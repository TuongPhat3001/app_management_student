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
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type ExerciseItem = {
  id: number;
  title?: string;
  description?: string;
  dueDate?: string;
  status?: string;
  classId?: number;
  class?: { classCode?: string };
};

type SubmissionItem = {
  id: number;
  content?: string;
  fileURL?: string;
  submittedAt?: string;
  status?: string;
  score?: number | null;
  feedback?: string;
  student?: {
    studentCode?: string;
    user?: { fullName?: string };
  };
};

type ClassItem = {
  id?: number;
  classId?: number;
  classCode?: string;
};

const ManageAssignments = () => {
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [exRes, classRes] = await Promise.all([
        axios.get("/exercises"),
        axios.get("/teacher/classes"),
      ]);
      setExercises(exRes.data?.data || exRes.data || []);
      setClasses(classRes.data?.data || classRes.data || []);
    } catch {
      setExercises([]);
      setClasses([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const openCreate = () => {
    setTitle("");
    setDescription("");
    setDueDate("");
    setClassId(classes[0] ? classes[0].classId || classes[0].id || null : null);
    setShowCreate(true);
  };

  const createExercise = async () => {
    if (!title.trim()) {
      Alert.alert("Thông báo", "Vui lòng nhập tiêu đề bài tập");
      return;
    }
    if (!classId) {
      Alert.alert("Thông báo", "Vui lòng chọn lớp");
      return;
    }
    setSaving(true);
    try {
      await axios.post("/exercises", {
        title: title.trim(),
        description: description.trim(),
        classId,
        dueDate: dueDate || undefined,
      });
      Alert.alert("Thành công", "Đã tạo bài tập");
      setShowCreate(false);
      loadData();
    } catch (err: any) {
      Alert.alert(
        "Lỗi",
        err.response?.data?.message || "Không tạo được bài tập",
      );
    } finally {
      setSaving(false);
    }
  };

  const openSubmissions = async (item: ExerciseItem) => {
    setSelectedExercise(item);
    setLoadingSubs(true);
    try {
      const res = await axios.get(`/exercises/${item.id}/submissions`);
      setSubmissions(res.data?.data || res.data || []);
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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  // Màn hình xem bài nộp
  if (selectedExercise) {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={() => setSelectedExercise(null)}>
          <Text style={styles.back}>‹ Quay lại</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{selectedExercise.title}</Text>
        <Text style={styles.meta}>
          Hạn nộp: {formatDate(selectedExercise.dueDate)}
        </Text>

        {loadingSubs ? (
          <ActivityIndicator style={{ marginTop: 40 }} color="#2563eb" />
        ) : (
          <FlatList
            data={submissions}
            keyExtractor={(item) => String(item.id)}
            ListEmptyComponent={
              <Text style={styles.empty}>Chưa có bài nộp</Text>
            }
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Text style={styles.studentName}>
                  {item.student?.user?.fullName || "Sinh viên"}
                </Text>
                <Text style={styles.meta}>
                  {item.student?.studentCode || ""} ·{" "}
                  {formatDate(item.submittedAt)}
                </Text>
                {!!item.content && (
                  <Text style={styles.content} numberOfLines={4}>
                    {item.content}
                  </Text>
                )}
                <Text style={styles.status}>
                  {item.status || "submitted"}
                  {item.score != null ? ` · Điểm: ${item.score}` : ""}
                </Text>
              </View>
            )}
          />
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Bài tập</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
          <Text style={styles.addBtnText}>+ Tạo mới</Text>
        </TouchableOpacity>
      </View>

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
              Lớp: {item.class?.classCode || item.classId || "—"}
            </Text>
            <Text style={styles.meta}>Hạn: {formatDate(item.dueDate)}</Text>
            <Text style={styles.link}>Xem bài nộp ›</Text>
          </TouchableOpacity>
        )}
      />

      {/* Modal tạo bài tập */}
      <Modal visible={showCreate} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Tạo bài tập mới</Text>

            <Text style={styles.label}>Tiêu đề</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Nhập tiêu đề"
            />

            <Text style={styles.label}>Mô tả</Text>
            <TextInput
              style={[styles.input, { height: 80 }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Mô tả bài tập"
              multiline
            />

            <Text style={styles.label}>Lớp</Text>
            <View style={styles.classPick}>
              {classes.map((c) => {
                const id = c.classId || c.id || 0;
                const active = classId === id;
                return (
                  <TouchableOpacity
                    key={id}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setClassId(id)}>
                    <Text
                      style={[
                        styles.chipText,
                        active && styles.chipTextActive,
                      ]}>
                      {c.classCode || `#${id}`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>Hạn nộp (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={dueDate}
              onChangeText={setDueDate}
              placeholder="2026-07-30"
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
        </View>
      </Modal>
    </View>
  );
};

export default ManageAssignments;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc", padding: 16 },
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
  back: { color: "#2563eb", fontWeight: "700", marginBottom: 10, fontSize: 15 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
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
    paddingVertical: 6,
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
