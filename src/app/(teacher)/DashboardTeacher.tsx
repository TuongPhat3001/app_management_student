import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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

  const fetchDashboard = async () => {
    try {
      const res = await getTeacherDashboardAPI();

      setData(res.data?.data ?? {});
    } catch (error) {
      console.log("Teacher dashboard error:", error);
      setData({
        classes: 0,
        pendingClassOffers: 0,
        exercises: 0,
        pendingSubmissions: 0,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

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
    },
    {
      label: "Lớp chờ phản hồi",
      value: data.pendingClassOffers,
      color: "#7c3aed",
      bg: "#f5f3ff",
    },
    {
      label: "Bài tập",
      value: data.exercises,
      color: "#d97706",
      bg: "#fffbeb",
    },
    {
      label: "Bài nộp chờ chấm",
      value: data.pendingSubmissions,
      color: "#dc2626",
      bg: "#fef2f2",
    },
  ];

  const quickActions = [
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
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
      <View style={styles.header}>
        <Text style={styles.greeting}>Dashboard</Text>
        <Text style={styles.name}>Giảng viên</Text>
      </View>

      <HomeScreen role="teacher" embedded />

      <View style={styles.statsGrid}>
        {cards.map((item, idx) => (
          <View
            key={idx}
            style={[styles.statCard, { backgroundColor: item.bg }]}>
            <Text style={[styles.statValue, { color: item.color }]}>
              {item.value}
            </Text>
            <Text style={styles.statLabel}>{item.label}</Text>
          </View>
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
  header: { marginBottom: 20 },
  greeting: { fontSize: 15, color: "#64748b" },
  name: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0f172a",
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    width: "48%",
    borderRadius: 14,
    padding: 16,
  },
  statValue: { fontSize: 24, fontWeight: "800" },
  statLabel: { fontSize: 13, color: "#64748b", marginTop: 4 },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0f172a",
    marginTop: 8,
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
  actionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  actionContent: { flex: 1 },
  actionTitle: { fontSize: 15, fontWeight: "700", color: "#1e293b" },
  actionDesc: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  actionArrow: { fontSize: 22, color: "#cbd5e1", fontWeight: "300" },
});
