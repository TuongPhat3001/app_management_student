import api from "@/src/api/axios";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Lesson = {
  id: string;
  dayKey: string;
  dayLabel: string;
  startTime: string;
  endTime: string;
  classCode: string;
  courseCode: string;
  courseName: string;
  room: string;
};

const DAY_ORDER = ["2", "3", "4", "5", "6", "7", "CN"];

function normalizeDay(raw: any): { key: string; label: string } {
  const s = String(raw ?? "")
    .trim()
    .toLowerCase();
  if (!s) return { key: "?", label: "—" };

  if (
    s === "2" ||
    s.includes("monday") ||
    s === "mon" ||
    s.includes("thứ 2") ||
    s.includes("thu 2") ||
    s === "t2"
  )
    return { key: "2", label: "Thứ 2" };
  if (
    s === "3" ||
    s.includes("tuesday") ||
    s === "tue" ||
    s.includes("thứ 3") ||
    s.includes("thu 3") ||
    s === "t3"
  )
    return { key: "3", label: "Thứ 3" };
  if (
    s === "4" ||
    s.includes("wednesday") ||
    s === "wed" ||
    s.includes("thứ 4") ||
    s.includes("thu 4") ||
    s === "t4"
  )
    return { key: "4", label: "Thứ 4" };
  if (
    s === "5" ||
    s.includes("thursday") ||
    s === "thu" ||
    s.includes("thứ 5") ||
    s.includes("thu 5") ||
    s === "t5"
  )
    return { key: "5", label: "Thứ 5" };
  if (
    s === "6" ||
    s.includes("friday") ||
    s === "fri" ||
    s.includes("thứ 6") ||
    s.includes("thu 6") ||
    s === "t6"
  )
    return { key: "6", label: "Thứ 6" };
  if (
    s === "7" ||
    s.includes("saturday") ||
    s === "sat" ||
    s.includes("thứ 7") ||
    s.includes("thu 7") ||
    s === "t7"
  )
    return { key: "7", label: "Thứ 7" };
  if (
    s === "1" ||
    s === "8" ||
    s === "0" ||
    s.includes("sunday") ||
    s === "sun" ||
    s.includes("chủ nhật") ||
    s === "cn"
  )
    return { key: "CN", label: "Chủ nhật" };

  return { key: s, label: String(raw) };
}

function fmtTime(t: any): string {
  if (!t) return "—";
  const s = String(t);
  // "07:30:00" | "07:30"
  const m = s.match(/(\d{1,2}):(\d{2})/);
  if (m) return `${m[1].padStart(2, "0")}:${m[2]}`;
  return s;
}

/**
 * Lịch dạy GV — build từ GET /teacher/classes
 * (CourseOfferings + Schedules đã preload ở backend ListTeacherClasses)
 */
const ViewTeachingSchedule = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [filterDay, setFilterDay] = useState<string | "all">("all");

  const load = useCallback(async () => {
    try {
      const res = await api.get("/teacher/classes");
      const classes = res.data?.data ?? res.data ?? [];
      const list: Lesson[] = [];

      for (const c of Array.isArray(classes) ? classes : []) {
        const classCode = String(c.ClassCode ?? c.classCode ?? "—");
        const offerings = c.CourseOfferings ?? c.courseOfferings ?? [];
        const classSchedules = c.Schedules ?? c.schedules ?? [];

        const pushSchedule = (
          sch: any,
          courseCode: string,
          courseName: string,
          roomFallback: string,
        ) => {
          const day = normalizeDay(sch.DayOfWeek ?? sch.dayOfWeek ?? sch.day);
          const id = String(
            sch.ID ?? sch.id ?? `${classCode}-${day.key}-${sch.StartTime}`,
          );
          const roomObj = sch.Room ?? sch.room;
          const room =
            (typeof roomObj === "object"
              ? (roomObj?.Name ?? roomObj?.name ?? roomObj?.Code)
              : roomObj) ||
            sch.RoomName ||
            sch.roomName ||
            roomFallback ||
            "—";

          list.push({
            id,
            dayKey: day.key,
            dayLabel: day.label,
            startTime: fmtTime(sch.StartTime ?? sch.startTime),
            endTime: fmtTime(sch.EndTime ?? sch.endTime),
            classCode,
            courseCode,
            courseName,
            room: String(room),
          });
        };

        if (Array.isArray(offerings) && offerings.length > 0) {
          for (const o of offerings) {
            const course = o.Course ?? o.course ?? {};
            const courseCode = String(course.Code ?? course.code ?? "");
            const courseName = String(course.Name ?? course.name ?? "Học phần");
            const roomOff =
              o.Room?.Name ?? o.Room?.name ?? o.room?.name ?? o.RoomName ?? "";
            const schedules = o.Schedules ?? o.schedules ?? [];
            if (Array.isArray(schedules) && schedules.length > 0) {
              for (const sch of schedules) {
                pushSchedule(sch, courseCode, courseName, roomOff);
              }
            }
          }
        } else if (Array.isArray(classSchedules)) {
          for (const sch of classSchedules) {
            pushSchedule(sch, "", "Lớp học", "");
          }
        }
      }

      // sort by day then start time
      list.sort((a, b) => {
        const da = DAY_ORDER.indexOf(a.dayKey);
        const db = DAY_ORDER.indexOf(b.dayKey);
        if (da !== db) return (da < 0 ? 99 : da) - (db < 0 ? 99 : db);
        return a.startTime.localeCompare(b.startTime);
      });

      setLessons(list);
    } catch (e) {
      console.log("teacher schedule", e);
      setLessons([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const daysPresent = useMemo(() => {
    const set = new Set(lessons.map((l) => l.dayKey));
    return DAY_ORDER.filter((d) => set.has(d));
  }, [lessons]);

  const filtered = useMemo(() => {
    if (filterDay === "all") return lessons;
    return lessons.filter((l) => l.dayKey === filterDay);
  }, [lessons, filterDay]);

  const todayKey = useMemo(() => {
    const d = new Date().getDay(); // 0 CN ... 6 T7
    if (d === 0) return "CN";
    if (d === 1) return "2";
    if (d === 2) return "3";
    if (d === 3) return "4";
    if (d === 4) return "5";
    if (d === 5) return "6";
    return "7";
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#2563EB" />
        </TouchableOpacity>
        <Text style={styles.title}>Lịch dạy</Text>
        <View style={{ width: 40 }} />
      </View>

      <Text style={styles.hint}>
        Lịch theo học phần đang phụ trách · Hôm nay:{" "}
        {normalizeDay(todayKey).label}
      </Text>

      <FlatList
        horizontal
        data={["all", ...daysPresent]}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        style={styles.dayBar}
        contentContainerStyle={{ gap: 8, paddingHorizontal: 4 }}
        renderItem={({ item }) => {
          const active = filterDay === item;
          const label =
            item === "all"
              ? "Tất cả"
              : normalizeDay(item).label.replace("Thứ ", "T");
          return (
            <TouchableOpacity
              style={[styles.dayChip, active && styles.dayChipOn]}
              onPress={() => setFilterDay(item)}>
              <Text
                style={[styles.dayChipText, active && styles.dayChipTextOn]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 40, paddingTop: 8 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            colors={["#2563EB"]}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>
              Chưa có lịch dạy. Nhận lớp từ admin hoặc kiểm tra lịch học phần.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isToday = item.dayKey === todayKey;
          return (
            <View style={[styles.card, isToday && styles.cardToday]}>
              <View style={styles.timeCol}>
                <Text style={styles.time}>{item.startTime}</Text>
                <Text style={styles.timeEnd}>{item.endTime}</Text>
              </View>
              <View style={styles.divider} />
              <View style={{ flex: 1 }}>
                <Text style={styles.dayLabel}>
                  {item.dayLabel}
                  {isToday ? " · Hôm nay" : ""}
                </Text>
                <Text style={styles.course}>
                  {item.courseCode ? `${item.courseCode} · ` : ""}
                  {item.courseName}
                </Text>
                <Text style={styles.meta}>
                  Lớp {item.classCode} · Phòng {item.room}
                </Text>
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
};

export default ViewTeachingSchedule;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC", paddingHorizontal: 16 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
    marginTop: 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  title: { fontSize: 20, fontWeight: "800", color: "#0F172A" },
  hint: {
    fontSize: 12,
    color: "#94A3B8",
    marginBottom: 10,
    textAlign: "center",
  },
  dayBar: { maxHeight: 44, marginBottom: 4 },
  dayChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  dayChipOn: { backgroundColor: "#2563EB", borderColor: "#2563EB" },
  dayChipText: { fontSize: 13, fontWeight: "600", color: "#64748B" },
  dayChipTextOn: { color: "#FFF" },
  card: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
  },
  cardToday: {
    borderColor: "#2563EB",
    backgroundColor: "#EFF6FF",
  },
  timeCol: { width: 56, alignItems: "center" },
  time: { fontSize: 15, fontWeight: "800", color: "#2563EB" },
  timeEnd: { fontSize: 12, color: "#94A3B8", marginTop: 2 },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: "#E2E8F0",
    marginHorizontal: 12,
  },
  dayLabel: { fontSize: 12, fontWeight: "700", color: "#64748B" },
  course: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 2,
  },
  meta: { fontSize: 12, color: "#94A3B8", marginTop: 4 },
  empty: { alignItems: "center", paddingTop: 48, paddingHorizontal: 24 },
  emptyText: {
    marginTop: 12,
    textAlign: "center",
    color: "#94A3B8",
    fontSize: 14,
    lineHeight: 20,
  },
});
