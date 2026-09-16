import { useAuth } from "@/src/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function dashboardByRole(role?: string | null) {
  const r = (role || "").toLowerCase();
  if (r === "admin") return "/(admin)/DashboardAdmin";
  if (r === "teacher") return "/(teacher)/DashboardTeacher";
  if (r === "student") return "/(student)/DashboardStudent";
  return null;
}

/**
 * Splash Screen-00
 * - Chưa đăng nhập: hiện splash, bấm mũi tên → login
 * - Đã đăng nhập: redirect dashboard theo role
 */
export default function Index() {
  const { token, user, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  if (token) {
    const href = dashboardByRole(user?.role) || "/(auth)/login";
    return <Redirect href={href as any} />;
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <StatusBar barStyle="light-content" backgroundColor="#2F2FBF" />
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="school" size={72} color="#FFFFFF" />
        </View>

        <Text style={styles.title}>Student Management{"\n"}System</Text>
        <Text style={styles.subtitle}>
          Manage your academic{"\n"}life in one place
        </Text>

        <TouchableOpacity
          style={styles.arrowBtn}
          activeOpacity={0.8}
          onPress={() => router.push("/(auth)/login")}
          accessibilityLabel="Đi tới đăng nhập">
          <Ionicons name="arrow-forward" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2F2FBF",
  },
  safe: {
    flex: 1,
    backgroundColor: "#2F2FBF",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  iconWrap: {
    marginBottom: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 36,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 48,
  },
  arrowBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.55)",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
});
