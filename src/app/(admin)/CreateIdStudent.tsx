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

/**
 * Khớp CreateStudentRequest (Go/Gin):
 * required: username, fullName, studentCode, classId
 * optional: password, email, dateOfBirth, gender, phone, address, enrollmentDate, status
 * password mặc định backend: Student@123
 */
interface StudentForm {
  username: string;
  password: string;
  email: string;
  fullName: string;
  studentCode: string;
  classId: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  address: string;
  enrollmentDate: string;
}

interface CreatedResult {
  studentCode?: string;
  email?: string;
  username?: string;
  defaultPassword?: string;
  fullName?: string;
}

const CreateIdStudent: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<StudentForm>({
    username: "",
    password: "",
    email: "",
    fullName: "",
    studentCode: "",
    classId: "",
    dateOfBirth: "",
    gender: "",
    phone: "",
    address: "",
    enrollmentDate: "",
  });
  const [createdInfo, setCreatedInfo] = useState<CreatedResult | null>(null);

  const handleChange = (field: keyof StudentForm, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validate = () => {
    if (!formData.username.trim()) {
      Alert.alert("Thông báo", "Vui lòng nhập tên đăng nhập (username).");
      return false;
    }
    if (!formData.fullName.trim()) {
      Alert.alert("Thông báo", "Vui lòng nhập họ và tên.");
      return false;
    }
    if (!formData.studentCode.trim()) {
      Alert.alert("Thông báo", "Vui lòng nhập mã sinh viên.");
      return false;
    }
    if (!formData.classId.trim() || isNaN(Number(formData.classId))) {
      Alert.alert("Thông báo", "Vui lòng nhập ID lớp học (số).");
      return false;
    }
    if (formData.password.trim() && formData.password.trim().length < 6) {
      Alert.alert("Thông báo", "Mật khẩu phải có ít nhất 6 ký tự.");
      return false;
    }
    if (formData.dateOfBirth.trim()) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(formData.dateOfBirth.trim())) {
        Alert.alert("Thông báo", "Ngày sinh phải đúng YYYY-MM-DD.");
        return false;
      }
    }
    if (formData.enrollmentDate.trim()) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(formData.enrollmentDate.trim())) {
        Alert.alert("Thông báo", "Ngày nhập học phải đúng YYYY-MM-DD.");
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
      studentCode: formData.studentCode.trim(),
      classId: Number(formData.classId),
    };

    if (formData.password.trim()) payload.password = formData.password.trim();
    if (formData.email.trim()) payload.email = formData.email.trim();
    if (formData.dateOfBirth.trim())
      payload.dateOfBirth = formData.dateOfBirth.trim();
    if (formData.gender.trim()) payload.gender = formData.gender.trim();
    if (formData.phone.trim()) payload.phone = formData.phone.trim();
    if (formData.address.trim()) payload.address = formData.address.trim();
    if (formData.enrollmentDate.trim())
      payload.enrollmentDate = formData.enrollmentDate.trim();

    try {
      const res = await apiClient.post("/students", payload);
      const data = res.data?.data || res.data;
      const defaultPassword =
        res.data?.defaultPassword || formData.password.trim() || "Student@123";

      setCreatedInfo({
        studentCode:
          data?.StudentCode || data?.studentCode || formData.studentCode,
        email:
          data?.User?.Email ||
          data?.User?.email ||
          data?.email ||
          formData.email,
        username: formData.username,
        fullName: formData.fullName,
        defaultPassword,
      });

      Alert.alert("Thành công", "Tạo sinh viên thành công!");

      setFormData({
        username: "",
        password: "",
        email: "",
        fullName: "",
        studentCode: "",
        classId: "",
        dateOfBirth: "",
        gender: "",
        phone: "",
        address: "",
        enrollmentDate: "",
      });
    } catch (error: any) {
      const data = error?.response?.data;
      let message = data?.message || data?.error || "Tạo sinh viên thất bại.";
      if (data?.error && typeof data.error === "string") {
        message = `${data.message || "Lỗi"}\n${data.error}`;
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
        <Text style={styles.headerTitle}>Tạo sinh viên mới</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled">
          <Text style={styles.sectionLabel}>Thông tin bắt buộc</Text>

          <Text style={styles.label}>Tên đăng nhập (username) *</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: quang.tran"
            placeholderTextColor="#9CA3AF"
            value={formData.username}
            onChangeText={(t) => handleChange("username", t)}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Họ và tên *</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: Trần Đăng Quang"
            placeholderTextColor="#9CA3AF"
            value={formData.fullName}
            onChangeText={(t) => handleChange("fullName", t)}
          />

          <Text style={styles.label}>Mã sinh viên *</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: 20260001"
            placeholderTextColor="#9CA3AF"
            value={formData.studentCode}
            onChangeText={(t) => handleChange("studentCode", t)}
            autoCapitalize="characters"
          />

          <Text style={styles.label}>ID lớp học (classId) *</Text>
          <TextInput
            style={styles.input}
            placeholder="ID lớp đã có trong hệ thống (số)"
            placeholderTextColor="#9CA3AF"
            value={formData.classId}
            onChangeText={(t) => handleChange("classId", t)}
            keyboardType="numeric"
          />
          <Text style={styles.hint}>
            Lớp phải tồn tại trong DB. Nếu chưa có, tạo lớp trước.
          </Text>

          <Text style={styles.sectionLabel}>Thông tin tùy chọn</Text>

          <Text style={styles.label}>Mật khẩu</Text>
          <TextInput
            style={styles.input}
            placeholder="Để trống → mặc định Student@123"
            placeholderTextColor="#9CA3AF"
            value={formData.password}
            onChangeText={(t) => handleChange("password", t)}
            secureTextEntry
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: quang.tran@student.edu.vn"
            placeholderTextColor="#9CA3AF"
            value={formData.email}
            onChangeText={(t) => handleChange("email", t)}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Ngày sinh</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD (VD: 2005-01-19)"
            placeholderTextColor="#9CA3AF"
            value={formData.dateOfBirth}
            onChangeText={(t) => handleChange("dateOfBirth", t)}
            keyboardType="numbers-and-punctuation"
          />

          <Text style={styles.label}>Giới tính</Text>
          <View style={styles.genderRow}>
            {["Nam", "Nữ", "Khác"].map((g) => {
              const active = formData.gender === g;
              return (
                <TouchableOpacity
                  key={g}
                  style={[styles.genderChip, active && styles.genderChipActive]}
                  onPress={() => handleChange("gender", g)}>
                  <Text
                    style={[
                      styles.genderText,
                      active && styles.genderTextActive,
                    ]}>
                    {g}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.label}>Số điện thoại</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: 0901234567"
            placeholderTextColor="#9CA3AF"
            value={formData.phone}
            onChangeText={(t) => handleChange("phone", t)}
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Địa chỉ</Text>
          <TextInput
            style={styles.input}
            placeholder="Địa chỉ liên hệ"
            placeholderTextColor="#9CA3AF"
            value={formData.address}
            onChangeText={(t) => handleChange("address", t)}
          />

          <Text style={styles.label}>Ngày nhập học</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD (để trống = hôm nay)"
            placeholderTextColor="#9CA3AF"
            value={formData.enrollmentDate}
            onChangeText={(t) => handleChange("enrollmentDate", t)}
            keyboardType="numbers-and-punctuation"
          />

          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.7 }]}
            disabled={loading}
            onPress={handleSubmit}
            activeOpacity={0.8}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Tạo sinh viên</Text>
            )}
          </TouchableOpacity>

          {createdInfo && (
            <View style={styles.resultBox}>
              <View style={styles.resultHeader}>
                <Ionicons name="checkmark-circle" size={22} color="#059669" />
                <Text style={styles.resultTitle}>Tài khoản đã tạo</Text>
              </View>
              {createdInfo.fullName ? (
                <Text style={styles.resultText}>
                  Họ tên:{" "}
                  <Text style={styles.resultBold}>{createdInfo.fullName}</Text>
                </Text>
              ) : null}
              {createdInfo.studentCode ? (
                <Text style={styles.resultText}>
                  MSSV:{" "}
                  <Text style={styles.resultBold}>
                    {createdInfo.studentCode}
                  </Text>
                </Text>
              ) : null}
              {createdInfo.username ? (
                <Text style={styles.resultText}>
                  Username:{" "}
                  <Text style={styles.resultBold}>{createdInfo.username}</Text>
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
                  Mật khẩu:{" "}
                  <Text style={styles.resultBold}>
                    {createdInfo.defaultPassword}
                  </Text>
                </Text>
              ) : null}
              <Text style={styles.resultHint}>
                Gửi thông tin đăng nhập cho sinh viên.
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CreateIdStudent;

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
  genderRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  genderChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
  },
  genderChipActive: {
    backgroundColor: "#5B5BD6",
    borderColor: "#5B5BD6",
  },
  genderText: { fontSize: 14, fontWeight: "600", color: "#374151" },
  genderTextActive: { color: "#FFFFFF" },
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
