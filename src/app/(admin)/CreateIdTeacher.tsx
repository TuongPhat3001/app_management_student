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

const CreateIdTeacher: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    username: "",
    password: "",
    email: "",
    fullName: "",
    teacherCode: "",
    phone: "",
    address: "",
    qualification: "",
  });
  const [created, setCreated] = useState<{
    teacherCode?: string;
    username?: string;
    email?: string;
    defaultPassword?: string;
  } | null>(null);

  const set = (k: keyof typeof form, v: string) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    const username = form.username.trim();
    const fullName = form.fullName.trim();
    const teacherCode = form.teacherCode.trim().toUpperCase();
    const password = form.password.trim();
    let email = form.email.trim().toLowerCase();

    if (!username) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập username.");
      return;
    }
    if (!fullName) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập họ tên.");
      return;
    }
    if (!teacherCode) {
      Alert.alert(
        "Thiếu thông tin",
        "Vui lòng nhập mã giảng viên (teacherCode).",
      );
      return;
    }
    if (password && password.length < 6) {
      Alert.alert("Sai", "Mật khẩu tối thiểu 6 ký tự.");
      return;
    }

    if (!email) {
      email = `${username.replace(/\s+/g, ".")}@teacher.local`;
    }

    const payload: Record<string, any> = {
      username,
      fullName,
      teacherCode,
      email,
    };
    if (password) payload.password = password;
    if (form.phone.trim()) payload.phone = form.phone.trim();
    if (form.address.trim()) payload.address = form.address.trim();
    if (form.qualification.trim())
      payload.qualification = form.qualification.trim();

    setLoading(true);
    setCreated(null);
    try {
      const res = await apiClient.post("/teachers", payload);
      const data = res.data?.data ?? {};
      const code = data?.TeacherCode ?? data?.teacherCode ?? teacherCode;
      const pwd = res.data?.defaultPassword || password || "Teacher@123";
      const savedEmail = data?.User?.Email ?? data?.User?.email ?? email;

      setCreated({
        teacherCode: code,
        username,
        email: savedEmail,
        defaultPassword: pwd,
      });

      Alert.alert(
        "Thành công",
        res.data?.message || `Đã tạo GV ${code}\nUser: ${username}\nMK: ${pwd}`,
      );

      setForm({
        username: "",
        password: "",
        email: "",
        fullName: "",
        teacherCode: "",
        phone: "",
        address: "",
        qualification: "",
      });
    } catch (e: any) {
      const status = e?.response?.status;
      const d = e?.response?.data;
      let msg =
        [d?.message, d?.error].filter(Boolean).join("\n") ||
        "Tạo giảng viên thất bại.";

      if (!e?.response) {
        msg =
          "Không kết nối server. Kiểm tra IP trong axios / backend đang chạy.";
      } else if (status === 401 || status === 403) {
        msg =
          "Phiên đăng nhập hết hạn hoặc không có quyền admin. Đăng nhập lại.";
      } else if (status === 404) {
        msg =
          "API POST /teachers không tồn tại. Kiểm tra route backend CreateTeacher.";
      } else if (/duplicate|unique|tồn tại|already|Duplicate/i.test(msg)) {
        msg =
          "Username, email hoặc mã GV đã tồn tại.\nĐổi username / teacherCode / email rồi thử lại.";
      }

      Alert.alert("Lỗi", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.title}>Tạo giảng viên mới</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Username *</Text>
          <TextInput
            style={styles.input}
            value={form.username}
            onChangeText={(v) => set("username", v)}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="gv001"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.label}>Họ và tên *</Text>
          <TextInput
            style={styles.input}
            value={form.fullName}
            onChangeText={(v) => set("fullName", v)}
            placeholder="Trần Thị B"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.label}>Mã giảng viên (teacherCode) *</Text>
          <TextInput
            style={styles.input}
            value={form.teacherCode}
            onChangeText={(v) => set("teacherCode", v)}
            autoCapitalize="characters"
            autoCorrect={false}
            placeholder="GV001"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.label}>Mật khẩu (mặc định Teacher@123)</Text>
          <TextInput
            style={styles.input}
            value={form.password}
            onChangeText={(v) => set("password", v)}
            secureTextEntry
            placeholder="≥ 6 ký tự hoặc để trống"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.label}>Email (tuỳ chọn)</Text>
          <TextInput
            style={styles.input}
            value={form.email}
            onChangeText={(v) => set("email", v)}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
            placeholder="vd: gv001@school.edu"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.label}>SĐT</Text>
          <TextInput
            style={styles.input}
            value={form.phone}
            onChangeText={(v) => set("phone", v)}
            keyboardType="phone-pad"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.label}>Địa chỉ</Text>
          <TextInput
            style={styles.input}
            value={form.address}
            onChangeText={(v) => set("address", v)}
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.label}>Trình độ (qualification)</Text>
          <TextInput
            style={styles.input}
            value={form.qualification}
            onChangeText={(v) => set("qualification", v)}
            placeholder="Thạc sĩ / Tiến sĩ..."
            placeholderTextColor="#9CA3AF"
          />

          {created && (
            <View style={styles.result}>
              <Text style={styles.resultTitle}>Đã tạo giảng viên</Text>
              <Text>Mã GV: {created.teacherCode}</Text>
              <Text>Username: {created.username}</Text>
              <Text>Email: {created.email}</Text>
              <Text>Mật khẩu: {created.defaultPassword}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.btn, loading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.btnText}>Tạo giảng viên</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CreateIdTeacher;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F3EEFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  back: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  title: { flex: 1, textAlign: "center", fontSize: 17, fontWeight: "700" },
  scroll: { padding: 20, paddingBottom: 40 },
  hint: {
    fontSize: 12.5,
    color: "#5B5BD6",
    backgroundColor: "#EDE9FE",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    lineHeight: 18,
  },
  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 8 },
  input: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    fontSize: 15,
    color: "#1A1A1A",
  },
  result: {
    backgroundColor: "#D1FAE5",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    gap: 4,
  },
  resultTitle: { fontWeight: "700", color: "#059669", marginBottom: 4 },
  btn: {
    backgroundColor: "#5B5BD6",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  btnText: { color: "#FFF", fontWeight: "700", fontSize: 16 },
});
