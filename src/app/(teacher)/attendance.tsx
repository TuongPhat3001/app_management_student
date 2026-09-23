import api from "@/src/api/axios";
import React, { useCallback, useEffect, useMemo, useState } from "react";
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

type ScheduleInfo = {
  dayRaw: string;
  dayLabel: string;
  start: string;
  end: string;
  matchesToday: boolean;
};

type OfferingItem = {
  key: string;
  classId: number;
  courseId: number;
  courseOfferingId: number;
  classCode: string;
  courseName: string;
  courseCode: string;
  schedules: ScheduleInfo[];
};

type RecordItem = {
  id: number;
  status?: string;
  studentName?: string;
  studentCode?: string;
};

const STATUS_OPTIONS = ["present", "absent", "late", "excused"] as const;

/** Backend: Mon Tue Wed Thu Fri Sat Sun */
function todayBackendDay(): string {
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date().getDay()];
}

function todayVi(): string {
  return ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"][
    new Date().getDay()
  ];
}

function normalizeDayLabel(raw: any): { backend: string; label: string } {
  const s = String(raw ?? "")
    .trim()
    .toLowerCase();
  const map: Record<string, { backend: string; label: string }> = {
    mon: { backend: "Mon", label: "Thứ 2" },
    monday: { backend: "Mon", label: "Thứ 2" },
    "2": { backend: "Mon", label: "Thứ 2" },
    t2: { backend: "Mon", label: "Thứ 2" },
    tue: { backend: "Tue", label: "Thứ 3" },
    tuesday: { backend: "Tue", label: "Thứ 3" },
    "3": { backend: "Tue", label: "Thứ 3" },
    t3: { backend: "Tue", label: "Thứ 3" },
    wed: { backend: "Wed", label: "Thứ 4" },
    wednesday: { backend: "Wed", label: "Thứ 4" },
    "4": { backend: "Wed", label: "Thứ 4" },
    t4: { backend: "Wed", label: "Thứ 4" },
    thu: { backend: "Thu", label: "Thứ 5" },
    thursday: { backend: "Thu", label: "Thứ 5" },
    "5": { backend: "Thu", label: "Thứ 5" },
    t5: { backend: "Thu", label: "Thứ 5" },
    fri: { backend: "Fri", label: "Thứ 6" },
    friday: { backend: "Fri", label: "Thứ 6" },
    "6": { backend: "Fri", label: "Thứ 6" },
    t6: { backend: "Fri", label: "Thứ 6" },
    sat: { backend: "Sat", label: "Thứ 7" },
    saturday: { backend: "Sat", label: "Thứ 7" },
    "7": { backend: "Sat", label: "Thứ 7" },
    t7: { backend: "Sat", label: "Thứ 7" },
    sun: { backend: "Sun", label: "Chủ nhật" },
    sunday: { backend: "Sun", label: "Chủ nhật" },
    "1": { backend: "Sun", label: "Chủ nhật" },
    "0": { backend: "Sun", label: "Chủ nhật" },
    cn: { backend: "Sun", label: "Chủ nhật" },
  };
  if (map[s]) return map[s];
  // Already Mon/Tue...
  const up = String(raw ?? "").trim();
  const short = up.slice(0, 3);
  const byShort: Record<string, { backend: string; label: string }> = {
    Mon: { backend: "Mon", label: "Thứ 2" },
    Tue: { backend: "Tue", label: "Thứ 3" },
    Wed: { backend: "Wed", label: "Thứ 4" },
    Thu: { backend: "Thu", label: "Thứ 5" },
    Fri: { backend: "Fri", label: "Thứ 6" },
    Sat: { backend: "Sat", label: "Thứ 7" },
    Sun: { backend: "Sun", label: "Chủ nhật" },
  };
  if (byShort[short]) return byShort[short];
  return { backend: up, label: up || "—" };
}

function fmtTime(t: any): string {
  if (!t) return "—";
  const m = String(t).match(/(\d{1,2}):(\d{2})/);
  if (m) return `${m[1].padStart(2, "0")}:${m[2]}`;
  return String(t);
}

function minutesNow(): number {
  const n = new Date();
  return n.getHours() * 60 + n.getMinutes();
}

function parseMinutes(t: string): number {
  const m = t.match(/(\d{1,2}):(\d{2})/);
  if (!m) return -1;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

/**
 * Backend CreateAttendanceSession:
 * - Phải có lịch đúng THỨ HÔM NAY (Mon/Tue/...)
 * - Chỉ mở từ 15 phút trước giờ học đến hết tiết
 * - Có SV đăng ký
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

  const todayB = useMemo(() => todayBackendDay(), []);
  const todayLabel = useMemo(() => todayVi(), []);

  const mapOfferings = (classes: any[]): OfferingItem[] => {
    const out: OfferingItem[] = [];
    for (const c of classes || []) {
      const classId = Number(c.ID ?? c.id);
      const classCode = String(c.ClassCode ?? c.classCode ?? `Lớp #${classId}`);
      const offerings = c.CourseOfferings ?? c.courseOfferings ?? [];

      if (!Array.isArray(offerings) || offerings.length === 0) continue;

      for (const o of offerings) {
        const offeringId = Number(o.ID ?? o.id);
        const course = o.Course ?? o.course ?? {};
        const courseId = Number(
          o.CourseID ?? o.courseId ?? course.ID ?? course.id ?? 0,
        );
        if (!classId || !offeringId) continue;

        const rawSch = o.Schedules ?? o.schedules ?? [];
        const schedules: ScheduleInfo[] = (
          Array.isArray(rawSch) ? rawSch : []
        ).map((sch: any) => {
          const day = normalizeDayLabel(sch.DayOfWeek ?? sch.dayOfWeek);
          const start = fmtTime(sch.StartTime ?? sch.startTime);
          const end = fmtTime(sch.EndTime ?? sch.endTime);
          return {
            dayRaw: day.backend,
            dayLabel: day.label,
            start,
            end,
            matchesToday: day.backend === todayB,
          };
        });

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
          schedules,
        });
      }
    }
    return out;
  };

  const loadClasses = useCallback(async () => {
    try {
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
      if (list.length && !selectedKey) setSelectedKey(list[0].key);
    } catch (e) {
      console.log("attendance classes", e);
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedKey, todayB]);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  const canOpenHint = (item: OfferingItem): string => {
    const todaySlots = item.schedules.filter((s) => s.matchesToday);
    if (item.schedules.length === 0) {
      return "Chưa có lịch dạy trong hệ thống";
    }
    if (todaySlots.length === 0) {
      const days = [...new Set(item.schedules.map((s) => s.dayLabel))].join(
        ", ",
      );
      return `Hôm nay (${todayLabel}) không có tiết. Lịch: ${days}`;
    }
    const now = minutesNow();
    const openable = todaySlots.some((s) => {
      const start = parseMinutes(s.start);
      const end = parseMinutes(s.end);
      if (start < 0 || end <= start) return false;
      // 15 phút trước → hết tiết
      return now >= start - 15 && now <= end;
    });
    if (!openable) {
      const times = todaySlots.map((s) => `${s.start}–${s.end}`).join(", ");
      return `Có tiết hôm nay ${times}. Chỉ mở từ 15 phút trước giờ học đến hết tiết.`;
    }
    return "Có thể tạo QR (trong khung giờ tiết)";
  };

  const createSession = async (item: OfferingItem) => {
    setCreating(true);
    setSelectedKey(item.key);
    try {
      const body: Record<string, number> = {
        courseOfferingId: item.courseOfferingId,
      };
      if (item.classId) body.classId = item.classId;
      if (item.courseId) body.courseId = item.courseId;

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
      const msg =
        [d?.message, d?.error].filter(Boolean).join("\n") ||
        err?.message ||
        "Không tạo được phiên";
      Alert.alert("Không tạo được phiên", `${msg}\n\n${canOpenHint(item)}`);
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
        Hôm nay: <Text style={styles.bold}>{todayLabel}</Text> ({todayB}).
        Backend chỉ cho mở QR khi học phần có lịch đúng thứ này và trong khung
        giờ tiết (±15 phút trước giờ học).
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
            Không có học phần phụ trách. Nhận lớp từ admin trước.
          </Text>
        }
        renderItem={({ item }) => {
          const active = selectedKey === item.key;
          const hasToday = item.schedules.some((s) => s.matchesToday);
          const hint = canOpenHint(item);
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

              {item.schedules.length > 0 ? (
                <View style={styles.schBox}>
                  {item.schedules.map((s, i) => (
                    <Text
                      key={i}
                      style={[
                        styles.schLine,
                        s.matchesToday && styles.schToday,
                      ]}>
                      {s.dayLabel} {s.start}–{s.end}
                      {s.matchesToday ? " · hôm nay" : ""}
                    </Text>
                  ))}
                </View>
              ) : (
                <Text style={styles.warn}>Chưa có lịch trong DB</Text>
              )}

              <Text
                style={[styles.hint, hasToday ? styles.hintOk : styles.hintNo]}>
                {hint}
              </Text>

              <View style={styles.row}>
                <TouchableOpacity
                  style={[
                    styles.btn,
                    styles.btnPrimary,
                    !hasToday && styles.btnDisabled,
                  ]}
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
  bold: { fontWeight: "800", color: "#0f172a" },
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
  schBox: {
    marginTop: 8,
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    padding: 8,
  },
  schLine: { fontSize: 12, color: "#64748b", marginBottom: 2 },
  schToday: { color: "#2563eb", fontWeight: "700" },
  warn: { marginTop: 8, fontSize: 12, color: "#dc2626" },
  hint: { marginTop: 8, fontSize: 12, lineHeight: 16 },
  hintOk: { color: "#059669" },
  hintNo: { color: "#d97706" },
  row: { marginTop: 12 },
  btn: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  btnPrimary: { backgroundColor: "#2563eb" },
  btnDisabled: { opacity: 0.55 },
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
