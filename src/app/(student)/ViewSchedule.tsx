import { getScheduleAPI } from "@/src/api/authApi";
import { useAuth } from "@/src/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export const { width } = Dimensions.get("window");

interface ScheduleItem {
  id: number;
  courseName: string;
  classCode: string;
  startTime: string;
  endTime: string;
  room: string;
  teacherName: string;
  credit: number;
  status?: "active" | "upcoming" | "finished";
}

interface DaySchedule {
  day: string;
  label: string;
  items: ScheduleItem[];
}

const daysOfWeek = [
  { key: "Monday", label: "Thứ 2" },
  { key: "Tuesday", label: "Thứ 3" },
  { key: "Wednesday", label: "Thứ 4" },
  { key: "Thursday", label: "Thứ 5" },
  { key: "Friday", label: "Thứ 6" },
  { key: "Saturday", label: "Thứ 7" },
  { key: "Sunday", label: "Chủ Nhật" },
];

const ViewSchedule: React.FC = () => {
  const { token } = useAuth();

  const [schedules, setSchedules] = useState<DaySchedule[]>([]);
  const [selectedDay, setSelectedDay] = useState<string>("Monday");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSchedule = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getScheduleAPI();

      console.log(response.data);

      const grouped: { [key: string]: ScheduleItem[] } = {};

      const schedules = response.data.data || [];

      schedules.forEach((item: any, index: number) => {
        const dayKey = item.day_of_week || "Monday";
        if (!grouped[dayKey]) grouped[dayKey] = [];

        grouped[dayKey].push({
          id: index,
          courseName: item.course_name,
          classCode: item.course_code,
          startTime: item.period,
          endTime: "",
          room: item.room,
          teacherName: item.teacher_name,
          credit: 3,
          status: "active",
        });
      });

      const formattedSchedules = daysOfWeek.map((day) => ({
        day: day.key,
        label: day.label,
        items: grouped[day.key] || [],
      }));

      setSchedules(formattedSchedules);
    } catch (error) {
      console.error("Lỗi tải lịch học:", error);
      setSchedules([
        {
          day: "Monday",
          label: "Thứ 2",
          items: [
            {
              id: 1,
              courseName: "Cơ sở dữ liệu",
              classCode: "DB101",
              startTime: "07:30",
              endTime: "09:30",
              room: "A1.202",
              teacherName: "Nguyễn Văn A",
              credit: 3,
              status: "active",
            },
          ],
        },
        {
          day: "Tuesday",
          label: "Thứ 3",
          items: [
            {
              id: 1,
              courseName: "Development of Mobile Applications",
              classCode: "DB102",
              startTime: "07:30",
              endTime: "09:30",
              room: "A1.202",
              teacherName: "Nguyễn Văn B",
              credit: 3,
              status: "active",
            },
          ],
        },
        {
          day: "Wednesday",
          label: "Thứ 4",
          items: [
            {
              id: 1,
              courseName: "Cơ sở dữ liệu",
              classCode: "DB101",
              startTime: "07:30",
              endTime: "09:30",
              room: "A1.202",
              teacherName: "Nguyễn Văn A",
              credit: 3,
              status: "active",
            },
          ],
        },
        {
          day: "Thursday",
          label: "Thứ 5",
          items: [
            {
              id: 1,
              courseName: "Cơ sở dữ liệu",
              classCode: "DB101",
              startTime: "07:30",
              endTime: "09:30",
              room: "A1.202",
              teacherName: "Nguyễn Văn A",
              credit: 3,
              status: "active",
            },
          ],
        },
        {
          day: "Friday",
          label: "Thứ 6",
          items: [
            {
              id: 1,
              courseName: "Cơ sở dữ liệu",
              classCode: "DB101",
              startTime: "07:30",
              endTime: "09:30",
              room: "A1.202",
              teacherName: "Nguyễn Văn A",
              credit: 3,
              status: "active",
            },
          ],
        },
        {
          day: "Saturday",
          label: "Thứ 7",
          items: [
            {
              id: 1,
              courseName: "Cơ sở dữ liệu",
              classCode: "DB101",
              startTime: "07:30",
              endTime: "09:30",
              room: "A1.202",
              teacherName: "Nguyễn Văn A",
              credit: 3,
              status: "active",
            },
          ],
        },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (token) fetchSchedule();
  }, [token, fetchSchedule]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSchedule();
  };

  const currentSchedule = schedules.find((s) => s.day === selectedDay) || {
    items: [],
  };

  const renderScheduleItem = (item: ScheduleItem) => (
    <View key={item.id} style={styles.scheduleCard}>
      <View style={styles.timeSection}>
        <Text style={styles.startTime}>{item.startTime}</Text>
        <Text style={styles.timeDivider}>—</Text>
        <Text style={styles.endTime}>{item.endTime}</Text>
      </View>

      <View style={styles.contentSection}>
        <View style={styles.headerRow}>
          <Text style={styles.classCode}>{item.classCode}</Text>
          <Text style={styles.credit}>{item.credit} TC</Text>
        </View>

        <Text style={styles.courseName} numberOfLines={2}>
          {item.courseName}
        </Text>

        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={16} color="#555" />
          <Text style={styles.infoText}>{item.teacherName}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={16} color="#555" />
          <Text style={styles.infoText}>Phòng {item.room}</Text>
        </View>
      </View>

      {item.status && (
        <View
          style={[
            styles.statusBadge,
            item.status === "active" && styles.statusActive,
            item.status === "upcoming" && styles.statusUpcoming,
          ]}>
          <Text style={styles.statusText}>
            {item.status === "active" ? "Đang học" : "Sắp bắt đầu"}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lịch Học</Text>
        <TouchableOpacity onPress={fetchSchedule} style={styles.refreshButton}>
          <Ionicons name="refresh-outline" size={24} color="#0066CC" />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.daysScroll}
        contentContainerStyle={styles.daysContent}>
        {daysOfWeek.map((day) => (
          <TouchableOpacity
            key={day.key}
            style={[
              styles.dayTab,
              selectedDay === day.key && styles.dayTabActive,
            ]}
            onPress={() => setSelectedDay(day.key)}
            activeOpacity={0.7}>
            <Text
              style={[
                styles.dayTabText,
                selectedDay === day.key && styles.dayTabTextActive,
              ]}>
              {day.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0066CC" />
          </View>
        ) : currentSchedule.items.length > 0 ? (
          currentSchedule.items.map(renderScheduleItem)
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={80} color="#e0e0e0" />
            <Text style={styles.emptyTitle}>Không có lịch học</Text>
            <Text style={styles.emptySubtitle}>Hôm nay bạn được nghỉ ngơi</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1f1f1f",
  },
  refreshButton: { padding: 4 },

  daysScroll: { backgroundColor: "#fff" },
  daysContent: { paddingVertical: 12, paddingHorizontal: 8 },
  dayTab: {
    paddingHorizontal: 22,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 22,
    backgroundColor: "#f1f3f5",
  },
  dayTabActive: { backgroundColor: "#0066CC" },
  dayTabText: { fontSize: 15.5, fontWeight: "600", color: "#666" },
  dayTabTextActive: { color: "#fff" },

  listContainer: { flex: 1, padding: 16 },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },

  scheduleCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    marginBottom: 16,
    padding: 16,
    flexDirection: "row",
    boxShadow: "0px 3px 10px rgba(0, 0, 0, 0.08)",
    elevation: 4,
  },

  timeSection: {
    width: 72,
    alignItems: "center",
    paddingRight: 14,
    borderRightWidth: 3,
    borderRightColor: "#0066CC",
  },
  startTime: { fontSize: 16, fontWeight: "700", color: "#0066CC" },
  timeDivider: { fontSize: 18, color: "#ddd", marginVertical: 4 },
  endTime: { fontSize: 16, fontWeight: "700", color: "#555" },

  contentSection: { flex: 1, paddingLeft: 14 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  classCode: { fontSize: 16.5, fontWeight: "700" },
  credit: { fontSize: 14, color: "#0066CC", fontWeight: "600" },

  courseName: {
    fontSize: 16.5,
    fontWeight: "600",
    lineHeight: 23,
    marginBottom: 12,
    color: "#1f1f1f",
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  infoText: { marginLeft: 8, fontSize: 14.5, color: "#555" },

  statusBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  statusActive: { backgroundColor: "#d4edda" },
  statusUpcoming: { backgroundColor: "#fff3cd" },
  statusText: { fontSize: 12.5, fontWeight: "600" },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 120,
  },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#666", marginTop: 16 },
  emptySubtitle: { fontSize: 15, color: "#999", marginTop: 6 },
});

export default ViewSchedule;
