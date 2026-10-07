import { useAuth } from "@/src/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  LogBox,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

LogBox.ignoreLogs([
  "ExponentAV",
  "expo-av native module",
  "[index] expo-av",
  "Cannot find native module",
]);

const { width, height } = Dimensions.get("window");

function dashboardByRole(role?: string | null) {
  const r = (role || "").toLowerCase();
  if (r === "admin") return "/(admin)/DashboardAdmin";
  if (r === "teacher") return "/(teacher)/DashboardTeacher";
  if (r === "student") return "/(student)/DashboardStudent";
  return null;
}

type Slide = {
  key: string;
  label: string;
  source: any;
  color: string;
  color2: string;
};

const SLIDES: Slide[] = [
  {
    key: "sinhvien",
    label: "Đời sống sinh viên",
    source: require("../assets/videos/sinhvien.mp4"),
    color: "#1B4332",
    color2: "#2D6A4F",
  },
  {
    key: "khuonvien",
    label: "Khuôn viên",
    source: require("../assets/videos/khuonvien.mp4"),
    color: "#1A3A2A",
    color2: "#40916C",
  },
  {
    key: "phonghoc",
    label: "Phòng học",
    source: require("../assets/videos/phonghoc.mp4"),
    color: "#0F2C24",
    color2: "#1B4332",
  },
  {
    key: "thuvien",
    label: "Thư viện",
    source: require("../assets/videos/thuvien.mp4"),
    color: "#1C2E3A",
    color2: "#3D5A80",
  },
  {
    key: "phongmay",
    label: "Phòng máy",
    source: require("../assets/videos/phongmay.mp4"),
    color: "#1A2433",
    color2: "#415A77",
  },
];

let ExpoVideo: any = null;
let ResizeMode: any = { COVER: "cover" };
let avAvailable = false;
try {
  const av = require("expo-av");
  if (av?.Video) {
    ExpoVideo = av.Video;
    ResizeMode = av.ResizeMode || ResizeMode;
    avAvailable = true;
  }
} catch {
  avAvailable = false;
}

export default function Index() {
  const { token, user, isLoading } = useAuth();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState(2);
  const [paused, setPaused] = useState(false);

  const fade = useRef(new Animated.Value(0)).current;
  const slideY = useRef(new Animated.Value(24)).current;
  const bgAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => {
      setActive((i) => (i + 1) % SLIDES.length);
    }, 7000);
    return () => clearInterval(t);
  }, [paused]);

  useEffect(() => {
    bgAnim.setValue(0);
    Animated.timing(bgAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: false,
      easing: Easing.out(Easing.cubic),
    }).start();
  }, [active, bgAnim]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(slideY, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
    ]).start();
    const t = setTimeout(() => setReady(true), 600);
    return () => clearTimeout(t);
  }, [fade, slideY]);

  useEffect(() => {
    if (isLoading || !ready) return;
    const dash = token ? dashboardByRole(user?.role) : null;
    if (dash) router.replace(dash as any);
  }, [isLoading, ready, token, user?.role, router]);

  const goLogin = useCallback(() => {
    const dash = token ? dashboardByRole(user?.role) : null;
    if (dash) router.replace(dash as any);
    else router.push("/(auth)/login");
  }, [token, user?.role, router]);

  const selectSlide = (idx: number) => {
    setPaused(true);
    setActive(idx);
    setTimeout(() => setPaused(false), 12000);
  };

  const current = SLIDES[active];
  const scriptFont = Platform.select({
    ios: "Snell Roundhand",
    android: "serif",
    default: "serif",
  }) as string;

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      <View
        style={[styles.videoWrap, { backgroundColor: current.color }]}
        pointerEvents="none">
        {avAvailable && ExpoVideo ? (
          <ExpoVideo
            key={current.key}
            source={current.source}
            style={styles.video}
            resizeMode={ResizeMode.COVER || "cover"}
            shouldPlay
            isLooping
            isMuted
            useNativeControls={false}
          />
        ) : (
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: current.color2, opacity: 0.45 },
            ]}
          />
        )}
        <View style={styles.dim} />
      </View>

      <SafeAreaView style={styles.safe}>
        <Animated.View
          style={[
            styles.header,
            { opacity: fade, transform: [{ translateY: slideY }] },
          ]}>
          <View style={styles.brandRow}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoLetters}>PP</Text>
            </View>
            <View>
              <Text style={styles.brandName}>PP Academy</Text>
              <Text style={styles.brandSub}>Thông tin nhà trường</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.headerLogin}
            onPress={goLogin}
            activeOpacity={0.85}>
            <Text style={styles.headerLoginText}>Đăng nhập</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View
          style={[
            styles.hero,
            { opacity: fade, transform: [{ translateY: slideY }] },
          ]}>
          <Text style={[styles.heroLine1, { fontFamily: scriptFont }]}>
            Học tập hôm nay.
          </Text>
          <Text style={[styles.heroLine2, { fontFamily: scriptFont }]}>
            Sẵn sàng ngày mai.
          </Text>

          <Text style={styles.heroLead}>
            Thông tin nhà trường, chương trình học và các thông báo dành cho
            sinh viên, giảng viên.
          </Text>

          <View style={styles.ctaRow}>
            <TouchableOpacity
              style={styles.ctaPrimary}
              onPress={goLogin}
              activeOpacity={0.9}>
              {isLoading ? (
                <ActivityIndicator color="#0F172A" />
              ) : (
                <>
                  <Text style={styles.ctaPrimaryText}>Đăng nhập hệ thống</Text>
                  <Ionicons name="arrow-forward" size={16} color="#0F172A" />
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.ctaSecondary}
              onPress={() => selectSlide(0)}
              activeOpacity={0.9}>
              <Text style={styles.ctaSecondaryText}>Tìm hiểu ngành học</Text>
              <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.quickLinks}>
            <Text style={styles.quickLink}>Thông báo mới</Text>
            <Text style={styles.quickDot}>·</Text>
            <Text style={styles.quickLink}>Chương trình học</Text>
            <Text style={styles.quickDot}>·</Text>
            <Text style={styles.quickLink}>Liên hệ nhà trường</Text>
          </View>
        </Animated.View>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.navArrow}
            onPress={() =>
              selectSlide((active - 1 + SLIDES.length) % SLIDES.length)
            }>
            <Ionicons name="chevron-back" size={18} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.tabs}>
            {SLIDES.map((s, i) => {
              const on = i === active;
              return (
                <TouchableOpacity
                  key={s.key}
                  style={[styles.tab, on && styles.tabOn]}
                  onPress={() => selectSlide(i)}
                  activeOpacity={0.85}>
                  <Text
                    style={[styles.tabText, on && styles.tabTextOn]}
                    numberOfLines={1}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={styles.navArrow}
            onPress={() => selectSlide((active + 1) % SLIDES.length)}>
            <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0B1220" },
  safe: { flex: 1 },
  videoWrap: {
    ...StyleSheet.absoluteFill,
    width,
    height,
  },
  video: { width, height },
  dim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(8, 16, 12, 0.55)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 6,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  logoCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#0B3D2E",
    borderWidth: 2,
    borderColor: "#C9A227",
    justifyContent: "center",
    alignItems: "center",
  },
  logoLetters: {
    color: "#F5E6A8",
    fontWeight: "800",
    fontSize: 13,
    letterSpacing: 0.5,
  },
  brandName: { color: "#FFFFFF", fontWeight: "800", fontSize: 16 },
  brandSub: { color: "rgba(255,255,255,0.7)", fontSize: 11, marginTop: 1 },
  headerLogin: {
    backgroundColor: "#1B5E3B",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 22,
  },
  headerLoginText: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },
  hero: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 22,
    paddingBottom: 24,
  },
  heroLine1: {
    fontSize: 40,
    color: "#FFFFFF",
    lineHeight: 50,
    marginBottom: 2,
    fontStyle: "italic",
  },
  heroLine2: {
    fontSize: 40,
    color: "#C5E1A5",
    lineHeight: 50,
    marginBottom: 16,
    fontStyle: "italic",
  },
  heroLead: {
    fontSize: 14,
    color: "rgba(255,255,255,0.88)",
    lineHeight: 21,
    maxWidth: width * 0.88,
    marginBottom: 22,
  },
  ctaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 18,
  },
  ctaPrimary: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    paddingVertical: 13,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  ctaPrimaryText: { color: "#0F172A", fontWeight: "700", fontSize: 14 },
  ctaSecondary: {
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.75)",
    borderRadius: 28,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ctaSecondaryText: { color: "#FFFFFF", fontWeight: "600", fontSize: 13 },
  quickLinks: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  quickLink: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    textDecorationLine: "underline",
  },
  quickDot: { color: "rgba(255,255,255,0.4)", fontSize: 12 },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingBottom: 14,
    paddingTop: 6,
    gap: 4,
  },
  navArrow: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  tabs: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 6,
  },
  tab: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  tabOn: {
    backgroundColor: "rgba(27, 94, 59, 0.92)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  tabText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 11,
    fontWeight: "600",
  },
  tabTextOn: { color: "#FFFFFF", fontWeight: "700" },
});
