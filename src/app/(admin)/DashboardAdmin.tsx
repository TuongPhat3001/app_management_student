import { logoutAPI } from "@/src/api/authApi";
import apiClient from "@/src/api/axios";
import { useAuth } from "@/src/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import HomeScreen from "../HomeScreen";

const DashboardAdmin = () => {
  const router = useRouter();
  const { logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    totalClasses: 0,
    pendingAssign: 0,
    newNotifications: 0,
  });

  const fetchStats = useCallback(async () => {
    try {
      // Backend: DashboardAdmin → pendingClassOffers, newNotifications, totalClasses
      let data: any = null;
      for (const url of [
        "/dashboard/admin",
        "/admin/dashboard",
        "/admin/dashboard-stats",
      ]) {
        try {
          const res = await apiClient.get(url);
          data = res.data?.data ?? res.data;
          if (data) break;
        } catch {
          /* try next */
        }
      }

      let totalClasses = Number(data?.totalClasses ?? data?.total_classes ?? 0);
      let pendingAssign = Number(
        data?.pendingClassOffers ??
          data?.pending_class_offers ??
          data?.pendingAssign ??
          data?.pending_assign ??
          0,
      );
      let newNotifications = Number(
        data?.newNotifications ?? data?.new_notifications ?? 0,
      );

      // Fallback đếm trực tiếp nếu dashboard không có / thiếu số
      if (!data || (!totalClasses && !pendingAssign && !newNotifications)) {
        try {
          const [cRes, oRes, nRes] = await Promise.all([
            apiClient.get("/classes").catch(() => null),
            apiClient
              .get("/class-offers", { params: { status: "pending" } })
              .catch(() => null),
            apiClient.get("/notifications").catch(() => null),
          ]);
          const classes = cRes?.data?.data ?? [];
          if (Array.isArray(classes)) totalClasses = classes.length;

          const offers = oRes?.data?.data ?? [];
          if (Array.isArray(offers)) {
            pendingAssign = offers.filter(
              (o: any) =>
                String(o.Status ?? o.status ?? "").toLowerCase() === "pending",
            ).length;
          }

          const notis = nRes?.data?.data ?? [];
          if (Array.isArray(notis)) {
            const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
            newNotifications = notis.filter((n: any) => {
              const t = new Date(n.CreatedAt ?? n.createdAt ?? 0).getTime();
              return !t || t >= weekAgo;
            }).length;
          }
        } catch (e) {
          console.log("stats fallback error", e);
        }
      }

      setStats({ totalClasses, pendingAssign, newNotifications });
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

  // Đồng bộ lại khi quay về dashboard
  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [fetchStats]),
  );

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
      id: "student-to-class",
      label: "+ Thêm SV vào lớp đang học",
      route: "/(admin)/AddStudentToClass",
      icon: "people-circle-outline" as const,
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
    try {
      router.push(route as any);
    } catch (e) {
      console.log("navigate error", route, e);
      Alert.alert("Điều hướng", `Không mở được: ${route}`);
    }
  };

  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc muốn đăng xuất?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: async () => {
          try {
            await logoutAPI();
          } catch {
            // vẫn xóa local
          }
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
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
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
            <Ionicons name="refresh" size={20} color="#5B5BD6" />
          </TouchableOpacity>
          {/* <TouchableOpacity
            style={styles.logoutHeaderBtn}
            onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          </TouchableOpacity> */}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#5B5BD6"]}
            tintColor="#5B5BD6"
          />
        }>
        <HomeScreen role="admin" embedded />

        {/* 3 thẻ thống kê — cùng pattern TouchableOpacity như nút Quản lý nhanh */}
        <TouchableOpacity
          style={styles.statCard}
          activeOpacity={0.7}
          onPress={() => goTo("/(admin)/ClassList")}>
          <Text style={styles.statLabel}>Tổng lớp học</Text>
          <View style={styles.statRow}>
            <Text style={styles.statValue}>{stats.totalClasses}</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.statCard}
          activeOpacity={0.7}
          onPress={() => goTo("/(admin)/AssignTeacher")}>
          <Text style={styles.statLabel}>Lớp chờ phân công</Text>
          <View style={styles.statRow}>
            <Text style={[styles.statValue, { color: "#F97316" }]}>
              {stats.pendingAssign}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.statCard}
          activeOpacity={0.7}
          onPress={() => goTo("/(admin)/NotificationList")}>
          <Text style={styles.statLabel}>Thông báo mới</Text>
          <View style={styles.statRow}>
            <Text style={[styles.statValue, { color: "#2563EB" }]}>
              {stats.newNotifications}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </View>
        </TouchableOpacity>

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
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EDE9FE",
    justifyContent: "center",
    alignItems: "center",
  },
  logoutHeaderBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },

  // Stats
  statRow: {
    flexDirection: "row",
    alignItems: "center",
  },
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
  statHint: {
    fontSize: 12,
    color: "#5B5BD6",
    marginTop: 6,
    fontWeight: "600",
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
