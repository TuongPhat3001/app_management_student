import apiClient from "@/src/api/axios";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * GET /class-offers — backend ViewSuggestClass
 * Teacher: chỉ offer của mình (teacher_id)
 * Poll 10s khi màn focus để đồng bộ ngay khi admin gửi lời mời
 */

interface ClassOfferItem {
  id: number;
  classCode: string;
  courseName: string;
  room?: string;
  semester?: string;
  message?: string;
  studentCount: number;
  status: string;
  offeredAt?: string;
}

const POLL_MS = 10000;

const formatTime = (raw?: string) => {
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const normalizeOffers = (raw: any): ClassOfferItem[] => {
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.data)
      ? raw.data
      : Array.isArray(raw?.data?.data)
        ? raw.data.data
        : [];

  return list
    .map((item: any, index: number) => {
      const cls = item.Class ?? item.class ?? {};
      const id = Number(item.ID ?? item.id ?? index);
      const classCode = String(
        cls.ClassCode ??
          cls.classCode ??
          item.classCode ??
          item.ClassCode ??
          "—",
      );
      const majorName =
        cls.Major?.Name ??
        cls.Major?.name ??
        cls.major?.name ??
        cls.majorName ??
        "";
      const room =
        cls.Room?.Name ??
        cls.Room?.name ??
        cls.room?.name ??
        cls.RoomName ??
        undefined;
      const semester =
        cls.Semester?.Name ??
        cls.Semester?.name ??
        cls.semester?.name ??
        undefined;

      return {
        id,
        classCode,
        courseName: majorName || classCode || "Lớp học",
        room: room ? String(room) : undefined,
        semester: semester ? String(semester) : undefined,
        message: item.Message ?? item.message ?? undefined,
        studentCount: Number(
          cls.MaxStudents ??
            cls.maxStudents ??
            item.studentCount ??
            item.StudentCount ??
            0,
        ),
        status: String(item.Status ?? item.status ?? "pending").toLowerCase(),
        offeredAt:
          item.OfferedAt ?? item.offeredAt ?? item.CreatedAt ?? item.createdAt,
      };
    })
    .sort((a: ClassOfferItem, b: ClassOfferItem) => {
      const ta = new Date(b.offeredAt || 0).getTime();
      const tb = new Date(a.offeredAt || 0).getTime();
      return ta - tb;
    });
};

const statusMeta = (status: string) => {
  switch (status) {
    case "accepted":
    case "approved":
      return { label: "Đã nhận", bg: "#D1FAE5", color: "#059669" };
    case "rejected":
    case "declined":
      return { label: "Đã từ chối", bg: "#FEE2E2", color: "#DC2626" };
    default:
      return { label: "Chờ phản hồi", bg: "#FEF3C7", color: "#D97706" };
  }
};

const ViewSuggestClass: React.FC = () => {
  const router = useRouter();
  const [offers, setOffers] = useState<ClassOfferItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchOffers = useCallback(async (silent = false) => {
    try {
      if (!silent) setError("");
      const res = await apiClient.get("/class-offers");
      setOffers(normalizeOffers(res.data));
    } catch (err: any) {
      if (!silent) {
        setError(
          err?.response?.data?.message || "Không thể tải danh sách phân công.",
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Focus → load ngay + poll 10s để nhận lời mời admin mới
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchOffers(false);
      pollRef.current = setInterval(() => fetchOffers(true), POLL_MS);
      return () => {
        if (pollRef.current) clearInterval(pollRef.current);
      };
    }, [fetchOffers]),
  );

  const openRespond = (id: number) => {
    router.push({
      pathname: "/(teacher)/class-offers/RespondClassOffer",
      params: { id: String(id) },
    } as any);
  };

  const pendingCount = offers.filter(
    (o) => o.status === "pending" || o.status === "",
  ).length;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#5B5BD6" />
        <Text style={styles.loadingText}>Đang tải phân công...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3EEFF" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đề xuất lớp</Text>
        <TouchableOpacity
          onPress={() => {
            setRefreshing(true);
            fetchOffers(false);
          }}
          style={styles.backBtn}>
          <Ionicons name="refresh" size={22} color="#5B5BD6" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchOffers(false);
            }}
            colors={["#5B5BD6"]}
            tintColor="#5B5BD6"
          />
        }>
        <Text style={styles.subtitle}>
          {pendingCount > 0
            ? `Bạn có ${pendingCount} lời mời đang chờ phản hồi`
            : "Danh sách lớp được phân công cho bạn"}
        </Text>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="warning-outline" size={22} color="#DC2626" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => fetchOffers(false)}>
              <Text style={styles.retryText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {!error && offers.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="folder-open-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>Chưa có đề xuất lớp</Text>
            <Text style={styles.emptyDesc}>
              Khi admin gửi lời mời phân công, danh sách sẽ cập nhật tự động tại
              đây (và trên chuông thông báo).
            </Text>
          </View>
        ) : null}

        {offers.map((offer, index) => {
          const meta = statusMeta(offer.status);
          const isPending =
            offer.status === "pending" ||
            offer.status === "" ||
            !["accepted", "approved", "rejected", "declined"].includes(
              offer.status,
            );

          return (
            <View key={`offer-${offer.id}-${index}`} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.classCode}>{offer.classCode}</Text>
                  <Text style={styles.courseName}>{offer.courseName}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: meta.bg }]}>
                  <Text style={[styles.badgeText, { color: meta.color }]}>
                    {meta.label}
                  </Text>
                </View>
              </View>

              {offer.semester ? (
                <View style={styles.metaRow}>
                  <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                  <Text style={styles.metaText}>{offer.semester}</Text>
                </View>
              ) : null}
              {offer.room ? (
                <View style={styles.metaRow}>
                  <Ionicons name="business-outline" size={16} color="#6B7280" />
                  <Text style={styles.metaText}>Phòng {offer.room}</Text>
                </View>
              ) : null}
              {offer.studentCount > 0 ? (
                <View style={styles.metaRow}>
                  <Ionicons name="people-outline" size={16} color="#6B7280" />
                  <Text style={styles.metaText}>
                    Tối đa {offer.studentCount} SV
                  </Text>
                </View>
              ) : null}
              {offer.message ? (
                <View style={styles.msgBox}>
                  <Text style={styles.msgLabel}>Lời nhắn admin</Text>
                  <Text style={styles.msgText}>{offer.message}</Text>
                </View>
              ) : null}
              {offer.offeredAt ? (
                <Text style={styles.timeText}>
                  Gửi lúc {formatTime(offer.offeredAt)}
                </Text>
              ) : null}

              {isPending ? (
                <TouchableOpacity
                  style={styles.respondBtn}
                  activeOpacity={0.85}
                  onPress={() => openRespond(offer.id)}>
                  <Ionicons name="hand-left-outline" size={18} color="#FFF" />
                  <Text style={styles.respondText}>Phản hồi phân công</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.doneRow}>
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color={meta.color}
                  />
                  <Text style={[styles.doneText, { color: meta.color }]}>
                    Đã xử lý
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ViewSuggestClass;

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
    paddingHorizontal: 12,
    paddingVertical: 12,
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
    fontWeight: "700",
    color: "#1A1A1A",
  },
  scroll: { padding: 20, paddingBottom: 40 },
  subtitle: { fontSize: 14, color: "#6B7280", marginBottom: 16 },
  errorBox: {
    backgroundColor: "#FEF2F2",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorText: { color: "#991B1B", textAlign: "center", fontSize: 13 },
  retryBtn: {
    marginTop: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#DC2626",
    borderRadius: 10,
  },
  retryText: { color: "#FFF", fontWeight: "600", fontSize: 13 },
  emptyBox: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
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
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  classCode: {
    fontSize: 15,
    fontWeight: "700",
    color: "#5B5BD6",
    marginBottom: 2,
  },
  courseName: { fontSize: 16, fontWeight: "600", color: "#1A1A1A" },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginLeft: 8,
  },
  badgeText: { fontSize: 11, fontWeight: "600" },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  metaText: { fontSize: 13, color: "#6B7280", flex: 1 },
  msgBox: {
    backgroundColor: "#F5F3FF",
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
    marginBottom: 4,
  },
  msgLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#5B5BD6",
    marginBottom: 4,
  },
  msgText: { fontSize: 13, color: "#4C1D95", lineHeight: 18 },
  timeText: { fontSize: 11, color: "#9CA3AF", marginTop: 6 },
  respondBtn: {
    marginTop: 14,
    backgroundColor: "#5B5BD6",
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  respondText: { color: "#FFF", fontWeight: "700", fontSize: 14 },
  doneRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  doneText: { fontSize: 13, fontWeight: "600" },
});
