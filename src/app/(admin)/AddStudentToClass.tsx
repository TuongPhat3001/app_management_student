import apiClient from "@/src/api/axios";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
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

interface ClassItem {
  id: number;
  classCode: string;
  className: string;
  capacity?: number;
  enrolled?: number;
  teacherName?: string;
  academicYear?: string;
  status?: string;
}

interface StudentForm {
  username: string;
  password: string;
  email: string;
  fullName: string;
  studentCode: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  address: string;
  enrollmentDate: string;
}

interface CreatedResult {
  studentCode?: string;
  username?: string;
  fullName?: string;
  email?: string;
  defaultPassword?: string;
  className?: string;
}

const emptyForm: StudentForm = {
  username: "",
  password: "",
  email: "",
  fullName: "",
  studentCode: "",
  dateOfBirth: "",
  gender: "",
  phone: "",
  address: "",
  enrollmentDate: "",
};

const normalizeClass = (raw: any): ClassItem | null => {
  const id = Number(raw?.id ?? raw?.ID ?? raw?.Id);
  if (!id || isNaN(id)) return null;
  return {
    id,
    classCode: String(
      raw?.classCode ?? raw?.ClassCode ?? raw?.code ?? raw?.class_code ?? "",
    ),
    className: String(
      raw?.className ??
        raw?.ClassName ??
        raw?.name ??
        raw?.class_name ??
        "Lớp chưa đặt tên",
    ),
    capacity: Number(raw?.capacity ?? raw?.Capacity ?? 0) || undefined,
    enrolled: Number(
      raw?.enrolled ??
        raw?.Enrolled ??
        raw?.studentCount ??
        raw?.StudentCount ??
        0,
    ),
    teacherName:
      raw?.teacherName ??
      raw?.TeacherName ??
      raw?.teacher?.fullName ??
      raw?.Teacher?.FullName ??
      raw?.teacher?.name,
    academicYear: raw?.academicYear ?? raw?.AcademicYear ?? raw?.academic_year,
    status: String(raw?.status ?? raw?.Status ?? "active").toLowerCase(),
  };
};

const AddStudentToClass: React.FC = () => {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [classSearch, setClassSearch] = useState("");
  const [form, setForm] = useState<StudentForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [createdInfo, setCreatedInfo] = useState<CreatedResult | null>(null);

  const fetchClasses = useCallback(async () => {
    try {
      let list: any[] = [];
      // Ưu tiên lớp đang mở / đang học
      try {
        const res = await apiClient.get("/classes", {
          params: { status: "active" },
        });
        const data = res.data?.data ?? res.data;
        list = Array.isArray(data)
          ? data
          : (data?.items ?? data?.classes ?? []);
      } catch {
        try {
          const res = await apiClient.get("/classes");
          const data = res.data?.data ?? res.data;
          list = Array.isArray(data)
            ? data
            : (data?.items ?? data?.classes ?? []);
        } catch {
          const res = await apiClient.get("/course-classes");
          const data = res.data?.data ?? res.data;
          list = Array.isArray(data) ? data : (data?.items ?? []);
        }
      }

      const normalized = list
        .map(normalizeClass)
        .filter((c): c is ClassItem => c !== null)
        // Ưu tiên lớp đang học / active; nếu không có status thì vẫn hiện
        .filter((c) => {
          if (!c.status) return true;
          return (
            c.status === "active" ||
            c.status === "open" ||
            c.status === "ongoing" ||
            c.status === "in_progress" ||
            c.status === "studying"
          );
        });

      setClasses(normalized);
    } catch (e) {
      console.log("fetchClasses error:", e);
      setClasses([]);
    } finally {
      setLoadingClasses(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchClasses();
  };

  const setField = <K extends keyof StudentForm>(key: K, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const filteredClasses = classes.filter((c) => {
    const q = classSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      c.classCode.toLowerCase().includes(q) ||
      c.className.toLowerCase().includes(q) ||
      String(c.id).includes(q) ||
      (c.teacherName || "").toLowerCase().includes(q)
    );
  });

  const validate = (): boolean => {
    if (!selectedClass) {
      Alert.alert("Thiếu thông tin", "Vui lòng chọn lớp học.");
      return false;
    }
    if (!form.username.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập username.");
      return false;
    }
    if (!form.fullName.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập họ và tên.");
      return false;
    }
    if (!form.studentCode.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập mã sinh viên.");
      return false;
    }
    if (form.password.trim() && form.password.trim().length < 6) {
      Alert.alert("Sai định dạng", "Mật khẩu phải có ít nhất 6 ký tự.");
      return false;
    }
    if (
      form.dateOfBirth.trim() &&
      !/^\d{4}-\d{2}-\d{2}$/.test(form.dateOfBirth.trim())
    ) {
      Alert.alert("Sai định dạng", "Ngày sinh phải đúng YYYY-MM-DD.");
      return false;
    }
    if (
      form.enrollmentDate.trim() &&
      !/^\d{4}-\d{2}-\d{2}$/.test(form.enrollmentDate.trim())
    ) {
      Alert.alert("Sai định dạng", "Ngày nhập học phải đúng YYYY-MM-DD.");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate() || !selectedClass) return;

    setSubmitting(true);
    setCreatedInfo(null);

    const payload: Record<string, any> = {
      username: form.username.trim(),
      fullName: form.fullName.trim(),
      studentCode: form.studentCode.trim(),
      classId: selectedClass.id,
      classID: selectedClass.id,
    };

    if (form.password.trim()) payload.password = form.password.trim();
    if (form.email.trim()) payload.email = form.email.trim();
    if (form.dateOfBirth.trim()) payload.dateOfBirth = form.dateOfBirth.trim();
    if (form.gender.trim()) payload.gender = form.gender.trim();
    if (form.phone.trim()) payload.phone = form.phone.trim();
    if (form.address.trim()) payload.address = form.address.trim();
    if (form.enrollmentDate.trim())
      payload.enrollmentDate = form.enrollmentDate.trim();

    try {
      // 1) Tạo sinh viên gắn classId
      const res = await apiClient.post("/students", payload);
      const data = res.data?.data ?? res.data;
      const studentId =
        data?.id ?? data?.ID ?? data?.studentId ?? data?.StudentID;
      const defaultPassword =
        res.data?.defaultPassword || form.password.trim() || "Student@123";

      // 2) Nếu backend tách đăng ký lớp học phần, thử enroll thêm
      if (studentId) {
        try {
          await apiClient.post("/course-registrations", {
            courseClassId: selectedClass.id,
            courseClassID: selectedClass.id,
            classId: selectedClass.id,
            classID: selectedClass.id,
            studentId: Number(studentId),
            studentID: Number(studentId),
          });
        } catch {
          // Không bắt buộc — nhiều backend gán lớp ngay khi tạo student
        }

        try {
          await apiClient.post(`/classes/${selectedClass.id}/students`, {
            studentId: Number(studentId),
            studentID: Number(studentId),
          });
        } catch {
          // optional
        }
      }

      setCreatedInfo({
        studentCode:
          data?.StudentCode || data?.studentCode || form.studentCode.trim(),
        username: form.username.trim(),
        fullName: form.fullName.trim(),
        email:
          data?.User?.Email ||
          data?.User?.email ||
          data?.email ||
          form.email.trim() ||
          undefined,
        defaultPassword,
        className: `${selectedClass.classCode} — ${selectedClass.className}`,
      });

      Alert.alert(
        "Thành công",
        `Đã thêm sinh viên vào lớp ${selectedClass.classCode}.`,
      );

      setForm(emptyForm);
    } catch (error: any) {
      const d = error?.response?.data;
      let message =
        d?.message || d?.error || "Không thể thêm sinh viên vào lớp.";
      if (d?.error && typeof d.error === "string" && d.message) {
        message = `${d.message}\n${d.error}`;
      } else if (!error?.response) {
        message = "Không kết nối được server. Kiểm tra mạng / baseURL.";
      } else if (
        error?.response?.status === 401 ||
        error?.response?.status === 403
      ) {
        message = "Bạn chưa đăng nhập hoặc không có quyền admin.";
      } else if (error?.response?.status === 404) {
        message =
          "API tạo sinh viên / gán lớp chưa có trên backend hoặc lớp không tồn tại.";
      }
      Alert.alert("Lỗi", message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderClassItem = ({ item }: { item: ClassItem }) => {
    const isSelected = selectedClass?.id === item.id;
    return (
      <TouchableOpacity
        style={[styles.classItem, isSelected && styles.classItemSelected]}
        onPress={() => {
          setSelectedClass(item);
          setShowClassPicker(false);
          setClassSearch("");
        }}
        activeOpacity={0.7}>
        <View style={{ flex: 1 }}>
          <Text style={styles.classCode}>
            {item.classCode || `#${item.id}`}
          </Text>
          <Text style={styles.className}>{item.className}</Text>
          <Text style={styles.classMeta}>
            ID: {item.id}
            {item.teacherName ? ` · GV: ${item.teacherName}` : ""}
            {item.capacity
              ? ` · ${item.enrolled ?? 0}/${item.capacity} SV`
              : item.enrolled
                ? ` · ${item.enrolled} SV`
                : ""}
          </Text>
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={22} color="#5B5BD6" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3EEFF" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thêm SV vào lớp</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.backBtn}>
          <Ionicons name="refresh" size={20} color="#5B5BD6" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#5B5BD6"]}
              tintColor="#5B5BD6"
            />
          }>
          <Text style={styles.sectionLabel}>1. Chọn lớp đang học</Text>

          <TouchableOpacity
            style={styles.classSelector}
            onPress={() => setShowClassPicker(true)}
            activeOpacity={0.7}>
            {selectedClass ? (
              <View style={{ flex: 1 }}>
                <Text style={styles.selectedCode}>
                  {selectedClass.classCode || `Lớp #${selectedClass.id}`}
                </Text>
                <Text style={styles.selectedName}>
                  {selectedClass.className}
                </Text>
              </View>
            ) : (
              <Text style={styles.placeholder}>
                {loadingClasses
                  ? "Đang tải danh sách lớp..."
                  : "Chạm để chọn lớp học"}
              </Text>
            )}
            <Ionicons name="chevron-down" size={20} color="#6B7280" />
          </TouchableOpacity>

          {classes.length === 0 && !loadingClasses && (
            <Text style={styles.hintWarn}>
              Không tải được lớp từ server. Bạn vẫn có thể nhập ID lớp thủ công
              bên dưới (nếu backend yêu cầu).
            </Text>
          )}

          {!selectedClass && (
            <View style={styles.manualBox}>
              <Text style={styles.label}>Hoặc nhập ID lớp thủ công</Text>
              <TextInput
                style={styles.input}
                placeholder="VD: 5"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                onChangeText={(t) => {
                  const id = Number(t);
                  if (!isNaN(id) && id > 0) {
                    setSelectedClass({
                      id,
                      classCode: `ID-${id}`,
                      className: "Lớp nhập thủ công",
                      status: "active",
                    });
                  } else {
                    setSelectedClass(null);
                  }
                }}
              />
            </View>
          )}

          <Text style={[styles.sectionLabel, { marginTop: 20 }]}>
            2. Thông tin sinh viên mới
          </Text>

          <Text style={styles.label}>Username *</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: quang.tran"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
            autoCorrect={false}
            value={form.username}
            onChangeText={(t) => setField("username", t)}
          />

          <Text style={styles.label}>Họ và tên *</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: Trần Đăng Quang"
            placeholderTextColor="#9CA3AF"
            value={form.fullName}
            onChangeText={(t) => setField("fullName", t)}
          />

          <Text style={styles.label}>Mã sinh viên *</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: 20260015"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="characters"
            value={form.studentCode}
            onChangeText={(t) => setField("studentCode", t)}
          />

          <Text style={styles.label}>Mật khẩu</Text>
          <TextInput
            style={styles.input}
            placeholder="Để trống → Student@123"
            placeholderTextColor="#9CA3AF"
            secureTextEntry
            value={form.password}
            onChangeText={(t) => setField("password", t)}
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: quang.tran@student.edu.vn"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
            keyboardType="email-address"
            value={form.email}
            onChangeText={(t) => setField("email", t)}
          />

          <Text style={styles.label}>Số điện thoại</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: 09xxxxxxxx"
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
            value={form.phone}
            onChangeText={(t) => setField("phone", t)}
          />

          <Text style={styles.label}>Giới tính</Text>
          <View style={styles.genderRow}>
            {["Nam", "Nữ", "Khác"].map((g) => (
              <TouchableOpacity
                key={g}
                style={[
                  styles.genderChip,
                  form.gender === g && styles.genderChipActive,
                ]}
                onPress={() => setField("gender", g)}>
                <Text
                  style={[
                    styles.genderText,
                    form.gender === g && styles.genderTextActive,
                  ]}>
                  {g}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Ngày sinh (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: 2005-08-15"
            placeholderTextColor="#9CA3AF"
            value={form.dateOfBirth}
            onChangeText={(t) => setField("dateOfBirth", t)}
          />

          <Text style={styles.label}>Ngày nhập học (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: 2026-09-01"
            placeholderTextColor="#9CA3AF"
            value={form.enrollmentDate}
            onChangeText={(t) => setField("enrollmentDate", t)}
          />

          <Text style={styles.label}>Địa chỉ</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Địa chỉ liên hệ"
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
            value={form.address}
            onChangeText={(t) => setField("address", t)}
          />

          <TouchableOpacity
            style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
            disabled={submitting}
            onPress={handleSubmit}>
            {submitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitText}>Thêm sinh viên vào lớp</Text>
            )}
          </TouchableOpacity>

          {createdInfo && (
            <View style={styles.resultCard}>
              <Text style={styles.resultTitle}>Đã tạo thành công</Text>
              <Text style={styles.resultLine}>
                Lớp: {createdInfo.className}
              </Text>
              <Text style={styles.resultLine}>
                MSSV: {createdInfo.studentCode}
              </Text>
              <Text style={styles.resultLine}>
                Username: {createdInfo.username}
              </Text>
              <Text style={styles.resultLine}>
                Họ tên: {createdInfo.fullName}
              </Text>
              {createdInfo.email ? (
                <Text style={styles.resultLine}>
                  Email: {createdInfo.email}
                </Text>
              ) : null}
              <Text style={styles.resultPassword}>
                Mật khẩu: {createdInfo.defaultPassword}
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={showClassPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowClassPicker(false)}>
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Chọn lớp đang học</Text>
            <TouchableOpacity onPress={() => setShowClassPicker(false)}>
              <Ionicons name="close" size={26} color="#1A1A1A" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm mã lớp, tên lớp, ID..."
              placeholderTextColor="#9CA3AF"
              value={classSearch}
              onChangeText={setClassSearch}
            />
          </View>

          {loadingClasses ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#5B5BD6" />
            </View>
          ) : (
            <FlatList
              data={filteredClasses}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderClassItem}
              contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
              ListEmptyComponent={
                <Text style={styles.emptyText}>
                  Không có lớp phù hợp. Kiểm tra API GET /classes trên backend.
                </Text>
              }
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

export default AddStudentToClass;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F3EEFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1A1A1A" },
  scroll: { padding: 20, paddingBottom: 48 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#5B5BD6",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 10,
  },
  classSelector: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  selectedCode: { fontSize: 15, fontWeight: "700", color: "#5B5BD6" },
  selectedName: { fontSize: 13, color: "#4B5563", marginTop: 2 },
  placeholder: { flex: 1, fontSize: 15, color: "#9CA3AF" },
  hintWarn: {
    marginTop: 8,
    fontSize: 12,
    color: "#F97316",
    lineHeight: 18,
  },
  manualBox: { marginTop: 12 },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: "#1A1A1A",
  },
  textArea: { minHeight: 80, textAlignVertical: "top" },
  genderRow: { flexDirection: "row", gap: 10 },
  genderChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  genderChipActive: {
    backgroundColor: "#EDE9FE",
    borderColor: "#5B5BD6",
  },
  genderText: { fontSize: 14, color: "#6B7280", fontWeight: "600" },
  genderTextActive: { color: "#5B5BD6" },
  submitBtn: {
    marginTop: 28,
    backgroundColor: "#5B5BD6",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  submitText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
  resultCard: {
    marginTop: 20,
    backgroundColor: "#ECFDF5",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#059669",
    marginBottom: 8,
  },
  resultLine: { fontSize: 14, color: "#065F46", marginBottom: 4 },
  resultPassword: {
    fontSize: 14,
    fontWeight: "700",
    color: "#047857",
    marginTop: 6,
  },
  modalSafe: { flex: 1, backgroundColor: "#F9FAFB" },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    backgroundColor: "#FFF",
  },
  modalTitle: { fontSize: 17, fontWeight: "700", color: "#1A1A1A" },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    backgroundColor: "#FFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: "#1A1A1A" },
  classItem: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  classItemSelected: {
    borderColor: "#5B5BD6",
    backgroundColor: "#F5F3FF",
  },
  classCode: { fontSize: 14, fontWeight: "700", color: "#5B5BD6" },
  className: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A1A1A",
    marginTop: 2,
  },
  classMeta: { fontSize: 12, color: "#6B7280", marginTop: 4 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: {
    textAlign: "center",
    color: "#9CA3AF",
    marginTop: 40,
    fontSize: 14,
    paddingHorizontal: 24,
  },
});
