import { logoutAPI } from "@/src/api/authApi";
import { useAuth } from "@/src/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Profile = () => {
  const { user, logout } = useAuth();
  const router = useRouter();

  const displayName = useMemo(
    () => user?.fullName || user?.name || user?.username || "Giảng viên",
    [user],
  );
  const displayId = useMemo(
    () =>
      user?.teacherCode ||
      user?.teacherId ||
      user?.email ||
      user?.username ||
      "GV",
    [user],
  );

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
            // ignore
          }
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  const menuItems = [
    {
      id: "info",
      icon: "person-outline" as const,
      label: "Thông tin cá nhân",
      onPress: () =>
        Alert.alert("Thông tin", `${displayName}\nMã GV: ${displayId}`),
    },
    {
      id: "password",
      icon: "lock-closed-outline" as const,
      label: "Đổi mật khẩu",
      onPress: () => router.push("/(auth)/ChangePassword"),
    },
    {
      id: "settings",
      icon: "settings-outline" as const,
      label: "Cài đặt",
      onPress: () => Alert.alert("Cài đặt", "Tính năng đang phát triển."),
    },
    {
      id: "help",
      icon: "help-circle-outline" as const,
      label: "Trợ giúp & Hỗ trợ",
      onPress: () =>
        Alert.alert("Hỗ trợ", "Liên hệ phòng đào tạo để được hỗ trợ."),
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3EEFF" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hồ sơ</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatar}>
              <Ionicons name="school" size={44} color="#9CA3AF" />
            </View>
          </View>
          <Text style={styles.userName}>{displayName}</Text>
          <Text style={styles.userId}>{displayId}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>Giảng viên</Text>
          </View>
        </View>

        <View style={styles.menuCard}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                index < menuItems.length - 1 && styles.menuItemBorder,
              ]}
              onPress={item.onPress}
              activeOpacity={0.6}>
              <View style={styles.menuLeft}>
                <View style={styles.menuIconWrap}>
                  <Ionicons name={item.icon} size={20} color="#5B5BD6" />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F3EEFF" },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#1A1A1A" },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 40,
  },
  profileSection: { alignItems: "center", marginBottom: 28 },
  avatarWrapper: { position: "relative", marginBottom: 14 },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  userName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  userId: { fontSize: 14, color: "#6B7280", marginBottom: 8 },
  roleBadge: {
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleBadgeText: { fontSize: 12, fontWeight: "700", color: "#2563EB" },
  menuCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  menuLeft: { flexDirection: "row", alignItems: "center" },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#EDE9FE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  menuLabel: { fontSize: 15, fontWeight: "500", color: "#1A1A1A" },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 16,
    gap: 8,
  },
  logoutText: { fontSize: 15, fontWeight: "600", color: "#EF4444" },
});
