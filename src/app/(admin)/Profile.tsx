import { logoutAPI } from "@/src/api/authApi";
import { useAuth } from "@/src/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
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
  const [displayName, setDisplayName] = useState("Admin");
  const [displayId, setDisplayId] = useState("ADMIN");

  useEffect(() => {
    const load = async () => {
      try {
        const name =
          user?.fullName ||
          user?.name ||
          user?.username ||
          (await AsyncStorage.getItem("userName")) ||
          "Admin Hệ thống";
        const code =
          user?.adminCode ||
          user?.email ||
          user?.username ||
          (await AsyncStorage.getItem("role")) ||
          "admin";
        setDisplayName(String(name));
        setDisplayId(String(code));
      } catch {
        // keep defaults
      }
    };
    load();
  }, [user]);

  const clearSession = async () => {
    try {
      await logoutAPI();
    } catch {
      // vẫn xóa local
    }
    if (Platform.OS === "web") {
      await AsyncStorage.multiRemove([
        "jwt_token",
        "role",
        "authToken",
        "userData",
      ]);
    } else {
      try {
        await SecureStore.deleteItemAsync("jwt_token");
        await SecureStore.deleteItemAsync("role");
      } catch {
        // ignore
      }
      await AsyncStorage.multiRemove(["authToken", "userData"]);
    }
    try {
      await logout();
    } catch {
      // ignore
    }
  };

  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc muốn đăng xuất?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: async () => {
          await clearSession();
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
        Alert.alert("Thông tin", `${displayName}\nVai trò: Quản trị viên`),
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
        Alert.alert("Hỗ trợ", "Liên hệ admin hệ thống để được hỗ trợ."),
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
              <Ionicons name="shield-checkmark" size={44} color="#9CA3AF" />
            </View>
            <TouchableOpacity style={styles.cameraBtn} activeOpacity={0.8}>
              <Ionicons name="camera" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <Text style={styles.userName}>{displayName}</Text>
          <Text style={styles.userId}>{displayId}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>Quản trị viên</Text>
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
  cameraBtn: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#5B5BD6",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
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
    backgroundColor: "#EDE9FE",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleBadgeText: { fontSize: 12, fontWeight: "700", color: "#5B5BD6" },
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutText: { fontSize: 15, fontWeight: "600", color: "#EF4444" },
});
