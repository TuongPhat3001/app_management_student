import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

type Role = "admin" | "teacher" | "student" | string;

interface HomeScreenProps {
  role?: Role;
  userName?: string;
  embedded?: boolean;
}

const roleLabel = (role?: Role) => {
  const r = (role || "").toLowerCase();
  if (r === "admin") return "Quản trị viên";
  if (r === "teacher") return "Giảng viên";
  if (r === "student") return "Sinh viên";
  return "Người dùng";
};

const HomeScreen: React.FC<HomeScreenProps> = ({
  role,
  userName,
  embedded = true,
}) => {
  const title = userName
    ? `Xin chào, ${userName}!`
    : "Chào mừng đến Hệ thống Quản lý Sinh viên";

  return (
    <View style={[styles.container, embedded && styles.embedded]}>
      <View style={styles.iconWrap}>
        <Ionicons name="school" size={embedded ? 28 : 40} color="#5B5BD6" />
      </View>
      <Text style={[styles.title, embedded && styles.titleEmbedded]}>
        {title}
      </Text>
      <Text style={styles.subtitle}>
        Bạn đã đăng nhập thành công với vai trò{" "}
        <Text style={styles.role}>{roleLabel(role)}</Text>.
      </Text>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#F8F9FA",
  },
  embedded: {
    flex: 0,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#EDE9FE",
    shadowColor: "#5B5BD6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#EDE9FE",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
    color: "#1A1A1A",
  },
  titleEmbedded: {
    fontSize: 17,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
  role: {
    fontWeight: "700",
    color: "#5B5BD6",
  },
});
