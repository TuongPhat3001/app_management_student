import { useLocalSearchParams, useRouter } from "expo-router";
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

import api from "../../api/axios";

const ResetPasswordScreen = () => {
  const router = useRouter();

  const { token } = useLocalSearchParams<{
    token: string;
  }>();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const validate = () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin.");
      return false;
    }

    if (newPassword.length < 6) {
      Alert.alert("Lỗi", "Mật khẩu phải có ít nhất 6 ký tự.");
      return false;
    }

    const regex = /^(?=.*[A-Za-z])(?=.*\d).+$/;

    if (!regex.test(newPassword)) {
      Alert.alert("Lỗi", "Mật khẩu phải bao gồm ít nhất 1 chữ và 1 số.");
      return false;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Lỗi", "Xác nhận mật khẩu không khớp.");
      return false;
    }

    return true;
  };

  const handleResetPassword = async () => {
    if (!validate()) return;

    if (!token) {
      Alert.alert("Lỗi", "Token không hợp lệ.");
      return;
    }

    setLoading(true);

    try {
      const res = await api.post("/reset-password", {
        token,
        new_password: newPassword,
      });

      Alert.alert(
        "Thành công 🎉",
        res.data.message || "Đổi mật khẩu thành công.",
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
        error.response?.data?.error || "Không thể đặt lại mật khẩu.",
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
        <Text style={styles.title}>Đặt lại mật khẩu 🔑</Text>

        <Text style={styles.subtitle}>
          Nhập mật khẩu mới cho tài khoản của bạn.
        </Text>

        <Text style={styles.label}>Mật khẩu mới</Text>

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            secureTextEntry={!showPassword}
            placeholder="Nhập mật khẩu mới"
            value={newPassword}
            onChangeText={setNewPassword}
          />

          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eye}>
            <Text>{showPassword ? "🙈" : "👁️"}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Xác nhận mật khẩu</Text>

        <TextInput
          style={styles.input}
          secureTextEntry={!showPassword}
          placeholder="Nhập lại mật khẩu"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        <TouchableOpacity
          style={styles.button}
          disabled={loading}
          onPress={handleResetPassword}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Đặt lại mật khẩu</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ResetPasswordScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
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
    color: "#1F2937",
    marginBottom: 10,
  },

  subtitle: {
    textAlign: "center",
    color: "#6B7280",
    marginBottom: 40,
    fontSize: 15,
  },

  label: {
    marginBottom: 8,
    marginTop: 18,
    fontWeight: "600",
    color: "#374151",
  },

  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
    fontSize: 16,
  },

  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  passwordInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
  },

  eye: {
    paddingHorizontal: 16,
  },

  button: {
    marginTop: 32,
    backgroundColor: "#2563EB",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
