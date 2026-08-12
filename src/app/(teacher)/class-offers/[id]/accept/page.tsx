import apiClient from "@/src/api/axios";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface OfferDetail {
  id: number;
  classCode: string;
  courseName: string;
  schedule: string;
  studentCount: number;
  status: string;
  message?: string;
  createdAt?: string;
}

/** Chuẩn hóa 1 offer từ nhiều dạng field backend */
const mapOffer = (item: any, fallbackId?: string): OfferDetail | null => {
  if (!item && !fallbackId) return null;
  const id = item?.id ?? item?.ID ?? Number(fallbackId);
  if (!id || Number.isNaN(Number(id))) return null;

  return {
    id: Number(id),
    classCode:
      item?.classCode ||
      item?.class_code ||
      item?.ClassCode ||
      item?.class?.classCode ||
      item?.class?.code ||
      "—",
    courseName:
      item?.courseName ||
      item?.course_name ||
      item?.CourseName ||
      item?.class?.courseName ||
      item?.class?.name ||
      item?.title ||
      "Lớp học được phân công",
    schedule:
      item?.schedule ||
      item?.Schedule ||
      item?.class?.schedule ||
      "Chưa có lịch",
    studentCount:
      item?.studentCount ??
      item?.student_count ??
      item?.StudentCount ??
      item?.class?.studentCount ??
      0,
    status: String(item?.status || item?.Status || "pending").toLowerCase(),
    message:
      item?.message ||
      item?.note ||
      item?.content ||
      item?.notification?.content,
    createdAt:
      item?.createdAt || item?.created_at || item?.CreatedAt || item?.updatedAt,
  };
};

/**
 * Logic: luôn ưu tiên lời mời MỚI NHẤT đang pending từ admin.
 * - Có param id → load offer đó; nếu đã xử lý thì tìm pending mới nhất
 * - Không có id → lấy pending mới nhất từ GET /class-offers
 */
const AcceptClassOffer = () => {
  const { id: paramId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [offer, setOffer] = useState<OfferDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchLatestOffer = useCallback(async () => {
    try {
      setError("");

      // 1) Lấy danh sách phân công
      const res = await apiClient.get("/class-offers");
      const raw = res.data;
      const list: any[] = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.data)
          ? raw.data
          : Array.isArray(raw?.data?.data)
            ? raw.data.data
            : [];

      const mapped = list
        .map((item) => mapOffer(item))
        .filter(Boolean) as OfferDetail[];

      // Sắp xếp mới nhất trước (theo createdAt hoặc id)
      mapped.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }
        return b.id - a.id;
      });

      const isPending = (s: string) =>
        !["accepted", "approved", "rejected", "declined"].includes(s);

      // 2) Ưu tiên: offer theo param id (nếu còn pending)
      if (paramId) {
        const byParam = mapped.find((o) => String(o.id) === String(paramId));
        if (byParam && isPending(byParam.status)) {
          setOffer(byParam);
          return;
        }
        // Thử GET chi tiết nếu list không có
        try {
          const detailRes = await apiClient.get(`/class-offers/${paramId}`);
          const detail = mapOffer(
            detailRes.data?.data ?? detailRes.data,
            paramId,
          );
          if (detail && isPending(detail.status)) {
            setOffer(detail);
            return;
          }
        } catch {
          // ignore — fallback pending mới nhất
        }
      }

      // 3) Lời mời pending mới nhất từ admin
      const latestPending = mapped.find((o) => isPending(o.status));
      if (latestPending) {
        setOffer(latestPending);
        return;
      }

      // 4) Không còn pending → hiện offer theo id (đã xử lý) hoặc null
      if (paramId) {
        const anyMatch = mapped.find((o) => String(o.id) === String(paramId));
        setOffer(anyMatch ?? mapOffer(null, paramId));
        return;
      }

      setOffer(null);
    } catch (err: any) {
      console.error("AcceptClassOffer fetch:", err);
      setError(
        err?.response?.data?.message ||
          "Không tải được lời mời. Kiểm tra mạng / backend.",
      );
      // Vẫn giữ id từ URL để có thể thử accept
      if (paramId) {
        setOffer(mapOffer(null, paramId));
      } else {
        setOffer(null);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [paramId]);

  // Mỗi lần vào màn → load lại (luôn thấy lời mời mới nhất)
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchLatestOffer();
    }, [fetchLatestOffer]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchLatestOffer();
  };

  const isPending =
    offer &&
    !["accepted", "approved", "rejected", "declined"].includes(offer.status);

  const handleAccept = async () => {
    if (!offer?.id) {
      Alert.alert("Lỗi", "Không tìm thấy mã phân công.");
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post(`/class-offers/${offer.id}/accept`);
      Alert.alert("Thành công", "Đã chấp nhận phân công lớp học!", [
        {
          text: "OK",
          onPress: () => {
            // Load lại — có thể còn lời mời pending khác
            setLoading(true);
            fetchLatestOffer().then(() => {
              if (!offer) router.back();
            });
            router.back();
          },
        },
      ]);
    } catch (err: any) {
      Alert.alert(
        "Lỗi",
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Không thể chấp nhận lớp. Vui lòng thử lại.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const goReject = () => {
    if (!offer?.id) return;
    // Đi sang màn reject cũ hoặc respond gộp
    router.push(`/(teacher)/class-offers/${offer.id}/reject` as any);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#5B5BD6" />
        <Text style={styles.loadingText}>Đang tải lời mời mới nhất...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3EEFF" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lời mời nhận lớp</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.backBtn}>
          <Ionicons name="refresh" size={22} color="#5B5BD6" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#5B5BD6"]}
            tintColor="#5B5BD6"
          />
        }>
        {/* Banner: luôn là lời mời mới nhất */}
        <View style={styles.banner}>
          <Ionicons name="notifications" size={18} color="#5B5BD6" />
          <Text style={styles.bannerText}>
            Hiển thị lời mời phân công mới nhất từ admin
          </Text>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {!offer ? (
          <View style={styles.emptyBox}>
            <Ionicons name="mail-open-outline" size={56} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>Không có lời mời nào</Text>
            <Text style={styles.emptyDesc}>
              Khi admin gửi phân công lớp, thông báo sẽ hiện tại đây.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.iconWrap}>
              <Ionicons
                name={isPending ? "mail-unread" : "checkmark-circle"}
                size={64}
                color={isPending ? "#5B5BD6" : "#059669"}
              />
            </View>

            <Text style={styles.title}>
              {isPending ? "Lời mời nhận lớp mới" : "Phân công đã xử lý"}
            </Text>
            <Text style={styles.subtitle}>
              {isPending
                ? "Admin đã gửi lời mời phân công lớp. Xác nhận để nhận trách nhiệm giảng dạy."
                : "Bạn đã phản hồi lời mời này trước đó."}
            </Text>

            {/* Chi tiết lớp từ admin */}
            <View style={styles.detailCard}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Mã phân công</Text>
                <Text style={styles.detailValue}>#{offer.id}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Mã lớp</Text>
                <Text style={styles.detailValue}>{offer.classCode}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Môn / lớp</Text>
                <Text
                  style={[styles.detailValue, { flex: 1, textAlign: "right" }]}>
                  {offer.courseName}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Lịch học</Text>
                <Text
                  style={[styles.detailValue, { flex: 1, textAlign: "right" }]}>
                  {offer.schedule}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Sĩ số</Text>
                <Text style={styles.detailValue}>{offer.studentCount} SV</Text>
              </View>
              {offer.message ? (
                <>
                  <View style={styles.divider} />
                  <View style={styles.messageBox}>
                    <Text style={styles.detailLabel}>Ghi chú từ admin</Text>
                    <Text style={styles.messageText}>{offer.message}</Text>
                  </View>
                </>
              ) : null}
            </View>

            {submitting ? (
              <ActivityIndicator
                size="large"
                color="#5B5BD6"
                style={{ marginTop: 24 }}
              />
            ) : isPending ? (
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.acceptBtn}
                  onPress={handleAccept}
                  activeOpacity={0.85}>
                  <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                  <Text style={styles.acceptText}>Đồng ý nhận lớp</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.rejectBtn}
                  onPress={goReject}
                  activeOpacity={0.85}>
                  <Ionicons
                    name="close-circle-outline"
                    size={20}
                    color="#DC2626"
                  />
                  <Text style={styles.rejectText}>Từ chối</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => router.back()}>
                  <Text style={styles.cancelText}>Để sau</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => router.back()}>
                <Text style={styles.cancelText}>Quay lại</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default AcceptClassOffer;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F3EEFF" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3EEFF",
  },
  loadingText: { marginTop: 12, color: "#6B7280", fontSize: 14 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  scroll: {
    padding: 20,
    paddingBottom: 40,
    alignItems: "center",
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#EDE9FE",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 20,
    width: "100%",
  },
  bannerText: { flex: 1, fontSize: 12, color: "#5B5BD6", fontWeight: "600" },
  errorBox: {
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    width: "100%",
  },
  errorText: { color: "#991B1B", fontSize: 13, textAlign: "center" },
  emptyBox: { alignItems: "center", paddingVertical: 40 },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#374151",
    marginTop: 12,
  },
  emptyDesc: {
    fontSize: 13,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  iconWrap: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#EDE9FE",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  detailCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  detailLabel: { fontSize: 13, color: "#9CA3AF", fontWeight: "500" },
  detailValue: { fontSize: 14, fontWeight: "700", color: "#1A1A1A" },
  divider: { height: 1, backgroundColor: "#F3F4F6" },
  messageBox: { paddingTop: 10 },
  messageText: {
    fontSize: 14,
    color: "#374151",
    marginTop: 6,
    lineHeight: 20,
  },
  actions: { width: "100%", gap: 12 },
  acceptBtn: {
    backgroundColor: "#5B5BD6",
    paddingVertical: 16,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  acceptText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  rejectBtn: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: "#FECACA",
  },
  rejectText: { color: "#DC2626", fontSize: 15, fontWeight: "700" },
  cancelBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    width: "100%",
  },
  cancelText: { color: "#6B7280", fontSize: 15, fontWeight: "600" },
});
