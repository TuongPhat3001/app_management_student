import apiClient from "@/src/api/axios";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
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

interface CourseItem {
  id: number;
  courseCode: string;
  courseName: string;
  credits: number;
  department?: string;
  description?: string;
}

type FormState = {
  courseCode: string;
  courseName: string;
  credits: string;
  department: string;
  description: string;
};

const emptyForm: FormState = {
  courseCode: "",
  courseName: "",
  credits: "",
  department: "",
  description: "",
};

const normalizeCourse = (raw: any): CourseItem | null => {
  const id = Number(raw?.id ?? raw?.ID ?? raw?.Id);
  if (!id || Number.isNaN(id)) return null;

  const courseCode = String(
    raw?.courseCode ??
      raw?.CourseCode ??
      raw?.code ??
      raw?.Code ??
      raw?.course_code ??
      "",
  ).trim();

  const courseName = String(
    raw?.courseName ??
      raw?.CourseName ??
      raw?.name ??
      raw?.Name ??
      raw?.course_name ??
      "",
  ).trim();

  const credits = Number(
    raw?.credits ?? raw?.Credits ?? raw?.credit ?? raw?.Credit ?? 0,
  );

  const department =
    raw?.department ??
    raw?.Department ??
    raw?.faculty ??
    raw?.Faculty ??
    raw?.majorName ??
    undefined;

  const description =
    raw?.description ?? raw?.Description ?? raw?.desc ?? undefined;

  return {
    id,
    courseCode: courseCode || `MH-${id}`,
    courseName: courseName || "Chưa đặt tên",
    credits: Number.isFinite(credits) && credits > 0 ? credits : 0,
    department: department ? String(department) : undefined,
    description: description ? String(description) : undefined,
  };
};

const extractError = (error: any, fallback: string) => {
  const data = error?.response?.data;
  if (!error?.response) {
    return "Không kết nối được server. Kiểm tra mạng / IP backend.";
  }
  if (error.response.status === 401 || error.response.status === 403) {
    return "Bạn chưa đăng nhập hoặc không có quyền admin.";
  }
  if (typeof data?.message === "string") return data.message;
  if (typeof data?.error === "string") return data.error;
  if (Array.isArray(data?.message)) return data.message.join("\n");
  return fallback;
};

const Courses = () => {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<CourseItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchCourses = useCallback(async () => {
    try {
      setFetchError(null);
      const res = await apiClient.get("/courses");
      const raw = res.data?.data ?? res.data ?? [];
      const list = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.items)
          ? raw.items
          : Array.isArray(raw?.courses)
            ? raw.courses
            : [];

      const normalized = list
        .map(normalizeCourse)
        .filter((c: CourseItem | null): c is CourseItem => c !== null);

      setCourses(normalized);
    } catch (error: any) {
      setFetchError(extractError(error, "Không tải được danh sách môn học."));
      setCourses([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCourses();
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter(
      (c) =>
        c.courseName.toLowerCase().includes(q) ||
        c.courseCode.toLowerCase().includes(q) ||
        (c.department || "").toLowerCase().includes(q),
    );
  }, [courses, search]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (course: CourseItem) => {
    setEditing(course);
    setForm({
      courseCode: course.courseCode,
      courseName: course.courseName,
      credits: course.credits ? String(course.credits) : "",
      department: course.department || "",
      description: course.description || "",
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const setField = <K extends keyof FormState>(key: K, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validate = () => {
    if (!form.courseCode.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập mã môn học.");
      return false;
    }
    if (!form.courseName.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập tên môn học.");
      return false;
    }
    const creditsNum = Number(form.credits);
    if (!form.credits.trim() || isNaN(creditsNum) || creditsNum <= 0) {
      Alert.alert("Sai định dạng", "Số tín chỉ phải là số dương.");
      return false;
    }
    return true;
  };

  const buildPayload = () => {
    const creditsNum = Number(form.credits);
    const payload: Record<string, any> = {
      courseCode: form.courseCode.trim(),
      courseName: form.courseName.trim(),
      credits: creditsNum,
      code: form.courseCode.trim(),
      name: form.courseName.trim(),
      CourseCode: form.courseCode.trim(),
      CourseName: form.courseName.trim(),
      Credits: creditsNum,
    };
    if (form.department.trim()) {
      payload.department = form.department.trim();
      payload.Department = form.department.trim();
    }
    if (form.description.trim()) {
      payload.description = form.description.trim();
      payload.Description = form.description.trim();
    }
    return payload;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = buildPayload();

      if (editing) {
        await apiClient.put(`/courses/${editing.id}`, payload);
        Alert.alert("Thành công", "Cập nhật môn học thành công!");
      } else {
        await apiClient.post("/courses", payload);
        Alert.alert("Thành công", "Tạo môn học thành công!");
      }

      closeModal();
      fetchCourses();
    } catch (error: any) {
      Alert.alert(
        "Lỗi",
        extractError(
          error,
          editing ? "Không thể cập nhật môn học." : "Không thể tạo môn học.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (course: CourseItem) => {
    Alert.alert(
      "Xóa môn học",
      `Bạn có chắc muốn xóa "${course.courseName}" (${course.courseCode})?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              await apiClient.delete(`/courses/${course.id}`);
              setCourses((prev) => prev.filter((c) => c.id !== course.id));
              Alert.alert("Thành công", "Đã xóa môn học.");
            } catch (error: any) {
              Alert.alert("Lỗi", extractError(error, "Không thể xóa môn học."));
            }
          },
        },
      ],
    );
  };

  const renderItem = ({ item }: { item: CourseItem }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.codeBadge}>
          <Text style={styles.codeText}>{item.courseCode}</Text>
        </View>
        <View style={styles.creditBadge}>
          <Text style={styles.creditText}>
            {item.credits > 0 ? `${item.credits} TC` : "— TC"}
          </Text>
        </View>
      </View>

      <Text style={styles.courseName}>{item.courseName}</Text>

      {item.department ? (
        <View style={styles.metaRow}>
          <Ionicons name="business-outline" size={14} color="#6B7280" />
          <Text style={styles.metaText}>{item.department}</Text>
        </View>
      ) : null}

      {item.description ? (
        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>
      ) : null}

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.editAction}
          onPress={() => openEdit(item)}
          activeOpacity={0.7}>
          <Ionicons name="create-outline" size={16} color="#5B5BD6" />
          <Text style={styles.editActionText}>Sửa</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteAction}
          onPress={() => handleDelete(item)}
          activeOpacity={0.7}>
          <Ionicons name="trash-outline" size={16} color="#EF4444" />
          <Text style={styles.deleteActionText}>Xóa</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3EEFF" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Quản lý môn học</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={openCreate}
          activeOpacity={0.8}>
          <Ionicons name="add" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm mã môn, tên môn, khoa..."
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.countRow}>
        <Text style={styles.countText}>{filtered.length} môn học</Text>
        {fetchError ? (
          <TouchableOpacity onPress={onRefresh}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {fetchError ? (
        <View style={styles.errorBanner}>
          <Ionicons name="warning-outline" size={16} color="#B45309" />
          <Text style={styles.errorBannerText}>{fetchError}</Text>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#5B5BD6" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#5B5BD6"]}
              tintColor="#5B5BD6"
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="book-outline" size={56} color="#D1D5DB" />
              <Text style={styles.emptyText}>
                {fetchError
                  ? "Không tải được dữ liệu từ server"
                  : search
                    ? "Không tìm thấy môn học phù hợp"
                    : "Chưa có môn học nào"}
              </Text>
              {!fetchError && !search ? (
                <TouchableOpacity style={styles.emptyBtn} onPress={openCreate}>
                  <Text style={styles.emptyBtnText}>
                    + Tạo môn học đầu tiên
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          }
        />
      )}

      <Modal visible={showModal} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editing ? "Sửa môn học" : "Tạo môn học mới"}
              </Text>
              <TouchableOpacity onPress={closeModal} hitSlop={12}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Mã môn học *</Text>
              <TextInput
                style={styles.input}
                placeholder="VD: CSDL202"
                placeholderTextColor="#9CA3AF"
                value={form.courseCode}
                onChangeText={(t) => setField("courseCode", t)}
                autoCapitalize="characters"
              />

              <Text style={styles.inputLabel}>Tên môn học *</Text>
              <TextInput
                style={styles.input}
                placeholder="VD: Database Systems"
                placeholderTextColor="#9CA3AF"
                value={form.courseName}
                onChangeText={(t) => setField("courseName", t)}
              />

              <Text style={styles.inputLabel}>Số tín chỉ *</Text>
              <TextInput
                style={styles.input}
                placeholder="VD: 3"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={form.credits}
                onChangeText={(t) => setField("credits", t)}
              />

              <Text style={styles.inputLabel}>Khoa / Bộ môn</Text>
              <TextInput
                style={styles.input}
                placeholder="VD: Công nghệ thông tin"
                placeholderTextColor="#9CA3AF"
                value={form.department}
                onChangeText={(t) => setField("department", t)}
              />

              <Text style={styles.inputLabel}>Mô tả</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Mô tả ngắn về môn học..."
                placeholderTextColor="#9CA3AF"
                value={form.description}
                onChangeText={(t) => setField("description", t)}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={closeModal}>
                <Text style={styles.cancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, submitting && { opacity: 0.7 }]}
                onPress={handleSubmit}
                disabled={submitting}>
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveText}>
                    {editing ? "Lưu thay đổi" : "Tạo môn học"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

export default Courses;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F3EEFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#5B5BD6",
    justifyContent: "center",
    alignItems: "center",
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#1A1A1A" },
  countRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  countText: { fontSize: 13, color: "#6B7280" },
  retryText: { fontSize: 13, fontWeight: "600", color: "#5B5BD6" },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: "#FEF3C7",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorBannerText: { flex: 1, fontSize: 12, color: "#92400E", lineHeight: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  codeBadge: {
    backgroundColor: "#EDE9FE",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  codeText: { fontSize: 12, fontWeight: "700", color: "#5B5BD6" },
  creditBadge: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  creditText: { fontSize: 12, fontWeight: "600", color: "#6B7280" },
  courseName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  metaText: { fontSize: 13, color: "#6B7280" },
  description: {
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 4,
    lineHeight: 18,
  },
  cardActions: {
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    marginTop: 12,
    paddingTop: 10,
    flexDirection: "row",
    gap: 20,
  },
  editAction: { flexDirection: "row", alignItems: "center", gap: 4 },
  editActionText: { fontSize: 13, color: "#5B5BD6", fontWeight: "600" },
  deleteAction: { flexDirection: "row", alignItems: "center", gap: 4 },
  deleteActionText: { fontSize: 13, color: "#EF4444", fontWeight: "600" },
  empty: { alignItems: "center", paddingTop: 60, paddingHorizontal: 24 },
  emptyText: {
    fontSize: 15,
    color: "#9CA3AF",
    marginTop: 10,
    textAlign: "center",
  },
  emptyBtn: {
    marginTop: 16,
    backgroundColor: "#5B5BD6",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyBtnText: { color: "#FFF", fontWeight: "700", fontSize: 14 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 36,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#1A1A1A",
    marginBottom: 14,
  },
  textArea: { height: 80, paddingTop: 12 },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 8 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
  },
  cancelText: { fontSize: 15, fontWeight: "600", color: "#6B7280" },
  saveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#5B5BD6",
    alignItems: "center",
  },
  saveText: { fontSize: 15, fontWeight: "600", color: "#FFFFFF" },
});
