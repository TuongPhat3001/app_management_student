import apiClient from "@/src/api/axios";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
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

type ReasonCode = "all" | "unexcused" | "absence_limit" | "failed_course";

type Candidate = {
  enrollmentId: number;
  studentId: number;
  studentCode: string;
  studentName: string;
  classId: number;
  classCode: string;
  courseName: string;
  semesterName: string;
  unexcused: number;
  missed: number;
  totalLessons: number;
  score?: number;
  reasons: string[];
};

type SavedWarning = {
  id: number;
  studentName: string;
  studentCode: string;
  semester: string;
  gpa: number;
  failedCourses: number;
  reason: string;
  status: string;
};

type SemesterItem = { id: number; name: string };
type ClassItem = { id: number; code: string };

const REASON_OPTS: { key: ReasonCode; label: string }[] = [
  { key: "all", label: "Tất cả lý do" },
  { key: "unexcused", label: "Nghỉ không phép" },
  { key: "absence_limit", label: "Nghỉ quá 25%" },
  { key: "failed_course", label: "Rớt môn (<40)" },
];

const reasonLabel = (code: string) => {
  switch (code) {
    case "unexcused":
      return "Nghỉ không phép";
    case "absence_limit":
      return "Nghỉ quá quy định";
    case "failed_course":
      return "Rớt môn";
    default:
      return code;
  }
};

export default function AcademicWarnings() {
  const router = useRouter();
  const [tab, setTab] = useState<"candidates" | "saved">("candidates");

  const [semesters, setSemesters] = useState<SemesterItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [semesterId, setSemesterId] = useState<number | null>(null);
  const [classId, setClassId] = useState<number | null>(null);
  const [reason, setReason] = useState<ReasonCode>("all");

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [saved, setSaved] = useState<SavedWarning[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingCand, setLoadingCand] = useState(false);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [showGpaGen, setShowGpaGen] = useState(false);
  const [minGpa, setMinGpa] = useState("2.0");
  const [maxFailed, setMaxFailed] = useState("2");
  const [generating, setGenerating] = useState(false);

  const mapCandidate = (r: any): Candidate | null => {
    const enrollmentId = Number(r.enrollmentId ?? r.EnrollmentID ?? r.id);
    if (!enrollmentId) return null;
    const reasons = Array.isArray(r.reasons ?? r.Reasons)
      ? (r.reasons ?? r.Reasons).map(String)
      : [];
    const scoreRaw = r.score ?? r.Score;
    return {
      enrollmentId,
      studentId: Number(r.studentId ?? r.StudentID ?? 0),
      studentCode: String(r.studentCode ?? r.StudentCode ?? ""),
      studentName: String(r.studentName ?? r.StudentName ?? "SV"),
      classId: Number(r.classId ?? r.ClassID ?? 0),
      classCode: String(r.classCode ?? r.ClassCode ?? ""),
      courseName: String(r.courseName ?? r.CourseName ?? ""),
      semesterName: String(r.semesterName ?? r.SemesterName ?? ""),
      unexcused: Number(r.unexcused ?? r.Unexcused ?? 0),
      missed: Number(r.missed ?? r.Missed ?? 0),
      totalLessons: Number(r.totalLessons ?? r.TotalLessons ?? 0),
      score:
        scoreRaw === null || scoreRaw === undefined
          ? undefined
          : Number(scoreRaw),
      reasons,
    };
  };

  const loadMeta = useCallback(async () => {
    try {
      let sList: SemesterItem[] = [];
      try {
        const sRes = await apiClient.get("/semesters");
        const raw = sRes.data?.data ?? sRes.data ?? [];
        sList = (Array.isArray(raw) ? raw : [])
          .map((s: any) => ({
            id: Number(s.ID ?? s.id),
            name: String(
              s.Name ?? s.name ?? s.Code ?? s.code ?? `HK ${s.ID ?? s.id}`,
            ),
          }))
          .filter((s: SemesterItem) => s.id > 0);
      } catch {
        const mRes = await apiClient.get("/metadata");
        const raw = mRes.data?.data?.semesters ?? mRes.data?.semesters ?? [];
        sList = (Array.isArray(raw) ? raw : [])
          .map((s: any) => ({
            id: Number(s.ID ?? s.id),
            name: String(s.Name ?? s.name ?? s.Code ?? s.code ?? ""),
          }))
          .filter((s: SemesterItem) => s.id > 0);
      }
      setSemesters(sList);
      if (!semesterId && sList[0]) setSemesterId(sList[0].id);

      try {
        const cRes = await apiClient.get("/classes");
        const raw = cRes.data?.data ?? cRes.data ?? [];
        setClasses(
          (Array.isArray(raw) ? raw : [])
            .map((c: any) => ({
              id: Number(c.ID ?? c.id),
              code: String(c.ClassCode ?? c.classCode ?? c.code ?? ""),
            }))
            .filter((c: ClassItem) => c.id > 0),
        );
      } catch {
        setClasses([]);
      }
    } catch (e) {
      console.log("meta", e);
    }
  }, [semesterId]);

  const loadSaved = useCallback(async () => {
    try {
      const res = await apiClient.get("/academic-warnings");
      const raw = res.data?.data ?? res.data ?? [];
      setSaved(
        (Array.isArray(raw) ? raw : [])
          .map((w: any) => {
            const id = Number(w.ID ?? w.id);
            if (!id) return null;
            const st = w.Student ?? w.student ?? {};
            const user = st.User ?? st.user ?? {};
            const sem = w.Semester ?? w.semester ?? {};
            return {
              id,
              studentName: String(user.FullName ?? user.fullName ?? "SV"),
              studentCode: String(st.StudentCode ?? st.studentCode ?? ""),
              semester: String(sem.Name ?? sem.name ?? sem.Code ?? ""),
              gpa: Number(w.GPA ?? w.gpa ?? 0),
              failedCourses: Number(w.FailedCourses ?? w.failedCourses ?? 0),
              reason: String(w.Reason ?? w.reason ?? ""),
              status: String(w.Status ?? w.status ?? "active"),
            };
          })
          .filter(Boolean) as SavedWarning[],
      );
    } catch {
      setSaved([]);
    }
  }, []);

  const loadCandidates = useCallback(async () => {
    if (!semesterId) {
      setCandidates([]);
      return;
    }
    setLoadingCand(true);
    try {
      const params: any = { semesterId };
      if (classId) params.classId = classId;
      let res;
      try {
        res = await apiClient.get("/academic-warnings/candidates", {
          params,
        });
      } catch {
        res = await apiClient.get("/academic-warning-candidates", {
          params,
        });
      }
      const raw = res.data?.data ?? res.data ?? [];
      const list = (Array.isArray(raw) ? raw : [])
        .map(mapCandidate)
        .filter(Boolean) as Candidate[];
      setCandidates(list);
      setSelected(new Set());
    } catch (e: any) {
      console.log("candidates", e?.response?.data || e);
      setCandidates([]);
      Alert.alert(
        "Lỗi",
        e?.response?.data?.message ||
          "Không tải được danh sách vi phạm. Kiểm tra học kỳ.",
      );
    } finally {
      setLoadingCand(false);
    }
  }, [semesterId, classId]);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        setLoading(true);
        await loadMeta();
        await loadSaved();
        if (alive) setLoading(false);
      })();
      return () => {
        alive = false;
      };
    }, [loadMeta, loadSaved]),
  );

  const filtered = useMemo(() => {
    if (reason === "all") return candidates;
    return candidates.filter((c) => c.reasons.includes(reason));
  }, [candidates, reason]);

  const toggleOne = (enrollmentId: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(enrollmentId)) next.delete(enrollmentId);
      else next.add(enrollmentId);
      return next;
    });
  };

  const toggleAllFiltered = () => {
    const ids = filtered.map((c) => c.enrollmentId);
    const allOn = ids.every((id) => selected.has(id));
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOn) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  };

  const onSend = async (sendAll: boolean) => {
    if (!semesterId) {
      Alert.alert("Thiếu học kỳ", "Chọn học kỳ trước khi gửi.");
      return;
    }
    const ids = sendAll ? filtered.map((c) => c.enrollmentId) : [...selected];
    if (!sendAll && ids.length === 0) {
      Alert.alert("Chưa chọn", "Chọn ít nhất một dòng vi phạm để gửi.");
      return;
    }
    if (filtered.length === 0) {
      Alert.alert("Trống", "Không có sinh viên phù hợp với bộ lọc hiện tại.");
      return;
    }

    Alert.alert(
      "Gửi cảnh báo học vụ",
      sendAll
        ? `Gửi cho tất cả ${filtered.length} dòng đang lọc?`
        : `Gửi cho ${ids.length} dòng đã chọn?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Gửi",
          onPress: async () => {
            try {
              setSending(true);
              const body: any = {
                semesterId,
                reason,
                all: sendAll,
              };
              if (classId) body.classId = classId;
              if (!sendAll) body.enrollmentIds = ids;

              let res;
              try {
                res = await apiClient.post("/academic-warnings/send", body);
              } catch (e1: any) {
                if (e1?.response?.status === 404) {
                  res = await apiClient.post(
                    "/academic-warnings/deliver",
                    body,
                  );
                } else throw e1;
              }
              Alert.alert(
                "Thành công",
                res.data?.message ||
                  `Đã gửi cảnh báo cho ${res.data?.count ?? ""} sinh viên.`,
              );
              setSelected(new Set());
            } catch (e: any) {
              Alert.alert(
                "Lỗi",
                e?.response?.data?.message ||
                  "Gửi cảnh báo thất bại. Tải lại danh sách rồi thử lại.",
              );
            } finally {
              setSending(false);
            }
          },
        },
      ],
    );
  };

  const onGenerateGpa = async () => {
    if (!semesterId) {
      Alert.alert("Thiếu học kỳ", "Chọn học kỳ.");
      return;
    }
    try {
      setGenerating(true);
      const res = await apiClient.post("/academic-warnings/generate", {
        semesterId,
        minGpa: parseFloat(minGpa) || 2.0,
        maxFailedCourses: parseInt(maxFailed, 10) || 2,
      });
      Alert.alert(
        "Thành công",
        res.data?.message ||
          `Đã tạo/cập nhật ${res.data?.count ?? 0} cảnh báo GPA.`,
      );
      setShowGpaGen(false);
      loadSaved();
    } catch (e: any) {
      Alert.alert(
        "Lỗi",
        e?.response?.data?.message || "Không tạo được cảnh báo GPA.",
      );
    } finally {
      setGenerating(false);
    }
  };

  const onDeleteSaved = (item: SavedWarning) => {
    Alert.alert("Xóa", `Xóa cảnh báo GPA của ${item.studentName}?`, [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            await apiClient.delete(`/academic-warnings/${item.id}`);
            setSaved((p) => p.filter((x) => x.id !== item.id));
          } catch (e: any) {
            Alert.alert("Lỗi", e?.response?.data?.message || "Xóa thất bại.");
          }
        },
      },
    ]);
  };

  const renderCandidate = ({ item }: { item: Candidate }) => {
    const on = selected.has(item.enrollmentId);
    return (
      <TouchableOpacity
        style={[styles.card, on && styles.cardOn]}
        activeOpacity={0.8}
        onPress={() => toggleOne(item.enrollmentId)}>
        <View style={[styles.check, on && styles.checkOn]}>
          {on && <Ionicons name="checkmark" size={14} color="#FFF" />}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>
            {item.studentName}{" "}
            <Text style={styles.code}>({item.studentCode})</Text>
          </Text>
          <Text style={styles.meta}>
            Lớp {item.classCode || "—"} · {item.courseName || "—"}
          </Text>
          <Text style={styles.meta}>
            Nghỉ KP: {item.unexcused} · Tổng nghỉ: {item.missed}/
            {item.totalLessons || "?"}
            {item.score != null ? ` · Điểm: ${item.score}` : ""}
          </Text>
          <View style={styles.reasonRow}>
            {item.reasons.map((r) => (
              <View key={r} style={styles.reasonChip}>
                <Text style={styles.reasonChipText}>{reasonLabel(r)}</Text>
              </View>
            ))}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.title}>Cảnh báo học vụ</Text>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => setShowGpaGen(true)}>
          <Ionicons name="calculator-outline" size={22} color="#5B5BD6" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === "candidates" && styles.tabOn]}
          onPress={() => setTab("candidates")}>
          <Text
            style={[styles.tabText, tab === "candidates" && styles.tabTextOn]}>
            Vi phạm & gửi TB
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === "saved" && styles.tabOn]}
          onPress={() => {
            setTab("saved");
            loadSaved();
          }}>
          <Text style={[styles.tabText, tab === "saved" && styles.tabTextOn]}>
            Cảnh báo GPA ({saved.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator
          style={{ marginTop: 40 }}
          color="#5B5BD6"
          size="large"
        />
      ) : tab === "candidates" ? (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterBar}
            contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}>
            {semesters.map((s) => (
              <TouchableOpacity
                key={s.id}
                style={[styles.chip, semesterId === s.id && styles.chipOn]}
                onPress={() => setSemesterId(s.id)}>
                <Text
                  style={[
                    styles.chipText,
                    semesterId === s.id && styles.chipTextOn,
                  ]}>
                  {s.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterBar}
            contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}>
            <TouchableOpacity
              style={[styles.chip, !classId && styles.chipOn]}
              onPress={() => setClassId(null)}>
              <Text style={[styles.chipText, !classId && styles.chipTextOn]}>
                Tất cả lớp
              </Text>
            </TouchableOpacity>
            {classes.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={[styles.chip, classId === c.id && styles.chipOn]}
                onPress={() => setClassId(c.id)}>
                <Text
                  style={[
                    styles.chipText,
                    classId === c.id && styles.chipTextOn,
                  ]}>
                  {c.code || `Lớp ${c.id}`}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterBar}
            contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}>
            {REASON_OPTS.map((r) => (
              <TouchableOpacity
                key={r.key}
                style={[styles.chip, reason === r.key && styles.chipOn]}
                onPress={() => setReason(r.key)}>
                <Text
                  style={[
                    styles.chipText,
                    reason === r.key && styles.chipTextOn,
                  ]}>
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.toolbar}>
            <TouchableOpacity
              style={styles.loadBtn}
              onPress={loadCandidates}
              disabled={!semesterId || loadingCand}>
              {loadingCand ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.loadBtnText}>Tải danh sách vi phạm</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleAllFiltered} hitSlop={8}>
              <Text style={styles.selectAll}>
                {filtered.length > 0 &&
                filtered.every((c) => selected.has(c.enrollmentId))
                  ? "Bỏ chọn"
                  : "Chọn tất cả"}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.count}>
            {filtered.length} vi phạm · đã chọn {selected.size}
          </Text>

          <FlatList
            data={filtered}
            keyExtractor={(i) => String(i.enrollmentId)}
            renderItem={renderCandidate}
            contentContainerStyle={{ padding: 14, paddingBottom: 100 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={async () => {
                  setRefreshing(true);
                  await loadCandidates();
                  setRefreshing(false);
                }}
                colors={["#5B5BD6"]}
              />
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={48}
                  color="#D1D5DB"
                />
                <Text style={styles.emptyText}>
                  {semesterId
                    ? "Chưa có vi phạm — bấm «Tải danh sách vi phạm»"
                    : "Chọn học kỳ trước"}
                </Text>
              </View>
            }
          />

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.sendBtn, styles.sendBtnOutline]}
              onPress={() => onSend(true)}
              disabled={sending || filtered.length === 0}>
              <Text style={styles.sendBtnOutlineText}>Gửi tất cả (lọc)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sendBtn}
              onPress={() => onSend(false)}
              disabled={sending || selected.size === 0}>
              {sending ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.sendBtnText}>
                  Gửi đã chọn ({selected.size})
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <FlatList
          data={saved}
          keyExtractor={(i) => String(i.id)}
          contentContainerStyle={{ padding: 14, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                await loadSaved();
                setRefreshing(false);
              }}
              colors={["#5B5BD6"]}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="document-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>
                Chưa có cảnh báo GPA. Bấm icon máy tính góc trên để tạo.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.studentName}</Text>
                <Text style={styles.meta}>
                  {item.studentCode} · {item.semester || "—"}
                </Text>
                <Text style={styles.meta}>
                  GPA: {item.gpa.toFixed(2)} · Môn trượt: {item.failedCourses}
                </Text>
                {!!item.reason && (
                  <Text style={styles.reasonText}>{item.reason}</Text>
                )}
              </View>
              <TouchableOpacity onPress={() => onDeleteSaved(item)} hitSlop={8}>
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      <Modal visible={showGpaGen} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Tạo cảnh báo theo GPA</Text>
            <Text style={styles.hint}>
              API generate: GPA &lt; ngưỡng hoặc số môn không đạt vượt mức.
            </Text>
            <Text style={styles.label}>Học kỳ đang chọn</Text>
            <Text style={styles.meta}>
              {semesters.find((s) => s.id === semesterId)?.name ||
                "Chưa chọn — chọn ở tab Vi phạm trước"}
            </Text>
            <Text style={[styles.label, { marginTop: 12 }]}>GPA tối thiểu</Text>
            <TextInput
              style={styles.input}
              value={minGpa}
              onChangeText={setMinGpa}
              keyboardType="decimal-pad"
            />
            <Text style={styles.label}>Số môn trượt tối đa</Text>
            <TextInput
              style={styles.input}
              value={maxFailed}
              onChangeText={setMaxFailed}
              keyboardType="number-pad"
            />
            <TouchableOpacity
              style={styles.sendBtn}
              onPress={onGenerateGpa}
              disabled={generating}>
              {generating ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.sendBtnText}>Tạo cảnh báo GPA</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowGpaGen(false)}>
              <Text style={styles.cancel}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F3EEFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  iconBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  title: { flex: 1, textAlign: "center", fontSize: 17, fontWeight: "700" },
  tabs: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    paddingHorizontal: 12,
    paddingBottom: 10,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
  },
  tabOn: { backgroundColor: "#5B5BD6" },
  tabText: { fontSize: 13, fontWeight: "700", color: "#6B7280" },
  tabTextOn: { color: "#FFF" },
  filterBar: { maxHeight: 44, marginTop: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  chipOn: { backgroundColor: "#5B5BD6", borderColor: "#5B5BD6" },
  chipText: { fontSize: 12, fontWeight: "600", color: "#374151" },
  chipTextOn: { color: "#FFF" },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    marginTop: 10,
  },
  loadBtn: {
    backgroundColor: "#0F172A",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  loadBtnText: { color: "#FFF", fontWeight: "700", fontSize: 13 },
  selectAll: { color: "#5B5BD6", fontWeight: "700", fontSize: 13 },
  count: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    color: "#6B7280",
    fontWeight: "600",
    fontSize: 12,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    gap: 12,
    alignItems: "flex-start",
  },
  cardOn: { borderColor: "#5B5BD6", backgroundColor: "#F5F3FF" },
  check: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  checkOn: { backgroundColor: "#5B5BD6", borderColor: "#5B5BD6" },
  name: { fontSize: 15, fontWeight: "700", color: "#1A1A1A" },
  code: { fontWeight: "600", color: "#6B7280", fontSize: 13 },
  meta: { fontSize: 12, color: "#6B7280", marginTop: 3 },
  reasonRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  reasonChip: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  reasonChipText: { color: "#DC2626", fontSize: 11, fontWeight: "700" },
  reasonText: { fontSize: 12, color: "#6B7280", marginTop: 6 },
  empty: {
    alignItems: "center",
    paddingTop: 48,
    gap: 8,
    paddingHorizontal: 24,
  },
  emptyText: {
    fontWeight: "600",
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    gap: 10,
    padding: 14,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  sendBtn: {
    flex: 1,
    backgroundColor: "#5B5BD6",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  sendBtnText: { color: "#FFF", fontWeight: "700", fontSize: 14 },
  sendBtnOutline: {
    backgroundColor: "#FFF",
    borderWidth: 1.5,
    borderColor: "#5B5BD6",
  },
  sendBtnOutlineText: { color: "#5B5BD6", fontWeight: "700", fontSize: 14 },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
  },
  modalTitle: { fontSize: 18, fontWeight: "800", marginBottom: 8 },
  hint: { fontSize: 12, color: "#6B7280", marginBottom: 12, lineHeight: 18 },
  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    fontSize: 15,
  },
  cancel: {
    textAlign: "center",
    color: "#6B7280",
    fontWeight: "600",
    marginTop: 14,
  },
});
