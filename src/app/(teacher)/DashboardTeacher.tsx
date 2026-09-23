import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getTeacherDashboardAPI } from "../../api/authApi";
import HomeScreen from "../HomeScreen";

type DashboardData = {
  classes: number;
  pendingClassOffers: number;
  exercises: number;
  pendingSubmissions: number;
};

const DashboardTeacher = () => {
  const router = useRouter();
  const [data, setData] = useState<DashboardData>({
    classes: 0,
    pendingClassOffers: 0,
    exercises: 0,
    pendingSubmissions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await getTeacherDashboardAPI();
      const d = res.data?.data ?? res.data ?? {};
      setData({
        classes: Number(d.classes ?? d.Classes ?? 0) || 0,
        pendingClassOffers:
          Number(d.pendingClassOffers ?? d.PendingClassOffers ?? 0) || 0,
        exercises: Number(d.exercises ?? d.Exercises ?? 0) || 0,
        pendingSubmissions:
          Number(d.pendingSubmissions ?? d.PendingSubmissions ?? 0) || 0,
      });
    } catch (error) {
      console.log("Teacher dashboard error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const cards = [
    {
      label: "Lớp phụ trách",
      value: data.classes,
      color: "#2563eb",
      bg: "#eff6ff",
      route: "/(teacher)/Grades",
    },
    {
      label: "Lớp chờ phản hồi",
      value: data.pendingClassOffers,
      color: "#7c3aed",
      bg: "#f5f3ff",
      route: "/(teacher)/class-offers",
    },
    {
      label: "Bài tập",
      value: data.exercises,
      color: "#d97706",
      bg: "#fffbeb",
      route: "/(teacher)/ManageAssignments",
    },
    {
      label: "Bài nộp chờ chấm",
      value: data.pendingSubmissions,
      color: "#dc2626",
      bg: "#fef2f2",
      route: "/(teacher)/ManageAssignments?focus=pending",
    },
  ];

  const quickActions = [
    {
      title: "Lịch dạy",
      desc: "Xem thời khóa biểu giảng dạy",
      route: "/(teacher)/ViewTeachingSchedule",
      color: "#0ea5e9",
    },
    {
      title: "Điểm danh",
      desc: "Tạo QR / xem & sửa điểm danh",
      route: "/(teacher)/Attendance",
      color: "#2563eb",
    },
    {
      title: "Nhập điểm",
      desc: "Quản lý điểm lớp học phần",
      route: "/(teacher)/Grades",
      color: "#059669",
    },
    {
      title: "Bài tập",
      desc: "Tạo & chấm bài tập",
      route: "/(teacher)/ManageAssignments",
      color: "#d97706",
    },
    {
      title: "Đề xuất lớp",
      desc: "Xem / nhận lớp được phân công",
      route: "/(teacher)/class-offers",
      color: "#7c3aed",
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchDashboard();
          }}
        />
      }>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Dashboard</Text>
          <Text style={styles.name}>Giảng viên</Text>
        </View>
        <TouchableOpacity
          style={styles.bellBtn}
          onPress={() => router.push("/(teacher)/Notification" as any)}
          activeOpacity={0.8}>
          <Ionicons name="notifications-outline" size={22} color="#1A1A1A" />
        </TouchableOpacity>
      </View>

      <HomeScreen role="teacher" embedded />

      <View style={styles.statsGrid}>
        {cards.map((item, idx) => (
          <TouchableOpacity
            key={idx}
            style={[styles.statCard, { backgroundColor: item.bg }]}
            activeOpacity={0.75}
            onPress={() => router.push(item.route as any)}>
            <Text style={[styles.statValue, { color: item.color }]}>
              {item.value}
            </Text>
            <Text style={styles.statLabel}>{item.label}</Text>
            <Text style={[styles.statHint, { color: item.color }]}>Xem ›</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Truy cập nhanh</Text>
      {quickActions.map((action, idx) => (
        <TouchableOpacity
          key={idx}
          style={styles.actionCard}
          activeOpacity={0.7}
          onPress={() => router.push(action.route as any)}>
          <View style={[styles.actionDot, { backgroundColor: action.color }]} />
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>{action.title}</Text>
            <Text style={styles.actionDesc}>{action.desc}</Text>
          </View>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

export default DashboardTeacher;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: 16, paddingBottom: 32 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  greeting: { fontSize: 15, color: "#64748b" },
  name: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0f172a",
    marginTop: 2,
  },
  bellBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: "47%",
    borderRadius: 16,
    padding: 16,
    minHeight: 100,
  },
  statValue: { fontSize: 28, fontWeight: "800" },
  statLabel: { fontSize: 13, color: "#64748b", marginTop: 6 },
  statHint: { fontSize: 12, fontWeight: "700", marginTop: 8 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 12,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  actionDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  actionContent: { flex: 1 },
  actionTitle: { fontSize: 15, fontWeight: "700", color: "#0f172a" },
  actionDesc: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  actionArrow: { fontSize: 22, color: "#cbd5e1", fontWeight: "300" },
});
