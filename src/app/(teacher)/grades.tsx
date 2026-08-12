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

type ClassItem = {
  id?: number;
  classId?: number;
  classCode?: string;
  courseName?: string;
};

type GradeItem = {
  id?: number;
  enrollmentId?: number;
  studentId?: number;
  studentCode?: string;
  studentName?: string;
  assignmentScore?: number;
  midtermScore?: number;
  finalScore?: number;
  totalScore?: number;
  gradeLetter?: string;
  status?: string;
};

const Grades = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [grades, setGrades] = useState<GradeItem[]>([]);
  const [loadingGrades, setLoadingGrades] = useState(false);

  const [editItem, setEditItem] = useState<GradeItem | null>(null);
  const [assignment, setAssignment] = useState("");
  const [midterm, setMidterm] = useState("");
  const [finalScore, setFinalScore] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const res = await axios.get("/teacher/classes");
      setClasses(res.data?.data || res.data || []);
    } catch {
      setClasses([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getClassId = (item: ClassItem) => item.classId || item.id || 0;

  const loadGrades = async (classId: number) => {
    setSelectedClassId(classId);
    setLoadingGrades(true);
    try {
      const res = await axios.get(`/classes/${classId}/grades`);
      setGrades(res.data?.data || res.data || []);
    } catch {
      setGrades([]);
      Alert.alert("Lỗi", "Không tải được bảng điểm lớp");
    } finally {
      setLoadingGrades(false);
    }
  };

  const openEdit = (item: GradeItem) => {
    setEditItem(item);
    setAssignment(String(item.assignmentScore ?? ""));
    setMidterm(String(item.midtermScore ?? ""));
    setFinalScore(String(item.finalScore ?? ""));
  };

  const calcTotal = () => {
    const a = parseFloat(assignment) || 0;
    const m = parseFloat(midterm) || 0;
    const f = parseFloat(finalScore) || 0;
    return Math.round((a * 0.3 + m * 0.3 + f * 0.4) * 100) / 100;
  };

  const saveGrade = async () => {
    if (!editItem) return;
    setSaving(true);
    try {
      const body = {
        enrollmentId: editItem.enrollmentId || editItem.id,
        assignmentScore: parseFloat(assignment) || 0,
        midtermScore: parseFloat(midterm) || 0,
        finalScore: parseFloat(finalScore) || 0,
        totalScore: calcTotal(),
      };

      if (editItem.id) {
        await axios.put(`/grades/${editItem.id}`, body);
      } else {
        await axios.post("/grades", body);
      }

      Alert.alert("Thành công", "Đã lưu điểm");
      setEditItem(null);
      if (selectedClassId) loadGrades(selectedClassId);
    } catch (err: any) {
      Alert.alert("Lỗi", err.response?.data?.message || "Không lưu được điểm");
    } finally {
      setSaving(false);
    }
  };

  const approveGrade = async (gradeId?: number) => {
    if (!gradeId) return;
    try {
      await axios.post(`/grades/${gradeId}/approve`);
      Alert.alert("Thành công", "Đã duyệt điểm");
      if (selectedClassId) loadGrades(selectedClassId);
    } catch (err: any) {
      Alert.alert(
        "Lỗi",
        err.response?.data?.message || "Không duyệt được điểm",
      );
    }
  };

  const approveAll = async () => {
    if (!selectedClassId) return;
    Alert.alert("Duyệt cả lớp", "Duyệt tất cả điểm của lớp này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Duyệt",
        onPress: async () => {
          try {
            await axios.post(`/classes/${selectedClassId}/grades/approve`);
            Alert.alert("Thành công", "Đã duyệt điểm cả lớp");
            loadGrades(selectedClassId);
          } catch (err: any) {
            Alert.alert(
              "Lỗi",
              err.response?.data?.message || "Không duyệt được",
            );
          }
        },
      },
    ]);
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
      <Text style={styles.title}>Quản lý điểm</Text>

      {!selectedClassId ? (
        <FlatList
          data={classes}
          keyExtractor={(item, idx) => String(getClassId(item) || idx)}
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
            <Text style={styles.empty}>Không có lớp phụ trách</Text>
          }
          renderItem={({ item }) => {
            const classId = getClassId(item);
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => loadGrades(classId)}>
                <Text style={styles.classCode}>
                  {item.classCode || `Lớp #${classId}`}
                </Text>
                {!!item.courseName && (
                  <Text style={styles.meta}>{item.courseName}</Text>
                )}
                <Text style={styles.link}>Xem / nhập điểm ›</Text>
              </TouchableOpacity>
            );
          }}
        />
      ) : (
        <>
          <View style={styles.toolbar}>
            <TouchableOpacity onPress={() => setSelectedClassId(null)}>
              <Text style={styles.back}>‹ Quay lại</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={approveAll}>
              <Text style={styles.approveAll}>Duyệt cả lớp</Text>
            </TouchableOpacity>
          </View>

          {loadingGrades ? (
            <ActivityIndicator style={{ marginTop: 40 }} color="#2563eb" />
          ) : (
            <FlatList
              data={grades}
              keyExtractor={(item, idx) =>
                String(item.id || item.enrollmentId || idx)
              }
              ListEmptyComponent={
                <Text style={styles.empty}>Chưa có dữ liệu điểm</Text>
              }
              renderItem={({ item }) => (
                <View style={styles.gradeCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.studentName}>
                      {item.studentName || "Sinh viên"}
                    </Text>
                    <Text style={styles.meta}>{item.studentCode || ""}</Text>
                    <Text style={styles.scoreLine}>
                      BT: {item.assignmentScore ?? "—"} · GK:{" "}
                      {item.midtermScore ?? "—"} · CK: {item.finalScore ?? "—"}
                    </Text>
                    <Text style={styles.total}>
                      Tổng: {item.totalScore ?? "—"} ({item.gradeLetter || "—"})
                    </Text>
                    <Text style={styles.status}>{item.status || "Draft"}</Text>
                  </View>
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={styles.btnEdit}
                      onPress={() => openEdit(item)}>
                      <Text style={styles.btnEditText}>Sửa</Text>
                    </TouchableOpacity>
                    {item.id && item.status !== "Approved" && (
                      <TouchableOpacity
                        style={styles.btnApprove}
                        onPress={() => approveGrade(item.id)}>
                        <Text style={styles.btnApproveText}>Duyệt</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
            />
          )}
        </>
      )}

      {/* Modal sửa điểm */}
      <Modal visible={!!editItem} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              Nhập điểm — {editItem?.studentName || ""}
            </Text>

            <Text style={styles.label}>Điểm bài tập (30%)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={assignment}
              onChangeText={setAssignment}
              placeholder="0 - 10"
            />

            <Text style={styles.label}>Điểm giữa kỳ (30%)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={midterm}
              onChangeText={setMidterm}
              placeholder="0 - 10"
            />

            <Text style={styles.label}>Điểm cuối kỳ (40%)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={finalScore}
              onChangeText={setFinalScore}
              placeholder="0 - 10"
            />

            <Text style={styles.preview}>Tổng dự kiến: {calcTotal()}</Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.btnCancel}
                onPress={() => setEditItem(null)}>
                <Text style={styles.btnCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnSave}
                onPress={saveGrade}
                disabled={saving}>
                <Text style={styles.btnSaveText}>
                  {saving ? "Đang lưu..." : "Lưu điểm"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Grades;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc", padding: 16 },
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
    marginBottom: 14,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  classCode: { fontSize: 16, fontWeight: "700", color: "#0f172a" },
  meta: { fontSize: 13, color: "#64748b", marginTop: 2 },
  link: { marginTop: 8, color: "#2563eb", fontWeight: "600" },
  empty: { textAlign: "center", color: "#94a3b8", marginTop: 40 },
  toolbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  back: { color: "#2563eb", fontWeight: "700", fontSize: 15 },
  approveAll: { color: "#059669", fontWeight: "700", fontSize: 15 },
  gradeCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    flexDirection: "row",
    gap: 10,
  },
  studentName: { fontSize: 15, fontWeight: "700", color: "#0f172a" },
  scoreLine: { fontSize: 13, color: "#64748b", marginTop: 4 },
  total: { fontSize: 14, fontWeight: "700", color: "#1e293b", marginTop: 4 },
  status: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  actions: { justifyContent: "center", gap: 8 },
  btnEdit: {
    backgroundColor: "#e2e8f0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  btnEditText: { fontWeight: "700", color: "#1e293b" },
  btnApprove: {
    backgroundColor: "#dcfce7",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  btnApproveText: { fontWeight: "700", color: "#059669" },
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
    marginBottom: 14,
  },
  label: { fontSize: 13, color: "#64748b", marginBottom: 6, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#0f172a",
  },
  preview: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: "700",
    color: "#2563eb",
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
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
