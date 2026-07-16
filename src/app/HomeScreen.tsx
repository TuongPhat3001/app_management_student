import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const HomeScreen = () => {
  const router = useRouter();

  const handleLogout = () => {
    router.replace("/login");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chào mừng đến Hệ thống Quản lý Sinh viên</Text>
      <Text style={styles.subtitle}>Bạn đã đăng nhập thành công!</Text>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Đăng xuất</Text>
      </TouchableOpacity>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#F8F9FA",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 40,
  },
  logoutButton: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  logoutText: {
    color: "white",
    fontWeight: "600",
  },
});

export default HomeScreen;
