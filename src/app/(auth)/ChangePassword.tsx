import { useAuth } from "@/src/context/AuthContext";
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
import { changePasswordAPI } from "../../api/authApi";

async function resolveRole(userRole?: string | null): Promise<string> {
  const fromUser = String(userRole || "").toLowerCase();
  if (
    fromUser === "admin" ||
    fromUser === "teacher" ||
    fromUser === "student"
  ) {
    return fromUser;
  }
  try {
    if (Platform.OS === "web") {
      return String((await AsyncStorage.getItem("role")) || "").toLowerCase();
    }
    const r =
      (await SecureStore.getItemAsync("role")) ||
      (await AsyncStorage.getItem("role"));
    return String(r || "").toLowerCase();
  } catch {
    return "";
  }
}

function profilePath(role: string) {
  if (role === "admin") return "/(admin)/Profile";
  if (role === "teacher") return "/(teacher)/Profile";
  if (role === "student") return "/(student)/Profile";
  return null;
}

const ChangePasswordScreen = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  /** Hủy bỏ → luôn về Hồ sơ (Profile), không về Dashboard */
  const goBackToProfile = async () => {
    const role = await resolveRole(user?.role);
    const path = profilePath(role);
    if (path) {
      router.replace(path as any);
      return;
    }
    // Fallback: vẫn cố về profile student (tránh Dashboard)
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(student)/Profile" as any);
    }
  };

  const validateForm = () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ các trường mật khẩu.");
      return false;
    }
    if (newPassword.length < 6) {
      Alert.alert("Lỗi", "Mật khẩu mới phải có ít nhất 6 ký tự.");
      return false;
    }
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;
    if (!passwordRegex.test(newPassword)) {
      Alert.alert("Lỗi", "Mật khẩu mới phải bao gồm cả chữ và số.");
      return false;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Lỗi", "Mật khẩu xác nhận không trùng khớp.");
      return false;
    }
    return true;
  };

  const handleChangePassword = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      const response = await changePasswordAPI({
        new_password: newPassword,
      });
      Alert.alert(
        "Thành công 🎉",
        response.data?.message || "Đã đổi mật khẩu",
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
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Đổi mật khẩu thất bại.",
      );
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
          <Text style={styles.title}>Đổi Mật Khẩu</Text>
          <Text style={styles.subtitle}>
            Vui lòng cập nhật mật khẩu mới để bảo vệ tài khoản của bạn.
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Mật khẩu mới</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Nhập mật khẩu mới"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showNewPassword}
            />
            <TouchableOpacity
              onPress={() => setShowNewPassword(!showNewPassword)}
              style={styles.eyeIcon}>
              <Text>{showNewPassword ? "🙈" : "👁️"}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Xác nhận lại mật khẩu mới</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Nhập lại mật khẩu mới"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showNewPassword}
            />
            <TouchableOpacity
              onPress={() => setShowNewPassword(!showNewPassword)}
              style={styles.eyeIcon}>
              <Text>{showNewPassword ? "🙈" : "👁️"}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleChangePassword}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Xác nhận thay đổi</Text>
            )}
          </TouchableOpacity>

          {/* Dòng cuối: chỉ HỦY BỎ → về Hồ sơ */}
          <TouchableOpacity
            style={styles.cancelLink}
            onPress={goBackToProfile}
            activeOpacity={0.7}>
            <Text style={styles.cancelText}>HỦY BỎ</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ChangePasswordScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  scrollContent: { flexGrow: 1, padding: 24, justifyContent: "center" },
  header: { alignItems: "center", marginBottom: 32 },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    paddingHorizontal: 10,
  },
  form: { width: "100%" },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
    marginTop: 16,
  },
  passwordContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: "#111827",
  },
  eyeIcon: { padding: 8 },
  submitButton: {
    backgroundColor: "#5B5BD6",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 28,
  },
  submitButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  cancelLink: { alignItems: "center", marginTop: 20, paddingVertical: 10 },
  cancelText: {
    color: "#6B7280",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
