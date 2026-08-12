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

interface AssignTeacherForm {
  classId: string;
  teacherId: string;
  startTime: string;
  endTime: string;
}

const AssignTeacher: React.FC = () => {
  const router = useRouter();
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
      !formData.classId.trim() ||
      !formData.teacherId.trim() ||
      !formData.startTime.trim() ||
      !formData.endTime.trim()
    ) {
      Alert.alert("Thông báo", "Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    const classId = Number(formData.classId);
    const teacherId = Number(formData.teacherId);
    if (isNaN(classId) || classId <= 0 || isNaN(teacherId) || teacherId <= 0) {
      Alert.alert("Thông báo", "ID lớp và ID giảng viên phải là số > 0.");
      return;
    }

    setLoading(true);

    try {
      await apiClient.put(`/classes/${classId}/assign-teacher`, {
        teacherId,
        teacherID: teacherId,
        startTime: formData.startTime.trim(),
        endTime: formData.endTime.trim(),
      });

      Alert.alert("Thành công", "Phân công giảng viên thành công!");

      setFormData({
        classId: "",
        teacherId: "",
        startTime: "",
        endTime: "",
      });
    } catch (error: any) {
      const data = error?.response?.data;
      const message =
        data?.message ||
        data?.error ||
        (error?.response?.status === 404
          ? "API phân công chưa có trên backend hoặc ID không tồn tại."
          : "Phân công thất bại.");
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
        <Text style={styles.headerTitle}>Phân công giảng viên</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>ID lớp học *</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: 1"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            value={formData.classId}
            onChangeText={(text) => handleChange("classId", text)}
          />

          <Text style={styles.label}>ID giảng viên *</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: 2"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            value={formData.teacherId}
            onChangeText={(text) => handleChange("teacherId", text)}
          />

          <Text style={styles.label}>Thời gian bắt đầu *</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD HH:mm"
            placeholderTextColor="#9CA3AF"
            value={formData.startTime}
            onChangeText={(text) => handleChange("startTime", text)}
          />

          <Text style={styles.label}>Thời gian kết thúc *</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD HH:mm"
            placeholderTextColor="#9CA3AF"
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
    </SafeAreaView>
  );
};

export default AssignTeacher;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F3EEFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#F3EEFF",
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  headerSpacer: {
    width: 40,
  },
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: "#1A1A1A",
  },
  button: {
    marginTop: 28,
    backgroundColor: "#5B5BD6",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
