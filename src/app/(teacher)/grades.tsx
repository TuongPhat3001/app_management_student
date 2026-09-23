import api from "@/src/api/axios";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ClassItem = {
  id: number;
  classCode: string;
  courseNames: string;
};

type GradeRow = {
  enrollmentId: number;
  gradeId?: number;
  studentCode: string;
  studentName: string;
  courseCode: string;
  courseName: string;
  assignmentScore?: number;
  midtermScore?: number;
  finalScore?: number;
  totalScore?: number;
  gradeLetter?: string;
  status: string;
  remark?: string;
};

/**
 * Backend:
 * GET  /teacher/classes          → ListTeacherClasses
 * GET  /classes/:id/grades       → enrollments + Grade nested
 * POST /grades                   → UpsertGrade { enrollmentId, assignmentScore, midtermScore, finalScore, remark }
 * PUT  /grades/:id               → UpdateGrade
 * POST /grades/:id/approve
 * POST /classes/:id/grades/approve
 * Thang điểm: 0–100 (BT 30% + GK 30% + CK 40%)
 */
const Grades = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedClassCode, setSelectedClassCode] = useState("");
  const [rows, setRows] = useState<GradeRow[]>([]);
  const [loadingGrades, setLoadingGrades] = useState(false);

  const [editItem, setEditItem] = useState<GradeRow | null>(null);
  const [assignment, setAssignment] = useState("");
  const [midterm, setMidterm] = useState("");
  const [finalScore, setFinalScore] = useState("");
  const [remark, setRemark] = useState("");
  const [saving, setSaving] = useState(false);

  const loadClasses = useCallback(async () => {
    try {
      const res = await api.get("/teacher/classes");
      const raw = res.data?.data ?? res.data ?? [];
      const list = (Array.isArray(raw) ? raw : [])
        .map((c: any) => {
          const id = Number(c.ID ?? c.id);
          const offerings = c.CourseOfferings ?? c.courseOfferings ?? [];
          const names = (Array.isArray(offerings) ? offerings : [])
            .map(
              (o: any) =>
                o.Course?.Name ??
                o.Course?.name ??
                o.course?.name ??
                o.courseName ??
                "",
            )
            .filter(Boolean)
            .join(", ");
          return {
            id,
            classCode: String(c.ClassCode ?? c.classCode ?? `Lớp #${id}`),
            courseNames: names || "Học phần",
          };
        })
        .filter((c: ClassItem) => c.id > 0);
      setClasses(list);
    } catch (e: any) {
      console.log("teacher classes", e?.response?.data || e);
      setClasses([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  const mapEnrollment = (e: any): GradeRow | null => {
    const enrollmentId = Number(e.ID ?? e.id);
    if (!enrollmentId) return null;
    const student = e.Student ?? e.student ?? {};
    const user = student.User ?? student.user ?? {};
    const course = e.Course ?? e.course ?? {};
    const grade = e.Grade ?? e.grade ?? null;

    const gradeId = grade
      ? Number(grade.ID ?? grade.id) || undefined
      : undefined;

    return {
      enrollmentId,
      gradeId: gradeId && gradeId > 0 ? gradeId : undefined,
      studentCode: String(
        student.StudentCode ??
          student.studentCode ??
          student.student_code ??
          "",
      ),
      studentName: String(
        user.FullName ?? user.fullName ?? user.full_name ?? "Sinh viên",
      ),
      courseCode: String(course.Code ?? course.code ?? ""),
      courseName: String(course.Name ?? course.name ?? "Môn học"),
      assignmentScore:
        grade != null
          ? Number(grade.AssignmentScore ?? grade.assignmentScore)
          : undefined,
      midtermScore:
        grade != null
          ? Number(grade.MidtermScore ?? grade.midtermScore)
          : undefined,
      finalScore:
        grade != null
          ? Number(grade.FinalScore ?? grade.finalScore)
          : undefined,
      totalScore:
        grade != null
          ? Number(
              grade.TotalScore ??
                grade.totalScore ??
                grade.Score ??
                grade.score,
            )
          : undefined,
      gradeLetter: grade
        ? String(
            grade.GradeLetter ??
              grade.gradeLetter ??
              grade.LetterGrade ??
              grade.letterGrade ??
              "",
          ) || undefined
        : undefined,
      status: grade
        ? String(grade.Status ?? grade.status ?? "Draft")
        : "Chưa nhập",
      remark: grade ? String(grade.Remark ?? grade.remark ?? "") : undefined,
    };
  };

  const loadGrades = async (classId: number, classCode?: string) => {
    setSelectedClassId(classId);
    if (classCode) setSelectedClassCode(classCode);
    setLoadingGrades(true);
    try {
      const res = await api.get(`/classes/${classId}/grades`);
      const raw = res.data?.data ?? res.data ?? [];
      const mapped = (Array.isArray(raw) ? raw : [])
        .map(mapEnrollment)
        .filter(Boolean) as GradeRow[];
      setRows(mapped);
    } catch (e: any) {
      console.log("class grades", e?.response?.data || e);
      setRows([]);
      Alert.alert(
        "Lỗi",
        e?.response?.data?.message || "Không tải được bảng điểm lớp",
      );
    } finally {
      setLoadingGrades(false);
    }
  };

  const openEdit = (item: GradeRow) => {
    if (item.status === "Approved") {
      Alert.alert("Thông báo", "Điểm đã duyệt — không thể sửa.");
      return;
    }
    setEditItem(item);
    setAssignment(
      item.assignmentScore != null && !isNaN(item.assignmentScore)
        ? String(item.assignmentScore)
        : "",
    );
    setMidterm(
      item.midtermScore != null && !isNaN(item.midtermScore)
        ? String(item.midtermScore)
        : "",
    );
    setFinalScore(
      item.finalScore != null && !isNaN(item.finalScore)
        ? String(item.finalScore)
        : "",
    );
    setRemark(item.remark || "");
  };

  const parseScore = (s: string) => {
    const n = parseFloat(s.replace(",", "."));
    return isNaN(n) ? 0 : n;
  };

  const calcTotal = () => {
    const a = parseScore(assignment);
    const m = parseScore(midterm);
    const f = parseScore(finalScore);
    return Math.round((a * 0.3 + m * 0.3 + f * 0.4) * 100) / 100;
  };

  const saveGrade = async () => {
    if (!editItem) return;
    const a = parseScore(assignment);
    const m = parseScore(midterm);
    const f = parseScore(finalScore);
    if ([a, m, f].some((x) => x < 0 || x > 100)) {
      Alert.alert("Lỗi", "Điểm phải từ 0 đến 100.");
      return;
    }
    setSaving(true);
    try {
      const body = {
        enrollmentId: editItem.enrollmentId,
        assignmentScore: a,
        midtermScore: m,
        finalScore: f,
        remark: remark.trim(),
      };

      if (editItem.gradeId) {
        await api.put(`/grades/${editItem.gradeId}`, body);
      } else {
        await api.post("/grades", body);
      }

      Alert.alert("Thành công", "Đã lưu điểm (trạng thái Draft).");
      setEditItem(null);
      if (selectedClassId) loadGrades(selectedClassId);
    } catch (err: any) {
      const d = err?.response?.data;
      Alert.alert(
        "Lỗi",
        [d?.message, d?.error].filter(Boolean).join("\n") ||
          "Không lưu được điểm",
      );
    } finally {
      setSaving(false);
    }
  };

  const approveGrade = async (gradeId?: number) => {
    if (!gradeId) {
      Alert.alert("Thông báo", "Chưa có điểm để duyệt — hãy lưu điểm trước.");
      return;
    }
    try {
      await api.post(`/grades/${gradeId}/approve`);
      Alert.alert("Thành công", "Đã duyệt điểm.");
      if (selectedClassId) loadGrades(selectedClassId);
    } catch (err: any) {
      Alert.alert(
        "Lỗi",
        err?.response?.data?.message || "Không duyệt được điểm",
      );
    }
  };

  const approveAll = () => {
    if (!selectedClassId) return;
    Alert.alert("Duyệt cả lớp", "Duyệt tất cả điểm Draft của lớp này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Duyệt",
        onPress: async () => {
          try {
            await api.post(`/classes/${selectedClassId}/grades/approve`);
            Alert.alert("Thành công", "Đã duyệt điểm cả lớp.");
            loadGrades(selectedClassId);
          } catch (err: any) {
            Alert.alert(
              "Lỗi",
              err?.response?.data?.message || "Không duyệt được",
            );
          }
        },
      },
    ]);
  };

  const fmt = (v?: number) =>
    v != null && !isNaN(v) ? String(Math.round(v * 100) / 100) : "—";

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" />
      <Text style={styles.title}>
        {selectedClassId
          ? `Điểm · ${selectedClassCode || `Lớp #${selectedClassId}`}`
          : "Nhập điểm"}
      </Text>
      <Text style={styles.hint}>
        Thang 0–100 · Tổng = BT×30% + GK×30% + CK×40%
      </Text>

      {!selectedClassId ? (
        <FlatList
          data={classes}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadClasses();
              }}
              colors={["#2563EB"]}
            />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>
              Không có lớp đang phụ trách (course offering open).
            </Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => loadGrades(item.id, item.classCode)}
              activeOpacity={0.85}>
              <View style={styles.cardIcon}>
                <Ionicons name="school-outline" size={22} color="#2563EB" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.classCode}>{item.classCode}</Text>
                <Text style={styles.meta} numberOfLines={2}>
                  {item.courseNames}
                </Text>
                <Text style={styles.link}>Xem / nhập điểm ›</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      ) : (
        <>
          <View style={styles.toolbar}>
            <TouchableOpacity
              onPress={() => {
                setSelectedClassId(null);
                setRows([]);
              }}
              style={styles.backBtn}>
              <Ionicons name="chevron-back" size={20} color="#2563EB" />
              <Text style={styles.back}>Danh sách lớp</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={approveAll}>
              <Text style={styles.approveAll}>Duyệt cả lớp</Text>
            </TouchableOpacity>
          </View>

          {loadingGrades ? (
            <ActivityIndicator style={{ marginTop: 40 }} color="#2563EB" />
          ) : (
            <FlatList
              data={rows}
              keyExtractor={(item) => String(item.enrollmentId)}
              contentContainerStyle={{ paddingBottom: 40 }}
              ListEmptyComponent={
                <Text style={styles.empty}>
                  Lớp chưa có sinh viên đăng ký học phần.
                </Text>
              }
              renderItem={({ item }) => (
                <View style={styles.gradeCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.studentName}>{item.studentName}</Text>
                    <Text style={styles.meta}>
                      {item.studentCode}
                      {item.courseCode ? ` · ${item.courseCode}` : ""}
                    </Text>
                    {!!item.courseName && (
                      <Text style={styles.meta}>{item.courseName}</Text>
                    )}
                    <Text style={styles.scoreLine}>
                      BT: {fmt(item.assignmentScore)} · GK:{" "}
                      {fmt(item.midtermScore)} · CK: {fmt(item.finalScore)}
                    </Text>
                    <Text style={styles.total}>
                      Tổng: {fmt(item.totalScore)}
                      {item.gradeLetter ? ` (${item.gradeLetter})` : ""}
                    </Text>
                    <Text
                      style={[
                        styles.status,
                        item.status === "Approved" && styles.statusOk,
                      ]}>
                      {item.status}
                    </Text>
                  </View>
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={styles.btnEdit}
                      onPress={() => openEdit(item)}>
                      <Text style={styles.btnEditText}>
                        {item.gradeId ? "Sửa" : "Nhập"}
                      </Text>
                    </TouchableOpacity>
                    {item.gradeId && item.status !== "Approved" && (
                      <TouchableOpacity
                        style={styles.btnApprove}
                        onPress={() => approveGrade(item.gradeId)}>
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

      <Modal visible={!!editItem} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              Nhập điểm — {editItem?.studentName || ""}
            </Text>
            {!!editItem?.courseName && (
              <Text style={styles.meta}>{editItem.courseName}</Text>
            )}

            <Text style={styles.label}>Điểm bài tập (30%) · 0–100</Text>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              value={assignment}
              onChangeText={setAssignment}
              placeholder="0 - 100"
              placeholderTextColor="#94A3B8"
            />

            <Text style={styles.label}>Điểm giữa kỳ (30%) · 0–100</Text>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              value={midterm}
              onChangeText={setMidterm}
              placeholder="0 - 100"
              placeholderTextColor="#94A3B8"
            />

            <Text style={styles.label}>Điểm cuối kỳ (40%) · 0–100</Text>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              value={finalScore}
              onChangeText={setFinalScore}
              placeholder="0 - 100"
              placeholderTextColor="#94A3B8"
            />

            <Text style={styles.label}>Ghi chú (tuỳ chọn)</Text>
            <TextInput
              style={styles.input}
              value={remark}
              onChangeText={setRemark}
              placeholder="Nhận xét..."
              placeholderTextColor="#94A3B8"
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
    </SafeAreaView>
  );
};

export default Grades;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC", paddingHorizontal: 16 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 8,
    marginBottom: 4,
  },
  hint: { fontSize: 12, color: "#94A3B8", marginBottom: 14 },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  classCode: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
  meta: { fontSize: 13, color: "#64748B", marginTop: 2 },
  link: { marginTop: 6, color: "#2563EB", fontWeight: "600" },
  empty: {
    textAlign: "center",
    color: "#94A3B8",
    marginTop: 40,
    paddingHorizontal: 20,
  },
  toolbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  backBtn: { flexDirection: "row", alignItems: "center" },
  back: { color: "#2563EB", fontWeight: "700", fontSize: 15 },
  approveAll: { color: "#059669", fontWeight: "700", fontSize: 15 },
  gradeCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    gap: 10,
  },
  studentName: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  scoreLine: { fontSize: 13, color: "#64748B", marginTop: 4 },
  total: { fontSize: 14, fontWeight: "700", color: "#1E293B", marginTop: 4 },
  status: { fontSize: 12, color: "#94A3B8", marginTop: 2 },
  statusOk: { color: "#059669", fontWeight: "700" },
  actions: { justifyContent: "center", gap: 8 },
  btnEdit: {
    backgroundColor: "#E2E8F0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  btnEditText: { fontWeight: "700", color: "#1E293B" },
  btnApprove: {
    backgroundColor: "#DCFCE7",
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
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 4,
  },
  label: { fontSize: 13, color: "#64748B", marginBottom: 6, marginTop: 10 },
  input: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#0F172A",
  },
  preview: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: "700",
    color: "#2563EB",
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  btnCancel: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  btnCancelText: { fontWeight: "700", color: "#475569" },
  btnSave: {
    flex: 1,
    backgroundColor: "#2563EB",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  btnSaveText: { fontWeight: "700", color: "#FFF" },
});
