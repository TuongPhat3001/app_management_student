import apiClient from "@/src/api/axios";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
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

interface ReportStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalCourses: number;
  pendingAssign: number;
  avgAttendance: number;
  avgGpa: number;
}

const DEFAULT_STATS: ReportStats = {
  totalStudents: 0,
  totalTeachers: 0,
  totalClasses: 0,
  totalCourses: 0,
  pendingAssign: 0,
  avgAttendance: 0,
  avgGpa: 0,
};

const Reports = () => {
  const router = useRouter();
  const [stats, setStats] = useState<ReportStats>(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReports = useCallback(async () => {
    try {
      // 1) API báo cáo nếu có
      let data: any = null;
      for (const url of ["/admin/reports", "/reports", "/dashboard/admin"]) {
        try {
          const res = await apiClient.get(url);
          data = res.data?.data ?? res.data;
          if (data) break;
        } catch {
          /* next */
        }
      }

      let totalStudents = Number(
        data?.totalStudents ?? data?.total_students ?? 0,
      );
      let totalTeachers = Number(
        data?.totalTeachers ?? data?.total_teachers ?? 0,
      );
      let totalClasses = Number(data?.totalClasses ?? data?.total_classes ?? 0);
      let totalCourses = Number(data?.totalCourses ?? data?.total_courses ?? 0);
      let pendingAssign = Number(
        data?.pendingClassOffers ??
          data?.pending_class_offers ??
          data?.pendingAssign ??
          0,
      );
      let avgAttendance = Number(
        data?.avgAttendance ?? data?.avg_attendance ?? 0,
      );
      let avgGpa = Number(data?.avgGpa ?? data?.avg_gpa ?? 0);

      // 2) Đếm thật từ list API để đồng bộ hiện tại
      try {
        const [s, t, c, co, o] = await Promise.all([
          apiClient.get("/students").catch(() => null),
          apiClient.get("/teachers").catch(() => null),
          apiClient.get("/classes").catch(() => null),
          apiClient.get("/courses").catch(() => null),
          apiClient
            .get("/class-offers", { params: { status: "pending" } })
            .catch(() => null),
        ]);
        const sArr = s?.data?.data;
        const tArr = t?.data?.data;
        const cArr = c?.data?.data;
        const coArr = co?.data?.data;
        const oArr = o?.data?.data;
        if (Array.isArray(sArr)) totalStudents = sArr.length;
        if (Array.isArray(tArr)) totalTeachers = tArr.length;
        if (Array.isArray(cArr)) totalClasses = cArr.length;
        if (Array.isArray(coArr)) totalCourses = coArr.length;
        if (Array.isArray(oArr)) {
          pendingAssign = oArr.filter(
            (x: any) =>
              String(x.Status ?? x.status ?? "").toLowerCase() === "pending",
          ).length;
        }
      } catch {
        /* keep previous */
      }

      setStats({
        totalStudents,
        totalTeachers,
        totalClasses,
        totalCourses,
        pendingAssign,
        avgAttendance: avgAttendance || 0,
        avgGpa: avgGpa || 0,
      });
    } catch {
      setStats(DEFAULT_STATS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchReports();
    }, [fetchReports]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchReports();
  };

  const go = (route: string) => {
    router.push(route as any);
  };

  const overviewCards = [
    {
      label: "Sinh viên",
      value: stats.totalStudents,
      icon: "school-outline" as const,
      color: "#2563EB",
      bg: "#DBEAFE",
      route: "/(admin)/Users",
    },
    {
      label: "Giảng viên",
      value: stats.totalTeachers,
      icon: "person-outline" as const,
      color: "#5B5BD6",
      bg: "#EDE9FE",
      route: "/(admin)/Users",
    },
    {
      label: "Lớp học",
      value: stats.totalClasses,
      icon: "albums-outline" as const,
      color: "#059669",
      bg: "#D1FAE5",
      route: "/(admin)/ClassList",
    },
    {
      label: "Môn học",
      value: stats.totalCourses,
      icon: "book-outline" as const,
      color: "#D97706",
      bg: "#FEF3C7",
      route: "/(admin)/Courses",
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3EEFF" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Báo cáo thống kê</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
          <Ionicons name="refresh" size={20} color="#5B5BD6" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#5B5BD6" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#5B5BD6"]}
              tintColor="#5B5BD6"
            />
          }>
          <Text style={styles.sectionTitle}>Tổng quan hệ thống</Text>
          <Text style={styles.sectionHint}>Bấm vào thẻ để xem chi tiết</Text>
          <View style={styles.grid}>
            {overviewCards.map((c) => (
              <TouchableOpacity
                key={c.label}
                style={styles.statCard}
                activeOpacity={0.7}
                onPress={() => go(c.route)}>
                <View style={[styles.statIcon, { backgroundColor: c.bg }]}>
                  <Ionicons name={c.icon} size={22} color={c.color} />
                </View>
                <Text style={styles.statValue}>{c.value}</Text>
                <Text style={styles.statLabel}>{c.label}</Text>
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color="#C4B5FD"
                  style={styles.cardChevron}
                />
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Chỉ số học tập</Text>

          <View style={styles.metricCard}>
            <View style={styles.metricRow}>
              <View style={styles.metricLeft}>
                <Ionicons name="checkmark-done" size={20} color="#059669" />
                <Text style={styles.metricLabel}>Tỷ lệ điểm danh TB</Text>
              </View>
              <Text style={[styles.metricValue, { color: "#059669" }]}>
                {stats.avgAttendance ? `${stats.avgAttendance}%` : "—"}
              </Text>
            </View>
            {stats.avgAttendance > 0 && (
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(stats.avgAttendance, 100)}%`,
                      backgroundColor: "#059669",
                    },
                  ]}
                />
              </View>
            )}
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricRow}>
              <View style={styles.metricLeft}>
                <Ionicons name="stats-chart" size={20} color="#5B5BD6" />
                <Text style={styles.metricLabel}>GPA trung bình</Text>
              </View>
              <Text style={[styles.metricValue, { color: "#5B5BD6" }]}>
                {stats.avgGpa ? stats.avgGpa.toFixed(2) : "—"}
              </Text>
            </View>
            {stats.avgGpa > 0 && (
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${(stats.avgGpa / 4) * 100}%`,
                      backgroundColor: "#5B5BD6",
                    },
                  ]}
                />
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.metricCard}
            activeOpacity={0.7}
            onPress={() => go("/(admin)/AssignTeacher")}>
            <View style={styles.metricRow}>
              <View style={styles.metricLeft}>
                <Ionicons name="alert-circle" size={20} color="#F97316" />
                <Text style={styles.metricLabel}>Lớp chờ phân công</Text>
              </View>
              <Text style={[styles.metricValue, { color: "#F97316" }]}>
                {stats.pendingAssign}
              </Text>
            </View>
            <Text style={styles.linkText}>Đi phân công ngay →</Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => go("/(admin)/Users")}>
            <Ionicons name="people-outline" size={20} color="#5B5BD6" />
            <Text style={styles.actionText}>Xem danh sách người dùng</Text>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => go("/(admin)/ClassList")}>
            <Ionicons name="albums-outline" size={20} color="#5B5BD6" />
            <Text style={styles.actionText}>Danh sách lớp học</Text>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => go("/(admin)/Courses")}>
            <Ionicons name="book-outline" size={20} color="#5B5BD6" />
            <Text style={styles.actionText}>Quản lý môn học</Text>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => go("/(admin)/Exams")}>
            <Ionicons name="clipboard-outline" size={20} color="#5B5BD6" />
            <Text style={styles.actionText}>Quản lý kỳ thi</Text>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default Reports;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F3EEFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1A1A1A",
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EDE9FE",
    justifyContent: "center",
    alignItems: "center",
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  scroll: { padding: 16, paddingBottom: 40 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 6,
    marginTop: 8,
  },
  sectionHint: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  statValue: {
    fontSize: 26,
    fontWeight: "800",
    color: "#111827",
  },
  statLabel: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
    fontWeight: "600",
  },
  cardChevron: {
    position: "absolute",
    top: 14,
    right: 12,
  },
  metricCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  metricRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  metricLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  metricLabel: { fontSize: 14, fontWeight: "600", color: "#374151" },
  metricValue: { fontSize: 18, fontWeight: "800" },
  progressBar: {
    height: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 4,
    marginTop: 12,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 4 },
  linkText: {
    marginTop: 10,
    color: "#5B5BD6",
    fontWeight: "700",
    fontSize: 13,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    gap: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  actionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#1A1A1A",
  },
});
