import { useAuth } from "@/src/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Dimensions,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

function dashboardByRole(role?: string | null) {
  const r = (role || "").toLowerCase();
  if (r === "admin") return "/(admin)/DashboardAdmin";
  if (r === "teacher") return "/(teacher)/DashboardTeacher";
  if (r === "student") return "/(student)/DashboardStudent";
  return null;
}

/** Splash EduSync — panel thương hiệu xanh */
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
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#1E40AF" />
      <SafeAreaView style={styles.safe}>
        <View style={styles.brandInner}>
          <View style={styles.logoRow}>
            <View style={styles.logoMark}>
              <Text style={styles.logoLetter}>S</Text>
            </View>
            <View>
              <Text style={styles.logoTitle}>EduSync</Text>
              <Text style={styles.logoSub}>TEACHER MANAGER</Text>
            </View>
          </View>

          <Text style={styles.kicker}>HỆ THỐNG QUẢN LÝ ĐÀO TẠO</Text>
          <Text style={styles.headline}>
            Một không gian.{"\n"}Mọi hoạt động học tập.
          </Text>
          <Text style={styles.lead}>
            Quản lý lớp học, sinh viên, điểm danh, điểm số và hoạt động giảng
            dạy trên một nền tảng duy nhất.
          </Text>

          <View style={styles.orbitWrap}>
            <View style={[styles.orbit, styles.orbit3]} />
            <View style={[styles.orbit, styles.orbit2]} />
            <View style={[styles.orbit, styles.orbit1]} />
            <View style={styles.orbitCore}>
              <Text style={styles.orbitText}>ES</Text>
            </View>
            <View style={[styles.dot, styles.dot1]} />
            <View style={[styles.dot, styles.dot2]} />
            <View style={[styles.dot, styles.dot3]} />
          </View>

          <TouchableOpacity
            style={styles.cta}
            activeOpacity={0.85}
            onPress={() => router.push("/(auth)/login")}>
            <Text style={styles.ctaText}>Đăng nhập</Text>
            <Ionicons name="arrow-forward" size={20} color="#1D4ED8" />
          </TouchableOpacity>

          <Text style={styles.footer}>© 2026 EduSync · Teacher Manager</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#2563EB" },
  loading: {
    flex: 1,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
  },
  safe: { flex: 1 },
  brandInner: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 20,
    justifyContent: "center",
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 36,
  },
  logoMark: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  logoLetter: { fontSize: 22, fontWeight: "800", color: "#2563EB" },
  logoTitle: { fontSize: 20, fontWeight: "800", color: "#FFFFFF" },
  logoSub: {
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(255,255,255,0.75)",
    letterSpacing: 1.2,
    marginTop: 2,
  },
  kicker: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.8)",
    letterSpacing: 1.4,
    marginBottom: 12,
  },
  headline: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
    lineHeight: 40,
    marginBottom: 14,
  },
  lead: {
    fontSize: 15,
    color: "rgba(255,255,255,0.88)",
    lineHeight: 22,
    marginBottom: 20,
    maxWidth: width * 0.9,
  },
  orbitWrap: {
    width: 160,
    height: 160,
    alignSelf: "center",
    marginVertical: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  orbit: {
    position: "absolute",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  orbit1: { width: 70, height: 70 },
  orbit2: { width: 110, height: 110 },
  orbit3: { width: 150, height: 150 },
  orbitCore: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  orbitText: { color: "#FFF", fontWeight: "800", fontSize: 14 },
  dot: { position: "absolute", width: 10, height: 10, borderRadius: 5 },
  dot1: { top: 12, right: 28, backgroundColor: "#FFFFFF" },
  dot2: { bottom: 18, left: 22, backgroundColor: "#FDBA74" },
  dot3: { top: 48, left: 8, backgroundColor: "#86EFAC" },
  cta: {
    marginTop: 12,
    alignSelf: "stretch",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  ctaText: { fontSize: 16, fontWeight: "700", color: "#1D4ED8" },
  footer: {
    marginTop: 24,
    textAlign: "center",
    fontSize: 11,
    color: "rgba(255,255,255,0.55)",
  },
});
