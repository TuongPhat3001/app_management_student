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
  View,
} from "react-native";

interface TeacherForm {
  fullName: string;
  department: string;
  specialization: string;
  joinYear: string;
}

interface CreatedTeacher {
  teacherId: string;
  email: string;
  defaultPassword?: string;
}

const CreateTeacher: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<TeacherForm>({
    fullName: "",
    department: "",
    specialization: "",
    joinYear: "",
  });

  const [createdInfo, setCreatedInfo] = useState<CreatedTeacher | null>(null);

  const handleChange = (field: keyof TeacherForm, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    if (
      !formData.fullName ||
      !formData.department ||
      !formData.specialization ||
      !formData.joinYear
    ) {
      Alert.alert("Thông báo", "Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    setLoading(true);
    setCreatedInfo(null);

    try {
      const res = await apiClient.post("/teachers", {
        fullName: formData.fullName,
        department: formData.department,
        specialization: formData.specialization,
        joinYear: Number(formData.joinYear),
      });

      setCreatedInfo(res.data);

      Alert.alert("Thành công", "Tạo giảng viên thành công!");

      setFormData({
        fullName: "",
        department: "",
        specialization: "",
        joinYear: "",
      });
    } catch (error: any) {
      Alert.alert(
        "Lỗi",
        error?.response?.data?.message || "Tạo giảng viên thất bại.",
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
        <Text style={styles.title}>Tạo Tài Khoản Giảng Viên</Text>

        <TextInput
          style={styles.input}
          placeholder="Họ và tên"
          value={formData.fullName}
          onChangeText={(text) => handleChange("fullName", text)}
        />

        <TextInput
          style={styles.input}
          placeholder="Khoa / Bộ môn"
          value={formData.department}
          onChangeText={(text) => handleChange("department", text)}
        />

        <TextInput
          style={styles.input}
          placeholder="Chuyên ngành"
          value={formData.specialization}
          onChangeText={(text) => handleChange("specialization", text)}
        />

        <TextInput
          style={styles.input}
          placeholder="Năm công tác"
          keyboardType="numeric"
          value={formData.joinYear}
          onChangeText={(text) => handleChange("joinYear", text)}
        />

        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.7 }]}
          disabled={loading}
          onPress={handleSubmit}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Tạo Giảng Viên</Text>
          )}
        </TouchableOpacity>

        {createdInfo && (
          <View style={styles.resultBox}>
            <Text style={styles.resultTitle}>Thông tin tài khoản đã tạo</Text>

            <Text style={styles.resultText}>
              Mã giảng viên: {createdInfo.teacherId}
            </Text>

            <Text style={styles.resultText}>Email: {createdInfo.email}</Text>

            {createdInfo.defaultPassword && (
              <Text style={styles.resultText}>
                Mật khẩu mặc định: {createdInfo.defaultPassword}
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default CreateTeacher;

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
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 10,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },

  resultBox: {
    marginTop: 25,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    borderRadius: 10,
    padding: 15,
  },

  resultTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#065F46",
    marginBottom: 10,
  },

  resultText: {
    fontSize: 16,
    marginBottom: 6,
    color: "#111827",
  },
});
