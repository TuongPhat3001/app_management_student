import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { loginAPI } from "../api/authApi";

const LoginScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Lỗi", "Vui lòng nhập email và mật khẩu");
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert("Lỗi", "Email không hợp lệ");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Lỗi", "Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    setLoading(true);

    try {
      const response = await loginAPI({ email, password });
      const data = response.data;

      if (data.token) {
        if (Platform.OS === "web") {
          await AsyncStorage.setItem("jwt_token", data.token);
          await AsyncStorage.setItem("role", data.role);
        } else {
          await SecureStore.setItemAsync("jwt_token", data.token);
          await SecureStore.setItemAsync("role", data.role);
        }

        const navigateToDashboard = () => {
          const role = data.role?.toLowerCase();
          if (role === "student") {
            router.replace("/(student)/Dashboard");
          } else if (role === "teacher") {
            router.replace("/(teacher)/Dashboard");
          } else if (role === "admin") {
            router.replace("/(admin)/Dashboard");
          } else {
            router.replace("/(auth)/Login");
          }
        };

        if (data.firstLogin) {
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
          Alert.alert("Thành công", "Đăng nhập thành công!", [
            { text: "OK", onPress: navigateToDashboard },
          ]);
        }
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Không thể kết nối đến server. Vui lòng thử lại sau.";

      Alert.alert("Lỗi", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Xin Chào!!!! 👋</Text>
          <Text style={styles.subtitle}>Hệ thống quản lý sinh viên</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập email của bạn"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Mật khẩu</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Nhập mật khẩu"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}>
              <Text>{showPassword ? "🙈" : "👁️"}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={() => router.push("/(auth)/ForgotPassword")}>
            <Text style={styles.forgotText}>Quên mật khẩu?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Đăng nhập</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.registerLink}>
            <Text style={styles.registerText}>
              Chưa có tài khoản?{" "}
              <Text style={styles.registerHighlight}>Đăng ký</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  scrollContent: { flexGrow: 1, padding: 24, justifyContent: "center" },
  header: { alignItems: "center", marginBottom: 40 },
  welcomeText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
  },
  subtitle: { fontSize: 16, color: "#6B7280", textAlign: "center" },
  form: { width: "100%" },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    alignItems: "center",
  },
  passwordInput: { flex: 1, padding: 16, fontSize: 16 },
  eyeIcon: { padding: 16 },
  forgotPassword: { alignSelf: "flex-end", marginTop: 8, marginBottom: 24 },
  forgotText: { color: "#3B82F6", fontWeight: "600" },
  loginButton: {
    backgroundColor: "#2563EB",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 24,
  },
  loginButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  registerLink: { alignItems: "center" },
  registerText: { color: "#6B7280", fontSize: 14 },
  registerHighlight: { color: "#2563EB", fontWeight: "600" },
});

export default LoginScreen;
