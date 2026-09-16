import {
  cancelCourseRegistrationAPI,
  getMyCourseRegistrationsAPI,
  getOpenCourseClassesAPI,
  registerCourseAPI,
} from "@/src/api/authApi";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Tab = "open" | "mine";

type OpenCourse = {
  courseOfferingId: number;
  classId: number;
  courseId: number;
  classCode: string;
  courseCode: string;
  courseName: string;
  teacherName: string;
  semesterName: string;
  roomName: string;
  maxStudents: number;
  currentStudents: number;
  scheduleText: string;
  credits?: number;
};

type RegisteredItem = {
  enrollmentId: number;
  courseName: string;
  courseCode: string;
  classCode: string;
  status: string;
  enrollDate?: string;
};

const formatSchedules = (schedules: any[] | undefined): string => {
  if (!Array.isArray(schedules) || schedules.length === 0)
    return "Chưa có lịch";
  return schedules
    .map((s) => {
      const day = s.DayOfWeek ?? s.dayOfWeek ?? s.day_of_week ?? "";
      const start = s.StartTime ?? s.startTime ?? s.start_time ?? "";
      const end = s.EndTime ?? s.endTime ?? s.end_time ?? "";
      const session = s.Session ?? s.session ?? "";
      if (start || end) return `${day} ${start}${end ? `-${end}` : ""}`.trim();
      return `${day} ${session}`.trim();
    })
    .filter(Boolean)
    .join(" · ");
};

const RegisterCourses: React.FC = () => {
  const [tab, setTab] = useState<Tab>("open");
  const [openList, setOpenList] = useState<OpenCourse[]>([]);
  const [mine, setMine] = useState<RegisteredItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const loadOpen = useCallback(async () => {
    const res = await getOpenCourseClassesAPI();
    const raw = res.data?.data ?? res.data ?? [];
    const list = (Array.isArray(raw) ? raw : [])
      .map((item: any): OpenCourse | null => {
        const classId = Number(
          item.classId ?? item.ClassID ?? item.class_id ?? 0,
        );
        const courseId = Number(
          item.courseId ?? item.CourseID ?? item.course_id ?? 0,
        );
        if (!classId || !courseId) return null;
        return {
          courseOfferingId: Number(
            item.courseOfferingId ?? item.CourseOfferingID ?? item.id ?? 0,
          ),
          classId,
          courseId,
          classCode: String(item.classCode ?? item.ClassCode ?? ""),
          courseCode: String(item.courseCode ?? item.CourseCode ?? ""),
          courseName: String(item.courseName ?? item.CourseName ?? "Học phần"),
          teacherName: String(item.teacherName ?? item.TeacherName ?? "—"),
          semesterName: String(item.semesterName ?? item.SemesterName ?? ""),
          roomName: String(item.roomName ?? item.RoomName ?? "—"),
          maxStudents: Number(item.maxStudents ?? item.MaxStudents ?? 0),
          currentStudents: Number(
            item.currentStudents ?? item.CurrentStudents ?? 0,
          ),
          scheduleText: formatSchedules(item.schedules ?? item.Schedules),
          credits: Number(item.credits ?? item.Credits ?? 0) || undefined,
        };
      })
      .filter(Boolean) as OpenCourse[];
    setOpenList(list);
  }, []);

  const loadMine = useCallback(async () => {
    const res = await getMyCourseRegistrationsAPI();
    const raw = res.data?.data ?? res.data ?? [];
    const list = (Array.isArray(raw) ? raw : [])
      .map((e: any): RegisteredItem | null => {
        const enrollmentId = Number(e.ID ?? e.id);
        if (!enrollmentId) return null;
        const course = e.Course ?? e.course ?? {};
        const cls = e.Class ?? e.class ?? {};
        return {
          enrollmentId,
          courseName: String(course.Name ?? course.name ?? "Môn học"),
          courseCode: String(course.Code ?? course.code ?? ""),
          classCode: String(cls.ClassCode ?? cls.classCode ?? ""),
          status: String(e.Status ?? e.status ?? "enrolled"),
          enrollDate: e.EnrollDate ?? e.enrollDate,
        };
      })
      .filter(Boolean) as RegisteredItem[];
    setMine(list);
  }, []);

  const loadAll = useCallback(async () => {
    try {
      await Promise.all([loadOpen(), loadMine()]);
    } catch (e: any) {
      console.log("register load", e?.response?.data || e);
      Alert.alert(
        "Lỗi",
        e?.response?.data?.message || "Không tải được danh sách học phần.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loadOpen, loadMine]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadAll();
    }, [loadAll]),
  );

  const filteredOpen = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return openList;
    return openList.filter(
      (c) =>
        c.courseName.toLowerCase().includes(q) ||
        c.courseCode.toLowerCase().includes(q) ||
        c.classCode.toLowerCase().includes(q) ||
        c.teacherName.toLowerCase().includes(q),
    );
  }, [openList, search]);

  const isAlreadyRegistered = (courseId: number) =>
    mine.some(
      (m) =>
        m.status !== "cancelled" &&
        // match by name/code loosely if no courseId on mine
        true,
    ) &&
    // better: check open list against mine course code
    mine.some((m) => {
      const open = openList.find((o) => o.courseId === courseId);
      if (!open) return false;
      return (
        m.courseCode &&
        open.courseCode &&
        m.courseCode.toLowerCase() === open.courseCode.toLowerCase()
      );
    });

  const handleRegister = (item: OpenCourse) => {
    if (item.maxStudents > 0 && item.currentStudents >= item.maxStudents) {
      Alert.alert("Hết chỗ", "Lớp học phần đã đủ sĩ số.");
      return;
    }
    if (isAlreadyRegistered(item.courseId)) {
      Alert.alert("Đã đăng ký", "Bạn đã đăng ký môn học này rồi.");
      return;
    }

    Alert.alert(
      "Xác nhận đăng ký",
      `${item.courseCode} — ${item.courseName}\nLớp: ${item.classCode}\nGV: ${item.teacherName}\nLịch: ${item.scheduleText}`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Đăng ký",
          onPress: async () => {
            setSubmittingId(item.courseOfferingId || item.classId);
            try {
              await registerCourseAPI(item.classId, item.courseId);
              Alert.alert(
                "Thành công",
                "Đăng ký học phần thành công.\nMôn đã được thêm vào lịch học của bạn.",
              );
              await loadAll();
              setTab("mine");
            } catch (e: any) {
              const d = e?.response?.data;
              Alert.alert(
                "Đăng ký thất bại",
                [d?.message, d?.error].filter(Boolean).join("\n") ||
                  "Không thể đăng ký. Kiểm tra học kỳ đang mở / lịch học phần.",
              );
            } finally {
              setSubmittingId(null);
            }
          },
        },
      ],
    );
  };

  const handleCancel = (item: RegisteredItem) => {
    Alert.alert("Hủy đăng ký", `Hủy ${item.courseName}?`, [
      { text: "Không", style: "cancel" },
      {
        text: "Hủy đăng ký",
        style: "destructive",
        onPress: async () => {
          try {
            await cancelCourseRegistrationAPI(item.enrollmentId);
            Alert.alert("Thành công", "Đã hủy học phần.");
            await loadAll();
          } catch (e: any) {
            const d = e?.response?.data;
            Alert.alert(
              "Lỗi",
              [d?.message, d?.error].filter(Boolean).join("\n") ||
                "Hủy thất bại.",
            );
          }
        },
      },
    ]);
  };

  const renderOpenItem = ({ item }: { item: OpenCourse }) => {
    const full =
      item.maxStudents > 0 && item.currentStudents >= item.maxStudents;
    const registered = isAlreadyRegistered(item.courseId);
    const busy =
      submittingId === item.courseOfferingId || submittingId === item.classId;

    return (
      <View style={styles.card}>
        <Text style={styles.code}>
          {item.courseCode} · {item.classCode}
        </Text>
        <Text style={styles.name}>{item.courseName}</Text>
        <Text style={styles.meta}>GV: {item.teacherName}</Text>
        <Text style={styles.meta}>Phòng: {item.roomName}</Text>
        <Text style={styles.meta}>Lịch: {item.scheduleText}</Text>
        {!!item.semesterName && (
          <Text style={styles.meta}>HK: {item.semesterName}</Text>
        )}
        <Text style={styles.slots}>
          Sĩ số: {item.currentStudents}
          {item.maxStudents ? `/${item.maxStudents}` : ""}
          {full ? " (đủ)" : ""}
        </Text>

        <TouchableOpacity
          style={[
            styles.btn,
            (full || registered || busy) && styles.btnDisabled,
          ]}
          disabled={full || registered || busy}
          onPress={() => handleRegister(item)}
          activeOpacity={0.8}>
          {busy ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.btnText}>
              {registered ? "Đã đăng ký" : full ? "Hết chỗ" : "Đăng ký"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const renderMineItem = ({ item }: { item: RegisteredItem }) => (
    <View style={styles.card}>
      <View style={styles.rowBetween}>
        <View style={{ flex: 1 }}>
          <Text style={styles.code}>
            {item.courseCode}
            {item.classCode ? ` · ${item.classCode}` : ""}
          </Text>
          <Text style={styles.name}>{item.courseName}</Text>
          <Text style={styles.meta}>Trạng thái: {item.status}</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Đã ĐK</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.cancelBtn}
        onPress={() => handleCancel(item)}>
        <Text style={styles.cancelText}>Hủy đăng ký</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.title}>Đăng ký học phần</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === "open" && styles.tabOn]}
          onPress={() => setTab("open")}>
          <Text style={[styles.tabText, tab === "open" && styles.tabTextOn]}>
            Đang mở ({openList.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === "mine" && styles.tabOn]}
          onPress={() => setTab("mine")}>
          <Text style={[styles.tabText, tab === "mine" && styles.tabTextOn]}>
            Đã đăng ký ({mine.length})
          </Text>
        </TouchableOpacity>
      </View>

      {tab === "open" && (
        <View style={styles.searchRow}>
          <Ionicons name="search" size={18} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm mã môn, tên, lớp, GV..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#9CA3AF"
          />
        </View>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#5B5BD6" />
        </View>
      ) : (
        <FlatList
          data={tab === "open" ? filteredOpen : (mine as any)}
          keyExtractor={(item: any) =>
            tab === "open"
              ? `o-${item.classId}-${item.courseId}`
              : `m-${item.enrollmentId}`
          }
          renderItem={tab === "open" ? renderOpenItem : (renderMineItem as any)}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadAll();
              }}
              colors={["#5B5BD6"]}
            />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>
              {tab === "open"
                ? "Không có lớp học phần đang mở (status=open + có lịch)."
                : "Bạn chưa đăng ký học phần nào."}
            </Text>
          }
          ListHeaderComponent={
            tab === "open" ? (
              <Text style={styles.hint}>
                Bấm Đăng ký → lưu Enrollment vào DB → môn xuất hiện trong{" "}
                <Text style={{ fontWeight: "800" }}>Xem lịch</Text>.
              </Text>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
};

export default RegisterCourses;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F3EEFF" },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  title: { fontSize: 20, fontWeight: "800", color: "#1A1A1A" },
  tabs: {
    flexDirection: "row",
    margin: 16,
    marginBottom: 8,
    backgroundColor: "#EDE9FE",
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  tabOn: { backgroundColor: "#5B5BD6" },
  tabText: { fontWeight: "700", color: "#5B5BD6", fontSize: 13 },
  tabTextOn: { color: "#FFF" },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: "#FFF",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: {
    textAlign: "center",
    color: "#9CA3AF",
    marginTop: 40,
    paddingHorizontal: 24,
  },
  hint: {
    fontSize: 12.5,
    color: "#5B5BD6",
    backgroundColor: "#EDE9FE",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    lineHeight: 18,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  code: { fontSize: 13, fontWeight: "700", color: "#5B5BD6" },
  name: { fontSize: 16, fontWeight: "700", color: "#1A1A1A", marginTop: 4 },
  meta: { fontSize: 12, color: "#6B7280", marginTop: 4 },
  slots: { fontSize: 12, fontWeight: "600", color: "#374151", marginTop: 8 },
  btn: {
    marginTop: 12,
    backgroundColor: "#5B5BD6",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  btnDisabled: { backgroundColor: "#C4B5FD" },
  btnText: { color: "#FFF", fontWeight: "700" },
  rowBetween: { flexDirection: "row", alignItems: "flex-start" },
  badge: {
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: { color: "#059669", fontWeight: "700", fontSize: 12 },
  cancelBtn: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  cancelText: { color: "#EF4444", fontWeight: "700" },
});
