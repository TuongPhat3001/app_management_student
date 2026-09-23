import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
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

/**
 * Login EduSync — form trắng + animation vào màn
 */
const LoginScreen = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(36)).current;
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const formSlide = useRef(new Animated.Value(24)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fade, {
          toValue: 1,
          duration: 550,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 7,
          tension: 70,
          useNativeDriver: true,
        }),
        Animated.timing(slide, {
          toValue: 0,
          duration: 550,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
      ]),
      Animated.timing(formSlide, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
    ]).start();
  }, [fade, slide, logoScale, formSlide]);

  const pressIn = () => {
    Animated.spring(btnScale, {
      toValue: 0.97,
      useNativeDriver: true,
      friction: 5,
    }).start();
  };
  const pressOut = () => {
    Animated.spring(btnScale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
    }).start();
  };

  const handleLogin = async () => {
    const user = username.trim();
    if (!user || !password) {
      Alert.alert("Lỗi", "Vui lòng nhập tên đăng nhập và mật khẩu");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Lỗi", "Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    setLoading(true);
    try {
      const response = await loginAPI({ username: user, password });
      const data = response.data;

      if (data.token) {
        setApiToken(data.token);
        if (Platform.OS === "web") {
          await AsyncStorage.setItem("jwt_token", data.token);
          await AsyncStorage.setItem("role", data.user.role);
        } else {
          await SecureStore.setItemAsync("jwt_token", data.token);
          await SecureStore.setItemAsync("role", data.user.role);
        }

        const navigateToDashboard = () => {
          const role = String(data.user?.role || "").toLowerCase();
          if (role === "student") {
            router.replace("/(student)/DashboardStudent");
          } else if (role === "teacher") {
            router.replace("/(teacher)/DashboardTeacher");
          } else if (role === "admin") {
            router.replace("/(admin)/DashboardAdmin");
          } else {
            router.replace("/(auth)/login");
          }
        };

        if (data.first_login) {
          Alert.alert(
            "Chào mừng!",
            "Đây là lần đăng nhập đầu tiên. Vui lòng đổi mật khẩu.",
            [
              {
                text: "OK",
                onPress: () => router.replace("/(auth)/ChangePassword"),
              },
            ],
          );
        } else {
          navigateToDashboard();
        }
      }
    } catch (error: any) {
      Alert.alert(
        "Đăng nhập thất bại",
        error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Sai tên đăng nhập hoặc mật khẩu",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Animated.View
            style={{
              opacity: fade,
              transform: [{ translateY: slide }, { scale: logoScale }],
            }}>
            <View style={styles.brandStrip}>
              <View style={styles.logoMark}>
                <Text style={styles.logoLetter}>S</Text>
              </View>
              <View>
                <Text style={styles.brandName}>EduSync</Text>
                <Text style={styles.brandTag}>TEACHER MANAGER</Text>
              </View>
            </View>

            <Text style={styles.welcome}>CHÀO MỪNG TRỞ LẠI</Text>
            <Text style={styles.title}>Đăng nhập hệ thống</Text>
            <Text style={styles.subtitle}>
              Sử dụng tài khoản được nhà trường cấp để tiếp tục.
            </Text>
          </Animated.View>

          <Animated.View
            style={{
              opacity: fade,
              transform: [{ translateY: formSlide }],
            }}>
            <Text style={styles.label}>Tên đăng nhập hoặc email</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Nhập tên đăng nhập hoặc email"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="default"
              />
            </View>

            <Text style={styles.label}>Mật khẩu</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={[
                  styles.input,
                  { flex: 1, borderWidth: 0, paddingHorizontal: 0 },
                ]}
                value={password}
                onChangeText={setPassword}
                placeholder="Nhập mật khẩu"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword((v) => !v)}
                hitSlop={10}>
                <Ionicons
                  name={showPassword ? "eye-outline" : "eye-off-outline"}
                  size={22}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.rowBetween}>
              <TouchableOpacity
                style={styles.rememberRow}
                onPress={() => setRemember((v) => !v)}
                activeOpacity={0.7}>
                <View style={[styles.checkbox, remember && styles.checkboxOn]}>
                  {remember && (
                    <Ionicons name="checkmark" size={14} color="#FFF" />
                  )}
                </View>
                <Text style={styles.rememberText}>Ghi nhớ đăng nhập</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push("/(auth)/ForgotPassword")}>
                <Text style={styles.forgot}>Quên mật khẩu?</Text>
              </TouchableOpacity>
            </View>

            <Animated.View style={{ transform: [{ scale: btnScale }] }}>
              <TouchableOpacity
                style={[styles.loginBtn, loading && { opacity: 0.75 }]}
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
                    <Ionicons name="arrow-forward" size={18} color="#FFF" />
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>

            <Text style={styles.hint}>
              Tài khoản do quản trị viên / nhà trường cấp. Không hỗ trợ tự đăng
              ký.
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 20,
    paddingBottom: 40,
    justifyContent: "center",
  },
  brandStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 32,
  },
  logoMark: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
  },
  logoLetter: { fontSize: 20, fontWeight: "800", color: "#FFFFFF" },
  brandName: { fontSize: 18, fontWeight: "800", color: "#111827" },
  brandTag: {
    fontSize: 10,
    fontWeight: "600",
    color: "#6B7280",
    letterSpacing: 1.1,
    marginTop: 2,
  },
  welcome: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2563EB",
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    marginBottom: 28,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
    minHeight: 52,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
    paddingVertical: 12,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
    marginTop: 4,
  },
  rememberRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxOn: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  rememberText: { fontSize: 13, color: "#4B5563" },
  forgot: { fontSize: 13, fontWeight: "600", color: "#2563EB" },
  loginBtn: {
    backgroundColor: "#2563EB",
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  loginText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  hint: {
    marginTop: 28,
    textAlign: "center",
    fontSize: 12,
    color: "#9CA3AF",
    lineHeight: 18,
  },
});
