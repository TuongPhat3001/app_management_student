import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type AssignmentStatus = "open" | "closed" | "grading";

interface Assignment {
  id: string;
  title: string;
  course: string;
  courseCode: string;
  dueDate: string;
  submitted: number;
  total: number;
  status: AssignmentStatus;
}

const MOCK_ASSIGNMENTS: Assignment[] = [
  {
    id: "1",
    title: "Bài tập SQL Queries",
    course: "Database Systems",
    courseCode: "CSDL-202",
    dueDate: "30/07/2026",
    submitted: 28,
    total: 40,
    status: "open",
  },
  {
    id: "2",
    title: "Project React Native App",
    course: "Web Development",
    courseCode: "WEB-205",
    dueDate: "05/08/2026",
    submitted: 12,
    total: 35,
    status: "open",
  },
  {
    id: "3",
    title: "UML Diagrams",
    course: "Software Engineering",
    courseCode: "SE-101",
    dueDate: "20/07/2026",
    submitted: 42,
    total: 42,
    status: "grading",
  },
  {
    id: "4",
    title: "Normalization Exercise",
    course: "Database Systems",
    courseCode: "CSDL-202",
    dueDate: "15/07/2026",
    submitted: 38,
    total: 40,
    status: "closed",
  },
];

const STATUS_CONFIG = {
  open: { label: "Đang mở", bg: "#D1FAE5", color: "#059669" },
  grading: { label: "Chờ chấm", bg: "#FEF3C7", color: "#D97706" },
  closed: { label: "Đã đóng", bg: "#F3F4F6", color: "#6B7280" },
};

const ManageAssignments = () => {
  const [assignments, setAssignments] = useState(MOCK_ASSIGNMENTS);
  const [filter, setFilter] = useState<"all" | AssignmentStatus>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCourse, setNewCourse] = useState("");
  const [newDue, setNewDue] = useState("");

  const filtered =
    filter === "all"
      ? assignments
      : assignments.filter((a) => a.status === filter);

  const handleCreate = () => {
    if (!newTitle.trim() || !newCourse.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tiêu đề và học phần");
      return;
    }
    const item: Assignment = {
      id: String(Date.now()),
      title: newTitle.trim(),
      course: newCourse.trim(),
      courseCode: "",
      dueDate: newDue.trim() || "Chưa đặt",
      submitted: 0,
      total: 40,
      status: "open",
    };
    setAssignments((prev) => [item, ...prev]);
    setShowCreate(false);
    setNewTitle("");
    setNewCourse("");
    setNewDue("");
    Alert.alert("Thành công", "Đã tạo bài tập mới");
  };

  const renderItem = ({ item }: { item: Assignment }) => {
    const cfg = STATUS_CONFIG[item.status];
    const progress = item.total > 0 ? item.submitted / item.total : 0;

    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.7}>
        <View style={styles.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.cardCourse}>
              {item.course}
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
          <Text style={styles.metaText}>Hạn nộp: {item.dueDate}</Text>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>
              Đã nộp {item.submitted}/{item.total}
            </Text>
            <Text style={styles.progressPct}>
              {Math.round(progress * 100)}%
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, { width: `${progress * 100}%` }]}
            />
          </View>
        </View>

        <View style={styles.cardActions}>
          {item.status === "open" && (
            <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
              <Ionicons name="eye-outline" size={16} color="#5B5BD6" />
              <Text style={styles.actionBtnText}>Xem bài nộp</Text>
            </TouchableOpacity>
          )}
          {item.status === "grading" && (
            <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
              <Ionicons name="create-outline" size={16} color="#D97706" />
              <Text style={[styles.actionBtnText, { color: "#D97706" }]}>
                Chấm điểm
              </Text>
            </TouchableOpacity>
          )}
          {item.status === "closed" && (
            <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
              <Ionicons name="stats-chart-outline" size={16} color="#6B7280" />
              <Text style={[styles.actionBtnText, { color: "#6B7280" }]}>
                Xem kết quả
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3EEFF" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Quản lý bài tập</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowCreate(true)}
          activeOpacity={0.8}>
          <Ionicons name="add" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}>
        {(
          [
            { key: "all", label: "Tất cả" },
            { key: "open", label: "Đang mở" },
            { key: "grading", label: "Chờ chấm" },
            { key: "closed", label: "Đã đóng" },
          ] as const
        ).map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[
              styles.filterChip,
              filter === f.key && styles.filterChipActive,
            ]}
            onPress={() => setFilter(f.key)}
            activeOpacity={0.7}>
            <Text
              style={[
                styles.filterChipText,
                filter === f.key && styles.filterChipTextActive,
              ]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="document-text-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>Chưa có bài tập nào</Text>
          </View>
        }
      />

      {/* Create modal */}
      <Modal visible={showCreate} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Tạo bài tập mới</Text>

            <Text style={styles.inputLabel}>Tiêu đề bài tập</Text>
            <TextInput
              style={styles.input}
              placeholder="VD: Bài tập SQL Queries"
              placeholderTextColor="#9CA3AF"
              value={newTitle}
              onChangeText={setNewTitle}
            />

            <Text style={styles.inputLabel}>Học phần</Text>
            <TextInput
              style={styles.input}
              placeholder="VD: Database Systems"
              placeholderTextColor="#9CA3AF"
              value={newCourse}
              onChangeText={setNewCourse}
            />

            <Text style={styles.inputLabel}>Hạn nộp</Text>
            <TextInput
              style={styles.input}
              placeholder="VD: 30/07/2026"
              placeholderTextColor="#9CA3AF"
              value={newDue}
              onChangeText={setNewDue}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowCreate(false)}>
                <Text style={styles.cancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleCreate}>
                <Text style={styles.saveText}>Tạo bài tập</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

export default ManageAssignments;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F3EEFF" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#1A1A1A" },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#5B5BD6",
    justifyContent: "center",
    alignItems: "center",
  },

  filterRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: "#5B5BD6",
    borderColor: "#5B5BD6",
  },
  filterChipText: { fontSize: 13, fontWeight: "600", color: "#6B7280" },
  filterChipTextActive: { color: "#FFFFFF" },

  list: { paddingHorizontal: 16, paddingBottom: 32 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 3,
  },
  cardCourse: { fontSize: 13, color: "#6B7280" },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 10,
  },
  statusText: { fontSize: 11, fontWeight: "600" },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  metaText: { fontSize: 13, color: "#6B7280" },

  progressSection: { marginBottom: 12 },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  progressLabel: { fontSize: 12, color: "#6B7280" },
  progressPct: { fontSize: 12, fontWeight: "600", color: "#5B5BD6" },
  progressBar: {
    height: 6,
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#5B5BD6",
    borderRadius: 3,
  },

  cardActions: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 12,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#5B5BD6",
  },

  empty: { alignItems: "center", paddingTop: 80 },
  emptyText: { fontSize: 16, color: "#9CA3AF", marginTop: 12 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
    textAlign: "center",
    marginBottom: 24,
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
    paddingVertical: 13,
    fontSize: 15,
    color: "#1A1A1A",
    marginBottom: 16,
  },
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
