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
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface FormState {
  subject: string;
  content: string;
  recipientEmail: string;
  recipientUserId: string;
  sendNow: boolean;
}

const SendNotification: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormState>({
    subject: "",
    content: "",
    recipientEmail: "",
    recipientUserId: "",
    sendNow: true,
  });

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!form.subject.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập tiêu đề");
      return;
    }
    if (!form.content.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập nội dung.");
      return;
    }

    const email = form.recipientEmail.trim();
    const userIdStr = form.recipientUserId.trim();

    if (!email && !userIdStr) {
      Alert.alert(
        "Thiếu người nhận",
        "Nhập email người nhận hoặc ID user (recipientUserId).",
      );
      return;
    }

    if (userIdStr && (isNaN(Number(userIdStr)) || Number(userIdStr) <= 0)) {
      Alert.alert("Sai định dạng", "ID user phải là số nguyên dương.");
      return;
    }

    const payload: Record<string, any> = {
      subject: form.subject.trim(),
      content: form.content.trim(),
      sendNow: form.sendNow,
    };
    if (email) payload.recipientEmail = email;
    if (userIdStr) payload.recipientUserId = Number(userIdStr);

    setLoading(true);
    try {
      await apiClient.post("/notifications/email", payload);

      Alert.alert(
        "Thành công",
        form.sendNow
          ? "Đã tạo và gửi thông báo thành công."
          : "Đã tạo thông báo (chưa gửi).",
        [{ text: "OK", onPress: () => router.back() }],
      );

      setForm({
        subject: "",
        content: "",
        recipientEmail: "",
        recipientUserId: "",
        sendNow: true,
      });
    } catch (error: any) {
      const data = error?.response?.data;
      let message = data?.message || data?.error || "Gửi thông báo thất bại.";
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
        <Text style={styles.headerTitle}>Gửi thông báo</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Tiêu đề </Text>
          <TextInput
            style={styles.input}
            placeholder="VD: Thông báo nghỉ lễ"
            placeholderTextColor="#9CA3AF"
            value={form.subject}
            onChangeText={(t) => setField("subject", t)}
          />

          <Text style={styles.label}>Nội dung </Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="VD: Nghỉ từ ngày 2/2–1/3"
            placeholderTextColor="#9CA3AF"
            value={form.content}
            onChangeText={(t) => setField("content", t)}
            multiline
            textAlignVertical="top"
          />

          <Text style={styles.sectionLabel}>Người nhận</Text>

          <Text style={styles.label}>Email người nhận</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: gv.phat@school.edu.vn"
            placeholderTextColor="#9CA3AF"
            value={form.recipientEmail}
            onChangeText={(t) => setField("recipientEmail", t)}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchTitle}>Gửi ngay (sendNow)</Text>
            </View>
            <Switch
              value={form.sendNow}
              onValueChange={(v) => setField("sendNow", v)}
              trackColor={{ false: "#D1D5DB", true: "#C4B5FD" }}
              thumbColor={form.sendNow ? "#5B5BD6" : "#F3F4F6"}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.7 }]}
            disabled={loading}
            onPress={handleSubmit}
            activeOpacity={0.85}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <View style={styles.btnRow}>
                <Ionicons name="send" size={18} color="#FFFFFF" />
                <Text style={styles.buttonText}>Gửi thông báo</Text>
              </View>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SendNotification;

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
  infoBox: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#EDE9FE",
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
  },
  infoText: { flex: 1, fontSize: 12.5, color: "#4C1D95", lineHeight: 18 },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#5B5BD6",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 12,
    marginTop: 4,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 14,
    fontSize: 15,
    color: "#1A1A1A",
  },
  textArea: { height: 120, paddingTop: 13 },
  orText: {
    textAlign: "center",
    color: "#9CA3AF",
    marginBottom: 12,
    fontSize: 13,
  },
  hint: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: -8,
    marginBottom: 16,
    lineHeight: 17,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 12,
  },
  switchTitle: { fontSize: 15, fontWeight: "600", color: "#1A1A1A" },
  switchDesc: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
  button: {
    backgroundColor: "#5B5BD6",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  btnRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
});
