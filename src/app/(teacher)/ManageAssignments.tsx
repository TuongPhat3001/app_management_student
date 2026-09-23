import api from "@/src/api/axios";
import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ClassItem = { id: number; classCode: string };

type ExerciseItem = {
  id: number;
  title: string;
  description?: string;
  dueDate?: string;
  classId?: number;
  classCode?: string;
  status?: string;
};

type SubmissionItem = {
  id: number;
  content?: string;
  fileURL?: string;
  submittedAt?: string;
  status?: string;
  score?: number | null;
  feedback?: string;
  studentName?: string;
  studentCode?: string;
};

/**
 * Backend:
 * GET  /exercises
 * POST /exercises { classId, title, description, dueDate }  dueDate required
 * GET  /exercises/:id/submissions
 * GET  /teacher/classes
 */
const ManageAssignments = () => {
  const params = useLocalSearchParams<{ focus?: string }>();
  const focusPending = params.focus === "pending";

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);

  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [classId, setClassId] = useState<number | null>(null);
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);

  const [selectedExercise, setSelectedExercise] = useState<ExerciseItem | null>(
    null,
  );
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [onlyPending, setOnlyPending] = useState(focusPending);

  const mapClass = (c: any): ClassItem | null => {
    const id = Number(c.ID ?? c.id);
    if (!id) return null;
    return {
      id,
      classCode: String(c.ClassCode ?? c.classCode ?? `Lớp #${id}`),
    };
  };

  const mapExercise = (e: any): ExerciseItem => {
    const cls = e.Class ?? e.class ?? {};
    return {
      id: Number(e.ID ?? e.id),
      title: String(e.Title ?? e.title ?? "Bài tập"),
      description: e.Description ?? e.description,
      dueDate: e.DueDate ?? e.dueDate,
      classId: Number(e.ClassID ?? e.classId ?? cls.ID ?? cls.id) || undefined,
      classCode: String(cls.ClassCode ?? cls.classCode ?? e.classCode ?? ""),
      status: e.Status ?? e.status,
    };
  };

  const loadData = useCallback(async () => {
    try {
      const [exRes, classRes] = await Promise.all([
        api.get("/exercises"),
        api.get("/teacher/classes"),
      ]);
      const rawEx = exRes.data?.data ?? exRes.data ?? [];
      const rawCl = classRes.data?.data ?? classRes.data ?? [];
      setExercises(
        (Array.isArray(rawEx) ? rawEx : [])
          .map(mapExercise)
          .filter((x) => x.id),
      );
      setClasses(
        (Array.isArray(rawCl) ? rawCl : [])
          .map(mapClass)
          .filter(Boolean) as ClassItem[],
      );
    } catch (e) {
      console.log("exercises load", e);
      setExercises([]);
      setClasses([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setOnlyPending(focusPending);
  }, [focusPending]);

  const openCreate = () => {
    setTitle("");
    setDescription("");
    const today = new Date();
    today.setDate(today.getDate() + 7);
    setDueDate(today.toISOString().slice(0, 10));
    setClassId(classes[0]?.id ?? null);
    setShowCreate(true);
  };

  const createExercise = async () => {
    if (!title.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập tiêu đề bài tập");
      return;
    }
    if (!classId) {
      Alert.alert(
        "Thiếu thông tin",
        classes.length === 0
          ? "Bạn chưa có lớp phụ trách. Nhận lớp từ admin trước."
          : "Vui lòng chọn lớp",
      );
      return;
    }
    if (!dueDate.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập hạn nộp (YYYY-MM-DD)");
      return;
    }
    setSaving(true);
    try {
      await api.post("/exercises", {
        classId,
        title: title.trim(),
        description: description.trim(),
        dueDate: dueDate.trim(),
      });
      Alert.alert("Thành công", "Đã tạo bài tập");
      setShowCreate(false);
      loadData();
    } catch (err: any) {
      const d = err?.response?.data;
      Alert.alert(
        "Lỗi",
        [d?.message, d?.error].filter(Boolean).join("\n") ||
          "Không tạo được bài tập",
      );
    } finally {
      setSaving(false);
    }
  };

  const openSubmissions = async (item: ExerciseItem) => {
    setSelectedExercise(item);
    setLoadingSubs(true);
    try {
      const res = await api.get(`/exercises/${item.id}/submissions`);
      const raw = res.data?.data ?? res.data ?? [];
      const list = (Array.isArray(raw) ? raw : []).map((s: any) => {
        const student = s.Student ?? s.student ?? {};
        const user = student.User ?? student.user ?? {};
        return {
          id: Number(s.ID ?? s.id),
          content: s.Content ?? s.content,
          fileURL: s.FileURL ?? s.fileURL ?? s.fileUrl,
          submittedAt: s.SubmittedAt ?? s.submittedAt,
          status: String(s.Status ?? s.status ?? "submitted"),
          score: s.Score ?? s.score,
          feedback: s.Feedback ?? s.feedback,
          studentName: String(user.FullName ?? user.fullName ?? "Sinh viên"),
          studentCode: String(student.StudentCode ?? student.studentCode ?? ""),
        } as SubmissionItem;
      });
      setSubmissions(list);
    } catch {
      setSubmissions([]);
      Alert.alert("Lỗi", "Không tải được bài nộp");
    } finally {
      setLoadingSubs(false);
    }
  };

  const formatDate = (value?: string) => {
    if (!value) return "—";
    try {
      return new Date(value).toLocaleString("vi-VN");
    } catch {
      return value;
    }
  };

  const pendingCount = useMemo(() => {
    // Hiển thị theo submission status khi đã mở — trên list exercise không có count
    return 0;
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (selectedExercise) {
    const pendingSubs = onlyPending
      ? submissions.filter(
          (s) =>
            !s.status ||
            s.status.toLowerCase() === "submitted" ||
            s.status.toLowerCase() === "pending" ||
            s.score == null,
        )
      : submissions;

    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <TouchableOpacity onPress={() => setSelectedExercise(null)}>
          <Text style={styles.back}>‹ Quay lại danh sách bài tập</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{selectedExercise.title}</Text>
        <Text style={styles.meta}>
          Lớp: {selectedExercise.classCode || selectedExercise.classId || "—"} ·
          Hạn: {formatDate(selectedExercise.dueDate)}
        </Text>

        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterChip, !onlyPending && styles.filterOn]}
            onPress={() => setOnlyPending(false)}>
            <Text
              style={[styles.filterText, !onlyPending && styles.filterTextOn]}>
              Tất cả
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, onlyPending && styles.filterOn]}
            onPress={() => setOnlyPending(true)}>
            <Text
              style={[styles.filterText, onlyPending && styles.filterTextOn]}>
              Chờ chấm
            </Text>
          </TouchableOpacity>
        </View>

        {loadingSubs ? (
          <ActivityIndicator style={{ marginTop: 40 }} color="#2563eb" />
        ) : (
          <FlatList
            data={pendingSubs}
            keyExtractor={(item) => String(item.id)}
            ListEmptyComponent={
              <Text style={styles.empty}>
                {onlyPending ? "Không có bài nộp chờ chấm" : "Chưa có bài nộp"}
              </Text>
            }
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Text style={styles.studentName}>{item.studentName}</Text>
                <Text style={styles.meta}>
                  {item.studentCode} · {formatDate(item.submittedAt)}
                </Text>
                {!!item.content && (
                  <Text style={styles.content} numberOfLines={5}>
                    {item.content}
                  </Text>
                )}
                <Text style={styles.status}>
                  {item.status}
                  {item.score != null
                    ? ` · Điểm: ${item.score}`
                    : " · Chưa chấm"}
                </Text>
              </View>
            )}
          />
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Bài tập</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
          <Text style={styles.addBtnText}>+ Tạo mới</Text>
        </TouchableOpacity>
      </View>

      {classes.length === 0 && (
        <Text style={styles.warn}>
          Chưa có lớp phụ trách — nhận lớp từ admin (Đề xuất lớp) trước khi tạo
          bài tập.
        </Text>
      )}

      <FlatList
        data={exercises}
        keyExtractor={(item) => String(item.id)}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadData();
            }}
          />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>Chưa có bài tập nào</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => openSubmissions(item)}>
            <Text style={styles.exTitle}>{item.title}</Text>
            <Text style={styles.meta}>
              Lớp: {item.classCode || item.classId || "—"}
            </Text>
            <Text style={styles.meta}>Hạn: {formatDate(item.dueDate)}</Text>
            <Text style={styles.link}>Xem bài nộp ›</Text>
          </TouchableOpacity>
        )}
      />

      <Modal visible={showCreate} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView
            contentContainerStyle={styles.modalScroll}
            keyboardShouldPersistTaps="handled">
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Tạo bài tập mới</Text>

              <Text style={styles.label}>Tiêu đề *</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Nhập tiêu đề"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.label}>Mô tả</Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: "top" }]}
                value={description}
                onChangeText={setDescription}
                placeholder="Mô tả bài tập"
                placeholderTextColor="#94A3B8"
                multiline
              />

              <Text style={styles.label}>Lớp *</Text>
              {classes.length === 0 ? (
                <Text style={styles.warnInline}>
                  Không có lớp để chọn. Vào Đề xuất lớp để nhận phân công.
                </Text>
              ) : (
                <View style={styles.classPick}>
                  {classes.map((c) => {
                    const active = classId === c.id;
                    return (
                      <TouchableOpacity
                        key={c.id}
                        style={[styles.chip, active && styles.chipActive]}
                        onPress={() => setClassId(c.id)}>
                        <Text
                          style={[
                            styles.chipText,
                            active && styles.chipTextActive,
                          ]}>
                          {c.classCode}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              <Text style={styles.label}>Hạn nộp (YYYY-MM-DD) *</Text>
              <TextInput
                style={styles.input}
                value={dueDate}
                onChangeText={setDueDate}
                placeholder="2026-12-31"
                placeholderTextColor="#94A3B8"
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.btnCancel}
                  onPress={() => setShowCreate(false)}>
                  <Text style={styles.btnCancelText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.btnSave}
                  onPress={createExercise}
                  disabled={saving}>
                  <Text style={styles.btnSaveText}>
                    {saving ? "Đang tạo..." : "Tạo bài tập"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ManageAssignments;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc", paddingHorizontal: 16 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    marginTop: 8,
  },
  title: { fontSize: 22, fontWeight: "800", color: "#0f172a" },
  addBtn: {
    backgroundColor: "#2563eb",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  addBtnText: { color: "#fff", fontWeight: "700" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  exTitle: { fontSize: 16, fontWeight: "700", color: "#0f172a" },
  studentName: { fontSize: 15, fontWeight: "700", color: "#0f172a" },
  meta: { fontSize: 13, color: "#64748b", marginTop: 3 },
  content: { fontSize: 14, color: "#334155", marginTop: 8, lineHeight: 20 },
  status: { fontSize: 12, color: "#94a3b8", marginTop: 6 },
  link: { marginTop: 8, color: "#2563eb", fontWeight: "600" },
  empty: { textAlign: "center", color: "#94a3b8", marginTop: 40 },
  back: {
    color: "#2563eb",
    fontWeight: "700",
    marginBottom: 10,
    marginTop: 8,
    fontSize: 15,
  },
  warn: {
    backgroundColor: "#fff7ed",
    color: "#c2410c",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    fontSize: 13,
    lineHeight: 18,
  },
  warnInline: { color: "#dc2626", fontSize: 13, marginBottom: 8 },
  filterRow: { flexDirection: "row", gap: 8, marginVertical: 10 },
  filterChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: "#fff",
  },
  filterOn: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  filterText: { fontSize: 13, fontWeight: "600", color: "#64748b" },
  filterTextOn: { color: "#fff" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
  },
  modalScroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  modalBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 12,
  },
  label: { fontSize: 13, color: "#64748b", marginBottom: 6, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: "#0f172a",
  },
  classPick: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#f8fafc",
  },
  chipActive: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  chipText: { fontSize: 13, color: "#334155", fontWeight: "600" },
  chipTextActive: { color: "#fff" },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 18 },
  btnCancel: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  btnCancelText: { fontWeight: "700", color: "#475569" },
  btnSave: {
    flex: 1,
    backgroundColor: "#2563eb",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  btnSaveText: { fontWeight: "700", color: "#fff" },
});
