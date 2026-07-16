import { useRouter } from "expo-router";
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
} from "react-native";
import api from "../../api/axios";

const ForgotPasswordScreen = () => {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const validateEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập email.");
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert("Lỗi", "Email không hợp lệ.");
      return;
    }

    setLoading(true);

    try {
      const res = await api.post("/forgot-password", {
        email,
      });

      Alert.alert(
        "Thành công",
        res.data.message ||
          "Liên kết đặt lại mật khẩu đã được gửi đến email của bạn.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/(auth)/login"),
          },
        ],
      );
    } catch (error: any) {
      Alert.alert(
        "Lỗi",
        error.response?.data?.error || "Không thể gửi email đặt lại mật khẩu.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Quên mật khẩu 🔐</Text>

        <Text style={styles.subtitle}>
          Nhập email đã đăng ký để nhận liên kết đặt lại mật khẩu.
        </Text>

        <Text style={styles.label}>Email</Text>

        <TextInput
          style={styles.input}
          placeholder="example@gmail.com"
          value={email}
          autoCapitalize="none"
          keyboardType="email-address"
          onChangeText={setEmail}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleForgotPassword}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Gửi liên kết đặt lại mật khẩu</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>Quay lại đăng nhập</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ForgotPasswordScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
    color: "#1E293B",
  },
  subtitle: {
    textAlign: "center",
    color: "#64748B",
    marginBottom: 40,
    fontSize: 15,
  },
  label: {
    fontWeight: "600",
    marginBottom: 8,
    color: "#374151",
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#2563EB",
    marginTop: 28,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  back: {
    marginTop: 24,
    textAlign: "center",
    color: "#2563EB",
    fontWeight: "600",
  },
});
