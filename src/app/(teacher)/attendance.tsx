import axios from "axios";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type ClassItem = {
  id?: number;
  classId?: number;
  classCode?: string;
  courseName?: string;
};

type SessionItem = {
  id: number;
  code?: string;
  classDate?: string;
  expiresAt?: string;
  isActive?: boolean;
  note?: string;
};

type RecordItem = {
  id: number;
  status?: string;
  note?: string;
  classDate?: string;
  checkedInAt?: string;
  studentCode?: string;
  studentName?: string;
  enrollment?: {
    student?: {
      studentCode?: string;
      user?: { fullName?: string };
    };
  };
};

const STATUS_OPTIONS = ["present", "absent", "late", "excused"];

const Attendance = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);

  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(
    null,
  );
  const [showRecords, setShowRecords] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const res = await axios.get("/teacher/attendance/classes");
      setClasses(res.data?.data || res.data || []);
    } catch {
      setClasses([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadClasses();
  };

  const getClassId = (item: ClassItem) => item.classId || item.id || 0;

  const createSession = async (classId: number) => {
    setCreating(true);
    try {
      const res = await axios.post("/attendance/sessions", { classId });
      const session = res.data?.data || res.data;
      Alert.alert(
        "Tạo phiên điểm danh thành công",
        `Mã: ${session.code || "—"}\nHiệu lực đến: ${formatTime(session.expiresAt)}`,
      );
      // Mở luôn danh sách điểm danh của phiên mới
      if (session.id) {
        openRecords(session.id);
      }
    } catch (err: any) {
      Alert.alert(
        "Lỗi",
        err.response?.data?.message || "Không tạo được phiên điểm danh",
      );
    } finally {
      setCreating(false);
    }
  };

  const openRecords = async (sessionId: number) => {
    setSelectedSessionId(sessionId);
    setShowRecords(true);
    try {
      const res = await axios.get(`/attendance/sessions/${sessionId}/records`);
      setRecords(res.data?.data || res.data || []);
    } catch {
      setRecords([]);
      Alert.alert("Lỗi", "Không tải được danh sách điểm danh");
    }
  };

  const updateStatus = async (attendanceId: number, status: string) => {
    try {
      await axios.put(`/attendances/${attendanceId}`, { status });
      setRecords((prev) =>
        prev.map((r) => (r.id === attendanceId ? { ...r, status } : r)),
      );
    } catch (err: any) {
      Alert.alert(
        "Lỗi",
        err.response?.data?.message || "Không cập nhật được trạng thái",
      );
    }
  };

  const statusLabel = (s?: string) => {
    switch (s) {
      case "present":
        return "Có mặt";
      case "absent":
        return "Vắng";
      case "late":
        return "Đi trễ";
      case "excused":
        return "Có phép";
      default:
        return s || "—";
    }
  };

  const statusColor = (s?: string) => {
    switch (s) {
      case "present":
        return "#059669";
      case "absent":
        return "#dc2626";
      case "late":
        return "#d97706";
      case "excused":
        return "#2563eb";
      default:
        return "#64748b";
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Điểm danh lớp học</Text>
      <Text style={styles.note}>
        Chọn lớp → tạo phiên QR hoặc xem / sửa trạng thái điểm danh.
      </Text>

      <FlatList
        data={classes}
        keyExtractor={(item, idx) => String(getClassId(item) || idx)}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>Không có lớp phụ trách</Text>
        }
        renderItem={({ item }) => {
          const classId = getClassId(item);
          const active = selectedClassId === classId;
          return (
            <View style={[styles.card, active && styles.cardActive]}>
              <TouchableOpacity onPress={() => setSelectedClassId(classId)}>
                <Text style={styles.classCode}>
                  {item.classCode || `Lớp #${classId}`}
                </Text>
                {!!item.courseName && (
                  <Text style={styles.meta}>{item.courseName}</Text>
                )}
              </TouchableOpacity>

              <View style={styles.row}>
                <TouchableOpacity
                  style={[styles.btn, styles.btnPrimary]}
                  disabled={creating}
                  onPress={() => createSession(classId)}>
                  <Text style={styles.btnPrimaryText}>
                    {creating ? "Đang tạo..." : "Tạo QR điểm danh"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      {/* Modal danh sách điểm danh */}
      <Modal visible={showRecords} animationType="slide">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Danh sách điểm danh</Text>
            <TouchableOpacity onPress={() => setShowRecords(false)}>
              <Text style={styles.close}>Đóng</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={records}
            keyExtractor={(item) => String(item.id)}
            ListEmptyComponent={
              <Text style={styles.empty}>Chưa có bản ghi điểm danh</Text>
            }
            renderItem={({ item }) => {
              const name =
                item.studentName ||
                item.enrollment?.student?.user?.fullName ||
                "Sinh viên";
              const code =
                item.studentCode || item.enrollment?.student?.studentCode || "";

              return (
                <View style={styles.recordCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.studentName}>{name}</Text>
                    {!!code && <Text style={styles.meta}>{code}</Text>}
                    <Text
                      style={[
                        styles.status,
                        { color: statusColor(item.status) },
                      ]}>
                      {statusLabel(item.status)}
                    </Text>
                  </View>

                  <View style={styles.statusActions}>
                    {STATUS_OPTIONS.map((s) => (
                      <TouchableOpacity
                        key={s}
                        style={[
                          styles.statusChip,
                          item.status === s && {
                            backgroundColor: statusColor(s),
                          },
                        ]}
                        onPress={() => updateStatus(item.id, s)}>
                        <Text
                          style={[
                            styles.statusChipText,
                            item.status === s && { color: "#fff" },
                          ]}>
                          {statusLabel(s)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              );
            }}
          />
        </View>
      </Modal>
    </View>
  );
};

export default Attendance;

function formatTime(value?: string) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleTimeString("vi-VN");
  } catch {
    return value;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc", padding: 16 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  title: { fontSize: 22, fontWeight: "800", color: "#0f172a", marginBottom: 6 },
  note: { fontSize: 13, color: "#64748b", marginBottom: 14 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardActive: { borderColor: "#2563eb", backgroundColor: "#eff6ff" },
  classCode: { fontSize: 16, fontWeight: "700", color: "#0f172a" },
  meta: { fontSize: 13, color: "#64748b", marginTop: 2 },
  row: { flexDirection: "row", marginTop: 12, gap: 8 },
  btn: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: "center",
  },
  btnPrimary: { backgroundColor: "#2563eb", flex: 1 },
  btnPrimaryText: { color: "#fff", fontWeight: "700" },
  empty: { textAlign: "center", color: "#94a3b8", marginTop: 40 },
  modal: {
    flex: 1,
    backgroundColor: "#f8fafc",
    paddingTop: 54,
    paddingHorizontal: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
  close: { color: "#2563eb", fontWeight: "700", fontSize: 15 },
  recordCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  studentName: { fontSize: 15, fontWeight: "700", color: "#0f172a" },
  status: { marginTop: 4, fontWeight: "700", fontSize: 13 },
  statusActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
  },
  statusChip: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#f8fafc",
  },
  statusChipText: { fontSize: 12, color: "#334155", fontWeight: "600" },
});
