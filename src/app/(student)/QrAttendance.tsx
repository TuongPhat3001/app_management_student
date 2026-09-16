import {
  attendanceByQRAPI,
  getMyAttendancesAPI,
  getStudentAttendanceClassesAPI,
} from "@/src/api/authApi";
import { useAuth } from "@/src/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
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

const { width } = Dimensions.get("window");
const SCAN_SIZE = width * 0.7;

type EnrolledCourse = {
  id: number;
  courseName: string;
  courseCode: string;
  classCode: string;
  classId: number;
  courseId: number;
};

type LastResult = {
  courseName: string;
  classCode: string;
  status: string;
  at: string;
};

const QrAttendance = () => {
  const router = useRouter();
  const { token } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [manualVisible, setManualVisible] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [coursesVisible, setCoursesVisible] = useState(false);
  const [enrolled, setEnrolled] = useState<EnrolledCourse[]>([]);
  const [lastResult, setLastResult] = useState<LastResult | null>(null);
  const [historyCount, setHistoryCount] = useState(0);

  const loadEnrolled = useCallback(async () => {
    try {
      const res = await getStudentAttendanceClassesAPI();
      const raw = res.data?.data ?? res.data ?? [];
      const list = (Array.isArray(raw) ? raw : [])
        .map((e: any) => {
          const id = Number(e.ID ?? e.id);
          const course = e.Course ?? e.course ?? {};
          const cls = e.Class ?? e.class ?? {};
          return {
            id,
            courseName: String(course.Name ?? course.name ?? "Môn học"),
            courseCode: String(course.Code ?? course.code ?? ""),
            classCode: String(cls.ClassCode ?? cls.classCode ?? ""),
            classId: Number(e.ClassID ?? e.classId ?? cls.ID ?? 0),
            courseId: Number(e.CourseID ?? e.courseId ?? course.ID ?? 0),
          };
        })
        .filter((x: EnrolledCourse) => x.id > 0);
      setEnrolled(list);
    } catch (e) {
      console.log("load enrolled attendance classes", e);
      setEnrolled([]);
    }
  }, []);

  const loadHistoryHint = useCallback(async () => {
    try {
      const res = await getMyAttendancesAPI();
      const raw = res.data?.data ?? [];
      setHistoryCount(Array.isArray(raw) ? raw.length : 0);
    } catch {
      setHistoryCount(0);
    }
  }, []);

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, [permission, requestPermission]);

  useEffect(() => {
    loadEnrolled();
    loadHistoryHint();
  }, [loadEnrolled, loadHistoryHint]);

  const handleAttendance = useCallback(
    async (code: string) => {
      if (!code || loading) return;
      setLoading(true);
      try {
        if (!token) throw new Error("Bạn chưa đăng nhập.");

        // Backend nhận code hoặc qrCode — môn học lấy từ session QR, không cố định
        const res = await attendanceByQRAPI(code.trim());
        const data = res.data?.data ?? {};
        const enrollment = data.Enrollment ?? data.enrollment;
        const courseName =
          enrollment?.Course?.Name ??
          enrollment?.Course?.name ??
          enrollment?.course?.name ??
          "Môn học";
        const classCode =
          enrollment?.Class?.ClassCode ??
          enrollment?.Class?.classCode ??
          enrollment?.class?.classCode ??
          "";

        const result: LastResult = {
          courseName: String(courseName),
          classCode: String(classCode),
          status: String(data.Status ?? data.status ?? "present"),
          at: new Date().toLocaleTimeString("vi-VN"),
        };
        setLastResult(result);
        loadHistoryHint();

        Alert.alert(
          "Điểm danh thành công",
          `Môn: ${result.courseName}${
            result.classCode ? `\nLớp: ${result.classCode}` : ""
          }\nTrạng thái: có mặt`,
          [
            {
              text: "OK",
              onPress: () => {
                setScanned(false);
                setManualCode("");
                setManualVisible(false);
              },
            },
          ],
        );
      } catch (error: any) {
        const msg =
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Mã QR không hợp lệ hoặc đã hết hạn.";
        Alert.alert("Điểm danh thất bại", msg, [
          {
            text: "Thử lại",
            onPress: () => {
              setScanned(false);
              setManualCode("");
            },
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [loading, token, loadHistoryHint],
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
          Ứng dụng cần camera để quét mã QR điểm danh
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

      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={scanned || loading ? undefined : onBarcodeScanned}
      />

      <View style={styles.overlay}>
        <SafeAreaView>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Điểm danh QR</Text>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setCoursesVisible(true)}>
              <Ionicons name="list" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        <View style={styles.scanArea}>
          <Text style={styles.scanTitle}>Quét mã QR</Text>

          <View style={styles.frameWrapper}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
            <View style={styles.scanFrame} />
          </View>

          {loading && (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.loadingText}>Đang điểm danh...</Text>
            </View>
          )}
        </View>

        <View style={styles.bottomSection}>
          <View style={styles.sessionCard}>
            {lastResult ? (
              <>
                <Text style={styles.sessionText}>
                  Vừa điểm danh:{" "}
                  <Text style={styles.sessionBold}>
                    {lastResult.courseName}
                  </Text>
                </Text>
                <Text style={styles.timerText}>
                  {lastResult.classCode ? `Lớp ${lastResult.classCode} · ` : ""}
                  {lastResult.at} · có mặt
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.sessionText}>
                  Đang học{" "}
                  <Text style={styles.sessionBold}>{enrolled.length} môn</Text>
                </Text>
                <Text style={styles.timerText}>
                  Lịch sử điểm danh: {historyCount} bản ghi · Bấm icon danh sách
                  để xem môn
                </Text>
              </>
            )}
          </View>

          <TouchableOpacity
            style={styles.manualButton}
            onPress={() => setManualVisible(true)}
            activeOpacity={0.8}>
            <Ionicons name="keypad-outline" size={18} color="#5B5BD6" />
            <Text style={styles.manualButtonText}>Nhập mã thủ công</Text>
          </TouchableOpacity>

          {scanned && !loading && (
            <TouchableOpacity
              style={styles.rescanBtn}
              onPress={() => setScanned(false)}>
              <Text style={styles.rescanText}>Quét tiếp</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Môn đang học (để SV biết mình có thể điểm danh môn nào) */}
      <Modal visible={coursesVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Môn đang học</Text>
              <TouchableOpacity onPress={() => setCoursesVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalHint}>
              Quét QR của GV cho đúng môn bên dưới. Hệ thống tự nhận môn từ mã
              QR.
            </Text>
            <FlatList
              data={enrolled}
              keyExtractor={(i) => String(i.id)}
              ListEmptyComponent={
                <Text style={styles.empty}>
                  Chưa có môn đăng ký / enrollment
                </Text>
              }
              renderItem={({ item }) => (
                <View style={styles.courseRow}>
                  <Ionicons name="book-outline" size={18} color="#5B5BD6" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.courseName}>
                      {item.courseCode ? `${item.courseCode} · ` : ""}
                      {item.courseName}
                    </Text>
                    <Text style={styles.courseMeta}>
                      Lớp {item.classCode || item.classId}
                    </Text>
                  </View>
                </View>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Nhập mã thủ công */}
      <Modal visible={manualVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={styles.modalBox}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Nhập mã điểm danh</Text>
              <TouchableOpacity onPress={() => setManualVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              value={manualCode}
              onChangeText={setManualCode}
              placeholder="Dán hoặc gõ mã QR"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleManualSubmit}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitText}>Xác nhận điểm danh</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

export default QrAttendance;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3EEFF",
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    backgroundColor: "#F3EEFF",
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 16,
    color: "#1A1A1A",
  },
  permissionText: {
    textAlign: "center",
    color: "#6B7280",
    marginTop: 8,
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: "#5B5BD6",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  permissionButtonText: { color: "#FFF", fontWeight: "700" },
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: "space-between",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    color: "#FFF",
    fontSize: 17,
    fontWeight: "700",
  },
  scanArea: { alignItems: "center", paddingHorizontal: 24 },
  scanTitle: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 8,
  },
  scanSubtitle: {
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
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
    borderRadius: 16,
  },
  corner: {
    position: "absolute",
    width: 28,
    height: 28,
    borderColor: "#FFF",
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 12,
  },
  loadingBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
  },
  loadingText: { color: "#FFF", fontWeight: "600" },
  bottomSection: { padding: 20, paddingBottom: 32 },
  sessionCard: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  sessionText: { fontSize: 14, color: "#374151" },
  sessionBold: { fontWeight: "800", color: "#1A1A1A" },
  timerText: { fontSize: 12, color: "#6B7280", marginTop: 4 },
  manualButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FFF",
    borderRadius: 14,
    paddingVertical: 14,
  },
  manualButtonText: { color: "#5B5BD6", fontWeight: "700", fontSize: 15 },
  rescanBtn: { alignItems: "center", marginTop: 12 },
  rescanText: {
    color: "#FFF",
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalBox: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
    paddingBottom: 28,
  },
  modalHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalTitle: { fontSize: 17, fontWeight: "700" },
  modalHint: {
    fontSize: 12,
    color: "#6B7280",
    paddingHorizontal: 16,
    paddingVertical: 10,
    lineHeight: 18,
  },
  courseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  courseName: { fontSize: 14, fontWeight: "700", color: "#1A1A1A" },
  courseMeta: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
  empty: { textAlign: "center", color: "#9CA3AF", padding: 24 },
  input: {
    marginHorizontal: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  submitBtn: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: "#5B5BD6",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  submitText: { color: "#FFF", fontWeight: "700", fontSize: 16 },
});
