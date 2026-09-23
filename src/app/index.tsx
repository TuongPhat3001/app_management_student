import { useAuth } from "@/src/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
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

export default function Index() {
  const { token, user, isLoading } = useAuth();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(28)).current;
  const logoScale = useRef(new Animated.Value(0.7)).current;
  const orbitSpin = useRef(new Animated.Value(0)).current;
  const ctaPulse = useRef(new Animated.Value(1)).current;
  const orbitPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();

    const spin = Animated.loop(
      Animated.timing(orbitSpin, {
        toValue: 1,
        duration: 12000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    const pulseOrbit = Animated.loop(
      Animated.sequence([
        Animated.timing(orbitPulse, {
          toValue: 1.06,
          duration: 1600,
          useNativeDriver: true,
        }),
        Animated.timing(orbitPulse, {
          toValue: 1,
          duration: 1600,
          useNativeDriver: true,
        }),
      ]),
    );
    const pulseCta = Animated.loop(
      Animated.sequence([
        Animated.timing(ctaPulse, {
          toValue: 1.03,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(ctaPulse, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
    );
    spin.start();
    pulseOrbit.start();
    pulseCta.start();

    const t = setTimeout(() => setReady(true), 1400);

    return () => {
      spin.stop();
      pulseOrbit.stop();
      pulseCta.stop();
      clearTimeout(t);
    };
  }, [fade, slide, logoScale, orbitSpin, ctaPulse, orbitPulse]);

  useEffect(() => {
    if (isLoading || !ready) return;
    const dash = token ? dashboardByRole(user?.role) : null;
    if (dash) {
      router.replace(dash as any);
    }
  }, [isLoading, ready, token, user?.role, router]);

  const spinInterpolate = orbitSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#1E40AF" />
      <SafeAreaView style={styles.safe}>
        <Animated.View
          style={[
            styles.brandInner,
            {
              opacity: fade,
              transform: [{ translateY: slide }],
            },
          ]}>
          <Animated.View
            style={[styles.logoRow, { transform: [{ scale: logoScale }] }]}>
            <View style={styles.logoMark}>
              <Text style={styles.logoLetter}>S</Text>
            </View>
            <View>
              <Text style={styles.logoTitle}>EduSync</Text>
              <Text style={styles.logoSub}>TEACHER MANAGER</Text>
            </View>
          </Animated.View>

          <Text style={styles.kicker}>HỆ THỐNG QUẢN LÝ ĐÀO TẠO</Text>
          <Text style={styles.headline}>
            Một không gian.{"\n"}Mọi hoạt động học tập.
          </Text>
          <Text style={styles.lead}>
            Quản lý lớp học, sinh viên, điểm danh, điểm số và hoạt động giảng
            dạy trên một nền tảng duy nhất.
          </Text>

          <Animated.View
            style={[
              styles.orbitWrap,
              {
                transform: [{ scale: orbitPulse }, { rotate: spinInterpolate }],
              },
            ]}>
            <View style={[styles.orbit, styles.orbit3]} />
            <View style={[styles.orbit, styles.orbit2]} />
            <View style={[styles.orbit, styles.orbit1]} />
            <View style={styles.orbitCore}>
              <Text style={styles.orbitText}>ES</Text>
            </View>
            <View style={[styles.dot, styles.dot1]} />
            <View style={[styles.dot, styles.dot2]} />
            <View style={[styles.dot, styles.dot3]} />
          </Animated.View>

          <Animated.View style={{ transform: [{ scale: ctaPulse }] }}>
            <TouchableOpacity
              style={styles.cta}
              activeOpacity={0.85}
              onPress={() => {
                const dash = token ? dashboardByRole(user?.role) : null;
                if (dash) {
                  router.replace(dash as any);
                } else {
                  router.push("/(auth)/login");
                }
              }}>
              {isLoading ? (
                <ActivityIndicator color="#1D4ED8" />
              ) : (
                <>
                  <Text style={styles.ctaText}>
                    {token && dashboardByRole(user?.role)
                      ? "Vào hệ thống"
                      : "Đăng nhập"}
                  </Text>
                  <Ionicons name="arrow-forward" size={20} color="#1D4ED8" />
                </>
              )}
            </TouchableOpacity>
          </Animated.View>

          <Text style={styles.footer}>© 2026 EduSync · Teacher Manager</Text>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#2563EB" },
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
