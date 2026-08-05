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

interface CreateClassForm {
  classCode: string;
  className: string;
  courseId: string;
  semester: string;
  academicYear: string;
  capacity: string;
}

const CreateClass: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<CreateClassForm>({
    classCode: "",
    className: "",
    courseId: "",
    semester: "",
    academicYear: "",
    capacity: "",
  });

  const handleChange = (field: keyof CreateClassForm, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validate = () => {
    if (!formData.classCode.trim()) {
      Alert.alert("Thông báo", "Vui lòng nhập mã lớp.");
      return false;
    }
    if (!formData.className.trim()) {
      Alert.alert("Thông báo", "Vui lòng nhập tên lớp.");
      return false;
    }
    if (!formData.courseId.trim() || isNaN(Number(formData.courseId))) {
      Alert.alert("Thông báo", "ID môn học phải là số.");
      return false;
    }
    if (!formData.semester.trim()) {
      Alert.alert("Thông báo", "Vui lòng nhập học kỳ.");
      return false;
    }
    if (!formData.academicYear.trim()) {
      Alert.alert("Thông báo", "Vui lòng nhập năm học (VD: 2025-2026).");
      return false;
    }
    if (!formData.capacity.trim() || isNaN(Number(formData.capacity))) {
      Alert.alert("Thông báo", "Sức chứa phải là số.");
      return false;
    }
    if (Number(formData.capacity) <= 0) {
      Alert.alert("Thông báo", "Sức chứa phải lớn hơn 0.");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    setSuccess(false);

    try {
      const payload = {
        classCode: formData.classCode.trim(),
        className: formData.className.trim(),
        courseId: Number(formData.courseId),
        semester: formData.semester.trim(),
        academicYear: formData.academicYear.trim(),
        capacity: Number(formData.capacity),
      };

      await apiClient.post("/classes", payload);

      setSuccess(true);
      Alert.alert(
        "Thành công",
        "Tạo lớp học thành công và đã lưu vào hệ thống!",
      );

      setFormData({
        classCode: "",
        className: "",
        courseId: "",
        semester: "",
        academicYear: "",
        capacity: "",
      });
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        (error?.response?.status === 401
          ? "Bạn chưa đăng nhập hoặc hết phiên."
          : error?.response?.status === 400
            ? "Dữ liệu không hợp lệ (mã lớp có thể đã tồn tại)."
            : error?.response?.status === 404
              ? "Không tìm thấy môn học với ID đã nhập."
              : "Không thể tạo lớp học. Vui lòng thử lại.");
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
        <Text style={styles.headerTitle}>Tạo lớp học mới</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Mã lớp *</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: CSDL-202-01"
            placeholderTextColor="#9CA3AF"
            value={formData.classCode}
            onChangeText={(t) => handleChange("classCode", t)}
            autoCapitalize="characters"
          />

          <Text style={styles.label}>Tên lớp *</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: Database Systems - Nhóm 1"
            placeholderTextColor="#9CA3AF"
            value={formData.className}
            onChangeText={(t) => handleChange("className", t)}
          />

          <Text style={styles.label}>ID môn học *</Text>
          <TextInput
            style={styles.input}
            placeholder="ID môn học trong hệ thống (số)"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            value={formData.courseId}
            onChangeText={(t) => handleChange("courseId", t)}
          />
          <Text style={styles.hint}>
            Lấy ID từ màn Quản lý môn học (Courses)
          </Text>

          <Text style={styles.label}>Học kỳ *</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: 1 hoặc HK1"
            placeholderTextColor="#9CA3AF"
            value={formData.semester}
            onChangeText={(t) => handleChange("semester", t)}
          />

          <Text style={styles.label}>Năm học *</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: 2025-2026"
            placeholderTextColor="#9CA3AF"
            value={formData.academicYear}
            onChangeText={(t) => handleChange("academicYear", t)}
          />

          <Text style={styles.label}>Sức chứa *</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: 40"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            value={formData.capacity}
            onChangeText={(t) => handleChange("capacity", t)}
          />

          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Tạo lớp học</Text>
            )}
          </TouchableOpacity>

          {success && (
            <View style={styles.resultBox}>
              <View style={styles.resultHeader}>
                <Ionicons name="checkmark-circle" size={22} color="#059669" />
                <Text style={styles.resultTitle}>Lớp học đã được lưu</Text>
              </View>
              <Text style={styles.resultHint}>
                Bạn có thể phân công giảng viên tại mục “Phân công giảng viên”.
              </Text>
              <TouchableOpacity
                style={styles.linkBtn}
                onPress={() => router.push("/(admin)/AssignTeacher" as any)}>
                <Text style={styles.linkText}>Đi phân công ngay →</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CreateClass;

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
  hint: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: -10,
    marginBottom: 14,
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
    marginBottom: 8,
  },
  resultTitle: { fontSize: 16, fontWeight: "700", color: "#065F46" },
  resultHint: { fontSize: 13, color: "#374151", lineHeight: 20 },
  linkBtn: { marginTop: 10 },
  linkText: { fontSize: 14, fontWeight: "600", color: "#5B5BD6" },
});
