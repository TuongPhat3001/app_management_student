import apiClient from "@/src/api/axios";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * POST /classes/:id/students
 * Body: { studentIds: number[] }  — ID bảng students (không phải users.id)
 *
 * Xếp SV đã có vào lớp đang học + sync enrollments (backend).
 */

type ClassItem = {
  id: number;
  code: string;
  label: string;
  max?: number;
  status?: string;
};

type StudentItem = {
  id: number;
  code: string;
  name: string;
  classId?: number;
  classCode?: string;
};

const AddStudentToClass: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [classPicker, setClassPicker] = useState(false);
  const [classQ, setClassQ] = useState("");
  const [studentQ, setStudentQ] = useState("");

  const load = useCallback(async () => {
    try {
      const [cRes, sRes] = await Promise.all([
        apiClient.get("/classes"),
        apiClient.get("/students"),
      ]);
      const cRaw = cRes.data?.data ?? cRes.data ?? [];
      const sRaw = sRes.data?.data ?? sRes.data ?? [];

      const cList: ClassItem[] = (Array.isArray(cRaw) ? cRaw : [])
        .map((c: any) => {
          const id = Number(c.ID ?? c.id);
          if (!id) return null;
          const code = String(c.ClassCode ?? c.classCode ?? id);
          const major = c.Major?.Name ?? c.Major?.name ?? "";
          const status = String(c.Status ?? c.status ?? "open").toLowerCase();
          return {
            id,
            code,
            label: major ? `${code} · ${major}` : code,
            max: Number(c.MaxStudents ?? c.maxStudents ?? 0) || undefined,
            status,
          };
        })
        .filter(Boolean) as ClassItem[];

      // Ưu tiên lớp open; nếu filter hết thì hiện tất cả
      const openOnly = cList.filter(
        (c) =>
          !c.status ||
          c.status === "open" ||
          c.status === "active" ||
          c.status === "ongoing",
      );
      setClasses(openOnly.length ? openOnly : cList);

      setStudents(
        (Array.isArray(sRaw) ? sRaw : [])
          .map((s: any) => {
            const id = Number(s.ID ?? s.id);
            if (!id) return null;
            return {
              id,
              code: String(s.StudentCode ?? s.studentCode ?? id),
              name: String(
                s.User?.FullName ??
                  s.User?.fullName ??
                  s.fullName ??
                  s.FullName ??
                  "SV",
              ),
              classId:
                Number(s.ClassID ?? s.classId ?? s.Class?.ID ?? 0) || undefined,
              classCode: String(s.Class?.ClassCode ?? s.Class?.classCode ?? ""),
            };
          })
          .filter(Boolean) as StudentItem[],
      );
    } catch (e) {
      console.log("load error", e);
      setClasses([]);
      setStudents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredClasses = useMemo(() => {
    const q = classQ.trim().toLowerCase();
    if (!q) return classes;
    return classes.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.label.toLowerCase().includes(q) ||
        String(c.id).includes(q),
    );
  }, [classes, classQ]);

  const filteredStudents = useMemo(() => {
    const q = studentQ.trim().toLowerCase();
    return students.filter((s) => {
      if (selectedClass && s.classId && s.classId === selectedClass.id) {
        // đã thuộc lớp này — vẫn hiện nhưng có thể disable
      }
      if (!q) return true;
      return (
        s.code.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        String(s.id).includes(q)
      );
    });
  }, [students, studentQ, selectedClass]);

  const toggle = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!selectedClass) {
      Alert.alert("Thiếu thông tin", "Chọn lớp học.");
      return;
    }
    if (selectedIds.size === 0) {
      Alert.alert("Thiếu thông tin", "Chọn ít nhất một sinh viên.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiClient.post(
        `/classes/${selectedClass.id}/students`,
        { studentIds: Array.from(selectedIds) },
      );
      Alert.alert(
        "Thành công",
        res.data?.message ||
          `Đã xếp ${selectedIds.size} SV vào lớp ${selectedClass.code}.`,
      );
      setSelectedIds(new Set());
      load();
    } catch (e: any) {
      const d = e?.response?.data;
      Alert.alert(
        "Lỗi",
        [d?.message, d?.error].filter(Boolean).join("\n") ||
          "Thêm sinh viên vào lớp thất bại.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#5B5BD6" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.title}>Thêm SV vào lớp</Text>
        <TouchableOpacity
          onPress={() => {
            setRefreshing(true);
            load();
          }}
          style={styles.back}>
          <Ionicons name="refresh" size={20} color="#5B5BD6" />
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <Text style={styles.hint}>
          Chọn lớp đang học + SV đã có trong hệ thống. API: POST
          /classes/:id/students {"{ studentIds }"}
        </Text>

        <Text style={styles.label}>Lớp học *</Text>
        <TouchableOpacity
          style={styles.select}
          onPress={() => setClassPicker(true)}>
          <Text
            style={
              selectedClass ? styles.selectValue : styles.selectPlaceholder
            }>
            {selectedClass
              ? `${selectedClass.label} (ID ${selectedClass.id})`
              : "Chọn lớp..."}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
        </TouchableOpacity>

        <Text style={styles.label}>
          Sinh viên * ({selectedIds.size} đã chọn)
        </Text>
        <View style={styles.search}>
          <Ionicons name="search" size={18} color="#9CA3AF" />
          <TextInput
            style={{ flex: 1, marginLeft: 8 }}
            placeholder="Tìm mã / tên SV..."
            value={studentQ}
            onChangeText={setStudentQ}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <FlatList
          data={filteredStudents}
          keyExtractor={(i) => String(i.id)}
          style={{ flex: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              colors={["#5B5BD6"]}
            />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>Không có sinh viên</Text>
          }
          renderItem={({ item }) => {
            const on = selectedIds.has(item.id);
            const already = selectedClass && item.classId === selectedClass.id;
            return (
              <TouchableOpacity
                style={[styles.row, on && styles.rowOn]}
                onPress={() => toggle(item.id)}
                activeOpacity={0.7}>
                <Ionicons
                  name={on ? "checkbox" : "square-outline"}
                  size={22}
                  color={on ? "#5B5BD6" : "#9CA3AF"}
                />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.rowTitle}>
                    {item.code} · {item.name}
                  </Text>
                  <Text style={styles.rowSub}>
                    ID: {item.id}
                    {item.classCode ? ` · Lớp hiện tại: ${item.classCode}` : ""}
                    {already ? " · (đã ở lớp này)" : ""}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />

        <TouchableOpacity
          style={[
            styles.btn,
            (submitting || selectedIds.size === 0 || !selectedClass) && {
              opacity: 0.6,
            },
          ]}
          onPress={handleSubmit}
          disabled={submitting || selectedIds.size === 0 || !selectedClass}>
          {submitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.btnText}>
              Xếp {selectedIds.size || ""} SV vào lớp
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <Modal visible={classPicker} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Chọn lớp</Text>
              <TouchableOpacity onPress={() => setClassPicker(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.modalSearch}
              placeholder="Tìm lớp..."
              value={classQ}
              onChangeText={setClassQ}
              placeholderTextColor="#9CA3AF"
            />
            <FlatList
              data={filteredClasses}
              keyExtractor={(i) => String(i.id)}
              ListEmptyComponent={
                <Text style={styles.empty}>Không có lớp</Text>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerRow}
                  onPress={() => {
                    setSelectedClass(item);
                    setClassPicker(false);
                    setSelectedIds(new Set());
                  }}>
                  <Text style={styles.rowTitle}>{item.label}</Text>
                  <Text style={styles.rowSub}>
                    ID: {item.id}
                    {item.max ? ` · Tối đa ${item.max}` : ""}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default AddStudentToClass;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F3EEFF" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3EEFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  back: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  title: { flex: 1, textAlign: "center", fontSize: 17, fontWeight: "700" },
  body: { flex: 1, padding: 16, paddingBottom: 20 },
  hint: {
    fontSize: 12.5,
    color: "#5B5BD6",
    backgroundColor: "#EDE9FE",
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
    lineHeight: 18,
  },
  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 8 },
  select: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 14,
  },
  selectValue: { flex: 1, fontSize: 15, color: "#1A1A1A" },
  selectPlaceholder: { flex: 1, fontSize: 15, color: "#9CA3AF" },
  search: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  rowOn: { borderColor: "#5B5BD6", backgroundColor: "#F5F3FF" },
  rowTitle: { fontSize: 14, fontWeight: "600", color: "#1A1A1A" },
  rowSub: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
  empty: { textAlign: "center", color: "#9CA3AF", marginTop: 24 },
  btn: {
    backgroundColor: "#5B5BD6",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 10,
  },
  btnText: { color: "#FFF", fontWeight: "700", fontSize: 16 },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "75%",
    paddingBottom: 24,
  },
  modalHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalTitle: { fontSize: 16, fontWeight: "700" },
  modalSearch: {
    margin: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  pickerRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
});
