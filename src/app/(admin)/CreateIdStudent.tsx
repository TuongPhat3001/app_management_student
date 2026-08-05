import apiClient from "@/src/api/axios";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

interface StudentForm {
  fullName: string;
  dateOfBirth: string;
  major: string;
}

interface CreatedStudent {
  studentId?: string;
  email?: string;
  defaultPassword?: string;
  id?: number;
}

const CreateIdStudent: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<StudentForm>({
    fullName: "",
    dateOfBirth: "",
    major: "",
  });
  const [createdInfo, setCreatedInfo] = useState<CreatedStudent | null>(null);

  const handleChange = (field: keyof StudentForm, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validate = () => {
    if (!formData.fullName.trim()) {
      Alert.alert("Thông báo", "Vui lòng nhập họ và tên.");
      return false;
    }
    if (!formData.dateOfBirth.trim()) {
      Alert.alert("Thông báo", "Vui lòng nhập ngày sinh (YYYY-MM-DD).");
      return false;
    }
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(formData.dateOfBirth.trim())) {
      Alert.alert("Thông báo", "Ngày sinh phải đúng định dạng YYYY-MM-DD.");
      return false;
    }
    if (!formData.major.trim()) {
      Alert.alert("Thông báo", "Vui lòng nhập ngành học.");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    setCreatedInfo(null);

    try {
      const payload = {
        fullName: formData.fullName.trim(),
        dateOfBirth: formData.dateOfBirth.trim(),
        major: formData.major.trim(),
      };

      const res = await apiClient.post("/students", payload);
      const data = res.data?.data || res.data;

      setCreatedInfo({
        studentId: data?.studentId || data?.student_id || data?.mssv,
        email: data?.email,
        defaultPassword:
          data?.defaultPassword || data?.default_password || data?.password,
        id: data?.id,
      });

      Alert.alert(
        "Thành công",
        "Tạo sinh viên thành công và đã lưu vào hệ thống!",
      );

      setFormData({ fullName: "", dateOfBirth: "", major: "" });
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        (error?.response?.status === 401
          ? "Bạn chưa đăng nhập hoặc hết phiên."
          : error?.response?.status === 400
            ? "Dữ liệu không hợp lệ. Kiểm tra lại thông tin."
            : "Tạo sinh viên thất bại. Vui lòng thử lại.");
      Alert.alert("Lỗi", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3EEFF" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tạo sinh viên mới</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Họ và tên *</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: Nguyễn Văn An"
            placeholderTextColor="#9CA3AF"
            value={formData.fullName}
            onChangeText={(t) => handleChange("fullName", t)}
          />

          <Text style={styles.label}>Ngày sinh *</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD (VD: 2004-05-15)"
            placeholderTextColor="#9CA3AF"
            value={formData.dateOfBirth}
            onChangeText={(t) => handleChange("dateOfBirth", t)}
            keyboardType="numbers-and-punctuation"
          />

          <Text style={styles.label}>Ngành học *</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: Công nghệ thông tin"
            placeholderTextColor="#9CA3AF"
            value={formData.major}
            onChangeText={(t) => handleChange("major", t)}
          />

          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.7 }]}
            disabled={loading}
            onPress={handleSubmit}
            activeOpacity={0.8}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Tạo sinh viên</Text>
            )}
          </TouchableOpacity>

          {createdInfo && (
            <View style={styles.resultBox}>
              <View style={styles.resultHeader}>
                <Ionicons name="checkmark-circle" size={22} color="#059669" />
                <Text style={styles.resultTitle}>Tài khoản đã tạo</Text>
              </View>
              {createdInfo.studentId ? (
                <Text style={styles.resultText}>
                  MSSV:{" "}
                  <Text style={styles.resultBold}>{createdInfo.studentId}</Text>
                </Text>
              ) : null}
              {createdInfo.email ? (
                <Text style={styles.resultText}>
                  Email:{" "}
                  <Text style={styles.resultBold}>{createdInfo.email}</Text>
                </Text>
              ) : null}
              {createdInfo.defaultPassword ? (
                <Text style={styles.resultText}>
                  Mật khẩu mặc định:{" "}
                  <Text style={styles.resultBold}>
                    {createdInfo.defaultPassword}
                  </Text>
                </Text>
              ) : null}
              <Text style={styles.resultHint}>
                Hãy gửi thông tin này cho sinh viên để đăng nhập.
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CreateIdStudent;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F3EEFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  headerSpacer: { width: 40 },
  scroll: { padding: 20, paddingBottom: 40 },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 16,
    fontSize: 15,
    color: "#1A1A1A",
  },
  button: {
    backgroundColor: "#5B5BD6",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  resultBox: {
    marginTop: 24,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    borderRadius: 14,
    padding: 16,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  resultTitle: { fontSize: 16, fontWeight: "700", color: "#065F46" },
  resultText: { fontSize: 14, color: "#374151", marginBottom: 6 },
  resultBold: { fontWeight: "700", color: "#111827" },
  resultHint: {
    fontSize: 12,
    color: "#059669",
    marginTop: 8,
    fontStyle: "italic",
  },
});
