import { getTranscriptAPI } from "@/src/api/authApi";
import { useAuth } from "@/src/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface TranscriptItem {
  id: number;
  courseCode: string;
  courseName: string;
  credit: number;
  grade: string | number;
  letter?: string;
  status: string;
  semester?: string;
}

type Summary = { gpa: number; totalCredits: number; totalCourses: number };

const CACHE_TTL_MS = 5 * 60_000; // 5 phút
let transcriptCache: {
  tokenKey: string;
  list: TranscriptItem[];
  summary: Summary;
  message: string | null;
  at: number;
} | null = null;

const ViewTranscript: React.FC = () => {
  const { token } = useAuth();
  const captureViewRef = useRef<View>(null);

  const cached =
    transcriptCache &&
    token &&
    transcriptCache.tokenKey === String(token).slice(-24) &&
    Date.now() - transcriptCache.at < CACHE_TTL_MS
      ? transcriptCache
      : null;

  const [transcript, setTranscript] = useState<TranscriptItem[]>(
    () => cached?.list ?? [],
  );
  const [summary, setSummary] = useState<Summary>(
    () => cached?.summary ?? { gpa: 0, totalCredits: 0, totalCourses: 0 },
  );
  // Có cache → không hiện full-screen loading
  const [loading, setLoading] = useState(() => !cached);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState<string | null>(
    () => cached?.message ?? null,
  );

  const fetchTranscript = useCallback(
    async (opts?: { force?: boolean }) => {
      const force = !!opts?.force;
      if (!token) return;
      const tokenKey = String(token).slice(-24);

      // Cache → mở màn gần như tức thì
      if (
        !force &&
        transcriptCache &&
        transcriptCache.tokenKey === tokenKey &&
        Date.now() - transcriptCache.at < CACHE_TTL_MS
      ) {
        setTranscript(transcriptCache.list);
        setSummary(transcriptCache.summary);
        setMessage(transcriptCache.message);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      try {
        // Chỉ full-screen loading khi chưa có data
        if (transcript.length === 0 && !refreshing) setLoading(true);
        setMessage(null);

        const response = await getTranscriptAPI();
        const body = response?.data ?? {};

        // Lấy mảng điểm đúng chỗ backend trả về
        let rawList: any[] = [];
        if (Array.isArray(body?.transcript)) {
          rawList = body.transcript;
        } else if (Array.isArray(body?.data?.transcript)) {
          rawList = body.data.transcript;
        } else if (Array.isArray(body?.data)) {
          rawList = body.data;
        } else if (Array.isArray(body)) {
          rawList = body;
        } else {
          rawList = [];
        }

        const formatted: TranscriptItem[] = rawList.map(
          (item: any, idx: number) => {
            const credits = Number(
              item.credits ?? item.Credits ?? item.credit ?? 0,
            );
            const totalRaw =
              item.total_score ??
              item.totalScore ??
              item.TotalScore ??
              item.grade ??
              item.score ??
              0;
            const total = Number(totalRaw);
            const letter = String(
              item.grade_letter ?? item.gradeLetter ?? item.GradeLetter ?? "",
            ).trim();

            return {
              id: Number(item.id ?? item.ID ?? idx + 1),
              courseCode: String(
                item.course_code ?? item.courseCode ?? item.CourseCode ?? "—",
              ),
              courseName: String(
                item.course_name ??
                  item.courseName ??
                  item.CourseName ??
                  item.course?.name ??
                  "Môn học",
              ),
              credit: Number.isFinite(credits) ? credits : 0,
              grade: Number.isFinite(total) ? total : "Chưa có",
              letter: letter || undefined,
              status: String(item.status ?? "Approved"),
              semester: item.semester ?? item.Semester ?? undefined,
            };
          },
        );

        const apiGpa = Number(body.gpa ?? body.GPA ?? body?.data?.gpa);
        const apiCredits = Number(
          body.totalCredit ?? body.totalCredits ?? body?.data?.totalCredit,
        );

        let gpa = Number.isFinite(apiGpa) ? apiGpa : 0;
        let totalCredits = Number.isFinite(apiCredits)
          ? apiCredits
          : formatted.reduce((s, x) => s + (x.credit || 0), 0);

        if (!Number.isFinite(apiGpa) && formatted.length > 0) {
          let pts = 0;
          let cr = 0;
          formatted.forEach((x) => {
            const g =
              typeof x.grade === "number"
                ? x.grade
                : parseFloat(String(x.grade));
            if (!isNaN(g) && x.credit > 0) {
              pts += g * x.credit;
              cr += x.credit;
            }
          });
          if (cr > 0) gpa = Math.round((pts / cr) * 100) / 100;
          totalCredits = cr;
        }

        const nextSummary: Summary = {
          gpa: Math.round(gpa * 100) / 100,
          totalCredits,
          totalCourses: formatted.length,
        };
        const nextMsg =
          formatted.length === 0 ? "Chưa có điểm được công bố." : null;

        setTranscript(formatted);
        setSummary(nextSummary);
        setMessage(nextMsg);

        transcriptCache = {
          tokenKey,
          list: formatted,
          summary: nextSummary,
          message: nextMsg,
          at: Date.now(),
        };
      } catch (error: any) {
        const status = error?.response?.status;
        const msg =
          error?.response?.data?.message ||
          error?.message ||
          "Không thể tải bảng điểm";
        console.log("transcript error", error?.response?.data || error);
        setTranscript([]);
        setSummary({ gpa: 0, totalCredits: 0, totalCourses: 0 });
        setMessage(status === 404 ? "Chưa có điểm được công bố." : String(msg));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token],
  );

  useEffect(() => {
    if (token) fetchTranscript({ force: false });
  }, [token, fetchTranscript]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTranscript({ force: true });
  };

  const buildTextReport = () => {
    const lines = [
      "=== BẢNG ĐIỂM SINH VIÊN (EduSync) ===",
      `GPA: ${summary.gpa}`,
      `Tín chỉ: ${summary.totalCredits}`,
      `Số môn: ${summary.totalCourses}`,
      "",
      "Mã môn | Tên môn | TC | Điểm | Chữ",
      ...transcript.map(
        (t) =>
          `${t.courseCode} | ${t.courseName} | ${t.credit} | ${t.grade}${
            t.letter ? ` (${t.letter})` : ""
          }`,
      ),
      "",
      `Xuất lúc: ${new Date().toLocaleString("vi-VN")}`,
    ];
    return lines.join("\n");
  };

  /** Xuất bảng điểm — chỉ Share (không import view-shot / media-library) */
  const handleExport = async () => {
    if (transcript.length === 0) {
      Alert.alert("Thông báo", "Chưa có dữ liệu bảng điểm để xuất.");
      return;
    }
    setExporting(true);
    try {
      await Share.share({
        title: "Bảng điểm EduSync",
        message: buildTextReport(),
      });
    } catch (e: any) {
      Alert.alert("Lỗi", e?.message || "Không thể xuất bảng điểm.");
    } finally {
      setExporting(false);
    }
  };

  const getGradeColor = (grade: string | number) => {
    const g = typeof grade === "number" ? grade : parseFloat(String(grade));
    if (isNaN(g)) return "#6B7280";
    if (g >= 8.5) return "#059669";
    if (g >= 7.0) return "#0EA5E9";
    if (g >= 5.0) return "#D97706";
    return "#DC2626";
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bảng Điểm</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {loading && <ActivityIndicator size="small" color="#5B5BD6" />}
          <TouchableOpacity
            onPress={handleExport}
            disabled={exporting || loading}
            style={styles.exportButton}>
            {exporting ? (
              <ActivityIndicator size="small" color="#5B5BD6" />
            ) : (
              <Ionicons name="download-outline" size={22} color="#5B5BD6" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.listContainer}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#5B5BD6"]}
            tintColor="#5B5BD6"
          />
        }>
        <View
          ref={captureViewRef}
          collapsable={false}
          style={styles.captureBox}>
          <Text style={styles.captureTitle}>Bảng điểm sinh viên</Text>
          <Text style={styles.captureSub}>EduSync · Student Management</Text>

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{summary.gpa}</Text>
                <Text style={styles.summaryLabel}>GPA</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{summary.totalCredits}</Text>
                <Text style={styles.summaryLabel}>Tín chỉ</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{summary.totalCourses}</Text>
                <Text style={styles.summaryLabel}>Môn học</Text>
              </View>
            </View>
          </View>

          {transcript.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="school-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>
                {message || "Chưa có dữ liệu bảng điểm"}
              </Text>
            </View>
          ) : (
            transcript.map((item) => (
              <View key={String(item.id)} style={styles.card}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.code}>{item.courseCode}</Text>
                  <Text style={styles.name}>{item.courseName}</Text>
                  {!!item.semester && (
                    <Text style={styles.sem}>{item.semester}</Text>
                  )}
                </View>
                <View style={styles.gradeCol}>
                  <Text
                    style={[
                      styles.grade,
                      { color: getGradeColor(item.grade) },
                    ]}>
                    {item.grade}
                  </Text>
                  <Text style={styles.credit}>{item.credit} TC</Text>
                  {!!item.letter && (
                    <Text style={styles.letter}>{item.letter}</Text>
                  )}
                </View>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color="#10B981"
                  style={{ marginLeft: 6 }}
                />
              </View>
            ))
          )}
        </View>

        <Text style={styles.exportHint}>
          Bấm tải xuống để chia sẻ / sao chép bảng điểm (văn bản). Lưu ảnh thư
          viện cần Dev Client build đủ native module.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ViewTranscript;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3EEFF" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3EEFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#1A1A1A" },
  exportButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EDE9FE",
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 40 },
  captureBox: {
    backgroundColor: "#F3EEFF",
    borderRadius: 12,
    paddingBottom: 8,
  },
  captureTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1A1A1A",
    textAlign: "center",
  },
  captureSub: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    marginBottom: 12,
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  summaryRow: { flexDirection: "row", alignItems: "center" },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryValue: { fontSize: 22, fontWeight: "800", color: "#5B5BD6" },
  summaryLabel: { fontSize: 12, color: "#9CA3AF", marginTop: 4 },
  summaryDivider: { width: 1, height: 36, backgroundColor: "#E5E7EB" },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  code: { fontSize: 13, fontWeight: "700", color: "#5B5BD6" },
  name: { fontSize: 15, fontWeight: "600", color: "#1A1A1A", marginTop: 2 },
  sem: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
  gradeCol: { alignItems: "flex-end", marginLeft: 8 },
  grade: { fontSize: 20, fontWeight: "800" },
  credit: { fontSize: 11, color: "#9CA3AF", marginTop: 2 },
  letter: { fontSize: 12, fontWeight: "700", color: "#6B7280", marginTop: 2 },
  empty: { alignItems: "center", paddingVertical: 48 },
  emptyText: { marginTop: 12, color: "#9CA3AF", fontSize: 14 },
  exportHint: {
    marginTop: 8,
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 18,
  },
});
