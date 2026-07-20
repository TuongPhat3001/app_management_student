import apiClient from "@/src/api/axios";
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

interface CreateClassRequest {
  classCode: string;
  className: string;
  courseId: string;
  semester: string;
  academicYear: string;
  capacity: string;
}

const CreateClass: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<CreateClassRequest>({
    classCode: "",
    className: "",
    courseId: "",
    semester: "",
    academicYear: "",
    capacity: "",
  });

  const handleChange = (field: keyof CreateClassRequest, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    if (
      !formData.classCode ||
      !formData.className ||
      !formData.courseId ||
      !formData.semester ||
      !formData.academicYear ||
      !formData.capacity
    ) {
      Alert.alert("Thông báo", "Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    setLoading(true);

    try {
      await apiClient.post("/classes", {
        classCode: formData.classCode,
        className: formData.className,
        courseId: Number(formData.courseId),
        semester: formData.semester,
        academicYear: formData.academicYear,
        capacity: Number(formData.capacity),
      });

      Alert.alert("Thành công", "Tạo lớp học thành công!");

      setFormData({
        classCode: "",
        className: "",
        courseId: "",
        semester: "",
        academicYear: "",
        capacity: "",
      });
    } catch (error: any) {
      Alert.alert(
        "Lỗi",
        error?.response?.data?.message || "Không thể tạo lớp học.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Tạo Lớp Học Mới</Text>

        <TextInput
          style={styles.input}
          placeholder="Mã lớp"
          value={formData.classCode}
          onChangeText={(text) => handleChange("classCode", text)}
        />

        <TextInput
          style={styles.input}
          placeholder="Tên lớp"
          value={formData.className}
          onChangeText={(text) => handleChange("className", text)}
        />

        <TextInput
          style={styles.input}
          placeholder="ID môn học"
          keyboardType="numeric"
          value={formData.courseId}
          onChangeText={(text) => handleChange("courseId", text)}
        />

        <TextInput
          style={styles.input}
          placeholder="Học kỳ"
          value={formData.semester}
          onChangeText={(text) => handleChange("semester", text)}
        />

        <TextInput
          style={styles.input}
          placeholder="Năm học (VD: 2025-2026)"
          value={formData.academicYear}
          onChangeText={(text) => handleChange("academicYear", text)}
        />

        <TextInput
          style={styles.input}
          placeholder="Sức chứa"
          keyboardType="numeric"
          value={formData.capacity}
          onChangeText={(text) => handleChange("capacity", text)}
        />

        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Tạo lớp học</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default CreateClass;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    padding: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 25,
    color: "#111827",
  },

  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 15,
    fontSize: 16,
  },

  button: {
    marginTop: 10,
    backgroundColor: "#2563EB",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
});
