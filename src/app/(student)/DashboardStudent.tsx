import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getStudentDashboardAPI } from "../../api/authApi";

const { width } = Dimensions.get("window");
const CARD_GAP = 12;
const STAT_WIDTH = (width - 48 - CARD_GAP) / 2;

type DashboardData = {
  enrolledCourses: number;
  openExercises: number;
  submissions: number;
  attendances: number;
};

const DashboardStudent = () => {
  const router = useRouter();
  const [data, setData] = useState<DashboardData>({
    enrolledCourses: 0,
    openExercises: 0,
    submissions: 0,
    attendances: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async () => {
    try {
      const res = await getStudentDashboardAPI();
      const d = res.data?.data ?? {};
      setData({
        enrolledCourses: d.enrolledCourses ?? 0,
        openExercises: d.openExercises ?? 0,
        submissions: d.submissions ?? 0,
        attendances: d.attendances ?? 0,
      });
    } catch (error) {
      console.log("Student dashboard error:", error);
      setData({
        enrolledCourses: 0,
        openExercises: 0,
        submissions: 0,
        attendances: 0,
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

  const cards = [
    {
      label: "Học phần đang học",
      value: data.enrolledCourses,
      icon: "book" as const,
      color: "#5B5BD6",
      bg: "#EDE9FE",
      route: "/(student)/RegisterCourses",
    },
    {
      label: "Bài tập đang mở",
      value: data.openExercises,
      icon: "document-text" as const,
      color: "#D97706",
      bg: "#FEF3C7",
      route: "/(student)/ViewSchedule",
    },
    {
      label: "Bài đã nộp",
      value: data.submissions,
      icon: "checkmark-done" as const,
      color: "#7C3AED",
      bg: "#F5F3FF",
      route: "/(student)/ViewSchedule",
    },
    {
      label: "Lượt điểm danh",
      value: data.attendances,
      icon: "qr-code" as const,
      color: "#059669",
      bg: "#D1FAE5",
      route: "/(student)/QrAttendance",
    },
  ];

  const quickActions = [
    {
      title: "Đăng ký học phần",
      desc: "Xem lớp đang mở & đăng ký",
      route: "/(student)/RegisterCourses",
      icon: "school-outline" as const,
      color: "#5B5BD6",
    },
    {
      title: "Thời khóa biểu",
      desc: "Xem lịch học trong tuần",
      route: "/(student)/ViewSchedule",
      icon: "calendar-outline" as const,
      color: "#059669",
    },
    {
      title: "Bảng điểm",
      desc: "Xem điểm & GPA",
      route: "/(student)/ViewTranscript",
      icon: "stats-chart-outline" as const,
      color: "#D97706",
    },
    {
      title: "Điểm danh QR",
      desc: "Quét mã điểm danh",
      route: "/(student)/QrAttendance",
      icon: "qr-code-outline" as const,
      color: "#7C3AED",
    },
  ];

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#5B5BD6" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3EEFF" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#5B5BD6"]}
            tintColor="#5B5BD6"
          />
        }>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Xin chào 👋</Text>
            <Text style={styles.name}>Sinh viên</Text>
          </View>
          <TouchableOpacity
            style={styles.bellBtn}
            onPress={() => router.push("/(student)/Notification" as any)}>
            <Ionicons name="notifications-outline" size={22} color="#1A1A1A" />
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          {cards.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.statCard}
              activeOpacity={0.75}
              onPress={() => router.push(item.route as any)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.statLabel}>{item.label}</Text>
                <Text style={[styles.statValue, { color: item.color }]}>
                  {item.value}
                </Text>
              </View>
              <View style={[styles.statIcon, { backgroundColor: item.bg }]}>
                <Ionicons name={item.icon} size={20} color={item.color} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Truy cập nhanh</Text>
        {quickActions.map((action) => (
          <TouchableOpacity
            key={action.title}
            style={styles.actionCard}
            activeOpacity={0.7}
            onPress={() => router.push(action.route as any)}>
            <View
              style={[
                styles.actionIcon,
                { backgroundColor: action.color + "18" },
              ]}>
              <Ionicons name={action.icon} size={20} color={action.color} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>{action.title}</Text>
              <Text style={styles.actionDesc}>{action.desc}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default DashboardStudent;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F3EEFF" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3EEFF",
  },
  content: { padding: 20, paddingBottom: 36 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 22,
  },
  greeting: { fontSize: 14, color: "#8A8A8A" },
  name: { fontSize: 24, fontWeight: "800", color: "#1A1A1A", marginTop: 2 },
  bellBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  statCard: {
    width: STAT_WIDTH,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    marginBottom: CARD_GAP,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  statLabel: { fontSize: 12, color: "#8A8A8A", marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: "800" },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 12,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  actionContent: { flex: 1 },
  actionTitle: { fontSize: 15, fontWeight: "700", color: "#1A1A1A" },
  actionDesc: { fontSize: 12, color: "#94A3B8", marginTop: 2 },
});
