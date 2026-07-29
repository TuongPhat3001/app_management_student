import React from "react";
import {
  Dimensions,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");
const CARD_GAP = 12;
const STAT_CARD_WIDTH = (width - 48 - CARD_GAP) / 2;

const Dashboard = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3EEFF" />
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              Hello, Phát <Text style={styles.wave}>👋</Text>
            </Text>
            <Text style={styles.subGreeting}>Chào buổi sáng!</Text>
          </View>
          <TouchableOpacity style={styles.bellButton} activeOpacity={0.7}>
            <Text style={styles.bellIcon}>🔔</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statLeft}>
              <Text style={styles.statLabel}>Phải học</Text>
              <Text style={styles.statValue}>12</Text>
            </View>
            <View style={[styles.statIcon, { backgroundColor: "#E8E4FF" }]}>
              <Text style={styles.iconEmoji}>📘</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statLeft}>
              <Text style={styles.statLabel}>Điểm danh</Text>
              <Text style={styles.statValue}>95%</Text>
            </View>
            <View style={[styles.statIcon, { backgroundColor: "#E0F2FE" }]}>
              <Text style={styles.iconEmoji}>✓</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statLeft}>
              <Text style={styles.statLabel}>Bài tập</Text>
              <Text style={styles.statValue}>08</Text>
            </View>
            <View style={[styles.statIcon, { backgroundColor: "#E8E4FF" }]}>
              <Text style={styles.iconEmoji}>📄</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statLeft}>
              <Text style={styles.statLabel}>Điểm trung bình</Text>
              <Text style={styles.statValue}>3.68</Text>
            </View>
            <View style={[styles.statIcon, { backgroundColor: "#E0F2FE" }]}>
              <Text style={styles.iconEmoji}>📊</Text>
            </View>
          </View>
        </View>

        {/* Section header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Các lớp học hôm nay</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.seeAll}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>

        {/* Class cards */}
        <View style={styles.classList}>
          <View style={styles.classCard}>
            <View style={styles.classInfo}>
              <Text style={styles.className}>Database Systems</Text>
              <Text style={styles.classTime}>08:00-11:30 AM</Text>
              <Text style={styles.classRoom}>Phòng A101</Text>
            </View>
            <View style={[styles.badge, styles.badgeActive]}>
              <Text style={styles.badgeTextActive}>Đang học</Text>
            </View>
          </View>

          <View style={styles.classCard}>
            <View style={styles.classInfo}>
              <Text style={styles.className}>Web Development</Text>
              <Text style={styles.classTime}>12:00-13:30 PM</Text>
              <Text style={styles.classRoom}>Phòng A102</Text>
            </View>
            <View style={[styles.badge, styles.badgeUpcoming]}>
              <Text style={styles.badgeTextUpcoming}>Sắp tới</Text>
            </View>
          </View>

          <View style={styles.classCard}>
            <View style={styles.classInfo}>
              <Text style={styles.className}>Software Engineering</Text>
              <Text style={styles.classTime}>17:00-20:30 PM</Text>
              <Text style={styles.classRoom}>Phòng A103</Text>
            </View>
            <View style={[styles.badge, styles.badgeUpcoming]}>
              <Text style={styles.badgeTextUpcoming}>Sắp tới</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Dashboard;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F3EEFF",
  },
  container: {
    flex: 1,
    backgroundColor: "#F3EEFF",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  wave: {
    fontSize: 22,
  },
  subGreeting: {
    fontSize: 14,
    color: "#8A8A8A",
    marginTop: 2,
  },
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
  bellIcon: {
    fontSize: 18,
  },

  // Stats
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
  statLeft: {
    flex: 1,
  },
  statLabel: {
    fontSize: 13,
    color: "#8A8A8A",
    marginBottom: 6,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  iconEmoji: {
    fontSize: 18,
  },

  // Section
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  seeAll: {
    fontSize: 14,
    color: "#5B5BD6",
    fontWeight: "500",
  },

  // Class cards
  classList: {
    gap: 12,
  },
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
  classInfo: {
    flex: 1,
  },
  className: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  classTime: {
    fontSize: 13,
    color: "#8A8A8A",
    marginBottom: 2,
  },
  classRoom: {
    fontSize: 13,
    color: "#8A8A8A",
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeActive: {
    backgroundColor: "#D1FAE5",
  },
  badgeUpcoming: {
    backgroundColor: "#FEF3C7",
  },
  badgeTextActive: {
    fontSize: 12,
    fontWeight: "600",
    color: "#059669",
  },
  badgeTextUpcoming: {
    fontSize: 12,
    fontWeight: "600",
    color: "#D97706",
  },
});
