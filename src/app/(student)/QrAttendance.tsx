import { attendanceByQRAPI } from "@/src/api/authApi";
import { useAuth } from "@/src/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");
const SCAN_SIZE = width * 0.7;

const QrAttendance = () => {
  const { token } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [manualVisible, setManualVisible] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [sessionInfo] = useState({
    name: "Database Systems",
    remaining: "16:36",
  });

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const handleAttendance = useCallback(
    async (code: string) => {
      if (!code || loading) return;

      setLoading(true);
      try {
        if (!token) {
          throw new Error("Bạn chưa đăng nhập.");
        }
        await attendanceByQRAPI(code.trim());

        Alert.alert("Điểm danh thành công ✅", `Bạn đã điểm danh thành công!`, [
          {
            text: "OK",
            onPress: () => {
              setScanned(false);
              setManualCode("");
              setManualVisible(false);
            },
          },
        ]);
      } catch (error: any) {
        Alert.alert(
          "Điểm danh thất bại",
          error?.response?.data?.message ||
            error?.response?.data?.error ||
            error?.message ||
            "Mã QR không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.",
          [
            {
              text: "Thử lại",
              onPress: () => {
                setScanned(false);
                setManualCode("");
              },
            },
          ],
        );
      } finally {
        setLoading(false);
      }
    },
    [loading, sessionInfo.name],
  );

  const onBarcodeScanned = useCallback(
    ({ data }: { data: string }) => {
      if (scanned || loading) return;
      setScanned(true);
      handleAttendance(data);
    },
    [scanned, loading, handleAttendance],
  );

  const handleManualSubmit = () => {
    if (!manualCode.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập mã điểm danh");
      return;
    }
    handleAttendance(manualCode.trim());
  };

  // Chưa có quyền camera
  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#5B5BD6" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={64} color="#5B5BD6" />
        <Text style={styles.permissionTitle}>Cần quyền Camera</Text>
        <Text style={styles.permissionText}>
          Ứng dụng cần quyền truy cập camera để quét mã QR điểm danh
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
          activeOpacity={0.8}>
          <Text style={styles.permissionButtonText}>Cấp quyền Camera</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Camera */}
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
        onBarcodeScanned={scanned || loading ? undefined : onBarcodeScanned}
      />

      {/* Overlay tối */}
      <View style={styles.overlay}>
        {/* Header */}
        <SafeAreaView>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Mã QR điểm danh</Text>
            <View style={styles.headerSpacer} />
          </View>
        </SafeAreaView>

        {/* Vùng quét */}
        <View style={styles.scanArea}>
          <Text style={styles.scanTitle}>Quét mã QR</Text>
          <Text style={styles.scanSubtitle}>
            Hướng camera của bạn để quét{"\n"}mã QR điểm danh
          </Text>

          <View style={styles.frameWrapper}>
            {/* 4 góc khung */}
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />

            {/* Khung trong suốt */}
            <View style={styles.scanFrame} />
          </View>

          {loading && (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.loadingText}>Đang điểm danh...</Text>
            </View>
          )}
        </View>

        {/* Thông tin phiên + nút nhập thủ công */}
        <View style={styles.bottomSection}>
          <View style={styles.sessionCard}>
            <Text style={styles.sessionText}>
              Phiên: <Text style={styles.sessionBold}>{sessionInfo.name}</Text>
            </Text>
            <Text style={styles.timerText}>
              Thời gian còn lại:{" "}
              <Text style={styles.timerValue}>{sessionInfo.remaining}</Text>
            </Text>
          </View>

          <TouchableOpacity
            style={styles.manualButton}
            onPress={() => setManualVisible(true)}
            activeOpacity={0.8}
            disabled={loading}>
            <Ionicons name="keypad-outline" size={18} color="#5B5BD6" />
            <Text style={styles.manualText}>Nhập mã thủ công</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal nhập mã thủ công */}
      <Modal
        visible={manualVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setManualVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nhập mã điểm danh</Text>
            <Text style={styles.modalSubtitle}>
              Nhập mã được giáo viên cung cấp
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Nhập mã..."
              placeholderTextColor="#9CA3AF"
              value={manualCode}
              onChangeText={setManualCode}
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!loading}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setManualVisible(false);
                  setManualCode("");
                }}
                disabled={loading}>
                <Text style={styles.cancelText}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
                onPress={handleManualSubmit}
                disabled={loading}>
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitText}>Điểm danh</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

export default QrAttendance;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3EEFF",
  },

  // Permission
  permissionContainer: {
    flex: 1,
    backgroundColor: "#F3EEFF",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
    marginTop: 20,
  },
  permissionText: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 10,
    lineHeight: 22,
  },
  permissionButton: {
    marginTop: 28,
    backgroundColor: "#5B5BD6",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
  },
  permissionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },

  // Overlay
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: "space-between",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  headerSpacer: {
    width: 40,
  },

  // Scan area
  scanArea: {
    alignItems: "center",
  },
  scanTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  scanSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 28,
  },
  frameWrapper: {
    width: SCAN_SIZE,
    height: SCAN_SIZE,
    justifyContent: "center",
    alignItems: "center",
  },
  scanFrame: {
    width: SCAN_SIZE - 8,
    height: SCAN_SIZE - 8,
    borderRadius: 12,
    backgroundColor: "transparent",
  },
  corner: {
    position: "absolute",
    width: 32,
    height: 32,
    borderColor: "#5B5BD6",
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 10,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 10,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 10,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 10,
  },

  loadingBox: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  loadingText: {
    color: "#FFFFFF",
    fontSize: 14,
    marginLeft: 10,
    fontWeight: "500",
  },

  // Bottom
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 36,
    alignItems: "center",
  },
  sessionCard: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    width: "100%",
    alignItems: "center",
    marginBottom: 16,
  },
  sessionText: {
    fontSize: 15,
    color: "#4A4A4A",
    marginBottom: 6,
  },
  sessionBold: {
    fontWeight: "700",
    color: "#1A1A1A",
  },
  timerText: {
    fontSize: 15,
    color: "#4A4A4A",
  },
  timerValue: {
    fontWeight: "700",
    color: "#5B5BD6",
  },
  manualButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
  },
  manualText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#5B5BD6",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 24,
  },
  input: {
    backgroundColor: "#F3F4F6",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#1A1A1A",
    marginBottom: 24,
    textAlign: "center",
    letterSpacing: 2,
    fontWeight: "600",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
  },
  submitBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#5B5BD6",
    alignItems: "center",
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
