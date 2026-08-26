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
  username: string;
  password: string;
  email: string;
  fullName: string;
  teacherCode: string;
  department: string;
  specialization: string;
  phone: string;
  joinYear: string;
}

interface CreatedInfo {
  teacherCode?: string;
  username?: string;
  fullName?: string;
  email?: string;
  defaultPassword?: string;
}

const extractError = (error: any): string => {
  const status = error?.response?.status;
  const data = error?.response?.data;

  if (!error?.response) {
    return "Không kết nối được server. Kiểm tra mạng / baseURL.";
  }

  if (status === 404) {
    return "API POST /teachers chưa có trên backend.\nCần thêm CreateTeacher trong user_management_controller.go và đăng ký route.";
  }

  if (status === 401 || status === 403) {
    return "Bạn chưa đăng nhập hoặc không có quyền admin.";
  }

  if (!data) return `Lỗi HTTP ${status}`;

  const parts: string[] = [];
  if (typeof data.message === "string") parts.push(data.message);
  if (Array.isArray(data.message)) parts.push(data.message.join("\n"));
  if (typeof data.error === "string" && data.error !== data.message) {
    parts.push(data.error);
  }

  if (parts.length === 0) {
    try {
      parts.push(JSON.stringify(data));
    } catch {
      parts.push(`Lỗi HTTP ${status}`);
    }
  }

  return parts.join("\n");
};

const CreateIdTeacher: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<TeacherForm>({
    username: "",
    password: "",
    email: "",
    fullName: "",
    teacherCode: "",
    department: "",
    specialization: "",
    phone: "",
    joinYear: "",
  });
  const [createdInfo, setCreatedInfo] = useState<CreatedInfo | null>(null);

  const handleChange = (field: keyof TeacherForm, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validate = (): boolean => {
    if (!formData.username.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập username.");
      return false;
    }
    if (!formData.fullName.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập họ và tên.");
      return false;
    }
    if (!formData.teacherCode.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập mã giảng viên.");
      return false;
    }
    if (formData.password.trim() && formData.password.trim().length < 6) {
      Alert.alert("Sai định dạng", "Mật khẩu phải có ít nhất 6 ký tự.");
      return false;
    }
    if (formData.joinYear.trim()) {
      const y = Number(formData.joinYear);
      if (isNaN(y) || y < 1990 || y > new Date().getFullYear() + 1) {
        Alert.alert("Sai định dạng", "Năm công tác không hợp lệ.");
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    setCreatedInfo(null);

    const payload: Record<string, any> = {
      username: formData.username.trim(),
      fullName: formData.fullName.trim(),
      teacherCode: formData.teacherCode.trim(),
    };

    if (formData.password.trim()) payload.password = formData.password.trim();
    if (formData.email.trim()) payload.email = formData.email.trim();
    if (formData.department.trim())
      payload.department = formData.department.trim();
    if (formData.specialization.trim())
      payload.specialization = formData.specialization.trim();
    if (formData.phone.trim()) payload.phone = formData.phone.trim();
    if (formData.joinYear.trim()) payload.joinYear = Number(formData.joinYear);

    try {
      const res = await apiClient.post("/teachers", payload);
      const data = res.data?.data ?? res.data;
      const defaultPassword =
        res.data?.defaultPassword || formData.password.trim() || "Teacher@123";

      setCreatedInfo({
        teacherCode:
          data?.TeacherCode ||
          data?.teacherCode ||
          data?.teacher_code ||
          formData.teacherCode,
        username: formData.username.trim(),
        fullName: formData.fullName.trim(),
        email:
          data?.User?.Email ||
          data?.User?.email ||
          data?.email ||
          formData.email.trim() ||
          undefined,
        defaultPassword,
      });

      Alert.alert("Thành công", "Tạo giảng viên thành công!");

      setFormData({
        username: "",
        password: "",
        email: "",
        fullName: "",
        teacherCode: "",
        department: "",
        specialization: "",
        phone: "",
        joinYear: "",
      });
    } catch (error: any) {
      Alert.alert("Lỗi", extractError(error));
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
          <Text style={styles.sectionLabel}>Bắt buộc</Text>

          <Text style={styles.label}>Username *</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: phat.truong"
            placeholderTextColor="#9CA3AF"
            value={formData.username}
            onChangeText={(t) => handleChange("username", t)}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Họ và tên *</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: Trương Tường Phát"
            placeholderTextColor="#9CA3AF"
            value={formData.fullName}
            onChangeText={(t) => handleChange("fullName", t)}
          />

          <Text style={styles.label}>Mã giảng viên *</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: GV001"
            placeholderTextColor="#9CA3AF"
            value={formData.teacherCode}
            onChangeText={(t) => handleChange("teacherCode", t)}
            autoCapitalize="characters"
          />

          <Text style={styles.sectionLabel}>Tùy chọn</Text>

          <Text style={styles.label}>Mật khẩu</Text>
          <TextInput
            style={styles.input}
            placeholder="Để trống → Teacher@123"
            placeholderTextColor="#9CA3AF"
            value={formData.password}
            onChangeText={(t) => handleChange("password", t)}
            secureTextEntry
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: phat.truong@gmail.edu.vn"
            placeholderTextColor="#9CA3AF"
            value={formData.email}
            onChangeText={(t) => handleChange("email", t)}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Khoa / Bộ môn</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: Công Nghệ Thông tin"
            placeholderTextColor="#9CA3AF"
            value={formData.department}
            onChangeText={(t) => handleChange("department", t)}
          />

          <Text style={styles.label}>Chuyên ngành</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: Hệ thống"
            placeholderTextColor="#9CA3AF"
            value={formData.specialization}
            onChangeText={(t) => handleChange("specialization", t)}
          />

          <Text style={styles.label}>Số điện thoại</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: 0901234567"
            placeholderTextColor="#9CA3AF"
            value={formData.phone}
            onChangeText={(t) => handleChange("phone", t)}
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Năm công tác</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: 2020"
            placeholderTextColor="#9CA3AF"
            value={formData.joinYear}
            onChangeText={(t) => handleChange("joinYear", t)}
            keyboardType="numeric"
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
              {!!createdInfo.fullName && (
                <Text style={styles.resultText}>
                  Họ tên:{" "}
                  <Text style={styles.resultBold}>{createdInfo.fullName}</Text>
                </Text>
              )}
              {!!createdInfo.teacherCode && (
                <Text style={styles.resultText}>
                  Mã GV:{" "}
                  <Text style={styles.resultBold}>
                    {createdInfo.teacherCode}
                  </Text>
                </Text>
              )}
              {!!createdInfo.username && (
                <Text style={styles.resultText}>
                  Username:{" "}
                  <Text style={styles.resultBold}>{createdInfo.username}</Text>
                </Text>
              )}
              {!!createdInfo.email && (
                <Text style={styles.resultText}>
                  Email:{" "}
                  <Text style={styles.resultBold}>{createdInfo.email}</Text>
                </Text>
              )}
              {!!createdInfo.defaultPassword && (
                <Text style={styles.resultText}>
                  Mật khẩu:{" "}
                  <Text style={styles.resultBold}>
                    {createdInfo.defaultPassword}
                  </Text>
                </Text>
              )}
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
    marginBottom: 12,
  },
  resultTitle: { fontSize: 16, fontWeight: "700", color: "#065F46" },
  resultText: { fontSize: 14, color: "#374151", marginBottom: 6 },
  resultBold: { fontWeight: "700", color: "#111827" },
});
