import { getScheduleAPI } from "@/src/api/authApi";
import { useAuth } from "@/src/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
  dayKey?: string;
}

interface DayMeta {
  key: string;
  label: string;
  short: string;
  dateNum: number;
  fullDate: Date;
  isToday: boolean;
  isCurrentMonth: boolean;
}

const DAY_KEYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const DAY_SHORT = ["CN", "Thứ2", "Thứ3", "Thứ4", "Thứ5", "Thứ6", "Thứ7"];

const getTodayKey = () => DAY_KEYS[new Date().getDay()];

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const getWeekDays = (baseDate: Date): DayMeta[] => {
  const day = baseDate.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(baseDate);
  monday.setDate(baseDate.getDate() + mondayOffset);

  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const key = DAY_KEYS[d.getDay()];
    return {
      key,
      label: DAY_SHORT[d.getDay()],
      short: DAY_SHORT[d.getDay()],
      dateNum: d.getDate(),
      fullDate: d,
      isToday: isSameDay(d, today),
      isCurrentMonth: d.getMonth() === baseDate.getMonth(),
    };
  });
};

const getWeeksInMonth = (baseDate: Date): DayMeta[][] => {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const start = new Date(firstDay);
  const startDay = start.getDay();
  const mondayOffset = startDay === 0 ? -6 : 1 - startDay;
  start.setDate(start.getDate() + mondayOffset);

  const weeks: DayMeta[][] = [];
  let cursor = new Date(start);
  const today = new Date();

  while (cursor <= lastDay || weeks.length === 0) {
    const week: DayMeta[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(cursor);
      week.push({
        key: DAY_KEYS[d.getDay()],
        label: DAY_SHORT[d.getDay()],
        short: DAY_SHORT[d.getDay()],
        dateNum: d.getDate(),
        fullDate: d,
        isToday: isSameDay(d, today),
        isCurrentMonth: d.getMonth() === month,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
    if (cursor.getMonth() !== month && cursor > lastDay) break;
    if (weeks.length > 6) break;
  }
  return weeks;
};

const getMonthGrid = (baseDate: Date): DayMeta[] => {
  const weeks = getWeeksInMonth(baseDate);
  return weeks.flat();
};

const MONTH_NAMES = [
  "Tháng 1",
  "Tháng 2",
  "Tháng 3",
  "Tháng 4",
  "Tháng 5",
  "Tháng 6",
  "Tháng 7",
  "Tháng 8",
  "Tháng 9",
  "Tháng 10",
  "Tháng 11",
  "Tháng 12",
];

/** Chuẩn hoá day_of_week từ backend → key lịch (Sunday..Saturday) */
const normalizeDayKey = (raw: any): string => {
  let s = String(raw ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFC");
  if (!s) return "";
  // bỏ dấu chấm/phẩy thừa
  s = s.replace(/[.,;]/g, " ").replace(/\s+/g, " ").trim();

  const map: Record<string, string> = {
    sunday: "Sunday",
    sun: "Sunday",
    cn: "Sunday",
    "chủ nhật": "Sunday",
    "chu nhat": "Sunday",
    monday: "Monday",
    mon: "Monday",
    t2: "Monday",
    "thứ 2": "Monday",
    "thu 2": "Monday",
    thu2: "Monday",
    "thứ hai": "Monday",
    "thu hai": "Monday",
    tuesday: "Tuesday",
    tue: "Tuesday",
    tues: "Tuesday",
    t3: "Tuesday",
    "thứ 3": "Tuesday",
    "thu 3": "Tuesday",
    thu3: "Tuesday",
    "thứ ba": "Tuesday",
    wednesday: "Wednesday",
    wed: "Wednesday",
    t4: "Wednesday",
    "thứ 4": "Wednesday",
    "thu 4": "Wednesday",
    thu4: "Wednesday",
    "thứ tư": "Wednesday",
    "thu tu": "Wednesday",
    thursday: "Thursday",
    thu: "Thursday",
    thur: "Thursday",
    thurs: "Thursday",
    t5: "Thursday",
    "thứ 5": "Thursday",
    "thu 5": "Thursday",
    thu5: "Thursday",
    "thứ năm": "Thursday",
    friday: "Friday",
    fri: "Friday",
    t6: "Friday",
    "thứ 6": "Friday",
    "thu 6": "Friday",
    thu6: "Friday",
    "thứ sáu": "Friday",
    saturday: "Saturday",
    sat: "Saturday",
    t7: "Saturday",
    "thứ 7": "Saturday",
    "thu 7": "Saturday",
    thu7: "Saturday",
    "thứ bảy": "Saturday",
  };
  if (map[s]) return map[s];

  // startsWith: "monday...", "mon ", "thứ 2..."
  if (s.startsWith("mon") || s.includes("thứ 2") || s.includes("thu 2"))
    return "Monday";
  if (s.startsWith("tue") || s.includes("thứ 3") || s.includes("thu 3"))
    return "Tuesday";
  if (s.startsWith("wed") || s.includes("thứ 4") || s.includes("thu 4"))
    return "Wednesday";
  if (
    (s.startsWith("thu") && !s.startsWith("tue")) ||
    s.includes("thứ 5") ||
    s.includes("thu 5")
  )
    return "Thursday";
  if (s.startsWith("fri") || s.includes("thứ 6") || s.includes("thu 6"))
    return "Friday";
  if (s.startsWith("sat") || s.includes("thứ 7") || s.includes("thu 7"))
    return "Saturday";
  if (s.startsWith("sun") || s.includes("chủ nhật") || s === "cn")
    return "Sunday";

  // số: 0-6 (CN=0) hoặc 1-7 (T2=1 ... CN=7)
  const n = Number(s);
  if (!Number.isNaN(n)) {
    if (n >= 0 && n <= 6) return DAY_KEYS[n];
    if (n >= 1 && n <= 7) {
      // 1=Mon ... 6=Sat, 7=Sun
      return DAY_KEYS[n === 7 ? 0 : n];
    }
  }

  const titled = s.charAt(0).toUpperCase() + s.slice(1);
  if (DAY_KEYS.includes(titled)) return titled;
  return "";
};

const parseTimeToSort = (t: string): number => {
  const m = String(t || "").match(/(\d{1,2}):(\d{2})/);
  if (!m) return 9999;
  return Number(m[1]) * 60 + Number(m[2]);
};

const mapScheduleRow = (item: any, index: number): ScheduleItem | null => {
  const dayKey = normalizeDayKey(
    item.day_of_week ?? item.dayOfWeek ?? item.DayOfWeek ?? item.day,
  );
  if (!dayKey) return null;

  const start =
    item.start_time ||
    item.startTime ||
    item.StartTime ||
    item.period ||
    item.session ||
    item.Session ||
    "";
  const end = item.end_time || item.endTime || item.EndTime || "";

  return {
    id: Number(item.id ?? item.ID ?? index + 1),
    courseName: String(
      item.course_name ?? item.courseName ?? item.CourseName ?? "Môn học",
    ),
    classCode: String(
      item.class_code ??
        item.classCode ??
        item.course_code ??
        item.courseCode ??
        "",
    ),
    startTime: String(start),
    endTime: String(end),
    room: String(
      item.room ?? item.room_name ?? item.Room ?? item.RoomName ?? "—",
    ),
    teacherName: String(
      item.teacher_name ?? item.teacherName ?? item.TeacherName ?? "—",
    ),
    credit: Number(item.credit ?? item.credits ?? 0) || (undefined as any),
    status: "upcoming",
    dayKey,
  };
};

/** Cache lịch trong RAM — mở lại tab không gọi API lại ngay */
const SCHEDULE_CACHE_TTL_MS = 60_000;
let scheduleCache: {
  tokenKey: string;
  map: Record<string, ScheduleItem[]>;
  total: number;
  at: number;
} | null = null;

const emptyMap = (): Record<string, ScheduleItem[]> => {
  const m: Record<string, ScheduleItem[]> = {};
  DAY_KEYS.forEach((k) => {
    m[k] = [];
  });
  return m;
};

const buildScheduleMap = (
  rows: any[],
): {
  map: Record<string, ScheduleItem[]>;
  total: number;
} => {
  const map = emptyMap();
  for (let index = 0; index < rows.length; index++) {
    const item = rows[index];
    const mapped = mapScheduleRow(item, index);
    if (mapped?.dayKey && map[mapped.dayKey]) {
      map[mapped.dayKey].push(mapped);
    } else {
      // dayOfWeek lạ → Monday để vẫn hiện, không mất dữ liệu
      const fb = mapScheduleRow(
        { ...item, dayOfWeek: "Monday", day_of_week: "Monday" },
        index,
      );
      if (fb) map.Monday.push(fb);
    }
  }
  for (let i = 0; i < DAY_KEYS.length; i++) {
    const k = DAY_KEYS[i];
    map[k].sort(
      (a, b) => parseTimeToSort(a.startTime) - parseTimeToSort(b.startTime),
    );
  }
  const total = DAY_KEYS.reduce((sum, k) => sum + map[k].length, 0);
  return { map, total };
};

const ScheduleCard = React.memo(({ item }: { item: ScheduleItem }) => (
  <View style={styles.scheduleCard}>
    <View style={styles.timeCol}>
      <Text style={styles.startTime}>{item.startTime}</Text>
    </View>
    <View
      style={[
        styles.bar,
        item.status === "active" ? styles.barActive : styles.barUpcoming,
      ]}
    />
    <View style={styles.contentCol}>
      <Text style={styles.courseName} numberOfLines={1}>
        {item.courseName}
      </Text>
      <Text style={styles.roomText}>
        {item.classCode ? `${item.classCode} · ` : ""}Phòng {item.room}
      </Text>
      <Text style={styles.rangeText}>
        {item.startTime}
        {item.endTime ? `-${item.endTime}` : ""}
        {item.teacherName && item.teacherName !== "—"
          ? ` · ${item.teacherName}`
          : ""}
      </Text>
    </View>
  </View>
));

const ViewSchedule: React.FC = () => {
  const { token } = useAuth();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayKey, setSelectedDayKey] = useState(getTodayKey());
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("day");
  const [scheduleMap, setScheduleMap] = useState<
    Record<string, ScheduleItem[]>
  >({});
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  const [fetchError, setFetchError] = useState<string | null>(null);
  const [totalSlots, setTotalSlots] = useState(0);

  const fetchSchedule = useCallback(
    async (isRefresh = false) => {
      if (!token) return;
      const tokenKey = String(token).slice(-24);

      // 1) Dùng cache trước → mở tab gần như tức thì
      if (
        !isRefresh &&
        scheduleCache &&
        scheduleCache.tokenKey === tokenKey &&
        Date.now() - scheduleCache.at < SCHEDULE_CACHE_TTL_MS
      ) {
        setScheduleMap(scheduleCache.map);
        setTotalSlots(scheduleCache.total);
        setHasFetched(true);
        setLoading(false);
        setFetchError(
          scheduleCache.total === 0
            ? "Chưa có lịch. Hãy đăng ký học phần (và học phần phải có schedules trên server)."
            : null,
        );
        return;
      }

      try {
        if (!isRefresh && !hasFetched) setLoading(true);
        setFetchError(null);

        const response = await getScheduleAPI();
        const raw = response?.data?.data ?? response?.data ?? [];
        const rows = Array.isArray(raw) ? raw : [];

        // Parse nhanh, một vòng
        const { map, total } = buildScheduleMap(rows);

        scheduleCache = { tokenKey, map, total, at: Date.now() };
        setTotalSlots(total);
        setScheduleMap(map);
        setHasFetched(true);

        if (rows.length === 0) {
          setFetchError(
            "Chưa có lịch. Hãy đăng ký học phần (và học phần phải có schedules trên server).",
          );
        }

        const todayKey = getTodayKey();
        if ((map[todayKey] || []).length === 0 && total > 0) {
          const first = DAY_KEYS.find((k) => (map[k] || []).length > 0);
          if (first) setSelectedDayKey(first);
        }
      } catch (e: any) {
        const status = e?.response?.status;
        const msg =
          e?.response?.data?.message || e?.message || "Không tải được lịch học";
        setScheduleMap(emptyMap());
        setTotalSlots(0);
        setHasFetched(true);
        setFetchError(
          status === 401 || status === 403
            ? "Phiên đăng nhập hết hạn / không phải tài khoản sinh viên."
            : String(msg),
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, hasFetched],
  );

  useEffect(() => {
    if (token && !hasFetched) fetchSchedule(false);
  }, [token, hasFetched, fetchSchedule]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSchedule(true);
  }, [fetchSchedule]);

  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);
  // Chỉ tính lưới tuần/tháng khi đang xem mode đó — tiết kiệm khi nhiều môn
  const weeksInMonth = useMemo(
    () =>
      viewMode === "week" || viewMode === "month"
        ? getWeeksInMonth(currentDate)
        : [],
    [currentDate, viewMode],
  );
  const monthGrid = useMemo(
    () => (viewMode === "month" ? getMonthGrid(currentDate) : []),
    [currentDate, viewMode],
  );

  const dayItems = useMemo(
    () => scheduleMap[selectedDayKey] || [],
    [scheduleMap, selectedDayKey],
  );

  const getItemsForDate = useCallback(
    (d: DayMeta) => scheduleMap[d.key] || [],
    [scheduleMap],
  );

  const changeMonth = (delta: number) => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setMonth(prev.getMonth() + delta);
      return next;
    });
  };

  const renderDayView = () => (
    <>
      {!!fetchError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{fetchError}</Text>
        </View>
      )}
      {totalSlots > 0 && (
        <Text style={styles.totalHint}>
          Tuần này có {totalSlots} buổi · đang xem {selectedDayKey}
        </Text>
      )}
      <View style={styles.dateStrip}>
        {weekDays.map((d) => {
          const active = selectedDayKey === d.key;
          return (
            <TouchableOpacity
              key={d.key + d.dateNum}
              style={[styles.dateItem, active && styles.dateItemActive]}
              onPress={() => {
                setSelectedDayKey(d.key);
                setCurrentDate(d.fullDate);
              }}
              activeOpacity={0.7}>
              <Text
                style={[styles.dateLabel, active && styles.dateLabelActive]}>
                {d.short}
              </Text>
              <Text style={[styles.dateNum, active && styles.dateNumActive]}>
                {d.dateNum}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={dayItems}
        keyExtractor={(item, index) => `${item.dayKey}-${item.id}-${index}`}
        renderItem={({ item }) => <ScheduleCard item={item} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={3}
        updateCellsBatchingPeriod={50}
        removeClippedSubviews
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#5B5BD6"]}
            tintColor="#5B5BD6"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>Không có lịch học</Text>
            <Text style={styles.emptySubtitle}>
              Không có tiết học trong ngày này (lịch theo môn bạn đã đăng ký)
            </Text>
          </View>
        }
      />
    </>
  );

  const renderWeekView = () => (
    <ScrollView
      contentContainerStyle={styles.weekScroll}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#5B5BD6"]}
          tintColor="#5B5BD6"
        />
      }>
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={() => changeMonth(-1)} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color="#5B5BD6" />
        </TouchableOpacity>
        <Text style={styles.monthNavText}>
          {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
        </Text>
        <TouchableOpacity onPress={() => changeMonth(1)} hitSlop={12}>
          <Ionicons name="chevron-forward" size={22} color="#5B5BD6" />
        </TouchableOpacity>
      </View>

      {weeksInMonth.map((week, weekIdx) => {
        const totalClasses = week.reduce(
          (sum, d) => sum + (d.isCurrentMonth ? getItemsForDate(d).length : 0),
          0,
        );
        const weekLabel = `Tuần ${weekIdx + 1}`;
        const rangeLabel = `${week[0].dateNum}/${currentDate.getMonth() + 1} – ${week[6].dateNum}/${currentDate.getMonth() + 1}`;

        return (
          <View key={weekIdx} style={styles.weekCard}>
            <View style={styles.weekHeader}>
              <Text style={styles.weekTitle}>{weekLabel}</Text>
              <Text style={styles.weekRange}>{rangeLabel}</Text>
              <View style={styles.weekBadge}>
                <Text style={styles.weekBadgeText}>{totalClasses} buổi</Text>
              </View>
            </View>

            <View style={styles.weekDaysRow}>
              {week.map((d) => {
                const count = d.isCurrentMonth ? getItemsForDate(d).length : 0;
                const isSelected =
                  selectedDayKey === d.key &&
                  d.dateNum === currentDate.getDate();
                return (
                  <TouchableOpacity
                    key={d.key + d.dateNum}
                    style={[
                      styles.weekDayItem,
                      !d.isCurrentMonth && styles.weekDayMuted,
                      d.isToday && styles.weekDayToday,
                      isSelected && styles.weekDaySelected,
                    ]}
                    onPress={() => {
                      if (!d.isCurrentMonth) return;
                      setSelectedDayKey(d.key);
                      setCurrentDate(d.fullDate);
                      setViewMode("day");
                    }}
                    activeOpacity={0.7}>
                    <Text
                      style={[
                        styles.weekDayLabel,
                        isSelected && styles.weekDayLabelSelected,
                      ]}>
                      {d.short}
                    </Text>
                    <Text
                      style={[
                        styles.weekDayNum,
                        isSelected && styles.weekDayNumSelected,
                      ]}>
                      {d.dateNum}
                    </Text>
                    {count > 0 && (
                      <View style={styles.dotRow}>
                        {Array.from({ length: Math.min(count, 3) }).map(
                          (_, i) => (
                            <View key={i} style={styles.eventDot} />
                          ),
                        )}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );

  const renderMonthView = () => (
    <ScrollView
      contentContainerStyle={styles.monthScroll}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#5B5BD6"]}
          tintColor="#5B5BD6"
        />
      }>
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={() => changeMonth(-1)} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color="#5B5BD6" />
        </TouchableOpacity>
        <Text style={styles.monthNavText}>
          {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
        </Text>
        <TouchableOpacity onPress={() => changeMonth(1)} hitSlop={12}>
          <Ionicons name="chevron-forward" size={22} color="#5B5BD6" />
        </TouchableOpacity>
      </View>

      <View style={styles.monthHeaderRow}>
        {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((l) => (
          <Text key={l} style={styles.monthHeaderCell}>
            {l}
          </Text>
        ))}
      </View>

      <View style={styles.monthGrid}>
        {monthGrid.map((d, idx) => {
          const count = d.isCurrentMonth ? getItemsForDate(d).length : 0;
          const isSelected =
            d.isCurrentMonth &&
            selectedDayKey === d.key &&
            d.dateNum === currentDate.getDate();

          return (
            <TouchableOpacity
              key={idx}
              style={[
                styles.monthCell,
                !d.isCurrentMonth && styles.monthCellMuted,
                d.isToday && styles.monthCellToday,
                isSelected && styles.monthCellSelected,
              ]}
              onPress={() => {
                if (!d.isCurrentMonth) return;
                setSelectedDayKey(d.key);
                setCurrentDate(d.fullDate);
                setViewMode("day");
              }}
              activeOpacity={0.7}>
              <Text
                style={[
                  styles.monthCellNum,
                  !d.isCurrentMonth && styles.monthCellNumMuted,
                  isSelected && styles.monthCellNumSelected,
                  d.isToday && !isSelected && styles.monthCellNumToday,
                ]}>
                {d.dateNum}
              </Text>
              {count > 0 && d.isCurrentMonth && (
                <View style={styles.monthDots}>
                  {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                    <View key={i} style={styles.eventDot} />
                  ))}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.eventDot, { marginRight: 6 }]} />
          <Text style={styles.legendText}>Có lịch học</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.todayLegend, { marginRight: 6 }]} />
          <Text style={styles.legendText}>Hôm nay</Text>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lịch của tôi</Text>
      </View>

      <View style={styles.modeRow}>
        {(["day", "week", "month"] as const).map((mode) => (
          <TouchableOpacity
            key={mode}
            style={[styles.modeTab, viewMode === mode && styles.modeTabActive]}
            onPress={() => setViewMode(mode)}
            activeOpacity={0.7}>
            <Text
              style={[
                styles.modeTabText,
                viewMode === mode && styles.modeTabTextActive,
              ]}>
              {mode === "day" ? "Ngày" : mode === "week" ? "Tuần" : "Tháng"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5B5BD6" />
        </View>
      ) : (
        <>
          {viewMode === "day" && renderDayView()}
          {viewMode === "week" && renderWeekView()}
          {viewMode === "month" && renderMonthView()}
        </>
      )}
    </SafeAreaView>
  );
};

export default ViewSchedule;

const styles = StyleSheet.create({
  errorBanner: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    padding: 12,
  },
  errorBannerText: { color: "#92400E", fontSize: 13, lineHeight: 18 },
  totalHint: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    fontSize: 12,
    color: "#5B5BD6",
    fontWeight: "600",
  },

  container: {
    flex: 1,
    backgroundColor: "#F3EEFF",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1A1A1A",
  },

  // Mode tabs
  modeRow: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  modeTab: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
  },
  modeTabActive: {
    backgroundColor: "#5B5BD6",
  },
  modeTabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  modeTabTextActive: {
    color: "#FFFFFF",
  },

  // Date strip (day view)
  dateStrip: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 8,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  dateItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 12,
    marginHorizontal: 2,
  },
  dateItemActive: {
    backgroundColor: "#5B5BD6",
  },
  dateLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 2,
  },
  dateLabelActive: {
    color: "#FFFFFF",
  },
  dateNum: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  dateNumActive: {
    color: "#FFFFFF",
  },

  // List
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // Schedule card
  scheduleCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    marginBottom: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  timeCol: {
    width: 52,
    alignItems: "center",
  },
  startTime: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  bar: {
    width: 4,
    height: 44,
    borderRadius: 2,
    marginHorizontal: 12,
  },
  barActive: {
    backgroundColor: "#10B981",
  },
  barUpcoming: {
    backgroundColor: "#10B981",
  },
  contentCol: {
    flex: 1,
  },
  courseName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 2,
  },
  roomText: {
    fontSize: 13,
    color: "#6B7280",
  },
  rangeText: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
  },

  emptyContainer: {
    alignItems: "center",
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 14,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 6,
  },

  // Month nav
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  monthNavText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1A1A1A",
  },

  // Week view
  weekScroll: {
    paddingBottom: 32,
  },
  weekCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 16,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  weekHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  weekTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  weekRange: {
    fontSize: 13,
    color: "#6B7280",
    marginLeft: 8,
    flex: 1,
  },
  weekBadge: {
    backgroundColor: "#EDE9FE",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  weekBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#5B5BD6",
  },
  weekDaysRow: {
    flexDirection: "row",
  },
  weekDayItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 10,
  },
  weekDayMuted: {
    opacity: 0.35,
  },
  weekDayToday: {
    backgroundColor: "#EDE9FE",
  },
  weekDaySelected: {
    backgroundColor: "#5B5BD6",
  },
  weekDayLabel: {
    fontSize: 11,
    color: "#6B7280",
  },
  weekDayLabelSelected: {
    color: "#FFFFFF",
  },
  weekDayNum: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A1A1A",
    marginTop: 2,
  },
  weekDayNumSelected: {
    color: "#FFFFFF",
  },
  dotRow: {
    flexDirection: "row",
    marginTop: 4,
    gap: 2,
  },
  eventDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#5B5BD6",
  },

  // Month view
  monthScroll: {
    paddingBottom: 32,
  },
  monthHeaderRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  monthHeaderCell: {
    flex: 1,
    textAlign: "center",
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  monthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
  },
  monthCell: {
    width: `${100 / 7}%` as any,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    marginBottom: 4,
  },
  monthCellMuted: {
    opacity: 0.3,
  },
  monthCellToday: {
    backgroundColor: "#EDE9FE",
  },
  monthCellSelected: {
    backgroundColor: "#5B5BD6",
  },
  monthCellNum: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  monthCellNumMuted: {
    color: "#9CA3AF",
  },
  monthCellNumSelected: {
    color: "#FFFFFF",
  },
  monthCellNumToday: {
    color: "#5B5BD6",
    fontWeight: "700",
  },
  monthDots: {
    flexDirection: "row",
    marginTop: 2,
    gap: 2,
  },

  // Legend
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    marginTop: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendText: {
    fontSize: 13,
    color: "#6B7280",
  },
  todayLegend: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#EDE9FE",
    borderWidth: 1.5,
    borderColor: "#5B5BD6",
  },
});
