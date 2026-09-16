import apiClient from "@/src/api/axios";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
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

type ClassItem = { id: number; label: string };

const CreateIdStudent: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [form, setForm] = useState({
    username: "",
    password: "",
    email: "",
    fullName: "",
    dateOfBirth: "",
    gender: "",
    phone: "",
    address: "",
    enrollmentDate: "",
  });
  const [created, setCreated] = useState<{
    studentCode?: string;
    username?: string;
    defaultPassword?: string;
  } | null>(null);

  const set = (k: keyof typeof form, v: string) =>
    setForm((p) => ({ ...p, [k]: v }));

  const loadClasses = useCallback(async () => {
    try {
      const res = await apiClient.get("/classes");
      const raw = res.data?.data ?? res.data ?? [];
      const list = (Array.isArray(raw) ? raw : [])
        .map((c: any) => {
          const id = Number(c.ID ?? c.id);
          if (!id) return null;
          const code = String(c.ClassCode ?? c.classCode ?? id);
          const major = c.Major?.Name ?? c.Major?.name ?? c.major?.name ?? "";
          return {
            id,
            label: major ? `${code} · ${major}` : code,
          };
        })
        .filter(Boolean) as ClassItem[];
      setClasses(list);
    } catch {
      setClasses([]);
    }
  }, []);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  const handleSubmit = async () => {
    if (!form.username.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập username.");
      return;
    }
    if (!form.fullName.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập họ tên.");
      return;
    }
    if (!selectedClass) {
      Alert.alert("Thiếu thông tin", "Vui lòng chọn lớp (classId).");
      return;
    }
    if (form.password.trim() && form.password.trim().length < 6) {
      Alert.alert("Sai", "Mật khẩu tối thiểu 6 ký tự.");
      return;
    }
    if (
      form.dateOfBirth.trim() &&
      !/^\d{4}-\d{2}-\d{2}$/.test(form.dateOfBirth.trim())
    ) {
      Alert.alert("Sai", "Ngày sinh YYYY-MM-DD.");
      return;
    }
    if (
      form.enrollmentDate.trim() &&
      !/^\d{4}-\d{2}-\d{2}$/.test(form.enrollmentDate.trim())
    ) {
      Alert.alert("Sai", "Ngày nhập học YYYY-MM-DD.");
      return;
    }

    const payload: Record<string, any> = {
      username: form.username.trim(),
      fullName: form.fullName.trim(),
      classId: selectedClass.id,
    };
    if (form.password.trim()) payload.password = form.password.trim();
    if (form.email.trim()) payload.email = form.email.trim();
    if (form.dateOfBirth.trim()) payload.dateOfBirth = form.dateOfBirth.trim();
    if (form.gender.trim()) payload.gender = form.gender.trim();
    if (form.phone.trim()) payload.phone = form.phone.trim();
    if (form.address.trim()) payload.address = form.address.trim();
    if (form.enrollmentDate.trim())
      payload.enrollmentDate = form.enrollmentDate.trim();

    setLoading(true);
    setCreated(null);
    try {
      const res = await apiClient.post("/students", payload);
      const data = res.data?.data ?? {};
      const code = data?.StudentCode ?? data?.studentCode ?? "";
      const pwd =
        res.data?.defaultPassword || form.password.trim() || "Student@123";
      setCreated({
        studentCode: code,
        username: form.username.trim(),
        defaultPassword: pwd,
      });
      Alert.alert(
        "Thành công",
        res.data?.message || `Tạo SV thành công. Mã: ${code}`,
      );
      setForm({
        username: "",
        password: "",
        email: "",
        fullName: "",
        dateOfBirth: "",
        gender: "",
        phone: "",
        address: "",
        enrollmentDate: "",
      });
      setSelectedClass(null);
    } catch (e: any) {
      const d = e?.response?.data;
      Alert.alert(
        "Lỗi",
        [d?.message, d?.error].filter(Boolean).join("\n") ||
          "Tạo sinh viên thất bại.",
      );
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
        <Text style={styles.title}>Tạo sinh viên mới</Text>
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
            placeholder="sv001"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.label}>Họ và tên *</Text>
          <TextInput
            style={styles.input}
            value={form.fullName}
            onChangeText={(v) => set("fullName", v)}
            placeholder="Nguyễn Văn A"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.label}>Lớp (classId) *</Text>
          <TouchableOpacity
            style={styles.select}
            onPress={() => setPickerOpen(true)}>
            <Text
              style={
                selectedClass ? styles.selectValue : styles.selectPlaceholder
              }>
              {selectedClass ? selectedClass.label : "Chọn lớp..."}
            </Text>
            <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
          </TouchableOpacity>

          <Text style={styles.label}>Mật khẩu (mặc định Student@123)</Text>
          <TextInput
            style={styles.input}
            value={form.password}
            onChangeText={(v) => set("password", v)}
            secureTextEntry
            placeholder="≥ 6 ký tự hoặc để trống"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={form.email}
            onChangeText={(v) => set("email", v)}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor="#9CA3AF"
            placeholder="email@school.edu"
          />

          <Text style={styles.label}>Ngày sinh (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            value={form.dateOfBirth}
            onChangeText={(v) => set("dateOfBirth", v)}
            placeholder="2004-01-15"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.label}>Giới tính</Text>
          <View style={styles.row}>
            {["Nam", "Nữ", "Khác"].map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.chip, form.gender === g && styles.chipOn]}
                onPress={() => set("gender", g)}>
                <Text
                  style={{
                    color: form.gender === g ? "#5B5BD6" : "#374151",
                    fontWeight: "600",
                  }}>
                  {g}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

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

          <Text style={styles.label}>Ngày nhập học (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            value={form.enrollmentDate}
            onChangeText={(v) => set("enrollmentDate", v)}
            placeholder="2024-09-01"
            placeholderTextColor="#9CA3AF"
          />

          {created && (
            <View style={styles.result}>
              <Text style={styles.resultTitle}>Đã tạo</Text>
              <Text>Mã SV: {created.studentCode || "—"}</Text>
              <Text>Username: {created.username}</Text>
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
              <Text style={styles.btnText}>Tạo sinh viên</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={pickerOpen} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Chọn lớp</Text>
              <TouchableOpacity onPress={() => setPickerOpen(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={classes}
              keyExtractor={(i) => String(i.id)}
              ListEmptyComponent={
                <Text
                  style={{
                    textAlign: "center",
                    color: "#9CA3AF",
                    padding: 24,
                  }}>
                  Không có lớp. Tạo lớp trước.
                </Text>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerRow}
                  onPress={() => {
                    setSelectedClass(item);
                    setPickerOpen(false);
                  }}>
                  <Text style={styles.pickerMain}>{item.label}</Text>
                  <Text style={styles.pickerSub}>ID: {item.id}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default CreateIdStudent;

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
  },
  select: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 14,
  },
  selectValue: { flex: 1, fontSize: 15, color: "#1A1A1A" },
  selectPlaceholder: { flex: 1, fontSize: 15, color: "#9CA3AF" },
  row: { flexDirection: "row", gap: 8, marginBottom: 14 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  chipOn: { borderColor: "#5B5BD6", backgroundColor: "#EDE9FE" },
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
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
    paddingBottom: 24,
  },
  modalHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalTitle: { fontSize: 16, fontWeight: "700" },
  pickerRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  pickerMain: { fontSize: 15, fontWeight: "600" },
  pickerSub: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
});
