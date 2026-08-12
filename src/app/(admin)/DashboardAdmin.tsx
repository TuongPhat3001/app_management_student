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

const DashboardAdmin = () => {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    totalClasses: 0,
    pendingAssign: 0,
    newNotifications: 0,
  });

  const fetchStats = useCallback(async () => {
    try {
      // Thử cả 2 endpoint phổ biến để khớp backend
      let data: any = null;
      try {
        const res = await apiClient.get("/dashboard/admin");
        data = res.data?.data || res.data;
      } catch {
        const res = await apiClient.get("/admin/dashboard-stats");
        data = res.data?.data || res.data;
      }
      if (data) {
        setStats({
          totalClasses: Number(data.totalClasses ?? data.total_classes ?? 0),
          pendingAssign: Number(data.pendingAssign ?? data.pending_assign ?? 0),
          newNotifications: Number(
            data.newNotifications ?? data.new_notifications ?? 0,
          ),
        });
      }
    } catch (e) {
      console.log("Dashboard stats error:", e);
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchStats();
      setLoading(false);
    })();
  }, [fetchStats]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchStats();
      await new Promise((r) => setTimeout(r, 400));
    } finally {
      setRefreshing(false);
    }
  }, [fetchStats]);

  const quickActions = [
    {
      id: "student",
      label: "+ Tạo sinh viên mới",
      route: "/(admin)/CreateIdStudent",
      icon: "person-add-outline" as const,
    },
    {
      id: "teacher",
      label: "+ Tạo giảng viên mới",
      route: "/(admin)/CreateIdTeacher",
      icon: "school-outline" as const,
    },
    {
      id: "class",
      label: "+ Tạo lớp học mới",
      route: "/(admin)/CreateClass",
      icon: "albums-outline" as const,
    },
  ];

  const mainActions = [
    {
      id: "assign",
      label: "Phân công giảng viên",
      route: "/(admin)/AssignTeacher",
      icon: "people-outline" as const,
    },
    {
      id: "notify",
      label: "Gửi thông báo",
      route: "/(admin)/SendNotification",
      icon: "megaphone-outline" as const,
    },
    {
      id: "users",
      label: "Quản lý người dùng",
      route: "/(admin)/Users",
      icon: "person-outline" as const,
    },
    {
      id: "courses",
      label: "Quản lý môn học",
      route: "/(admin)/Courses",
      icon: "book-outline" as const,
    },
    {
      id: "exams",
      label: "Quản lý kỳ thi",
      route: "/(admin)/Exams",
      icon: "clipboard-outline" as const,
    },
    {
      id: "reports",
      label: "Báo cáo thống kê",
      route: "/(admin)/Reports",
      icon: "stats-chart-outline" as const,
    },
  ];

  const goTo = (route: string) => {
    router.push(route as any);
  };

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

      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <Text style={styles.headerSub}>Quản trị hệ thống</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
          <Ionicons name="refresh" size={20} color="#5B5BD6" />
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
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Tổng lớp học</Text>
          <Text style={styles.statValue}>{stats.totalClasses}</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Lớp chờ phân công</Text>
          <Text style={[styles.statValue, { color: "#F97316" }]}>
            {stats.pendingAssign}
          </Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Thông báo mới</Text>
          <Text style={[styles.statValue, { color: "#2563EB" }]}>
            {stats.newNotifications}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Quản lý nhanh</Text>
        {quickActions.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.actionBtn}
            activeOpacity={0.7}
            onPress={() => goTo(item.route)}>
            <View style={styles.actionLeft}>
              <Ionicons name={item.icon} size={20} color="#5B5BD6" />
              <Text style={styles.actionText}>{item.label}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        ))}

        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
          Chức năng chính
        </Text>
        {mainActions.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.actionBtn}
            activeOpacity={0.7}
            onPress={() => goTo(item.route)}>
            <View style={styles.actionLeft}>
              <Ionicons name={item.icon} size={20} color="#374151" />
              <Text style={styles.actionTextMain}>{item.label}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default DashboardAdmin;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F3EEFF",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3EEFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  headerSub: {
    fontSize: 13,
    color: "#8A8A8A",
    marginTop: 2,
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EDE9FE",
    justifyContent: "center",
    alignItems: "center",
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },

  // Stats
  statCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  statLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 6,
  },
  statValue: {
    fontSize: 32,
    fontWeight: "700",
    color: "#111827",
  },

  // Sections
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
    marginTop: 8,
  },
  actionBtn: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  actionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  actionText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  actionTextMain: {
    fontSize: 15,
    fontWeight: "500",
    color: "#1A1A1A",
  },
});
