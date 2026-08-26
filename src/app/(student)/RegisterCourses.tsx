import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Step = "search" | "list" | "confirm" | "success" | "registered";

interface Course {
  id: number;
  name: string;
  code: string;
  credits: number;
  teacher: string;
  schedule?: string;
  time?: string;
  room?: string;
  slots: string;
  registered?: boolean;
}

const MOCK_COURSES: Course[] = [
  {
    id: 1,
    name: "Database Systems",
    code: "CSDL - 202",
    credits: 3,
    teacher: "Trương Tường Phát",
    schedule: "Thứ 2 - Thứ 4",
    time: "07:30 - 09:10",
    room: "Phòng A201",
    slots: "12/40",
  },
  {
    id: 2,
    name: "Web Development",
    code: "WEB - 205",
    credits: 3,
    teacher: "Trương Tường Phát",
    schedule: "Thứ 3 - Thứ 5",
    time: "09:30 - 11:10",
    room: "Phòng B102",
    slots: "5/35",
  },
  {
    id: 3,
    name: "Software Engineering",
    code: "SE101 - 203",
    credits: 3,
    teacher: "Trương Tường Phát",
    schedule: "Thứ 6",
    time: "13:00 - 16:00",
    room: "Phòng A103",
    slots: "10/40",
  },
];

const MOCK_REGISTERED: Course[] = [
  {
    id: 1,
    name: "Database Systems",
    code: "CSDL - 202",
    credits: 3,
    teacher: "Trương Tường Phát",
    slots: "",
    registered: true,
  },
  {
    id: 2,
    name: "Web Development",
    code: "WEB - 205",
    credits: 3,
    teacher: "Trương Tường Phát",
    slots: "",
    registered: true,
  },
  {
    id: 3,
    name: "Software Engineering",
    code: "SE101 - 203",
    credits: 3,
    teacher: "Trương Tường Phát",
    slots: "",
    registered: true,
  },
  {
    id: 4,
    name: "Discrete Mathematics",
    code: "MATH - 201",
    credits: 3,
    teacher: "Trương Tường Phát",
    slots: "",
    registered: true,
  },
];

const SEMESTERS = ["Học kỳ 1-2026", "Học kỳ 2-2025", "Học kỳ 1-2025"];

const RegisterCourses: React.FC = () => {
  const [step, setStep] = useState<Step>("search");
  const [semester, setSemester] = useState(SEMESTERS[0]);
  const [showSemesterPicker, setShowSemesterPicker] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [faculty, setFaculty] = useState("Tất cả khoa");
  const [courseType, setCourseType] = useState("Tất cả học phần");
  const [courses, setCourses] = useState<Course[]>(MOCK_COURSES);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [registeredCourses, setRegisteredCourses] =
    useState<Course[]>(MOCK_REGISTERED);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const { getOpenCourseClassesAPI } = await import("@/src/api/authApi");
      const res = await getOpenCourseClassesAPI();
      const raw = res.data?.data ?? res.data ?? [];
      const list = Array.isArray(raw) ? raw : [];
      if (list.length > 0) {
        const mapped: Course[] = list.map((item: any, idx: number) => ({
          id: Number(item.id ?? item.ID ?? idx + 1),
          name:
            item.courseName ||
            item.course?.name ||
            item.className ||
            item.name ||
            "Học phần",
          code:
            item.classCode ||
            item.courseCode ||
            item.code ||
            `HP-${item.id ?? idx + 1}`,
          credits: Number(item.credits ?? item.course?.credits ?? 3),
          teacher:
            item.teacherName ||
            item.teacher?.fullName ||
            item.teacher?.name ||
            "—",
          schedule: item.schedule || item.dayOfWeek || undefined,
          time:
            item.startTime && item.endTime
              ? `${item.startTime} - ${item.endTime}`
              : item.time,
          room: item.room || item.roomName || undefined,
          slots:
            item.capacity != null
              ? `${item.enrolled ?? item.registered ?? 0}/${item.capacity}`
              : "—",
        }));
        setCourses(mapped);
      } else {
        setCourses(MOCK_COURSES);
      }
      setStep("list");
    } catch {
      setCourses(MOCK_COURSES);
      setStep("list");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCourse = (course: Course) => {
    setSelectedCourse(course);
    setStep("confirm");
  };

  const handleConfirmRegister = async () => {
    if (!selectedCourse) return;
    setLoading(true);
    try {
      const { registerCourseAPI } = await import("@/src/api/authApi");
      await registerCourseAPI(selectedCourse.id);
      setRegisteredCourses((prev) => [
        ...prev,
        { ...selectedCourse, registered: true },
      ]);
      setStep("success");
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Đăng ký thất bại. Vui lòng thử lại.";
      Alert.alert("Lỗi", String(msg));
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (step === "list") setStep("search");
    else if (step === "confirm") setStep("list");
    else if (step === "success") setStep("search");
    else if (step === "registered") setStep("search");
  };

  // ===================== RENDER STEPS =====================

  // --- Step: Search (5.1) ---
  const renderSearch = () => (
    <ScrollView
      contentContainerStyle={styles.scrollPad}
      keyboardShouldPersistTaps="handled">
      <Text style={styles.sectionLabel}>Học kỳ</Text>
      <TouchableOpacity
        style={styles.dropdown}
        onPress={() => setShowSemesterPicker(!showSemesterPicker)}
        activeOpacity={0.7}>
        <Text style={styles.dropdownText}>{semester}</Text>
        <Ionicons name="chevron-down" size={18} color="#6B7280" />
      </TouchableOpacity>

      {showSemesterPicker && (
        <View style={styles.pickerList}>
          {SEMESTERS.map((s) => (
            <TouchableOpacity
              key={s}
              style={styles.pickerItem}
              onPress={() => {
                setSemester(s);
                setShowSemesterPicker(false);
              }}>
              <Text
                style={[
                  styles.pickerItemText,
                  s === semester && styles.pickerItemActive,
                ]}>
                {s}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.rowButtons}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={handleSearch}
          activeOpacity={0.8}>
          <Text style={styles.primaryBtnText}>Tra cứu</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.outlineBtn}
          onPress={() => setStep("registered")}
          activeOpacity={0.8}>
          <Text style={styles.outlineBtnText}>Lịch học</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchInputWrap}>
          <Ionicons name="search" size={18} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm học phần, mã môn, giảng viên"
            placeholderTextColor="#9CA3AF"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
        <TouchableOpacity style={styles.filterIconBtn} activeOpacity={0.7}>
          <Ionicons name="options-outline" size={20} color="#5B5BD6" />
        </TouchableOpacity>
      </View>

      <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Bộ lọc</Text>

      <TouchableOpacity style={styles.dropdown} activeOpacity={0.7}>
        <Text style={styles.dropdownText}>{faculty}</Text>
        <Ionicons name="chevron-down" size={18} color="#6B7280" />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.dropdown, { marginTop: 12 }]}
        activeOpacity={0.7}>
        <Text style={styles.dropdownText}>{courseType}</Text>
        <Ionicons name="chevron-down" size={18} color="#6B7280" />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.primaryBtn, { marginTop: 32 }]}
        onPress={handleSearch}
        activeOpacity={0.8}>
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.primaryBtnText}>Tìm kiếm</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );

  // --- Step: List (5.2) ---
  const renderList = () => (
    <ScrollView contentContainerStyle={styles.scrollPad}>
      <Text style={styles.resultCount}>Tìm thấy {courses.length} học phần</Text>

      {courses.map((course) => (
        <View key={course.id} style={styles.courseCard}>
          <View style={styles.courseInfo}>
            <Text style={styles.courseName}>{course.name}</Text>
            <Text style={styles.courseCode}>{course.code}</Text>
            <Text style={styles.courseMeta}>{course.credits} tín chỉ</Text>
            <Text style={styles.courseMeta}>Giảng viên: {course.teacher}</Text>
            <Text style={styles.slotsText}>Còn {course.slots} chỗ</Text>
          </View>
          <TouchableOpacity
            style={styles.registerBtn}
            onPress={() => handleSelectCourse(course)}
            activeOpacity={0.8}>
            <Text style={styles.registerBtnText}>Đăng ký</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );

  // --- Step: Confirm (5.3) ---
  const renderConfirm = () => {
    if (!selectedCourse) return null;
    return (
      <ScrollView contentContainerStyle={styles.scrollPad}>
        <View style={styles.confirmCard}>
          <Text style={styles.courseName}>{selectedCourse.name}</Text>
          <Text style={styles.courseCode}>{selectedCourse.code}</Text>
          <Text style={styles.courseMeta}>
            {selectedCourse.credits} tín chỉ
          </Text>
          <Text style={styles.courseMeta}>
            Giảng viên: {selectedCourse.teacher}
          </Text>

          {selectedCourse.schedule && (
            <>
              <View style={styles.divider} />
              <Text style={styles.scheduleTitle}>Lịch học:</Text>
              <Text style={styles.courseMeta}>{selectedCourse.schedule}</Text>
              <Text style={styles.courseMeta}>{selectedCourse.time}</Text>
              <Text style={styles.courseMeta}>{selectedCourse.room}</Text>
            </>
          )}

          <View style={styles.slotsBox}>
            <Text style={styles.slotsBoxText}>
              Sĩ số hiện tại{" "}
              <Text style={{ fontWeight: "700" }}>{selectedCourse.slots}</Text>
            </Text>
          </View>
        </View>

        <View style={styles.warningBox}>
          <Ionicons name="information-circle" size={18} color="#D97706" />
          <Text style={styles.warningText}>
            Lưu ý: Bạn sẽ không thể đăng ký trùng lịch hoặc vượt quá tín chỉ cho
            phép.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.primaryBtn, { marginTop: 24 }]}
          onPress={handleConfirmRegister}
          disabled={loading}
          activeOpacity={0.8}>
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.primaryBtnText}>Xác nhận đăng ký</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.outlineBtnFull, { marginTop: 12 }]}
          onPress={() => setStep("list")}
          activeOpacity={0.8}>
          <Text style={styles.outlineBtnText}>Hủy</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  // --- Step: Success (5.4) ---
  const renderSuccess = () => (
    <View style={styles.successContainer}>
      <View style={styles.successIcon}>
        <Ionicons name="checkmark" size={48} color="#FFFFFF" />
      </View>
      <Text style={styles.successTitle}>Đăng ký thành công!</Text>
      <Text style={styles.successSubtitle}>
        Bạn đã đăng ký học phần thành công.
      </Text>
      {selectedCourse && (
        <Text style={styles.successCourse}>
          {selectedCourse.name} - {selectedCourse.code}
        </Text>
      )}

      <TouchableOpacity
        style={[styles.primaryBtn, { marginTop: 40, width: "100%" }]}
        onPress={() => setStep("registered")}
        activeOpacity={0.8}>
        <Text style={styles.primaryBtnText}>Xem lịch học</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.outlineBtnFull, { marginTop: 12, width: "100%" }]}
        onPress={() => {
          setSelectedCourse(null);
          setStep("search");
        }}
        activeOpacity={0.8}>
        <Text style={styles.outlineBtnText}>Đăng ký thêm</Text>
      </TouchableOpacity>
    </View>
  );

  // --- Step: My Registered Courses ---
  const renderRegistered = () => {
    const totalCredits = registeredCourses.reduce(
      (sum, c) => sum + c.credits,
      0,
    );
    return (
      <ScrollView contentContainerStyle={styles.scrollPad}>
        <TouchableOpacity
          style={styles.dropdown}
          onPress={() => setShowSemesterPicker(!showSemesterPicker)}
          activeOpacity={0.7}>
          <Text style={styles.dropdownText}>{semester}</Text>
          <Ionicons name="chevron-down" size={18} color="#6B7280" />
        </TouchableOpacity>

        <Text style={styles.summaryText}>
          Tổng: {registeredCourses.length} học phần - {totalCredits} tín chỉ
        </Text>

        {registeredCourses.map((course) => (
          <View key={course.id} style={styles.registeredCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.courseName}>{course.name}</Text>
              <Text style={styles.courseCode}>{course.code}</Text>
              <Text style={styles.courseMeta}>{course.credits} tín chỉ</Text>
            </View>
            <View style={styles.registeredBadge}>
              <Text style={styles.registeredBadgeText}>Đã đăng ký</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    );
  };

  // ===================== HEADER =====================
  const getTitle = () => {
    switch (step) {
      case "search":
        return "Đăng ký học phần";
      case "list":
        return "Kết quả tìm kiếm";
      case "confirm":
        return "Xác nhận đăng ký";
      case "success":
        return "";
      case "registered":
        return "Học phần đã đăng ký";
      default:
        return "";
    }
  };

  const showBack = step !== "search" && step !== "success";

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3EEFF" />

      {/* Header */}
      {step !== "success" && (
        <View style={styles.header}>
          {showBack ? (
            <TouchableOpacity
              onPress={goBack}
              style={styles.backBtn}
              activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.backBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={24} color="#1A1A1A" />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>{getTitle()}</Text>
          <View style={styles.headerSpacer} />
        </View>
      )}

      {/* Content */}
      {step === "search" && renderSearch()}
      {step === "list" && renderList()}
      {step === "confirm" && renderConfirm()}
      {step === "success" && renderSuccess()}
      {step === "registered" && renderRegistered()}
    </SafeAreaView>
  );
};

export default RegisterCourses;

// ============ Styles ============
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F3EEFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  headerSpacer: {
    width: 36,
  },
  scrollPad: {
    padding: 20,
    paddingBottom: 40,
  },

  // Form
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  dropdownText: {
    fontSize: 15,
    color: "#1A1A1A",
  },
  pickerList: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  pickerItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  pickerItemText: {
    fontSize: 15,
    color: "#374151",
  },
  pickerItemActive: {
    color: "#5B5BD6",
    fontWeight: "600",
  },
  rowButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
    marginBottom: 20,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: "#5B5BD6",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  outlineBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#5B5BD6",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  outlineBtnFull: {
    borderWidth: 1.5,
    borderColor: "#5B5BD6",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  outlineBtnText: {
    color: "#5B5BD6",
    fontSize: 16,
    fontWeight: "600",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    height: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#1A1A1A",
  },
  filterIconBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },

  // List
  resultCount: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 14,
  },
  courseCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  courseInfo: {
    flex: 1,
  },
  courseName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 2,
  },
  courseCode: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 4,
  },
  courseMeta: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 2,
  },
  slotsText: {
    fontSize: 13,
    color: "#5B5BD6",
    fontWeight: "600",
    marginTop: 4,
  },
  registerBtn: {
    backgroundColor: "#5B5BD6",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  registerBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },

  // Confirm
  confirmCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 14,
  },
  scheduleTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  slotsBox: {
    marginTop: 14,
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },
  slotsBoxText: {
    fontSize: 14,
    color: "#374151",
  },
  warningBox: {
    flexDirection: "row",
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    gap: 10,
    alignItems: "flex-start",
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: "#92400E",
    lineHeight: 19,
  },

  // Success
  successContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  successIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
  },
  successCourse: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    marginTop: 16,
    textAlign: "center",
  },

  // Registered
  summaryText: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 12,
    marginBottom: 16,
  },
  registeredCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  registeredBadge: {
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  registeredBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#059669",
  },
});
