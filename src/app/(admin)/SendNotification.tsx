import apiClient from "@/src/api/axios";
import { Picker } from "@react-native-picker/picker";
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

interface NotificationForm {
  title: string;
  content: string;
  target: string;
}

const SendNotificationToEmail: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<NotificationForm>({
    title: "",
    content: "",
    target: "all",
  });

  const handleChange = (field: keyof NotificationForm, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.content) {
      Alert.alert("Thông báo", "Vui lòng nhập tiêu đề và nội dung.");
      return;
    }

    setLoading(true);

    try {
      await apiClient.post("/notifications/email", formData);

      Alert.alert("Thành công", "Gửi thông báo thành công!");

      setFormData({
        title: "",
        content: "",
        target: "all",
      });
    } catch (error: any) {
      Alert.alert(
        "Lỗi",
        error?.response?.data?.message || "Gửi thông báo thất bại.",
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
        <Text style={styles.title}>Gửi Thông Báo Qua Email</Text>

        <TextInput
          style={styles.input}
          placeholder="Tiêu đề"
          value={formData.title}
          onChangeText={(text) => handleChange("title", text)}
        />

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Nội dung thông báo"
          value={formData.content}
          onChangeText={(text) => handleChange("content", text)}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />

        <Text style={styles.label}>Đối tượng nhận</Text>

        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.target}
            onValueChange={(value) => handleChange("target", value)}>
            <Picker.Item label="Tất cả" value="all" />
            <Picker.Item label="Sinh viên" value="student" />
            <Picker.Item label="Giảng viên" value="teacher" />
            <Picker.Item label="Quản trị viên" value="admin" />
          </Picker>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.7 }]}
          disabled={loading}
          onPress={handleSubmit}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Gửi Thông Báo</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SendNotificationToEmail;

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

  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#374151",
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

  textArea: {
    height: 150,
  },

  pickerContainer: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    marginBottom: 20,
    overflow: "hidden",
  },

  button: {
    backgroundColor: "#16A34A",
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
