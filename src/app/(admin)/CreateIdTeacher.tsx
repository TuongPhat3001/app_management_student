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

interface TeacherForm {
  fullName: string;
  department: string;
  specialization: string;
  joinYear: string;
}

interface CreatedTeacher {
  teacherId?: string;
  email?: string;
  defaultPassword?: string;
  id?: number;
}

const CreateIdTeacher: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<TeacherForm>({
    fullName: "",
    department: "",
    specialization: "",
    joinYear: "",
  });
  const [createdInfo, setCreatedInfo] = useState<CreatedTeacher | null>(null);

  const handleChange = (field: keyof TeacherForm, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validate = () => {
    if (!formData.fullName.trim()) {
      Alert.alert("Thông báo", "Vui lòng nhập họ và tên.");
      return false;
    }
    if (!formData.department.trim()) {
      Alert.alert("Thông báo", "Vui lòng nhập khoa / bộ môn.");
      return false;
    }
    if (!formData.specialization.trim()) {
      Alert.alert("Thông báo", "Vui lòng nhập chuyên ngành.");
      return false;
    }
    if (!formData.joinYear.trim()) {
      Alert.alert("Thông báo", "Vui lòng nhập năm công tác.");
      return false;
    }
    const year = Number(formData.joinYear);
    if (isNaN(year) || year < 1990 || year > new Date().getFullYear() + 1) {
      Alert.alert("Thông báo", "Năm công tác không hợp lệ.");
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
        department: formData.department.trim(),
        specialization: formData.specialization.trim(),
        joinYear: Number(formData.joinYear),
      };

      const res = await apiClient.post("/teachers", payload);
      const data = res.data?.data || res.data;

      setCreatedInfo({
        teacherId: data?.teacherId || data?.teacher_id || data?.code,
        email: data?.email,
        defaultPassword:
          data?.defaultPassword || data?.default_password || data?.password,
        id: data?.id,
      });

      Alert.alert(
        "Thành công",
        "Tạo giảng viên thành công và đã lưu vào hệ thống!",
      );

      setFormData({
        fullName: "",
        department: "",
        specialization: "",
        joinYear: "",
      });
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        (error?.response?.status === 401
          ? "Bạn chưa đăng nhập hoặc hết phiên."
          : error?.response?.status === 400
            ? "Dữ liệu không hợp lệ. Kiểm tra lại thông tin."
            : "Tạo giảng viên thất bại. Vui lòng thử lại.");
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
        <Text style={styles.headerTitle}>Tạo giảng viên mới</Text>
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
            placeholder="VD: Trương Tường Phát"
            placeholderTextColor="#9CA3AF"
            value={formData.fullName}
            onChangeText={(t) => handleChange("fullName", t)}
          />

          <Text style={styles.label}>Khoa / Bộ môn *</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: Công nghệ thông tin"
            placeholderTextColor="#9CA3AF"
            value={formData.department}
            onChangeText={(t) => handleChange("department", t)}
          />

          <Text style={styles.label}>Chuyên ngành *</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: Hệ thống thông tin"
            placeholderTextColor="#9CA3AF"
            value={formData.specialization}
            onChangeText={(t) => handleChange("specialization", t)}
          />

          <Text style={styles.label}>Năm công tác *</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: 2020"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            value={formData.joinYear}
            onChangeText={(t) => handleChange("joinYear", t)}
          />

          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.7 }]}
            disabled={loading}
            onPress={handleSubmit}
            activeOpacity={0.8}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Tạo giảng viên</Text>
            )}
          </TouchableOpacity>

          {createdInfo && (
            <View style={styles.resultBox}>
              <View style={styles.resultHeader}>
                <Ionicons name="checkmark-circle" size={22} color="#059669" />
                <Text style={styles.resultTitle}>Tài khoản đã tạo</Text>
              </View>
              {createdInfo.teacherId ? (
                <Text style={styles.resultText}>
                  Mã GV:{" "}
                  <Text style={styles.resultBold}>{createdInfo.teacherId}</Text>
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
                Hãy gửi thông tin này cho giảng viên để đăng nhập.
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CreateIdTeacher;

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
