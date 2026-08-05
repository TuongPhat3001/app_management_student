import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const CARD_GAP = 12;
const STAT_CARD_WIDTH = (width - 48 - CARD_GAP) / 2;

const TODAY_CLASSES = [
  {
    id: "1",
    name: "Database Systems",
    time: "08:00-11:30 AM",
    room: "Phòng A101",
    status: "active" as const,
  },
  {
    id: "2",
    name: "Web Development",
    time: "12:00-13:30 PM",
    room: "Phòng A102",
    status: "upcoming" as const,
  },
  {
    id: "3",
    name: "Software Engineering",
    time: "17:00-20:30 PM",
    room: "Phòng A103",
    status: "upcoming" as const,
  },
];

const Dashboard = () => {
  const router = useRouter();

  const stats = [
    {
      id: "courses",
      label: "Phải học",
      value: "12",
      icon: "book" as const,
      bg: "#E8E4FF",
      color: "#5B5BD6",
      onPress: () => router.push("/RegisterCourses" as any),
    },
    {
      id: "attendance",
      label: "Điểm danh",
      value: "95%",
      icon: "checkmark-circle" as const,
      bg: "#E0F2FE",
      color: "#0EA5E9",
      onPress: () => router.push("/QrAttendance" as any),
    },
    {
      id: "assignments",
      label: "Bài tập",
      value: "08",
      icon: "document-text" as const,
      bg: "#E8E4FF",
      color: "#5B5BD6",
      onPress: () => router.push("/Attendance" as any),
    },
    {
      id: "gpa",
      label: "Điểm trung bình",
      value: "3.68",
      icon: "stats-chart" as const,
      bg: "#E0F2FE",
      color: "#0EA5E9",
      onPress: () => router.push("/ViewTranscript" as any),
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3EEFF" />
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              Hello, Phát <Text style={styles.wave}>👋</Text>
            </Text>
            <Text style={styles.subGreeting}>Chào buổi sáng!</Text>
          </View>
          <TouchableOpacity
            style={styles.bellButton}
            activeOpacity={0.7}
            onPress={() => router.push("/Notification" as any)}>
            <Ionicons name="notifications-outline" size={20} color="#1A1A1A" />
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          {stats.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={styles.statCard}
              activeOpacity={0.75}
              onPress={s.onPress}>
              <View style={styles.statLeft}>
                <Text style={styles.statLabel}>{s.label}</Text>
                <Text style={styles.statValue}>{s.value}</Text>
              </View>
              <View style={[styles.statIcon, { backgroundColor: s.bg }]}>
                <Ionicons name={s.icon} size={20} color={s.color} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Các lớp học hôm nay</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push("/ViewSchedule" as any)}>
            <Text style={styles.seeAll}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.classList}>
          {TODAY_CLASSES.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={styles.classCard}
              activeOpacity={0.7}
              onPress={() => router.push("/ViewSchedule" as any)}>
              <View style={styles.classInfo}>
                <Text style={styles.className}>{c.name}</Text>
                <Text style={styles.classTime}>{c.time}</Text>
                <Text style={styles.classRoom}>{c.room}</Text>
              </View>
              <View
                style={[
                  styles.badge,
                  c.status === "active"
                    ? styles.badgeActive
                    : styles.badgeUpcoming,
                ]}>
                <Text
                  style={
                    c.status === "active"
                      ? styles.badgeTextActive
                      : styles.badgeTextUpcoming
                  }>
                  {c.status === "active" ? "Đang học" : "Sắp tới"}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Dashboard;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F3EEFF" },
  container: { flex: 1, backgroundColor: "#F3EEFF" },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  greeting: { fontSize: 24, fontWeight: "700", color: "#1A1A1A" },
  wave: { fontSize: 22 },
  subGreeting: { fontSize: 14, color: "#8A8A8A", marginTop: 2 },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    marginBottom: 28,
  },
  statCard: {
    width: STAT_CARD_WIDTH,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 14,
    marginBottom: CARD_GAP,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statLeft: { flex: 1 },
  statLabel: { fontSize: 13, color: "#8A8A8A", marginBottom: 6 },
  statValue: { fontSize: 22, fontWeight: "700", color: "#1A1A1A" },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: "#1A1A1A" },
  seeAll: { fontSize: 14, color: "#5B5BD6", fontWeight: "500" },
  classList: { gap: 12 },
  classCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  classInfo: { flex: 1 },
  className: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  classTime: { fontSize: 13, color: "#8A8A8A", marginBottom: 2 },
  classRoom: { fontSize: 13, color: "#8A8A8A" },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  badgeActive: { backgroundColor: "#D1FAE5" },
  badgeUpcoming: { backgroundColor: "#FEF3C7" },
  badgeTextActive: { fontSize: 12, fontWeight: "600", color: "#059669" },
  badgeTextUpcoming: { fontSize: 12, fontWeight: "600", color: "#D97706" },
});
