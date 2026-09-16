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
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * POST /classes
 * CreateClassRequest:
 *   majorId*, semesterId*, roomId*
 *   classCode? (auto), teacherId?, maxStudents?, status?, schedules?
 */

type MetaItem = { id: number; label: string };
type PickerKind = "major" | "semester" | "room" | "teacher" | null;

const CreateClass: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [majors, setMajors] = useState<MetaItem[]>([]);
  const [semesters, setSemesters] = useState<MetaItem[]>([]);
  const [rooms, setRooms] = useState<MetaItem[]>([]);
  const [teachers, setTeachers] = useState<MetaItem[]>([]);
  const [picker, setPicker] = useState<PickerKind>(null);

  const [major, setMajor] = useState<MetaItem | null>(null);
  const [semester, setSemester] = useState<MetaItem | null>(null);
  const [room, setRoom] = useState<MetaItem | null>(null);
  const [teacher, setTeacher] = useState<MetaItem | null>(null);
  const [maxStudents, setMaxStudents] = useState("40");
  const [createdCode, setCreatedCode] = useState("");

  const loadMeta = useCallback(async () => {
    try {
      const res = await apiClient.get("/metadata");
      const d = res.data?.data ?? {};
      setMajors(
        (d.majors || [])
          .map((m: any) => ({
            id: Number(m.ID ?? m.id),
            label: String(m.Name ?? m.name ?? m.Code ?? m.code ?? ""),
          }))
          .filter((x: MetaItem) => x.id > 0),
      );
      setSemesters(
        (d.semesters || [])
          .map((s: any) => ({
            id: Number(s.ID ?? s.id),
            label: String(s.Name ?? s.name ?? `HK ${s.ID ?? s.id}`),
          }))
          .filter((x: MetaItem) => x.id > 0),
      );
      setRooms(
        (d.rooms || [])
          .map((r: any) => ({
            id: Number(r.ID ?? r.id),
            label: String(r.Name ?? r.name ?? r.Code ?? r.code ?? `P${r.ID}`),
          }))
          .filter((x: MetaItem) => x.id > 0),
      );
      setTeachers(
        (d.teachers || [])
          .map((t: any) => {
            const id = Number(t.ID ?? t.id);
            const name =
              t.User?.FullName ??
              t.User?.fullName ??
              t.fullName ??
              t.TeacherCode ??
              t.teacherCode ??
              `GV #${id}`;
            const code = t.TeacherCode ?? t.teacherCode ?? "";
            return {
              id,
              label: code ? `${name} (${code})` : String(name),
            };
          })
          .filter((x: MetaItem) => x.id > 0),
      );
    } catch {
      // fallback separate endpoints
      try {
        const [cRes, tRes] = await Promise.all([
          apiClient.get("/classes").catch(() => null),
          apiClient.get("/teachers").catch(() => null),
        ]);
        void cRes;
        const tRaw = tRes?.data?.data ?? [];
        setTeachers(
          (Array.isArray(tRaw) ? tRaw : [])
            .map((t: any) => ({
              id: Number(t.ID ?? t.id),
              label: String(
                t.User?.FullName ?? t.User?.fullName ?? t.TeacherCode ?? t.id,
              ),
            }))
            .filter((x: MetaItem) => x.id > 0),
        );
      } catch {
        /* ignore */
      }
    }
  }, []);

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  const handleSubmit = async () => {
    if (!major) {
      Alert.alert("Thiếu thông tin", "Chọn chuyên ngành (majorId).");
      return;
    }
    if (!semester) {
      Alert.alert("Thiếu thông tin", "Chọn học kỳ (semesterId).");
      return;
    }
    if (!room) {
      Alert.alert("Thiếu thông tin", "Chọn phòng (roomId).");
      return;
    }
    const max = Number(maxStudents) || 0;
    if (max < 0) {
      Alert.alert("Sai", "Sĩ số tối đa không hợp lệ.");
      return;
    }

    const payload: Record<string, any> = {
      majorId: major.id,
      semesterId: semester.id,
      roomId: room.id,
      maxStudents: max,
      status: "open",
    };
    if (teacher) payload.teacherId = teacher.id;

    setLoading(true);
    setCreatedCode("");
    try {
      const res = await apiClient.post("/classes", payload);
      const data = res.data?.data;
      const cls = data?.class ?? data;
      const code =
        cls?.ClassCode ?? cls?.classCode ?? res.data?.message ?? "OK";
      setCreatedCode(String(code));
      Alert.alert(
        "Thành công",
        res.data?.message || `Tạo lớp thành công: ${code}`,
      );
      setMajor(null);
      setSemester(null);
      setRoom(null);
      setTeacher(null);
      setMaxStudents("40");
    } catch (e: any) {
      const d = e?.response?.data;
      Alert.alert(
        "Lỗi",
        [d?.message, d?.error].filter(Boolean).join("\n") ||
          "Tạo lớp thất bại.",
      );
    } finally {
      setLoading(false);
    }
  };

  const pickerData =
    picker === "major"
      ? majors
      : picker === "semester"
        ? semesters
        : picker === "room"
          ? rooms
          : picker === "teacher"
            ? teachers
            : [];

  const selectLabel =
    picker === "major"
      ? "Chuyên ngành"
      : picker === "semester"
        ? "Học kỳ"
        : picker === "room"
          ? "Phòng"
          : "Giảng viên";

  const Field = ({
    label,
    value,
    onPress,
    required,
  }: {
    label: string;
    value?: string;
    onPress: () => void;
    required?: boolean;
  }) => (
    <>
      <Text style={styles.label}>
        {label}
        {required ? " *" : ""}
      </Text>
      <TouchableOpacity style={styles.select} onPress={onPress}>
        <Text style={value ? styles.selectValue : styles.selectPlaceholder}>
          {value || `Chọn ${label.toLowerCase()}...`}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
      </TouchableOpacity>
    </>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.title}>Tạo lớp học mới</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled">
          <Text style={styles.hint}>
            Backend tự sinh mã lớp. Bắt buộc: chuyên ngành, học kỳ, phòng.
          </Text>

          <Field
            label="Chuyên ngành (majorId)"
            value={major?.label}
            required
            onPress={() => setPicker("major")}
          />
          <Field
            label="Học kỳ (semesterId)"
            value={semester?.label}
            required
            onPress={() => setPicker("semester")}
          />
          <Field
            label="Phòng (roomId)"
            value={room?.label}
            required
            onPress={() => setPicker("room")}
          />
          <Field
            label="Giảng viên (teacherId)"
            value={teacher?.label}
            onPress={() => setPicker("teacher")}
          />

          <Text style={styles.label}>Sĩ số tối đa (maxStudents)</Text>
          <TextInput
            style={styles.input}
            value={maxStudents}
            onChangeText={setMaxStudents}
            keyboardType="numeric"
            placeholder="40"
            placeholderTextColor="#9CA3AF"
          />

          {!!createdCode && (
            <View style={styles.result}>
              <Text style={styles.resultTitle}>Đã tạo lớp</Text>
              <Text>{createdCode}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.btn, loading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.btnText}>Tạo lớp</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={!!picker} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>{selectLabel}</Text>
              <TouchableOpacity onPress={() => setPicker(null)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={pickerData}
              keyExtractor={(i) => String(i.id)}
              ListEmptyComponent={
                <Text
                  style={{
                    textAlign: "center",
                    color: "#9CA3AF",
                    padding: 24,
                  }}>
                  Không có dữ liệu từ /metadata
                </Text>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerRow}
                  onPress={() => {
                    if (picker === "major") setMajor(item);
                    if (picker === "semester") setSemester(item);
                    if (picker === "room") setRoom(item);
                    if (picker === "teacher") setTeacher(item);
                    setPicker(null);
                  }}>
                  <Text style={styles.pickerMain}>{item.label}</Text>
                  <Text style={styles.pickerSub}>ID: {item.id}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default CreateClass;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F3EEFF" },
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
  scroll: { padding: 20, paddingBottom: 40 },
  hint: {
    fontSize: 12.5,
    color: "#5B5BD6",
    backgroundColor: "#EDE9FE",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    lineHeight: 18,
  },
  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 8 },
  input: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    fontSize: 15,
  },
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
  result: {
    backgroundColor: "#D1FAE5",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  resultTitle: { fontWeight: "700", color: "#059669", marginBottom: 4 },
  btn: {
    backgroundColor: "#5B5BD6",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
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
    maxHeight: "70%",
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
  pickerRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  pickerMain: { fontSize: 15, fontWeight: "600" },
  pickerSub: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
});
