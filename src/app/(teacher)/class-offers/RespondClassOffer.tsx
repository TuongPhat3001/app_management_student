import apiClient from "@/src/api/axios";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
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

/**
 * POST /class-offers/:id/accept
 * POST /class-offers/:id/reject  { note }
 */

type Mode = "choose" | "reject" | "success";
type SuccessKind = "accepted" | "rejected";

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
  const [successKind, setSuccessKind] = useState<SuccessKind>("accepted");

  // Modal xác nhận
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmType, setConfirmType] = useState<"accept" | "reject">("accept");

  const doAccept = async () => {
    if (!id) {
      Alert.alert("Lỗi", "Không tìm thấy mã phân công.");
      return;
    }
    setConfirmVisible(false);
    setLoading(true);
    try {
      await apiClient.post(`/class-offers/${id}/accept`);
      setSuccessKind("accepted");
      setMode("success");
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

  const doReject = async () => {
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
    setConfirmVisible(false);
    setLoading(true);
    try {
      // Backend: ClassOfferResponseRequest { note }
      await apiClient.post(`/class-offers/${id}/reject`, {
        note: reason.trim(),
      });
      setSuccessKind("rejected");
      setMode("success");
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

  const openConfirmAccept = () => {
    setConfirmType("accept");
    setConfirmVisible(true);
  };

  const openConfirmReject = () => {
    if (!reason.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập hoặc chọn lý do từ chối.");
      return;
    }
    setConfirmType("reject");
    setConfirmVisible(true);
  };

  // —— Màn thành công ——
  if (mode === "success") {
    const ok = successKind === "accepted";
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <StatusBar barStyle="dark-content" backgroundColor="#F3EEFF" />
        <View style={styles.successWrap}>
          <View
            style={[
              styles.successIcon,
              { backgroundColor: ok ? "#D1FAE5" : "#FEE2E2" },
            ]}>
            <Ionicons
              name={ok ? "checkmark-circle" : "close-circle"}
              size={64}
              color={ok ? "#059669" : "#DC2626"}
            />
          </View>
          <Text style={styles.successTitle}>
            {ok ? "Đã nhận lớp" : "Đã từ chối"}
          </Text>
          <Text style={styles.successDesc}>
            {ok
              ? "Bạn đã chấp nhận phân công. Lớp sẽ được gán vào danh sách phụ trách của bạn."
              : "Phản hồi từ chối đã được gửi về giáo vụ. Họ sẽ phân công giảng viên khác."}
          </Text>
          {id ? <Text style={styles.successId}>Mã phân công #{id}</Text> : null}
          <TouchableOpacity
            style={[
              styles.successBtn,
              { backgroundColor: ok ? "#5B5BD6" : "#6B7280" },
            ]}
            onPress={() => router.back()}
            activeOpacity={0.85}>
            <Text style={styles.successBtnText}>Về danh sách đề xuất</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
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
                      onPress={openConfirmAccept}
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
                      onPress={openConfirmReject}
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

      {/* Modal xác nhận */}
      <Modal
        visible={confirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmVisible(false)}>
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmCard}>
            <View
              style={[
                styles.confirmIconWrap,
                {
                  backgroundColor:
                    confirmType === "accept" ? "#EDE9FE" : "#FEE2E2",
                },
              ]}>
              <Ionicons
                name={confirmType === "accept" ? "checkmark-circle" : "warning"}
                size={40}
                color={confirmType === "accept" ? "#5B5BD6" : "#DC2626"}
              />
            </View>
            <Text style={styles.confirmTitle}>
              {confirmType === "accept"
                ? "Xác nhận nhận lớp?"
                : "Xác nhận từ chối?"}
            </Text>
            <Text style={styles.confirmDesc}>
              {confirmType === "accept"
                ? `Bạn sẽ trở thành giảng viên phụ trách phân công #${id}. Không thể hoàn tác dễ dàng.`
                : `Bạn sẽ từ chối phân công #${id}.${
                    reason ? `\nLý do: ${reason}` : ""
                  }`}
            </Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={styles.confirmCancel}
                onPress={() => setConfirmVisible(false)}
                disabled={loading}>
                <Text style={styles.confirmCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirmOk,
                  {
                    backgroundColor:
                      confirmType === "accept" ? "#5B5BD6" : "#DC2626",
                  },
                ]}
                onPress={confirmType === "accept" ? doAccept : doReject}
                disabled={loading}
                activeOpacity={0.85}>
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.confirmOkText}>
                    {confirmType === "accept" ? "Đồng ý nhận" : "Từ chối"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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

  // Confirm modal
  confirmOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  confirmCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
  },
  confirmIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 8,
    textAlign: "center",
  },
  confirmDesc: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 22,
  },
  confirmActions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  confirmCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
  },
  confirmCancelText: { fontSize: 15, fontWeight: "600", color: "#6B7280" },
  confirmOk: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  confirmOkText: { fontSize: 15, fontWeight: "700", color: "#FFF" },

  // Success
  successWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  successIcon: {
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1A1A1A",
    marginBottom: 10,
  },
  successDesc: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 12,
  },
  successId: {
    fontSize: 13,
    color: "#9CA3AF",
    marginBottom: 28,
  },
  successBtn: {
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 14,
    minWidth: 220,
    alignItems: "center",
  },
  successBtnText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
});
