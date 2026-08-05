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

type TargetType = "all" | "student" | "teacher" | "admin";

interface NotificationForm {
  title: string;
  content: string;
  target: TargetType;
}

const TARGETS: {
  label: string;
  value: TargetType;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { label: "Tất cả", value: "all", icon: "globe-outline" },
  { label: "Sinh viên", value: "student", icon: "school-outline" },
  { label: "Giảng viên", value: "teacher", icon: "person-outline" },
  { label: "Quản trị viên", value: "admin", icon: "shield-outline" },
];

const SendNotification: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<NotificationForm>({
    title: "",
    content: "",
    target: "all",
  });

  const handleChange = <K extends keyof NotificationForm>(
    field: K,
    value: NotificationForm[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      Alert.alert("Thông báo", "Vui lòng nhập tiêu đề và nội dung.");
      return;
    }

    setLoading(true);
    try {
      await apiClient.post("/notifications/email", {
        title: formData.title.trim(),
        content: formData.content.trim(),
        target: formData.target,
      });

      Alert.alert("Thành công", "Gửi thông báo thành công!", [
        { text: "OK", onPress: () => router.back() },
      ]);
      setFormData({ title: "", content: "", target: "all" });
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
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Tiêu đề</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập tiêu đề thông báo"
            placeholderTextColor="#9CA3AF"
            value={formData.title}
            onChangeText={(text) => handleChange("title", text)}
          />

          <Text style={styles.label}>Nội dung</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Nhập nội dung thông báo..."
            placeholderTextColor="#9CA3AF"
            value={formData.content}
            onChangeText={(text) => handleChange("content", text)}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />

          <Text style={styles.label}>Đối tượng nhận</Text>
          <View style={styles.targetGrid}>
            {TARGETS.map((t) => {
              const active = formData.target === t.value;
              return (
                <TouchableOpacity
                  key={t.value}
                  style={[styles.targetChip, active && styles.targetChipActive]}
                  onPress={() => handleChange("target", t.value)}
                  activeOpacity={0.7}>
                  <Ionicons
                    name={t.icon}
                    size={18}
                    color={active ? "#FFFFFF" : "#5B5BD6"}
                  />
                  <Text
                    style={[
                      styles.targetChipText,
                      active && styles.targetChipTextActive,
                    ]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.7 }]}
            disabled={loading}
            onPress={handleSubmit}
            activeOpacity={0.8}>
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
  scrollContent: { padding: 20, paddingBottom: 40 },
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
  textArea: { height: 140, paddingTop: 13 },
  targetGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 28,
  },
  targetChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
  },
  targetChipActive: {
    backgroundColor: "#5B5BD6",
    borderColor: "#5B5BD6",
  },
  targetChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  targetChipTextActive: { color: "#FFFFFF" },
  button: {
    backgroundColor: "#5B5BD6",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  btnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
