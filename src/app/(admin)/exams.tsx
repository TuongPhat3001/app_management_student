import apiClient from "@/src/api/axios";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * Backend: exam_schedule_controller.go
 * ListExamSchedules / CreateExamSchedule / DeleteExamSchedule
 * Paths thường dùng: /exam-schedules  (fallback /exams)
 *
 * ExamScheduleRequest:
 *   classId*, courseId*, semesterId*, roomId*,
 *   examDate*, session*, startTime*, endTime*,
 *   examType?, note?
 */

type MetaItem = { id: number; label: string };
type ExamItem = {
  id: number;
  classId: number;
  courseId: number;
  semesterId: number;
  roomId: number;
  examDate: string;
  session: string;
  startTime: string;
  endTime: string;
  examType: string;
  note: string;
  classCode?: string;
  courseName?: string;
  roomName?: string;
};

const EXAM_BASES = ["/exam-schedules", "/exams", "/exam-schedule"];

async function examGet() {
  let lastErr: any;
  for (const base of EXAM_BASES) {
    try {
      const res = await apiClient.get(base);
      return { base, res };
    } catch (e: any) {
      lastErr = e;
      if (e?.response?.status && e.response.status !== 404) throw e;
    }
  }
  throw lastErr;
}

async function examPost(payload: any) {
  let lastErr: any;
  for (const base of EXAM_BASES) {
    try {
      return await apiClient.post(base, payload);
    } catch (e: any) {
      lastErr = e;
      if (e?.response?.status && e.response.status !== 404) throw e;
    }
  }
  throw lastErr;
}

async function examDelete(id: number) {
  let lastErr: any;
  for (const base of EXAM_BASES) {
    try {
      return await apiClient.delete(`${base}/${id}`);
    } catch (e: any) {
      lastErr = e;
      if (e?.response?.status && e.response.status !== 404) throw e;
    }
  }
  throw lastErr;
}

const Exams: React.FC = () => {
  const [list, setList] = useState<ExamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [classes, setClasses] = useState<MetaItem[]>([]);
  const [courses, setCourses] = useState<MetaItem[]>([]);
  const [semesters, setSemesters] = useState<MetaItem[]>([]);
  const [rooms, setRooms] = useState<MetaItem[]>([]);
  const [picker, setPicker] = useState<
    "class" | "course" | "semester" | "room" | null
  >(null);

  const [form, setForm] = useState({
    classId: 0,
    courseId: 0,
    semesterId: 0,
    roomId: 0,
    examDate: "",
    session: "Sáng",
    startTime: "08:00",
    endTime: "10:00",
    examType: "Giữa kỳ",
    note: "",
  });

  const mapExam = (raw: any): ExamItem | null => {
    const id = Number(raw?.ID ?? raw?.id);
    if (!id) return null;
    const dateRaw = raw?.ExamDate ?? raw?.examDate ?? "";
    const dateStr =
      typeof dateRaw === "string"
        ? dateRaw.slice(0, 10)
        : dateRaw
          ? String(dateRaw).slice(0, 10)
          : "";
    return {
      id,
      classId: Number(raw?.ClassID ?? raw?.classId ?? 0),
      courseId: Number(raw?.CourseID ?? raw?.courseId ?? 0),
      semesterId: Number(raw?.SemesterID ?? raw?.semesterId ?? 0),
      roomId: Number(raw?.RoomID ?? raw?.roomId ?? 0),
      examDate: dateStr,
      session: String(raw?.Session ?? raw?.session ?? ""),
      startTime: String(raw?.StartTime ?? raw?.startTime ?? ""),
      endTime: String(raw?.EndTime ?? raw?.endTime ?? ""),
      examType: String(raw?.ExamType ?? raw?.examType ?? ""),
      note: String(raw?.Note ?? raw?.note ?? ""),
      classCode: raw?.Class?.ClassCode ?? raw?.Class?.classCode,
      courseName: raw?.Course?.Name ?? raw?.Course?.name,
      roomName: raw?.Room?.Name ?? raw?.Room?.name ?? raw?.Room?.Code,
    };
  };

  const loadMeta = useCallback(async () => {
    try {
      const [metaRes, classRes, courseRes] = await Promise.all([
        apiClient.get("/metadata").catch(() => null),
        apiClient.get("/classes").catch(() => null),
        apiClient.get("/courses").catch(() => null),
      ]);
      const d = metaRes?.data?.data ?? {};
      setSemesters(
        (d.semesters || [])
          .map((s: any) => ({
            id: Number(s.ID ?? s.id),
            label: String(s.Name ?? s.name ?? `HK ${s.ID}`),
          }))
          .filter((x: MetaItem) => x.id > 0),
      );
      setRooms(
        (d.rooms || [])
          .map((r: any) => ({
            id: Number(r.ID ?? r.id),
            label: String(r.Name ?? r.name ?? r.Code ?? r.code ?? `P${r.ID}`),
          }))
          .filter((x: MetaItem) => x.id > 0),
      );
      const cRaw = classRes?.data?.data ?? [];
      setClasses(
        (Array.isArray(cRaw) ? cRaw : [])
          .map((c: any) => ({
            id: Number(c.ID ?? c.id),
            label: String(c.ClassCode ?? c.classCode ?? c.ID),
          }))
          .filter((x: MetaItem) => x.id > 0),
      );
      const coRaw = courseRes?.data?.data ?? [];
      setCourses(
        (Array.isArray(coRaw) ? coRaw : [])
          .map((c: any) => ({
            id: Number(c.ID ?? c.id),
            label:
              `${c.Code ?? c.code ?? ""} · ${c.Name ?? c.name ?? ""}`.trim(),
          }))
          .filter((x: MetaItem) => x.id > 0),
      );
    } catch {
      /* ignore */
    }
  }, []);

  const load = useCallback(async () => {
    try {
      const { res } = await examGet();
      const raw = res.data?.data ?? res.data ?? [];
      setList(
        (Array.isArray(raw) ? raw : [])
          .map(mapExam)
          .filter(Boolean) as ExamItem[],
      );
    } catch (e: any) {
      console.log("exams load", e?.response?.data);
      setList([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadMeta();
    load();
  }, [load, loadMeta]);

  const openCreate = () => {
    setForm({
      classId: classes[0]?.id || 0,
      courseId: courses[0]?.id || 0,
      semesterId: semesters[0]?.id || 0,
      roomId: rooms[0]?.id || 0,
      examDate: "",
      session: "Sáng",
      startTime: "08:00",
      endTime: "10:00",
      examType: "Giữa kỳ",
      note: "",
    });
    setModal(true);
  };

  const handleCreate = async () => {
    if (!form.classId || !form.courseId || !form.semesterId || !form.roomId) {
      Alert.alert("Thiếu thông tin", "Chọn lớp, môn, học kỳ, phòng.");
      return;
    }
    if (!form.examDate.trim()) {
      Alert.alert("Thiếu thông tin", "Nhập ngày thi (YYYY-MM-DD).");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.examDate.trim())) {
      Alert.alert("Sai định dạng", "Ngày thi phải YYYY-MM-DD.");
      return;
    }
    if (
      !form.session.trim() ||
      !form.startTime.trim() ||
      !form.endTime.trim()
    ) {
      Alert.alert("Thiếu thông tin", "Nhập ca, giờ bắt đầu, giờ kết thúc.");
      return;
    }

    const payload = {
      classId: form.classId,
      courseId: form.courseId,
      semesterId: form.semesterId,
      roomId: form.roomId,
      examDate: form.examDate.trim(),
      session: form.session.trim(),
      startTime: form.startTime.trim(),
      endTime: form.endTime.trim(),
      examType: form.examType.trim(),
      note: form.note.trim(),
    };

    setSaving(true);
    try {
      await examPost(payload);
      Alert.alert("Thành công", "Đã thêm lịch thi.");
      setModal(false);
      load();
    } catch (e: any) {
      const d = e?.response?.data;
      Alert.alert(
        "Lỗi",
        [d?.message, d?.error].filter(Boolean).join("\n") ||
          "Tạo lịch thi thất bại.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (item: ExamItem) => {
    Alert.alert(
      "Xóa lịch thi",
      `Xóa lịch ${item.courseName || item.courseId} — ${item.examDate}?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              await examDelete(item.id);
              Alert.alert("Thành công", "Đã xóa lịch thi.");
              load();
            } catch (e: any) {
              const d = e?.response?.data;
              Alert.alert(
                "Lỗi",
                [d?.message, d?.error].filter(Boolean).join("\n") ||
                  "Xóa thất bại.",
              );
            }
          },
        },
      ],
    );
  };

  const labelOf = (
    kind: "class" | "course" | "semester" | "room",
    id: number,
  ) => {
    const arr =
      kind === "class"
        ? classes
        : kind === "course"
          ? courses
          : kind === "semester"
            ? semesters
            : rooms;
    return arr.find((x) => x.id === id)?.label || "Chọn...";
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.title}>Kỳ thi</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
          <Ionicons name="add" size={22} color="#FFF" />
          <Text style={styles.addText}>Thêm</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#5B5BD6" />
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(i) => String(i.id)}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              colors={["#5B5BD6"]}
            />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>Chưa có lịch thi</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.code}>
                  {item.examType || "Thi"} · {item.examDate}
                </Text>
                <Text style={styles.name}>
                  {item.courseName || `Môn #${item.courseId}`}
                </Text>
                <Text style={styles.meta}>
                  Lớp {item.classCode || item.classId}
                  {" · "}
                  {item.session} {item.startTime}-{item.endTime}
                  {item.roomName ? ` · ${item.roomName}` : ""}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => handleDelete(item)}>
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      <Modal visible={modal} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Thêm lịch thi</Text>
              <TouchableOpacity onPress={() => setModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView
              contentContainerStyle={{ padding: 16 }}
              keyboardShouldPersistTaps="handled">
              {(
                [
                  ["class", "Lớp (classId) *", form.classId],
                  ["course", "Môn (courseId) *", form.courseId],
                  ["semester", "Học kỳ (semesterId) *", form.semesterId],
                  ["room", "Phòng (roomId) *", form.roomId],
                ] as const
              ).map(([kind, label, id]) => (
                <View key={kind}>
                  <Text style={styles.label}>{label}</Text>
                  <TouchableOpacity
                    style={styles.select}
                    onPress={() => setPicker(kind)}>
                    <Text style={styles.selectText}>{labelOf(kind, id)}</Text>
                    <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
              ))}

              <Text style={styles.label}>Ngày thi * (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                value={form.examDate}
                onChangeText={(v) => setForm((p) => ({ ...p, examDate: v }))}
                placeholder="2026-07-10"
                placeholderTextColor="#9CA3AF"
              />
              <Text style={styles.label}>Ca *</Text>
              <TextInput
                style={styles.input}
                value={form.session}
                onChangeText={(v) => setForm((p) => ({ ...p, session: v }))}
                placeholder="Sáng / Chiều"
                placeholderTextColor="#9CA3AF"
              />
              <Text style={styles.label}>Giờ bắt đầu * (HH:mm)</Text>
              <TextInput
                style={styles.input}
                value={form.startTime}
                onChangeText={(v) => setForm((p) => ({ ...p, startTime: v }))}
                placeholder="08:00"
                placeholderTextColor="#9CA3AF"
              />
              <Text style={styles.label}>Giờ kết thúc * (HH:mm)</Text>
              <TextInput
                style={styles.input}
                value={form.endTime}
                onChangeText={(v) => setForm((p) => ({ ...p, endTime: v }))}
                placeholder="10:00"
                placeholderTextColor="#9CA3AF"
              />
              <Text style={styles.label}>Loại thi</Text>
              <TextInput
                style={styles.input}
                value={form.examType}
                onChangeText={(v) => setForm((p) => ({ ...p, examType: v }))}
                placeholder="Giữa kỳ / Cuối kỳ"
                placeholderTextColor="#9CA3AF"
              />
              <Text style={styles.label}>Ghi chú</Text>
              <TextInput
                style={styles.input}
                value={form.note}
                onChangeText={(v) => setForm((p) => ({ ...p, note: v }))}
                placeholderTextColor="#9CA3AF"
              />

              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                onPress={handleCreate}
                disabled={saving}>
                {saving ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.saveText}>Thêm lịch thi</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={!!picker} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={[styles.modal, { maxHeight: "55%" }]}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Chọn</Text>
              <TouchableOpacity onPress={() => setPicker(null)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={
                picker === "class"
                  ? classes
                  : picker === "course"
                    ? courses
                    : picker === "semester"
                      ? semesters
                      : rooms
              }
              keyExtractor={(i) => String(i.id)}
              ListEmptyComponent={
                <Text style={styles.empty}>Không có dữ liệu</Text>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickRow}
                  onPress={() => {
                    if (picker === "class")
                      setForm((p) => ({ ...p, classId: item.id }));
                    if (picker === "course")
                      setForm((p) => ({ ...p, courseId: item.id }));
                    if (picker === "semester")
                      setForm((p) => ({ ...p, semesterId: item.id }));
                    if (picker === "room")
                      setForm((p) => ({ ...p, roomId: item.id }));
                    setPicker(null);
                  }}>
                  <Text style={styles.name}>{item.label}</Text>
                  <Text style={styles.meta}>ID: {item.id}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Exams;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F3EEFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  title: { fontSize: 20, fontWeight: "800" },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#5B5BD6",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addText: { color: "#FFF", fontWeight: "700" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { textAlign: "center", color: "#9CA3AF", marginTop: 40 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  code: { fontSize: 13, fontWeight: "700", color: "#5B5BD6" },
  name: { fontSize: 15, fontWeight: "700", marginTop: 2 },
  meta: { fontSize: 12, color: "#9CA3AF", marginTop: 4 },
  iconBtn: { padding: 8 },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
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
  label: { fontSize: 13, fontWeight: "600", marginBottom: 8, color: "#374151" },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 15,
  },
  select: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 12,
  },
  selectText: { flex: 1, fontSize: 15 },
  saveBtn: {
    backgroundColor: "#5B5BD6",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  saveText: { color: "#FFF", fontWeight: "700", fontSize: 16 },
  pickRow: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
});
