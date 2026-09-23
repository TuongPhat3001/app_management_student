import api from "@/src/api/axios";
import React, { useCallback, useEffect, useState } from "react";
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
import { SafeAreaView } from "react-native-safe-area-context";

type OfferingItem = {
  key: string;
  classId: number;
  courseId: number;
  courseOfferingId: number;
  classCode: string;
  courseName: string;
  courseCode: string;
};

type RecordItem = {
  id: number;
  status?: string;
  studentName?: string;
  studentCode?: string;
};

const STATUS_OPTIONS = ["present", "absent", "late", "excused"] as const;

/**
 * Backend:
 * GET  /teacher/classes  (hoặc /teacher/attendance/classes)
 * POST /attendance/sessions { classId, courseId } | { courseOfferingId }
 * GET  /attendance/sessions/:id/records
 * PUT  /attendances/:id { status }
 *
 * Lưu ý: chỉ tạo QR được nếu hôm nay có lịch dạy học phần đó.
 */
const Attendance = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<OfferingItem[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [showRecords, setShowRecords] = useState(false);
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [sessionInfo, setSessionInfo] = useState<{
    id: number;
    code?: string;
    expiresAt?: string;
  } | null>(null);

  const mapOfferings = (classes: any[]): OfferingItem[] => {
    const out: OfferingItem[] = [];
    for (const c of classes || []) {
      const classId = Number(c.ID ?? c.id);
      const classCode = String(c.ClassCode ?? c.classCode ?? `Lớp #${classId}`);
      const offerings = c.CourseOfferings ?? c.courseOfferings ?? [];

      if (Array.isArray(offerings) && offerings.length > 0) {
        for (const o of offerings) {
          const offeringId = Number(o.ID ?? o.id);
          const course = o.Course ?? o.course ?? {};
          const courseId = Number(
            o.CourseID ?? o.courseId ?? course.ID ?? course.id ?? 0,
          );
          if (!classId || !offeringId) continue;
          out.push({
            key: `off-${offeringId}`,
            classId,
            courseId: courseId || 0,
            courseOfferingId: offeringId,
            classCode,
            courseName: String(
              course.Name ?? course.name ?? o.courseName ?? "Học phần",
            ),
            courseCode: String(course.Code ?? course.code ?? ""),
          });
        }
      } else if (classId) {
        // Fallback: lớp không preload offering
        out.push({
          key: `cls-${classId}`,
          classId,
          courseId: 0,
          courseOfferingId: 0,
          classCode,
          courseName: "Học phần (chưa gắn)",
          courseCode: "",
        });
      }
    }
    return out;
  };

  const loadClasses = useCallback(async () => {
    try {
      // Ưu tiên /teacher/classes (có CourseOfferings)
      let raw: any[] = [];
      try {
        const res = await api.get("/teacher/classes");
        raw = res.data?.data ?? res.data ?? [];
      } catch {
        const res2 = await api.get("/teacher/attendance/classes");
        raw = res2.data?.data ?? res2.data ?? [];
      }
      const list = mapOfferings(Array.isArray(raw) ? raw : []);
      setItems(list);
      if (list.length && !selectedKey) {
        setSelectedKey(list[0].key);
      }
    } catch (e) {
      console.log("attendance classes", e);
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedKey]);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  const createSession = async (item: OfferingItem) => {
    if (!item.classId) {
      Alert.alert("Lỗi", "Không xác định được lớp");
      return;
    }
    setCreating(true);
    setSelectedKey(item.key);
    try {
      const body: Record<string, number | string> = {};
      if (item.courseOfferingId > 0) {
        body.courseOfferingId = item.courseOfferingId;
      } else if (item.courseId > 0) {
        body.classId = item.classId;
        body.courseId = item.courseId;
      } else {
        body.classId = item.classId;
      }

      const res = await api.post("/attendance/sessions", body);
      const session = res.data?.data ?? res.data ?? {};
      const id = Number(session.ID ?? session.id);
      const code = session.Code ?? session.code;
      const expiresAt = session.ExpiresAt ?? session.expiresAt;

      Alert.alert(
        "Tạo QR thành công",
        `Mã: ${code || "—"}\nHết hạn: ${formatTime(expiresAt)}\n\nSinh viên quét mã này để điểm danh.`,
      );

      if (id) {
        setSessionInfo({ id, code, expiresAt });
        await openRecords(id);
      }
    } catch (err: any) {
      const d = err?.response?.data;
      Alert.alert(
        "Không tạo được phiên",
        [d?.message, d?.error].filter(Boolean).join("\n") ||
          "Kiểm tra: hôm nay có lịch dạy học phần này không?",
      );
    } finally {
      setCreating(false);
    }
  };

  const openRecords = async (sessionId: number) => {
    setShowRecords(true);
    try {
      const res = await api.get(`/attendance/sessions/${sessionId}/records`);
      const raw = res.data?.data ?? res.data ?? [];
      setRecords(
        (Array.isArray(raw) ? raw : []).map((r: any) => {
          const enrollment = r.Enrollment ?? r.enrollment ?? {};
          const student =
            enrollment.Student ??
            enrollment.student ??
            r.Student ??
            r.student ??
            {};
          const user = student.User ?? student.user ?? {};
          return {
            id: Number(r.ID ?? r.id),
            status: r.Status ?? r.status,
            studentName: String(
              user.FullName ?? user.fullName ?? r.studentName ?? "Sinh viên",
            ),
            studentCode: String(
              student.StudentCode ?? student.studentCode ?? r.studentCode ?? "",
            ),
          };
        }),
      );
    } catch {
      setRecords([]);
    }
  };

  const updateStatus = async (attendanceId: number, status: string) => {
    try {
      await api.put(`/attendances/${attendanceId}`, { status });
      setRecords((prev) =>
        prev.map((r) => (r.id === attendanceId ? { ...r, status } : r)),
      );
    } catch (err: any) {
      Alert.alert(
        "Lỗi",
        err?.response?.data?.message || "Không cập nhật được trạng thái",
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

  const formatTime = (v?: string) => {
    if (!v) return "—";
    try {
      return new Date(v).toLocaleString("vi-VN");
    } catch {
      return String(v);
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
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Text style={styles.title}>Điểm danh lớp học</Text>
      <Text style={styles.note}>
        Chọn học phần → Tạo QR. Chỉ mở được khi hôm nay có lịch dạy (trước giờ
        học tối đa 15 phút).
      </Text>

      <FlatList
        data={items}
        keyExtractor={(item) => item.key}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadClasses();
            }}
          />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>
            Không có lớp / học phần phụ trách. Nhận lớp từ admin trước.
          </Text>
        }
        renderItem={({ item }) => {
          const active = selectedKey === item.key;
          return (
            <TouchableOpacity
              style={[styles.card, active && styles.cardActive]}
              activeOpacity={0.85}
              onPress={() => setSelectedKey(item.key)}>
              <Text style={styles.classCode}>{item.classCode}</Text>
              <Text style={styles.meta}>
                {item.courseCode ? `${item.courseCode} · ` : ""}
                {item.courseName}
              </Text>

              <View style={styles.row}>
                <TouchableOpacity
                  style={[styles.btn, styles.btnPrimary]}
                  disabled={creating}
                  onPress={() => createSession(item)}>
                  <Text style={styles.btnPrimaryText}>
                    {creating && selectedKey === item.key
                      ? "Đang tạo..."
                      : "Tạo QR điểm danh"}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      <Modal visible={showRecords} animationType="slide">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>Danh sách điểm danh</Text>
              {!!sessionInfo?.code && (
                <Text style={styles.meta}>
                  Mã QR: {sessionInfo.code} · Hết hạn:{" "}
                  {formatTime(sessionInfo.expiresAt)}
                </Text>
              )}
            </View>
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
            renderItem={({ item }) => (
              <View style={styles.recordCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.studentName}>{item.studentName}</Text>
                  {!!item.studentCode && (
                    <Text style={styles.meta}>{item.studentCode}</Text>
                  )}
                  <Text
                    style={[
                      styles.status,
                      { color: statusColor(item.status) },
                    ]}>
                    {statusLabel(item.status)}
                  </Text>
                </View>
                <View style={styles.statusBtns}>
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
            )}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

export default Attendance;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc", paddingHorizontal: 16 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0f172a",
    marginTop: 8,
    marginBottom: 6,
  },
  note: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 14,
    lineHeight: 18,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardActive: { borderColor: "#2563eb", backgroundColor: "#eff6ff" },
  classCode: { fontSize: 16, fontWeight: "700", color: "#0f172a" },
  meta: { fontSize: 13, color: "#64748b", marginTop: 2 },
  row: { marginTop: 12 },
  btn: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  btnPrimary: { backgroundColor: "#2563eb" },
  btnPrimaryText: { color: "#fff", fontWeight: "700" },
  empty: {
    textAlign: "center",
    color: "#94a3b8",
    marginTop: 40,
    paddingHorizontal: 16,
  },
  modal: { flex: 1, backgroundColor: "#f8fafc", padding: 16 },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
    gap: 12,
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
  status: { fontSize: 13, fontWeight: "700", marginTop: 4 },
  statusBtns: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
  },
  statusChip: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#f8fafc",
  },
  statusChipText: { fontSize: 12, fontWeight: "600", color: "#475569" },
});
