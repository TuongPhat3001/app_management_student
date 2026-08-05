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
  majorId: string;
  semesterId: string;
  roomId: string;
  capacity: string;
  teacherId: string;
  academicYear: string;
}

const CreateClass: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [createdClassId, setCreatedClassId] = useState<number | null>(null);
  const [formData, setFormData] = useState<CreateClassForm>({
    classCode: "",
    className: "",
    courseId: "",
    majorId: "",
    semesterId: "",
    roomId: "",
    capacity: "",
    teacherId: "",
    academicYear: "",
  });

  const handleChange = (field: keyof CreateClassForm, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const requireNumber = (value: string, label: string) => {
    if (!value.trim() || isNaN(Number(value)) || Number(value) <= 0) {
      Alert.alert("Thông báo", `${label} phải là số > 0.`);
      return false;
    }
    return true;
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
    if (!requireNumber(formData.majorId, "ID ngành (majorId)")) return false;
    if (!requireNumber(formData.semesterId, "ID học kỳ (semesterId)"))
      return false;
    if (!requireNumber(formData.roomId, "ID phòng (roomId)")) return false;

    if (formData.courseId.trim() && isNaN(Number(formData.courseId))) {
      Alert.alert("Thông báo", "ID môn học phải là số.");
      return false;
    }
    if (formData.capacity.trim()) {
      if (isNaN(Number(formData.capacity)) || Number(formData.capacity) <= 0) {
        Alert.alert("Thông báo", "Sức chứa phải là số > 0.");
        return false;
      }
    }
    if (formData.teacherId.trim() && isNaN(Number(formData.teacherId))) {
      Alert.alert("Thông báo", "ID giảng viên phải là số.");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    setSuccess(false);
    setCreatedClassId(null);

    const majorId = Number(formData.majorId);
    const semesterId = Number(formData.semesterId);
    const roomId = Number(formData.roomId);

    // Gửi cả majorId / majorID để khớp json tag backend
    const payload: Record<string, any> = {
      classCode: formData.classCode.trim(),
      className: formData.className.trim(),
      majorId,
      semesterId,
      roomId,
      majorID: majorId,
      semesterID: semesterId,
      roomID: roomId,
    };

    if (formData.courseId.trim()) {
      const courseId = Number(formData.courseId);
      payload.courseId = courseId;
      payload.courseID = courseId;
    }
    if (formData.capacity.trim()) {
      payload.capacity = Number(formData.capacity);
    }
    if (formData.teacherId.trim()) {
      const teacherId = Number(formData.teacherId);
      payload.teacherId = teacherId;
      payload.teacherID = teacherId;
    }
    if (formData.academicYear.trim()) {
      payload.academicYear = formData.academicYear.trim();
    }

    try {
      const res = await apiClient.post("/classes", payload);
      const data = res.data?.data || res.data;

      setSuccess(true);
      setCreatedClassId(data?.ID || data?.id || data?.Id || null);

      Alert.alert("Thành công", "Tạo lớp học thành công!");

      setFormData({
        classCode: "",
        className: "",
        courseId: "",
        majorId: "",
        semesterId: "",
        roomId: "",
        capacity: "",
        teacherId: "",
        academicYear: "",
      });
    } catch (error: any) {
      const data = error?.response?.data;
      let message = data?.message || data?.error || "Không thể tạo lớp học.";

      if (data?.error && typeof data.error === "string") {
        message = `${data.message || "Lỗi"}\n${data.error}`;
      } else if (error?.response?.status === 401) {
        message = "Bạn chưa đăng nhập hoặc hết phiên.";
      } else if (error?.response?.status === 404) {
        message =
          "Không tìm thấy ngành / học kỳ / phòng / môn học với ID đã nhập.";
      }

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
          <Text style={styles.sectionLabel}>Thông tin lớp</Text>

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
            placeholder="VD: Database Systems"
            placeholderTextColor="#9CA3AF"
            value={formData.className}
            onChangeText={(t) => handleChange("className", t)}
          />

          <Text style={styles.sectionLabel}>ID bắt buộc</Text>

          <Text style={styles.label}>ID ngành*</Text>
          <TextInput
            style={styles.input}
            placeholder="ID ngành trong DB (số)"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            value={formData.majorId}
            onChangeText={(t) => handleChange("majorId", t)}
          />

          <Text style={styles.label}>ID học kỳ*</Text>
          <TextInput
            style={styles.input}
            placeholder="ID học kỳ trong DB (số)"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            value={formData.semesterId}
            onChangeText={(t) => handleChange("semesterId", t)}
          />

          <Text style={styles.label}>ID phòng học*</Text>
          <TextInput
            style={styles.input}
            placeholder="ID phòng trong DB (số)"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            value={formData.roomId}
            onChangeText={(t) => handleChange("roomId", t)}
          />

          <Text style={styles.sectionLabel}>Thông tin thêm</Text>

          <Text style={styles.label}>ID môn học</Text>
          <TextInput
            style={styles.input}
            placeholder="ID môn học (số)"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            value={formData.courseId}
            onChangeText={(t) => handleChange("courseId", t)}
          />

          <Text style={styles.label}>Năm học</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: 2025-2026"
            placeholderTextColor="#9CA3AF"
            value={formData.academicYear}
            onChangeText={(t) => handleChange("academicYear", t)}
          />

          <Text style={styles.label}>Sức chứa</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: 40"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            value={formData.capacity}
            onChangeText={(t) => handleChange("capacity", t)}
          />

          <Text style={styles.label}>ID giảng viên</Text>
          <TextInput
            style={styles.input}
            placeholder="Để trống nếu phân công sau"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            value={formData.teacherId}
            onChangeText={(t) => handleChange("teacherId", t)}
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
              {createdClassId ? (
                <Text style={styles.resultText}>
                  ID lớp:{" "}
                  <Text style={styles.resultBold}>{createdClassId}</Text>
                  {"\n"}
                  Dùng ID này làm classId khi tạo sinh viên.
                </Text>
              ) : (
                <Text style={styles.resultHint}>
                  Lấy ID lớp từ danh sách lớp để gán khi tạo sinh viên.
                </Text>
              )}
              <TouchableOpacity
                style={styles.linkBtn}
                onPress={() => router.push("/(admin)/AssignTeacher" as any)}>
                <Text style={styles.linkText}>Đi phân công giảng viên →</Text>
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
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#5B5BD6",
    marginBottom: 12,
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
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
    marginBottom: 8,
  },
  resultTitle: { fontSize: 16, fontWeight: "700", color: "#065F46" },
  resultText: { fontSize: 13, color: "#374151", lineHeight: 20 },
  resultBold: { fontWeight: "700", color: "#111827" },
  resultHint: { fontSize: 13, color: "#374151", lineHeight: 20 },
  linkBtn: { marginTop: 10 },
  linkText: { fontSize: 14, fontWeight: "600", color: "#5B5BD6" },
});
