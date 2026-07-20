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

interface AssignTeacherForm {
  classId: string;
  teacherId: string;
  startTime: string;
  endTime: string;
}

const AssignTeacher: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<AssignTeacherForm>({
    classId: "",
    teacherId: "",
    startTime: "",
    endTime: "",
  });

  const handleChange = (field: keyof AssignTeacherForm, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    if (
      !formData.classId ||
      !formData.teacherId ||
      !formData.startTime ||
      !formData.endTime
    ) {
      Alert.alert("Thông báo", "Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    setLoading(true);

    try {
      await apiClient.put(`/classes/${formData.classId}/assign-teacher`, {
        teacherId: Number(formData.teacherId),
        startTime: formData.startTime,
        endTime: formData.endTime,
      });

      Alert.alert("Thành công", "Phân công giảng viên thành công!");

      setFormData({
        classId: "",
        teacherId: "",
        startTime: "",
        endTime: "",
      });
    } catch (error: any) {
      Alert.alert(
        "Lỗi",
        error?.response?.data?.message || "Phân công thất bại.",
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
        <Text style={styles.title}>Phân Công Giảng Viên</Text>

        <TextInput
          style={styles.input}
          placeholder="ID lớp học"
          keyboardType="numeric"
          value={formData.classId}
          onChangeText={(text) => handleChange("classId", text)}
        />

        <TextInput
          style={styles.input}
          placeholder="ID giảng viên"
          keyboardType="numeric"
          value={formData.teacherId}
          onChangeText={(text) => handleChange("teacherId", text)}
        />

        <TextInput
          style={styles.input}
          placeholder="Thời gian bắt đầu (YYYY-MM-DD HH:mm)"
          value={formData.startTime}
          onChangeText={(text) => handleChange("startTime", text)}
        />

        <TextInput
          style={styles.input}
          placeholder="Thời gian kết thúc (YYYY-MM-DD HH:mm)"
          value={formData.endTime}
          onChangeText={(text) => handleChange("endTime", text)}
        />

        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.7 }]}
          disabled={loading}
          onPress={handleSubmit}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Phân công giảng viên</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default AssignTeacher;

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
    backgroundColor: "#4F46E5",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
});
