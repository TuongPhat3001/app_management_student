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

interface ExamItem {
  id: number;
  title: string;
  courseName: string;
  courseCode?: string;
  examDate: string;
  startTime?: string;
  endTime?: string;
  room?: string;
  status: "upcoming" | "ongoing" | "finished";
}

const MOCK_EXAMS: ExamItem[] = [
  {
    id: 1,
    title: "Giữa kỳ Database Systems",
    courseName: "Database Systems",
    courseCode: "CSDL-202",
    examDate: "2026-08-15",
    startTime: "08:00",
    endTime: "10:00",
    room: "A101",
    status: "upcoming",
  },
  {
    id: 2,
    title: "Cuối kỳ Web Development",
    courseName: "Web Development",
    courseCode: "WEB-205",
    examDate: "2026-08-20",
    startTime: "13:00",
    endTime: "15:00",
    room: "B203",
    status: "upcoming",
  },
  {
    id: 3,
    title: "Giữa kỳ Software Engineering",
    courseName: "Software Engineering",
    courseCode: "SE-101",
    examDate: "2026-07-10",
    startTime: "09:00",
    endTime: "11:00",
    room: "A305",
    status: "finished",
  },
];

const STATUS_CFG = {
  upcoming: { label: "Sắp diễn ra", bg: "#DBEAFE", color: "#2563EB" },
  ongoing: { label: "Đang thi", bg: "#D1FAE5", color: "#059669" },
  finished: { label: "Đã kết thúc", bg: "#F3F4F6", color: "#6B7280" },
};

const Exams = () => {
  const router = useRouter();
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    courseName: "",
    examDate: "",
    startTime: "",
    endTime: "",
    room: "",
  });

  const fetchExams = useCallback(async () => {
    try {
      const res = await apiClient.get("/exams");
      const data = res.data?.data || res.data || [];
      setExams(Array.isArray(data) ? data : []);
    } catch {
      setExams(MOCK_EXAMS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchExams();
  };

  const handleCreate = async () => {
    if (
      !form.title.trim() ||
      !form.courseName.trim() ||
      !form.examDate.trim()
    ) {
      Alert.alert("Thông báo", "Vui lòng nhập tiêu đề, môn học và ngày thi.");
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post("/exams", {
        title: form.title.trim(),
        courseName: form.courseName.trim(),
        examDate: form.examDate.trim(),
        startTime: form.startTime.trim() || null,
        endTime: form.endTime.trim() || null,
        room: form.room.trim() || null,
      });
      Alert.alert("Thành công", "Tạo kỳ thi thành công!");
      setShowCreate(false);
      setForm({
        title: "",
        courseName: "",
        examDate: "",
        startTime: "",
        endTime: "",
        room: "",
      });
      fetchExams();
    } catch (error: any) {
      Alert.alert(
        "Lỗi",
        error?.response?.data?.message || "Không thể tạo kỳ thi.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (exam: ExamItem) => {
    Alert.alert("Xóa kỳ thi", `Xóa "${exam.title}"?`, [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            await apiClient.delete(`/exams/${exam.id}`);
            setExams((prev) => prev.filter((e) => e.id !== exam.id));
          } catch (error: any) {
            Alert.alert(
              "Lỗi",
              error?.response?.data?.message || "Không thể xóa.",
            );
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: ExamItem }) => {
    const cfg = STATUS_CFG[item.status] || STATUS_CFG.upcoming;
    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardCourse}>
              {item.courseName}
              {item.courseCode ? ` · ${item.courseCode}` : ""}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
            <Text style={[styles.statusText, { color: cfg.color }]}>
              {cfg.label}
            </Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={14} color="#6B7280" />
          <Text style={styles.metaText}>{item.examDate}</Text>
          {item.startTime ? (
            <>
              <Ionicons name="time-outline" size={14} color="#6B7280" />
              <Text style={styles.metaText}>
                {item.startTime}
                {item.endTime ? ` - ${item.endTime}` : ""}
              </Text>
            </>
          ) : null}
        </View>
        {item.room ? (
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={14} color="#6B7280" />
            <Text style={styles.metaText}>Phòng {item.room}</Text>
          </View>
        ) : null}

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.deleteAction}
            onPress={() => handleDelete(item)}>
            <Ionicons name="trash-outline" size={16} color="#EF4444" />
            <Text style={styles.deleteActionText}>Xóa</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3EEFF" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản lý kỳ thi</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowCreate(true)}>
          <Ionicons name="add" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#5B5BD6" />
        </View>
      ) : (
        <FlatList
          data={exams}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
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
              <Ionicons name="clipboard-outline" size={56} color="#D1D5DB" />
              <Text style={styles.emptyText}>Chưa có kỳ thi nào</Text>
            </View>
          }
        />
      )}

      {/* Modal tạo kỳ thi */}
      <Modal visible={showCreate} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Tạo kỳ thi mới</Text>
            <ScrollView keyboardShouldPersistTaps="handled">
              {(
                [
                  ["title", "Tiêu đề kỳ thi"],
                  ["courseName", "Tên môn học"],
                  ["examDate", "Ngày thi (YYYY-MM-DD)"],
                  ["startTime", "Giờ bắt đầu (HH:mm)"],
                  ["endTime", "Giờ kết thúc (HH:mm)"],
                  ["room", "Phòng thi"],
                ] as const
              ).map(([key, placeholder]) => (
                <TextInput
                  key={key}
                  style={styles.input}
                  placeholder={placeholder}
                  placeholderTextColor="#9CA3AF"
                  value={form[key]}
                  onChangeText={(t) => setForm((p) => ({ ...p, [key]: t }))}
                />
              ))}
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowCreate(false)}>
                <Text style={styles.cancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, submitting && { opacity: 0.7 }]}
                onPress={handleCreate}
                disabled={submitting}>
                {submitting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.saveText}>Tạo kỳ thi</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

export default Exams;

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
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  list: { padding: 16, paddingBottom: 32 },
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
  cardTop: { flexDirection: "row", marginBottom: 10 },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 2,
  },
  cardCourse: { fontSize: 13, color: "#6B7280" },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginLeft: 8,
    alignSelf: "flex-start",
  },
  statusText: { fontSize: 11, fontWeight: "600" },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  metaText: { fontSize: 13, color: "#6B7280", marginRight: 8 },
  cardActions: {
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    marginTop: 10,
    paddingTop: 10,
  },
  deleteAction: { flexDirection: "row", alignItems: "center", gap: 4 },
  deleteActionText: { fontSize: 13, color: "#EF4444", fontWeight: "600" },
  empty: { alignItems: "center", paddingTop: 60 },
  emptyText: { fontSize: 15, color: "#9CA3AF", marginTop: 10 },
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
    maxHeight: "85%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
    textAlign: "center",
    marginBottom: 16,
  },
  input: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#1A1A1A",
    marginBottom: 10,
  },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 12 },
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
