import apiClient from "@/src/api/axios";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
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

interface ClassOffer {
  id: number;
  classCode: string;
  courseName: string;
  schedule: string;
  studentCount: number;
  status: string;
}

/** Chuẩn hóa data từ nhiều dạng response backend */
const normalizeOffers = (raw: any): ClassOffer[] => {
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.data)
      ? raw.data
      : Array.isArray(raw?.data?.data)
        ? raw.data.data
        : [];

  return list.map((item: any, index: number) => ({
    id: item.id ?? item.ID ?? index,
    classCode:
      item.classCode ||
      item.class_code ||
      item.ClassCode ||
      item.class?.classCode ||
      "—",
    courseName:
      item.courseName ||
      item.course_name ||
      item.CourseName ||
      item.class?.courseName ||
      item.class?.name ||
      "Lớp học",
    schedule:
      item.schedule || item.Schedule || item.class?.schedule || "Chưa có lịch",
    studentCount:
      item.studentCount ?? item.student_count ?? item.StudentCount ?? 0,
    status: (item.status || item.Status || "pending").toLowerCase(),
  }));
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
  const [offers, setOffers] = useState<ClassOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchOffers = useCallback(async () => {
    try {
      setError("");
      const res = await apiClient.get("/class-offers");
      setOffers(normalizeOffers(res.data));
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          "Không thể tải danh sách phân công. Kiểm tra mạng / backend.",
      );
      setOffers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOffers();
  };

  /** Màn mới gộp Accept + Reject */
  const openRespond = (id: number) => {
    router.push(`/(teacher)/class-offers/${id}/respond` as any);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#5B5BD6" />
        <Text style={styles.loadingText}>Đang tải phân công...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3EEFF" />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Phân công lớp</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.backBtn}>
          <Ionicons name="refresh" size={22} color="#5B5BD6" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#5B5BD6"]}
            tintColor="#5B5BD6"
          />
        }>
        <Text style={styles.subtitle}>
          Danh sách lớp được phân công cho bạn
        </Text>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="warning-outline" size={22} color="#DC2626" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={fetchOffers}>
              <Text style={styles.retryText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {!error && offers.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="folder-open-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>Chưa có phân công</Text>
            <Text style={styles.emptyDesc}>
              Khi giáo vụ phân công lớp, danh sách sẽ hiện tại đây.
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

              <View style={styles.metaRow}>
                <Ionicons name="time-outline" size={16} color="#6B7280" />
                <Text style={styles.metaText}>{offer.schedule}</Text>
              </View>
              <View style={styles.metaRow}>
                <Ionicons name="people-outline" size={16} color="#6B7280" />
                <Text style={styles.metaText}>
                  {offer.studentCount} sinh viên
                </Text>
              </View>

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
  scroll: { padding: 20, paddingBottom: 40 },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 16,
  },
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
  courseName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
  },
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
