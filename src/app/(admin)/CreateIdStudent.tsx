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

interface StudentForm {
  fullName: string;
  dateOfBirth: string;
  major: string;
}

interface CreatedStudent {
  studentId: string;
  email: string;
  defaultPassword: string;
}

const CreateStudent: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<StudentForm>({
    fullName: "",
    dateOfBirth: "",
    major: "",
  });

  const [createdInfo, setCreatedInfo] = useState<CreatedStudent | null>(null);

  const handleChange = (field: keyof StudentForm, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!formData.fullName || !formData.dateOfBirth || !formData.major) {
      Alert.alert("Thông báo", "Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    setLoading(true);
    setCreatedInfo(null);

    try {
      const res = await apiClient.post("/students", formData);

      setCreatedInfo(res.data);

      Alert.alert("Thành công", "Tạo sinh viên thành công!");

      setFormData({
        fullName: "",
        dateOfBirth: "",
        major: "",
      });
    } catch (error: any) {
      Alert.alert(
        "Lỗi",
        error?.response?.data?.message || "Tạo sinh viên thất bại.",
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
        <Text style={styles.title}>Tạo Tài Khoản Sinh Viên</Text>

        <TextInput
          style={styles.input}
          placeholder="Họ và tên"
          value={formData.fullName}
          onChangeText={(text) => handleChange("fullName", text)}
        />

        <TextInput
          style={styles.input}
          placeholder="Ngày sinh (YYYY-MM-DD)"
          value={formData.dateOfBirth}
          onChangeText={(text) => handleChange("dateOfBirth", text)}
        />

        <TextInput
          style={styles.input}
          placeholder="Ngành học"
          value={formData.major}
          onChangeText={(text) => handleChange("major", text)}
        />

        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.7 }]}
          disabled={loading}
          onPress={handleSubmit}>
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>Tạo Sinh Viên</Text>
          )}
        </TouchableOpacity>

        {createdInfo && (
          <View style={styles.resultBox}>
            <Text style={styles.resultTitle}>Thông tin tài khoản đã tạo</Text>

            <Text style={styles.resultText}>MSSV: {createdInfo.studentId}</Text>

            <Text style={styles.resultText}>Email: {createdInfo.email}</Text>

            <Text style={styles.resultText}>
              Mật khẩu mặc định: {createdInfo.defaultPassword}
            </Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default CreateStudent;

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
    backgroundColor: "#2563EB",
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
    marginBottom: 10,
    color: "#065F46",
  },

  resultText: {
    fontSize: 16,
    marginBottom: 6,
    color: "#111827",
  },
});
