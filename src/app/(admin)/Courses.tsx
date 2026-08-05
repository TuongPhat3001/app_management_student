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

interface CourseItem {
  id: number;
  courseCode: string;
  courseName: string;
  credits: number;
  department?: string;
  description?: string;
}

const MOCK_COURSES: CourseItem[] = [
  {
    id: 1,
    courseCode: "CSDL202",
    courseName: "Database Systems",
    credits: 3,
    department: "Công nghệ thông tin",
    description: "Hệ quản trị cơ sở dữ liệu",
  },
  {
    id: 2,
    courseCode: "WEB205",
    courseName: "Web Development",
    credits: 3,
    department: "Công nghệ thông tin",
    description: "Phát triển ứng dụng web",
  },
  {
    id: 3,
    courseCode: "SE101",
    courseName: "Software Engineering",
    credits: 3,
    department: "Kỹ thuật phần mềm",
    description: "Công nghệ phần mềm",
  },
  {
    id: 4,
    courseCode: "MATH201",
    courseName: "Discrete Mathematics",
    credits: 3,
    department: "Toán ứng dụng",
    description: "Toán rời rạc",
  },
];

const Courses = () => {
  const router = useRouter();
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    courseCode: "",
    courseName: "",
    credits: "",
    department: "",
    description: "",
  });

  const fetchCourses = useCallback(async () => {
    try {
      const res = await apiClient.get("/courses");
      const data = res.data?.data || res.data || [];
      setCourses(Array.isArray(data) ? data : []);
    } catch {
      setCourses(MOCK_COURSES);
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

  const filtered = courses.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      c.courseName?.toLowerCase().includes(q) ||
      c.courseCode?.toLowerCase().includes(q) ||
      c.department?.toLowerCase().includes(q)
    );
  });

  const resetForm = () => {
    setForm({
      courseCode: "",
      courseName: "",
      credits: "",
      department: "",
      description: "",
    });
  };

  const handleCreate = async () => {
    if (
      !form.courseCode.trim() ||
      !form.courseName.trim() ||
      !form.credits.trim()
    ) {
      Alert.alert("Thông báo", "Vui lòng nhập mã môn, tên môn và số tín chỉ.");
      return;
    }

    const creditsNum = Number(form.credits);
    if (isNaN(creditsNum) || creditsNum <= 0) {
      Alert.alert("Thông báo", "Số tín chỉ phải là số dương.");
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post("/courses", {
        courseCode: form.courseCode.trim(),
        courseName: form.courseName.trim(),
        credits: creditsNum,
        department: form.department.trim() || null,
        description: form.description.trim() || null,
      });

      Alert.alert("Thành công", "Tạo môn học thành công!");
      setShowCreate(false);
      resetForm();
      fetchCourses();
    } catch (error: any) {
      Alert.alert(
        "Lỗi",
        error?.response?.data?.message || "Không thể tạo môn học.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (course: CourseItem) => {
    Alert.alert("Xóa môn học", `Bạn có chắc muốn xóa "${course.courseName}"?`, [
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
            Alert.alert(
              "Lỗi",
              error?.response?.data?.message || "Không thể xóa môn học.",
            );
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: CourseItem }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.codeBadge}>
          <Text style={styles.codeText}>{item.courseCode}</Text>
        </View>
        <View style={styles.creditBadge}>
          <Text style={styles.creditText}>{item.credits} TC</Text>
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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3EEFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản lý môn học</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowCreate(true)}
          activeOpacity={0.8}>
          <Ionicons name="add" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Search */}
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

      <Text style={styles.countText}>{filtered.length} môn học</Text>

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
              <Text style={styles.emptyText}>Chưa có môn học nào</Text>
            </View>
          }
        />
      )}

      {/* Modal tạo môn học */}
      <Modal visible={showCreate} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Tạo môn học mới</Text>

            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.inputLabel}>Mã môn học *</Text>
              <TextInput
                style={styles.input}
                placeholder="VD: CSDL202"
                placeholderTextColor="#9CA3AF"
                value={form.courseCode}
                onChangeText={(t) => setForm((p) => ({ ...p, courseCode: t }))}
                autoCapitalize="characters"
              />

              <Text style={styles.inputLabel}>Tên môn học *</Text>
              <TextInput
                style={styles.input}
                placeholder="VD: Database Systems"
                placeholderTextColor="#9CA3AF"
                value={form.courseName}
                onChangeText={(t) => setForm((p) => ({ ...p, courseName: t }))}
              />

              <Text style={styles.inputLabel}>Số tín chỉ *</Text>
              <TextInput
                style={styles.input}
                placeholder="VD: 3"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={form.credits}
                onChangeText={(t) => setForm((p) => ({ ...p, credits: t }))}
              />

              <Text style={styles.inputLabel}>Khoa / Bộ môn</Text>
              <TextInput
                style={styles.input}
                placeholder="VD: Công nghệ thông tin"
                placeholderTextColor="#9CA3AF"
                value={form.department}
                onChangeText={(t) => setForm((p) => ({ ...p, department: t }))}
              />

              <Text style={styles.inputLabel}>Mô tả</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Mô tả ngắn về môn học..."
                placeholderTextColor="#9CA3AF"
                value={form.description}
                onChangeText={(t) => setForm((p) => ({ ...p, description: t }))}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setShowCreate(false);
                  resetForm();
                }}>
                <Text style={styles.cancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, submitting && { opacity: 0.7 }]}
                onPress={handleCreate}
                disabled={submitting}>
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveText}>Tạo môn học</Text>
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "600",
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
  countText: {
    fontSize: 13,
    color: "#6B7280",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
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
  codeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#5B5BD6",
  },
  creditBadge: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  creditText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },
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
  },
  deleteAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  deleteActionText: {
    fontSize: 13,
    color: "#EF4444",
    fontWeight: "600",
  },
  empty: { alignItems: "center", paddingTop: 60 },
  emptyText: { fontSize: 15, color: "#9CA3AF", marginTop: 10 },

  // Modal
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
    paddingTop: 24,
    paddingBottom: 36,
    maxHeight: "90%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
    textAlign: "center",
    marginBottom: 18,
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
  textArea: {
    height: 80,
    paddingTop: 12,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
  },
  cancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6B7280",
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#5B5BD6",
    alignItems: "center",
  },
  saveText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
