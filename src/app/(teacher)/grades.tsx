import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface StudentGrade {
  id: string;
  studentId: string;
  name: string;
  midterm: number | null;
  final: number | null;
  assignment: number | null;
  total: number | null;
}

interface ClassItem {
  id: string;
  name: string;
  code: string;
  students: number;
}

const CLASSES: ClassItem[] = [
  { id: "1", name: "Database Systems", code: "CSDL-202", students: 40 },
  { id: "2", name: "Web Development", code: "WEB-205", students: 35 },
  { id: "3", name: "Software Engineering", code: "SE-101", students: 42 },
];

const MOCK_GRADES: StudentGrade[] = [
  {
    id: "1",
    studentId: "20260001",
    name: "Nguyễn Văn An",
    midterm: 8.5,
    final: 9.0,
    assignment: 8.0,
    total: 8.6,
  },
  {
    id: "2",
    studentId: "20260002",
    name: "Trần Thị Bình",
    midterm: 7.0,
    final: 8.0,
    assignment: 7.5,
    total: 7.6,
  },
  {
    id: "3",
    studentId: "20260003",
    name: "Lê Minh Cường",
    midterm: 9.0,
    final: 9.5,
    assignment: 9.0,
    total: 9.2,
  },
  {
    id: "4",
    studentId: "20260004",
    name: "Phạm Thu Hà",
    midterm: 6.5,
    final: null,
    assignment: 7.0,
    total: null,
  },
  {
    id: "5",
    studentId: "20260005",
    name: "Hoàng Đức Khoa",
    midterm: 8.0,
    final: 7.5,
    assignment: 8.5,
    total: 7.9,
  },
  {
    id: "6",
    studentId: "20260006",
    name: "Vũ Thị Lan",
    midterm: null,
    final: null,
    assignment: 8.0,
    total: null,
  },
];

const getGradeColor = (g: number | null) => {
  if (g === null) return "#9CA3AF";
  if (g >= 8.5) return "#059669";
  if (g >= 7.0) return "#0EA5E9";
  if (g >= 5.0) return "#D97706";
  return "#DC2626";
};

const Grades = () => {
  const [selectedClass, setSelectedClass] = useState<ClassItem>(CLASSES[0]);
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [grades, setGrades] = useState<StudentGrade[]>(MOCK_GRADES);
  const [editStudent, setEditStudent] = useState<StudentGrade | null>(null);
  const [editField, setEditField] = useState<
    "midterm" | "final" | "assignment"
  >("midterm");
  const [editValue, setEditValue] = useState("");

  const openEdit = (
    student: StudentGrade,
    field: "midterm" | "final" | "assignment",
  ) => {
    setEditStudent(student);
    setEditField(field);
    const val = student[field];
    setEditValue(val !== null ? String(val) : "");
  };

  const saveGrade = () => {
    if (!editStudent) return;
    const num = parseFloat(editValue);
    if (isNaN(num) || num < 0 || num > 10) {
      Alert.alert("Lỗi", "Điểm phải từ 0 đến 10");
      return;
    }
    setGrades((prev) =>
      prev.map((g) => {
        if (g.id !== editStudent.id) return g;
        const updated = { ...g, [editField]: num };
        const { midterm, final, assignment } = updated;
        if (midterm !== null && final !== null && assignment !== null) {
          updated.total = parseFloat(
            (midterm * 0.3 + assignment * 0.2 + final * 0.5).toFixed(1),
          );
        }
        return updated;
      }),
    );
    setEditStudent(null);
  };

  const renderStudent = ({ item }: { item: StudentGrade }) => (
    <View style={styles.studentCard}>
      <View style={styles.studentHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.studentName}>{item.name}</Text>
          <Text style={styles.studentId}>{item.studentId}</Text>
        </View>
        <Text style={[styles.totalGrade, { color: getGradeColor(item.total) }]}>
          {item.total !== null ? item.total : "—"}
        </Text>
      </View>

      <View style={styles.gradeRow}>
        {(["midterm", "assignment", "final"] as const).map((field) => {
          const labels = {
            midterm: "Giữa kỳ",
            assignment: "Bài tập",
            final: "Cuối kỳ",
          };
          const val = item[field];
          return (
            <TouchableOpacity
              key={field}
              style={styles.gradeBox}
              onPress={() => openEdit(item, field)}
              activeOpacity={0.7}>
              <Text style={styles.gradeBoxLabel}>{labels[field]}</Text>
              <Text
                style={[styles.gradeBoxValue, { color: getGradeColor(val) }]}>
                {val !== null ? val : "Nhập"}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3EEFF" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Quản lý điểm</Text>
      </View>

      {/* Class selector */}
      <TouchableOpacity
        style={styles.classSelector}
        onPress={() => setShowClassPicker(!showClassPicker)}
        activeOpacity={0.7}>
        <View>
          <Text style={styles.classSelectorLabel}>Lớp học phần</Text>
          <Text style={styles.classSelectorValue}>
            {selectedClass.name} ({selectedClass.code})
          </Text>
        </View>
        <Ionicons
          name={showClassPicker ? "chevron-up" : "chevron-down"}
          size={20}
          color="#6B7280"
        />
      </TouchableOpacity>

      {showClassPicker && (
        <View style={styles.pickerList}>
          {CLASSES.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={styles.pickerItem}
              onPress={() => {
                setSelectedClass(c);
                setShowClassPicker(false);
              }}>
              <Text
                style={[
                  styles.pickerItemText,
                  c.id === selectedClass.id && styles.pickerItemActive,
                ]}>
                {c.name} — {c.students} SV
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Summary */}
      <View style={styles.summaryRow}>
        <Text style={styles.summaryText}>
          {grades.length} sinh viên · Đã nhập:{" "}
          {grades.filter((g) => g.total !== null).length}
        </Text>
      </View>

      <FlatList
        data={grades}
        keyExtractor={(item) => item.id}
        renderItem={renderStudent}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      {/* Edit modal */}
      <Modal visible={!!editStudent} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              Nhập điểm — {editStudent?.name}
            </Text>
            <Text style={styles.modalSubtitle}>
              {editField === "midterm"
                ? "Điểm giữa kỳ"
                : editField === "final"
                  ? "Điểm cuối kỳ"
                  : "Điểm bài tập"}
            </Text>
            <TextInput
              style={styles.input}
              value={editValue}
              onChangeText={setEditValue}
              keyboardType="decimal-pad"
              placeholder="0 - 10"
              placeholderTextColor="#9CA3AF"
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setEditStudent(null)}>
                <Text style={styles.cancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveGrade}>
                <Text style={styles.saveText}>Lưu điểm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

export default Grades;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F3EEFF" },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#1A1A1A" },

  classSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 14,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  classSelectorLabel: { fontSize: 12, color: "#9CA3AF", marginBottom: 2 },
  classSelectorValue: { fontSize: 15, fontWeight: "600", color: "#1A1A1A" },
  pickerList: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 6,
    borderRadius: 12,
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
  pickerItemText: { fontSize: 14, color: "#374151" },
  pickerItemActive: { color: "#5B5BD6", fontWeight: "600" },

  summaryRow: { paddingHorizontal: 20, paddingVertical: 10 },
  summaryText: { fontSize: 13, color: "#6B7280" },

  list: { paddingHorizontal: 16, paddingBottom: 32 },
  studentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  studentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EDE9FE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: { fontSize: 16, fontWeight: "700", color: "#5B5BD6" },
  studentName: { fontSize: 15, fontWeight: "600", color: "#1A1A1A" },
  studentId: { fontSize: 12, color: "#9CA3AF", marginTop: 1 },
  totalGrade: { fontSize: 20, fontWeight: "700" },

  gradeRow: { flexDirection: "row", gap: 8 },
  gradeBox: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  gradeBoxLabel: { fontSize: 11, color: "#9CA3AF", marginBottom: 2 },
  gradeBoxValue: { fontSize: 16, fontWeight: "700" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1A1A1A",
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    color: "#1A1A1A",
    marginBottom: 20,
  },
  modalActions: { flexDirection: "row", gap: 12 },
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
