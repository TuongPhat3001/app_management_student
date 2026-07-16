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
  View,
} from "react-native";
import { changePasswordAPI } from "../../api/authApi";

const ChangePasswordScreen = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showNewPassword, setShowNewPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
      Alert.alert("Lỗi", "Mật khẩu mới không được trùng với mật khẩu cũ.");
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

      Alert.alert("Thành công 🎉", response.data.message, [
        {
          text: "OK",
          onPress: () => router.replace("/(auth)/login"),
        },
      ]);
    } catch (error: any) {
      Alert.alert(
        "Lỗi",
        error.response?.data?.error || "Đổi mật khẩu thất bại.",
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
          <Text style={styles.title}>Đổi Mật Khẩu 🔐</Text>
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

          <Text style={styles.label}>Xác nhận mật khẩu mới</Text>
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

          {/* Xác nhận mật khẩu mới */}
          <Text style={styles.label}>Xác nhận mật khẩu mới</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Nhập lại mật khẩu mới"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showNewPassword} // Dùng chung mắt ẩn/hiện với mật khẩu mới
            />
          </View>

          {/* Nút bấm hành động */}
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

          <TouchableOpacity
            style={styles.cancelLink}
            onPress={() => router.back()}>
            <Text style={styles.cancelText}>Hủy bỏ</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

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
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    alignItems: "center",
  },
  passwordInput: { flex: 1, padding: 16, fontSize: 16 },
  eyeIcon: { padding: 16 },
  submitButton: {
    backgroundColor: "#2563EB",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 32,
    marginBottom: 16,
  },
  submitButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  cancelLink: { alignItems: "center", padding: 8 },
  cancelText: { color: "#6B7280", fontSize: 14, fontWeight: "500" },
});

export default ChangePasswordScreen;
