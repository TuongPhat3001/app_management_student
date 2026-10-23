import apiClient from "@/src/api/axios";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export type StudentProfile = {
  id: number;
  studentCode: string;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  address: string;
  gender: string;
  dateOfBirth: string;
  status: string;
  classCode: string;
  classId?: number;
  enrollmentDate: string;
};

export type LearningRow = {
  id: number;
  courseCode: string;
  courseName: string;
  classCode: string;
  status: string;
  totalScore?: number;
  gradeLetter?: string;
  assignmentScore?: number;
  midtermScore?: number;
  finalScore?: number;
  semester?: string;
};

function pick(obj: any, ...keys: string[]) {
  for (const k of keys) {
    if (obj?.[k] != null && obj[k] !== "") return obj[k];
  }
  return undefined;
}

function formatDate(raw?: any) {
  if (!raw) return "—";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return String(raw);
  return d.toLocaleDateString("vi-VN");
}

function mapStudent(raw: any): StudentProfile | null {
  if (!raw) return null;
  const id = Number(raw.ID ?? raw.id);
  if (!id) return null;
  const user = raw.User ?? raw.user ?? {};
  const cls = raw.Class ?? raw.class ?? {};
  return {
    id,
    studentCode: String(
      pick(raw, "StudentCode", "studentCode", "student_code") ?? "",
    ),
    fullName: String(
      pick(user, "FullName", "fullName", "full_name") ??
        pick(raw, "fullName", "FullName") ??
        "Sinh viên",
    ),
    username: String(pick(user, "Username", "username") ?? ""),
    email: String(pick(user, "Email", "email") ?? ""),
    phone: String(
      pick(raw, "Phone", "phone") ?? pick(user, "Phone", "phone") ?? "",
    ),
    address: String(pick(raw, "Address", "address") ?? ""),
    gender: String(pick(raw, "Gender", "gender") ?? ""),
    dateOfBirth: formatDate(
      pick(raw, "DateOfBirth", "dateOfBirth", "date_of_birth"),
    ),
    status: String(pick(raw, "Status", "status") ?? "active"),
    classCode: String(pick(cls, "ClassCode", "classCode", "class_code") ?? ""),
    classId: Number(cls.ID ?? cls.id) || undefined,
    enrollmentDate: formatDate(
      pick(raw, "EnrollmentDate", "enrollmentDate", "enrollment_date"),
    ),
  };
}

function mapLearning(raw: any): LearningRow | null {
  const id = Number(raw.ID ?? raw.id);
  if (!id) return null;
  const course = raw.Course ?? raw.course ?? {};
  const cls = raw.Class ?? raw.class ?? {};
  const grade = raw.Grade ?? raw.grade ?? null;
  const offering = raw.CourseOffering ?? raw.courseOffering ?? {};
  const semester = offering.Semester ?? offering.semester ?? {};
  return {
    id,
    courseCode: String(pick(course, "Code", "code") ?? ""),
    courseName: String(pick(course, "Name", "name") ?? "Môn học"),
    classCode: String(pick(cls, "ClassCode", "classCode") ?? ""),
    status: String(pick(raw, "Status", "status") ?? ""),
    totalScore:
      grade != null
        ? Number(pick(grade, "TotalScore", "totalScore", "Score", "score"))
        : undefined,
    gradeLetter: grade
      ? String(
          pick(
            grade,
            "GradeLetter",
            "gradeLetter",
            "LetterGrade",
            "letterGrade",
          ) ?? "",
        ) || undefined
      : undefined,
    assignmentScore:
      grade != null
        ? Number(pick(grade, "AssignmentScore", "assignmentScore"))
        : undefined,
    midtermScore:
      grade != null
        ? Number(pick(grade, "MidtermScore", "midtermScore"))
        : undefined,
    finalScore:
      grade != null
        ? Number(pick(grade, "FinalScore", "finalScore"))
        : undefined,
    semester: String(pick(semester, "Name", "name", "Code", "code") ?? ""),
  };
}

async function fetchStudentProfile(
  studentId: number,
): Promise<StudentProfile | null> {
  // 1) Thử GET /students/:id (nếu backend có)
  try {
    const res = await apiClient.get(`/students/${studentId}`);
    const data = res.data?.data ?? res.data;
    const mapped = mapStudent(Array.isArray(data) ? data[0] : data);
    if (mapped) return mapped;
  } catch {
    /* fallback */
  }
  // 2) GET /students rồi lọc theo id
  try {
    const res = await apiClient.get("/students", {
      params: { _t: Date.now() },
    });
    const list = Array.isArray(res.data?.data)
      ? res.data.data
      : Array.isArray(res.data)
        ? res.data
        : [];
    const found = list.find((s: any) => Number(s.ID ?? s.id) === studentId);
    return mapStudent(found);
  } catch {
    return null;
  }
}

async function fetchLearningRows(studentId: number): Promise<LearningRow[]> {
  const paths = [
    `/students/${studentId}/learning-detail`,
    `/students/${studentId}/learning`,
    `/admin/students/${studentId}/learning-detail`,
    `/admin/students/${studentId}/learning`,
  ];
  for (const path of paths) {
    try {
      const res = await apiClient.get(path);
      const raw = res.data?.data ?? res.data ?? [];
      const arr = Array.isArray(raw) ? raw : [];
      if (arr.length || res.status === 200) {
        return arr.map(mapLearning).filter(Boolean) as LearningRow[];
      }
    } catch {
      /* thử path tiếp */
    }
  }
  return [];
}

type Props = {
  studentId: number;
  /** Hiển thị nút back */
  showBack?: boolean;
};

export default function StudentDetailView({
  studentId,
  showBack = true,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [learning, setLearning] = useState<LearningRow[]>([]);

  const load = useCallback(async () => {
    if (!studentId) {
      setError("Thiếu mã sinh viên");
      setLoading(false);
      return;
    }
    try {
      setError("");
      const [p, rows] = await Promise.all([
        fetchStudentProfile(studentId),
        fetchLearningRows(studentId),
      ]);
      setProfile(p);
      setLearning(rows);
      if (!p) {
        setError(
          "Không tải được hồ sơ sinh viên. Kiểm tra quyền hoặc ID sinh viên.",
        );
      }
    } catch (e: any) {
      setError(
        e?.response?.data?.message || "Không tải được chi tiết sinh viên.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [studentId]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#5B5BD6" />
          <Text style={styles.loadingText}>Đang tải hồ sơ sinh viên…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        {showBack ? (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            hitSlop={10}>
            <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
          </TouchableOpacity>
        ) : (
          <View style={styles.backBtn} />
        )}
        <Text style={styles.headerTitle}>Chi tiết sinh viên</Text>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            setRefreshing(true);
            load();
          }}
          hitSlop={10}>
          <Ionicons name="refresh" size={20} color="#5B5BD6" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            colors={["#5B5BD6"]}
            tintColor="#5B5BD6"
          />
        }>
        {!!error && (
          <View style={styles.errorBox}>
            <Ionicons name="warning-outline" size={18} color="#DC2626" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {profile && (
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(profile.fullName || "SV")
                  .split(" ")
                  .slice(-1)[0]
                  ?.charAt(0)
                  ?.toUpperCase() || "S"}
              </Text>
            </View>
            <Text style={styles.name}>{profile.fullName}</Text>
            <Text style={styles.code}>
              {profile.studentCode || "—"} · {profile.status}
            </Text>

            <View style={styles.infoGrid}>
              <InfoRow
                icon="person-outline"
                label="Username"
                value={profile.username}
              />
              <InfoRow
                icon="mail-outline"
                label="Email"
                value={profile.email}
              />
              <InfoRow
                icon="call-outline"
                label="Điện thoại"
                value={profile.phone}
              />
              <InfoRow
                icon="location-outline"
                label="Địa chỉ"
                value={profile.address}
              />
              <InfoRow
                icon="male-female-outline"
                label="Giới tính"
                value={profile.gender}
              />
              <InfoRow
                icon="calendar-outline"
                label="Ngày sinh"
                value={profile.dateOfBirth}
              />
              <InfoRow
                icon="school-outline"
                label="Lớp"
                value={profile.classCode || "—"}
              />
              <InfoRow
                icon="enter-outline"
                label="Ngày nhập học"
                value={profile.enrollmentDate}
              />
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>
          Kết quả học tập ({learning.length})
        </Text>
        {learning.length === 0 ? (
          <View style={styles.emptyLearn}>
            <Ionicons name="book-outline" size={36} color="#D1D5DB" />
            <Text style={styles.emptyLearnText}>
              Chưa có dữ liệu đăng ký / điểm môn học
            </Text>
          </View>
        ) : (
          learning.map((row) => (
            <View key={row.id} style={styles.learnCard}>
              <View style={styles.learnHead}>
                <Text style={styles.learnCourse} numberOfLines={2}>
                  {row.courseName}
                </Text>
                {row.gradeLetter || row.totalScore != null ? (
                  <View style={styles.scorePill}>
                    <Text style={styles.scorePillText}>
                      {row.gradeLetter ||
                        (row.totalScore != null ? String(row.totalScore) : "—")}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.learnMeta}>
                {[row.courseCode, row.classCode, row.semester, row.status]
                  .filter(Boolean)
                  .join(" · ")}
              </Text>
              {(row.assignmentScore != null ||
                row.midtermScore != null ||
                row.finalScore != null) && (
                <Text style={styles.learnScores}>
                  BT: {row.assignmentScore ?? "—"} · GK:{" "}
                  {row.midtermScore ?? "—"} · CK: {row.finalScore ?? "—"}
                  {row.totalScore != null ? ` · Tổng: ${row.totalScore}` : ""}
                </Text>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  value: string;
}) {
  if (!value || value === "—") {
    return (
      <View style={styles.infoRow}>
        <Ionicons name={icon} size={16} color="#9CA3AF" />
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, { color: "#9CA3AF" }]}>—</Text>
      </View>
    );
  }
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={16} color="#5B5BD6" />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F3EEFF" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: { color: "#6B7280", fontSize: 14 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 10,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  scroll: { padding: 16, paddingBottom: 40 },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF2F2",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  errorText: { flex: 1, color: "#DC2626", fontSize: 13 },
  profileCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#5B5BD6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarText: { color: "#FFF", fontSize: 28, fontWeight: "800" },
  name: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1A1A1A",
    textAlign: "center",
  },
  code: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
    marginBottom: 16,
  },
  infoGrid: { width: "100%", gap: 10 },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },
  infoLabel: {
    width: 100,
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "600",
  },
  infoValue: {
    flex: 1,
    fontSize: 13,
    color: "#1A1A1A",
    fontWeight: "600",
    textAlign: "right",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1A1A1A",
    marginBottom: 10,
  },
  emptyLearn: {
    alignItems: "center",
    padding: 28,
    backgroundColor: "#FFF",
    borderRadius: 14,
    gap: 8,
  },
  emptyLearnText: { color: "#9CA3AF", fontSize: 13, textAlign: "center" },
  learnCard: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  learnHead: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 4,
  },
  learnCourse: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  scorePill: {
    backgroundColor: "#EDE9FE",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  scorePillText: { color: "#5B5BD6", fontWeight: "800", fontSize: 13 },
  learnMeta: { fontSize: 12, color: "#6B7280", marginBottom: 4 },
  learnScores: { fontSize: 12, color: "#374151", fontWeight: "600" },
});
