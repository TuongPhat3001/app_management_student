import { Ionicons } from "@expo/vector-icons";
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
const STAT_WIDTH = (width - 48 - CARD_GAP) / 2;

const STATS = [
  {
    label: "Lớp đang dạy",
    value: "06",
    icon: "people" as const,
    bg: "#EDE9FE",
    color: "#5B5BD6",
  },
  {
    label: "Sinh viên",
    value: "248",
    icon: "school" as const,
    bg: "#E0F2FE",
    color: "#0EA5E9",
  },
  {
    label: "Chờ chấm điểm",
    value: "14",
    icon: "document-text" as const,
    bg: "#FEF3C7",
    color: "#D97706",
  },
  {
    label: "Điểm danh hôm nay",
    value: "03",
    icon: "checkmark-done" as const,
    bg: "#D1FAE5",
    color: "#059669",
  },
];

const TODAY_CLASSES = [
  {
    id: "1",
    name: "Database Systems",
    code: "CSDL-202",
    time: "08:00 - 11:30",
    room: "A101",
    students: 40,
    status: "active" as const,
  },
  {
    id: "2",
    name: "Web Development",
    code: "WEB-205",
    time: "13:00 - 16:30",
    room: "B203",
    students: 35,
    status: "upcoming" as const,
  },
  {
    id: "3",
    name: "Software Engineering",
    code: "SE-101",
    time: "17:00 - 20:00",
    room: "A305",
    students: 42,
    status: "upcoming" as const,
  },
];

const QUICK_ACTIONS = [
  { id: "attendance", label: "Điểm danh", icon: "qr-code" as const },
  { id: "grades", label: "Nhập điểm", icon: "create" as const },
  { id: "assignment", label: "Giao bài", icon: "document-attach" as const },
  { id: "schedule", label: "Lịch dạy", icon: "calendar" as const },
];

const DashboardTeacher = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3EEFF" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              Xin chào, Thầy Phát <Text style={{ fontSize: 20 }}>👋</Text>
            </Text>
            <Text style={styles.subGreeting}>
              Chúc bạn một ngày dạy học hiệu quả!
            </Text>
          </View>
          <TouchableOpacity style={styles.bellBtn} activeOpacity={0.7}>
            <Ionicons name="notifications-outline" size={22} color="#1A1A1A" />
            <View style={styles.badge} />
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          {STATS.map((s) => (
            <View key={s.label} style={styles.statCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.statLabel}>{s.label}</Text>
                <Text style={styles.statValue}>{s.value}</Text>
              </View>
              <View style={[styles.statIcon, { backgroundColor: s.bg }]}>
                <Ionicons name={s.icon} size={20} color={s.color} />
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
        <View style={styles.actionsRow}>
          {QUICK_ACTIONS.map((a) => (
            <TouchableOpacity
              key={a.id}
              style={styles.actionItem}
              activeOpacity={0.7}>
              <View style={styles.actionIcon}>
                <Ionicons name={a.icon} size={22} color="#5B5BD6" />
              </View>
              <Text style={styles.actionLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Lớp học hôm nay</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.seeAll}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>

        {TODAY_CLASSES.map((c) => (
          <View key={c.id} style={styles.classCard}>
            <View style={styles.classLeft}>
              <Text style={styles.className}>{c.name}</Text>
              <Text style={styles.classCode}>{c.code}</Text>
              <View style={styles.classMeta}>
                <Ionicons name="time-outline" size={14} color="#6B7280" />
                <Text style={styles.classMetaText}>{c.time}</Text>
              </View>
              <View style={styles.classMeta}>
                <Ionicons name="location-outline" size={14} color="#6B7280" />
                <Text style={styles.classMetaText}>Phòng {c.room}</Text>
                <Text style={styles.classMetaDot}>·</Text>
                <Ionicons name="people-outline" size={14} color="#6B7280" />
                <Text style={styles.classMetaText}>{c.students} SV</Text>
              </View>
            </View>
            <View
              style={[
                styles.statusBadge,
                c.status === "active"
                  ? styles.badgeActive
                  : styles.badgeUpcoming,
              ]}>
              <Text
                style={[
                  styles.statusText,
                  c.status === "active"
                    ? styles.statusActive
                    : styles.statusUpcoming,
                ]}>
                {c.status === "active" ? "Đang dạy" : "Sắp tới"}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default DashboardTeacher;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F3EEFF" },
  scroll: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 22,
  },
  greeting: { fontSize: 22, fontWeight: "700", color: "#1A1A1A" },
  subGreeting: { fontSize: 13, color: "#8A8A8A", marginTop: 3 },
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
  badge: {
    position: "absolute",
    top: 10,
    right: 11,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
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
  statValue: { fontSize: 22, fontWeight: "700", color: "#1A1A1A" },
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
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 8,
  },
  seeAll: { fontSize: 14, color: "#5B5BD6", fontWeight: "500" },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  actionItem: { alignItems: "center", width: (width - 40) / 4 },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionLabel: { fontSize: 12, color: "#374151", fontWeight: "500" },
  classCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  classLeft: { flex: 1 },
  className: { fontSize: 16, fontWeight: "700", color: "#1A1A1A" },
  classCode: { fontSize: 13, color: "#6B7280", marginTop: 2, marginBottom: 8 },
  classMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 3,
    gap: 4,
  },
  classMetaText: { fontSize: 13, color: "#6B7280" },
  classMetaDot: { color: "#D1D5DB", marginHorizontal: 4 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  badgeActive: { backgroundColor: "#D1FAE5" },
  badgeUpcoming: { backgroundColor: "#FEF3C7" },
  statusText: { fontSize: 12, fontWeight: "600" },
  statusActive: { color: "#059669" },
  statusUpcoming: { color: "#D97706" },
});
