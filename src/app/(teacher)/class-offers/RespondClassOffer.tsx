import apiClient from "@/src/api/axios";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";


type Mode = "choose" | "reject";

const QUICK_REASONS = [
  "Trùng lịch giảng dạy",
  "Không đúng chuyên môn",
  "Quá tải số lớp",
  "Lý do cá nhân",
];

const RespondClassOffer = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("choose");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    if (!id) {
      Alert.alert("Lỗi", "Không tìm thấy mã phân công.");
      return;
    }
    setLoading(true);
    try {
      await apiClient.post(`/class-offers/${id}/accept`);
      Alert.alert("Thành công", "Đã chấp nhận phân công lớp học!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert(
        "Lỗi",
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Không thể chấp nhận lớp. Vui lòng thử lại.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!reason.trim()) {
      Alert.alert(
        "Thiếu thông tin",
        "Vui lòng cung cấp lý do từ chối để giáo vụ nắm thông tin.",
      );
      return;
    }
    if (!id) {
      Alert.alert("Lỗi", "Không tìm thấy mã phân công.");
      return;
    }
    setLoading(true);
    try {
      await apiClient.post(`/class-offers/${id}/reject`, {
        reason: reason.trim(),
      });
      Alert.alert("Hoàn tất", "Đã gửi phản hồi từ chối nhận lớp.", [
        { text: "Đóng", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert(
        "Lỗi",
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Không thể gửi phản hồi lúc này.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3EEFF" />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (mode === "reject") setMode("choose");
            else router.back();
          }}
          style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {mode === "choose" ? "Phản hồi phân công" : "Từ chối lớp"}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled">
            {id ? (
              <View style={styles.idBadge}>
                <Text style={styles.idLabel}>Mã phân công</Text>
                <Text style={styles.idValue}>#{id}</Text>
              </View>
            ) : null}

            {/* ===== CHỌN: Nhận hoặc Từ chối ===== */}
            {mode === "choose" ? (
              <View style={styles.chooseBlock}>
                <View style={styles.iconWrap}>
                  <Ionicons name="school" size={56} color="#5B5BD6" />
                </View>
                <Text style={styles.title}>Bạn muốn phản hồi thế nào?</Text>
                <Text style={styles.subtitle}>
                  Chọn nhận lớp để giảng dạy, hoặc từ chối và ghi lý do gửi về
                  giáo vụ.
                </Text>

                {loading ? (
                  <ActivityIndicator
                    size="large"
                    color="#5B5BD6"
                    style={{ marginTop: 24 }}
                  />
                ) : (
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={styles.acceptBtn}
                      onPress={handleAccept}
                      activeOpacity={0.85}>
                      <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                      <Text style={styles.acceptText}>Đồng ý nhận lớp</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.rejectOutlineBtn}
                      onPress={() => setMode("reject")}
                      activeOpacity={0.85}>
                      <Ionicons
                        name="close-circle-outline"
                        size={20}
                        color="#DC2626"
                      />
                      <Text style={styles.rejectOutlineText}>Từ chối lớp</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => router.back()}>
                      <Text style={styles.cancelText}>Để sau</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ) : null}

            {mode === "reject" ? (
              <View>
                <View style={styles.warningBox}>
                  <Ionicons name="alert-circle" size={22} color="#DC2626" />
                  <Text style={styles.warningText}>
                    Thao tác này sẽ từ chối phân công. Vui lòng nêu rõ lý do.
                  </Text>
                </View>

                <Text style={styles.label}>Lý do nhanh</Text>
                <View style={styles.chipRow}>
                  {QUICK_REASONS.map((r) => {
                    const active = reason === r;
                    return (
                      <TouchableOpacity
                        key={r}
                        style={[styles.chip, active && styles.chipActive]}
                        onPress={() => setReason(r)}
                        activeOpacity={0.7}>
                        <Text
                          style={[
                            styles.chipText,
                            active && styles.chipTextActive,
                          ]}>
                          {r}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.label}>Chi tiết lý do *</Text>
                <TextInput
                  style={styles.textArea}
                  value={reason}
                  onChangeText={setReason}
                  placeholder="Nhập chi tiết lý do từ chối..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  textAlignVertical="top"
                />

                {loading ? (
                  <ActivityIndicator size="large" color="#DC2626" />
                ) : (
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={styles.rejectBtn}
                      onPress={handleReject}
                      activeOpacity={0.85}>
                      <Ionicons name="close-circle" size={20} color="#FFFFFF" />
                      <Text style={styles.rejectText}>Xác nhận từ chối</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => setMode("choose")}>
                      <Text style={styles.cancelText}>Quay lại</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ) : null}
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default RespondClassOffer;

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
  idBadge: {
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  idLabel: { fontSize: 12, color: "#9CA3AF", marginBottom: 2 },
  idValue: { fontSize: 16, fontWeight: "700", color: "#5B5BD6" },
  chooseBlock: { alignItems: "center" },
  iconWrap: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#EDE9FE",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  actions: { width: "100%", gap: 12 },
  acceptBtn: {
    backgroundColor: "#5B5BD6",
    paddingVertical: 16,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  acceptText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  rejectOutlineBtn: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: "#FECACA",
  },
  rejectOutlineText: { color: "#DC2626", fontSize: 16, fontWeight: "700" },
  rejectBtn: {
    backgroundColor: "#DC2626",
    paddingVertical: 16,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  rejectText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  cancelBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cancelText: { color: "#6B7280", fontSize: 15, fontWeight: "600" },
  warningBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  warningText: { flex: 1, fontSize: 13, color: "#991B1B", lineHeight: 19 },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 10,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  chipActive: { backgroundColor: "#FEE2E2", borderColor: "#FECACA" },
  chipText: { fontSize: 13, fontWeight: "500", color: "#374151" },
  chipTextActive: { color: "#DC2626", fontWeight: "600" },
  textArea: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    color: "#1A1A1A",
    minHeight: 120,
    marginBottom: 24,
  },
});
