import { useAuth } from "@/src/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { loginAPI } from "../../api/authApi";
import { setApiToken } from "../../api/axios";

const { width } = Dimensions.get("window");

const LoginScreen = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [lightOn, setLightOn] = useState(false);
  const router = useRouter();
  const { login: authLogin } = useAuth();

  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(28)).current;
  const btnScale = useRef(new Animated.Value(1)).current;
  const lampGlow = useRef(new Animated.Value(0)).current;
  const theme = useRef(new Animated.Value(0)).current;
  const toggleScale = useRef(new Animated.Value(1)).current;
  const swing = useRef(new Animated.Value(0)).current;
  const borderSpin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
    ]).start();

    // Đung đưa liên tục
    Animated.loop(
      Animated.sequence([
        Animated.timing(swing, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(swing, {
          toValue: -1,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(swing, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Viền màu quay vòng
    Animated.loop(
      Animated.timing(borderSpin, {
        toValue: 1,
        duration: 3200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, [fade, slide, swing, borderSpin]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(theme, {
        toValue: lightOn ? 1 : 0,
        duration: 700,
        easing: Easing.bezier(0.22, 1, 0.36, 1),
        useNativeDriver: false, // màu nền / chữ
      }),
      Animated.timing(lampGlow, {
        toValue: lightOn ? 1 : 0,
        duration: 700,
        easing: Easing.bezier(0.22, 1, 0.36, 1),
        useNativeDriver: true,
      }),
    ]).start();
  }, [lightOn, theme, lampGlow]);

  const onToggleLight = () => {
    Animated.sequence([
      Animated.spring(toggleScale, {
        toValue: 0.94,
        useNativeDriver: true,
        friction: 5,
        tension: 200,
      }),
      Animated.spring(toggleScale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 5,
        tension: 120,
      }),
    ]).start();
    setLightOn((v) => !v);
  };

  const pressIn = () =>
    Animated.spring(btnScale, {
      toValue: 0.97,
      useNativeDriver: true,
      friction: 5,
    }).start();
  const pressOut = () =>
    Animated.spring(btnScale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
    }).start();

  const handleLogin = async () => {
    const user = username.trim();
    const pass = password.trim();
    if (!user || !pass) {
      Alert.alert(
        "Thiếu thông tin",
        "Vui lòng nhập tên đăng nhập và mật khẩu.",
      );
      return;
    }
    try {
      setLoading(true);
      const res = await loginAPI({ username: user, password: pass });
      const data = res.data?.data ?? res.data ?? {};
      const token =
        data.token || data.accessToken || data.access_token || data.jwt;
      const roleRaw =
        data.role || data.user?.role || data.Role || data.user?.Role || "";
      const role = String(roleRaw).toLowerCase();

      if (!token) {
        Alert.alert("Lỗi", "Máy chủ không trả token đăng nhập.");
        return;
      }

      setApiToken(token);
      await authLogin(token, {
        id: data.userId ?? data.user?.id ?? data.UserID,
        username: data.username ?? data.user?.username ?? user,
        role,
        fullName:
          data.fullName ??
          data.user?.fullName ??
          data.FullName ??
          data.user?.FullName,
      });

      if (role === "admin") router.replace("/(admin)/DashboardAdmin" as any);
      else if (role === "teacher")
        router.replace("/(teacher)/DashboardTeacher" as any);
      else router.replace("/(student)/DashboardStudent" as any);
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        "Đăng nhập thất bại. Kiểm tra tài khoản hoặc máy chủ.";
      Alert.alert("Đăng nhập thất bại", String(msg));
    } finally {
      setLoading(false);
    }
  };

  const bgColor = theme.interpolate({
    inputRange: [0, 1],
    outputRange: ["#0B1B33", "#E8EEF6"],
  });
  const brandTitleColor = theme.interpolate({
    inputRange: [0, 1],
    outputRange: ["#FFFFFF", "#0F172A"],
  });
  const brandSubColor = theme.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255,255,255,0.72)", "#475569"],
  });
  const brandHintColor = theme.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255,255,255,0.55)", "#64748B"],
  });
  const toggleBg = theme.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255,255,255,0.08)", "rgba(37,99,235,0.12)"],
  });
  const toggleBorder = theme.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255,255,255,0.15)", "rgba(37,99,235,0.35)"],
  });
  const toggleTextColor = theme.interpolate({
    inputRange: [0, 1],
    outputRange: ["#E2E8F0", "#1D4ED8"],
  });

  const swingRotate = swing.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ["-12deg", "0deg", "12deg"],
  });

  const borderRotate = borderSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View style={[styles.root, { backgroundColor: bgColor }]}>
      <StatusBar
        barStyle={lightOn ? "dark-content" : "light-content"}
        animated
      />
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <Animated.View
              style={[
                styles.inner,
                { opacity: fade, transform: [{ translateY: slide }] },
              ]}>
              {/* ===== BRAND ===== */}
              <View style={styles.brandBlock}>
                <View style={styles.logoRow}>
                  <View style={styles.logoCircle}>
                    <Text style={styles.logoLetters}>PP</Text>
                  </View>
                  <View>
                    <Animated.Text
                      style={[styles.brandName, { color: brandTitleColor }]}>
                      PP Academy
                    </Animated.Text>
                    <Animated.Text
                      style={[styles.brandTag, { color: brandHintColor }]}>
                      EDUCATION MANAGER
                    </Animated.Text>
                  </View>
                </View>

                <Animated.View style={{ transform: [{ scale: toggleScale }] }}>
                  <TouchableOpacity activeOpacity={0.9} onPress={onToggleLight}>
                    <Animated.View
                      style={[
                        styles.lightToggle,
                        {
                          backgroundColor: toggleBg,
                          borderColor: toggleBorder,
                          borderWidth: 1,
                        },
                      ]}>
                      <Ionicons
                        name={lightOn ? "bulb" : "bulb-outline"}
                        size={16}
                        color={lightOn ? "#1D4ED8" : "#E2E8F0"}
                      />
                      <Animated.Text
                        style={[
                          styles.lightToggleText,
                          { color: toggleTextColor },
                        ]}>
                        {lightOn ? "Đèn đang bật" : "Bật sáng góc học tập"}
                      </Animated.Text>
                    </Animated.View>
                  </TouchableOpacity>
                </Animated.View>
                <Animated.Text
                  style={[styles.lightHint, { color: brandHintColor }]}>
                  {lightOn
                    ? "Một chút ánh sáng. Một khởi đầu mới."
                    : "Chạm vào chiếu đèn để bật sáng."}
                </Animated.Text>

                {/* Đèn treo đung đưa */}
                <View style={styles.illustWrap}>
                  {/* Dây treo */}
                  <View style={styles.ceilingHook} />
                  <Animated.View
                    style={[
                      styles.hangingLamp,
                      {
                        transform: [{ translateY: 0 }, { rotate: swingRotate }],
                      },
                    ]}>
                    <View style={styles.cord} />
                    <Animated.View
                      style={[
                        styles.beam,
                        {
                          opacity: lampGlow.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.1, 0.5],
                          }),
                        },
                      ]}
                    />
                    <View
                      style={[
                        styles.lampShade,
                        {
                          backgroundColor: lightOn ? "#F59E0B" : "#3B82F6",
                          borderColor: lightOn ? "#FBBF24" : "#60A5FA",
                        },
                      ]}>
                      <Ionicons
                        name="bulb"
                        size={26}
                        color={lightOn ? "#FEF3C7" : "#DBEAFE"}
                      />
                    </View>
                  </Animated.View>
                  <View style={styles.deskRow}>
                    <Ionicons
                      name="library-outline"
                      size={34}
                      color={lightOn ? "#3B82F6" : "#93C5FD"}
                    />
                    <Ionicons
                      name="cafe-outline"
                      size={26}
                      color={lightOn ? "#64748B" : "#94A3B8"}
                      style={{ marginLeft: 14 }}
                    />
                  </View>
                </View>

                <Animated.Text
                  style={[styles.kicker, { color: brandHintColor }]}>
                  HỆ THỐNG QUẢN LÝ ĐÀO TẠO
                </Animated.Text>
                <Animated.Text
                  style={[styles.heroTitle, { color: brandTitleColor }]}>
                  Bật sáng tri thức.{"\n"}Bắt đầu hành trình.
                </Animated.Text>
                <Animated.Text
                  style={[styles.heroLead, { color: brandSubColor }]}>
                  Quản lý lớp học, sinh viên, điểm danh, điểm số và hoạt động
                  giảng dạy trên một nền tảng duy nhất.
                </Animated.Text>
              </View>

              {/* ===== FORM + VIỀN MÀU CHẠY ===== */}
              <View style={styles.cardOuter}>
                {/* Lớp gradient quay — 4 góc màu giả lập bằng các dải màu */}
                <Animated.View
                  style={[
                    styles.borderSpinLayer,
                    { transform: [{ rotate: borderRotate }] },
                  ]}>
                  <View style={styles.spinGradient}>
                    <View
                      style={[styles.spinSeg, { backgroundColor: "#93C5FD" }]}
                    />
                    <View
                      style={[styles.spinSeg, { backgroundColor: "#0F172A" }]}
                    />
                    <View
                      style={[styles.spinSeg, { backgroundColor: "#BFDBFE" }]}
                    />
                    <View
                      style={[styles.spinSeg, { backgroundColor: "#1E293B" }]}
                    />
                    <View
                      style={[styles.spinSeg, { backgroundColor: "#60A5FA" }]}
                    />
                    <View
                      style={[styles.spinSeg, { backgroundColor: "#020617" }]}
                    />
                    <View
                      style={[styles.spinSeg, { backgroundColor: "#93C5FD" }]}
                    />
                    <View
                      style={[styles.spinSeg, { backgroundColor: "#0F172A" }]}
                    />
                  </View>
                </Animated.View>

                <View style={styles.card}>
                  <TouchableOpacity
                    style={styles.backHome}
                    onPress={() => router.replace("/" as any)}
                    hitSlop={8}>
                    <Ionicons name="arrow-back" size={16} color="#3B82F6" />
                    <Text style={styles.backHomeText}>
                      Về trang chủ PP Academy
                    </Text>
                  </TouchableOpacity>

                  <Text style={styles.welcome}>CHÀO MỪNG TRỞ LẠI</Text>
                  <Text style={styles.title}>Đăng nhập hệ thống</Text>
                  <Text style={styles.subtitle}>
                    Sử dụng tài khoản được nhà trường cấp để tiếp tục.
                  </Text>

                  <Text style={styles.label}>Tên đăng nhập hoặc email</Text>
                  <View style={styles.inputWrap}>
                    <TextInput
                      style={styles.input}
                      placeholder="Nhập tên đăng nhập hoặc email"
                      placeholderTextColor="#94A3B8"
                      autoCapitalize="none"
                      autoCorrect={false}
                      value={username}
                      onChangeText={setUsername}
                      returnKeyType="next"
                    />
                  </View>

                  <Text style={styles.label}>Mật khẩu</Text>
                  <View style={styles.inputWrap}>
                    <TextInput
                      style={styles.input}
                      placeholder="Nhập mật khẩu"
                      placeholderTextColor="#94A3B8"
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={setPassword}
                      returnKeyType="done"
                      onSubmitEditing={handleLogin}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword((v) => !v)}
                      hitSlop={10}>
                      <Ionicons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={20}
                        color="#64748B"
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.rowBetween}>
                    <TouchableOpacity
                      style={styles.rememberRow}
                      onPress={() => setRemember((v) => !v)}
                      activeOpacity={0.8}>
                      <View
                        style={[
                          styles.checkbox,
                          remember && styles.checkboxOn,
                        ]}>
                        {remember && (
                          <Ionicons name="checkmark" size={13} color="#FFF" />
                        )}
                      </View>
                      <Text style={styles.rememberText}>Ghi nhớ đăng nhập</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() =>
                        router.push("/(auth)/ForgotPassword" as any)
                      }>
                      <Text style={styles.forgot}>Quên mật khẩu?</Text>
                    </TouchableOpacity>
                  </View>

                  <Animated.View style={{ transform: [{ scale: btnScale }] }}>
                    <TouchableOpacity
                      style={styles.loginBtn}
                      onPress={handleLogin}
                      onPressIn={pressIn}
                      onPressOut={pressOut}
                      disabled={loading}
                      activeOpacity={0.9}>
                      {loading ? (
                        <ActivityIndicator color="#FFF" />
                      ) : (
                        <>
                          <Text style={styles.loginText}>Đăng nhập</Text>
                          <Ionicons
                            name="arrow-forward"
                            size={18}
                            color="#FFFFFF"
                          />
                        </>
                      )}
                    </TouchableOpacity>
                  </Animated.View>
                </View>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Animated.View>
  );
};

export default LoginScreen;

const BORDER = 3;

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
  },
  inner: { flexGrow: 1 },

  brandBlock: { marginBottom: 20 },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  logoCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#1E3A8A",
    borderWidth: 1.5,
    borderColor: "#C9A227",
    justifyContent: "center",
    alignItems: "center",
  },
  logoLetters: {
    color: "#F5E6A8",
    fontWeight: "800",
    fontSize: 14,
    letterSpacing: 0.5,
  },
  brandName: { fontSize: 18, fontWeight: "800" },
  brandTag: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginTop: 2,
  },

  lightToggle: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 22,
    marginBottom: 6,
  },
  lightToggleOff: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  lightToggleOn: {
    backgroundColor: "rgba(37,99,235,0.12)",
    borderWidth: 1,
    borderColor: "rgba(37,99,235,0.35)",
  },
  lightToggleText: { fontSize: 13, fontWeight: "700" },
  lightHint: { fontSize: 12, marginBottom: 10 },

  illustWrap: {
    height: 150,
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "flex-start",
    overflow: "visible",
  },
  ceilingHook: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(148,163,184,0.6)",
    zIndex: 2,
  },
  hangingLamp: {
    alignItems: "center",
    // transformOrigin mô phỏng bằng cách xoay từ trên
    transformOrigin: "top center",
  },
  cord: {
    width: 2,
    height: 36,
    backgroundColor: "rgba(148,163,184,0.7)",
  },
  lampShade: {
    width: 52,
    height: 40,
    borderRadius: 8,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginTop: -2,
  },
  beam: {
    position: "absolute",
    top: 70,
    width: 140,
    height: 70,
    borderBottomLeftRadius: 70,
    borderBottomRightRadius: 70,
    backgroundColor: "#93C5FD",
  },
  deskRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginTop: 8,
  },

  kicker: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.4,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: "800",
    lineHeight: 34,
    marginBottom: 10,
  },
  heroLead: {
    fontSize: 13,
    lineHeight: 20,
    maxWidth: width * 0.92,
  },

  /* Viền màu chạy */
  cardOuter: {
    borderRadius: 22,
    padding: BORDER,
    overflow: "hidden",
    position: "relative",
  },
  borderSpinLayer: {
    position: "absolute",
    // Lớn hơn card để khi quay vẫn phủ viền
    width: width * 1.6,
    height: width * 1.6,
    top: "50%",
    left: "50%",
    marginLeft: -(width * 0.8),
    marginTop: -(width * 0.8),
  },
  spinGradient: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  spinSeg: {
    width: "50%",
    height: "50%",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 19,
    padding: 22,
    zIndex: 1,
  },
  backHome: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
  },
  backHomeText: { color: "#3B82F6", fontSize: 13, fontWeight: "600" },
  welcome: {
    fontSize: 11,
    fontWeight: "800",
    color: "#3B82F6",
    letterSpacing: 1.3,
    marginBottom: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 19,
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 8,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 14,
    backgroundColor: "#FFFFFF",
    minHeight: 50,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#0F172A",
    paddingVertical: 12,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    marginTop: 2,
  },
  rememberRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxOn: {
    backgroundColor: "#0F172A",
    borderColor: "#0F172A",
  },
  rememberText: { fontSize: 13, color: "#475569" },
  forgot: { fontSize: 13, fontWeight: "600", color: "#3B82F6" },
  loginBtn: {
    backgroundColor: "#0F172A",
    borderRadius: 12,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  loginText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
});
