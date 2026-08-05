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

const QUICK_REASONS = [
  "Trùng lịch giảng dạy",
  "Không đúng chuyên môn",
  "Quá tải số lớp",
  "Lý do cá nhân",
];

const RejectClassOffer = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

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
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Từ chối lớp</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled">
            <View style={styles.warningBox}>
              <Ionicons name="alert-circle" size={22} color="#DC2626" />
              <Text style={styles.warningText}>
                Thao tác này sẽ từ chối phân công lớp. Vui lòng nêu rõ lý do.
              </Text>
            </View>

            {id ? (
              <Text style={styles.offerId}>Mã phân công: #{id}</Text>
            ) : null}

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
              <ActivityIndicator
                size="large"
                color="#DC2626"
                style={{ marginTop: 24 }}
              />
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
                  onPress={() => router.back()}
                  activeOpacity={0.7}>
                  <Text style={styles.cancelText}>Hủy bỏ</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default RejectClassOffer;

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
  warningText: {
    flex: 1,
    fontSize: 13,
    color: "#991B1B",
    lineHeight: 19,
  },
  offerId: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 16,
    fontWeight: "500",
  },
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
  chipActive: {
    backgroundColor: "#FEE2E2",
    borderColor: "#FECACA",
  },
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
    minHeight: 140,
    marginBottom: 24,
  },
  actions: { gap: 12 },
  rejectBtn: {
    backgroundColor: "#DC2626",
    paddingVertical: 16,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  rejectText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  cancelBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cancelText: {
    color: "#6B7280",
    fontSize: 16,
    fontWeight: "600",
  },
});
