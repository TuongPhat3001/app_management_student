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

type ClassItem = {
  id: number;
  classCode: string;
  label: string;
};

type TeacherItem = {
  id: number;
  userId?: number;
  name: string;
  email?: string;
  code?: string;
};

const AssignTeacher: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingMeta, setLoadingMeta] = useState(true);

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherItem | null>(
    null,
  );
  const [message, setMessage] = useState("");
  const [picker, setPicker] = useState<"class" | "teacher" | null>(null);

  const loadMeta = useCallback(async () => {
    setLoadingMeta(true);
    try {
      const [cRes, tRes] = await Promise.all([
        apiClient.get("/classes").catch(() => ({ data: [] })),
        apiClient.get("/teachers").catch(() => ({ data: [] })),
      ]);

      const cRaw = cRes.data?.data ?? cRes.data ?? [];
      const cList = (Array.isArray(cRaw) ? cRaw : []).map(
        (c: any, i: number) => {
          const id = Number(c.ID ?? c.id ?? i);
          const code = String(
            c.ClassCode ?? c.classCode ?? c.code ?? `Lớp ${id}`,
          );
          const major =
            c.Major?.Name ??
            c.Major?.name ??
            c.major?.name ??
            c.majorName ??
            "";
          return {
            id,
            classCode: code,
            label: major ? `${code} · ${major}` : code,
          };
        },
      );
      setClasses(cList.filter((x: ClassItem) => x.id > 0));

      const tRaw = tRes.data?.data ?? tRes.data ?? [];
      const tList = (Array.isArray(tRaw) ? tRaw : []).map(
        (t: any, i: number) => {
          const id = Number(t.ID ?? t.id ?? i);
          const userId = Number(
            t.UserID ??
              t.userId ??
              t.user_id ??
              t.User?.ID ??
              t.User?.id ??
              t.user?.id,
          );
          const name = String(
            t.User?.FullName ??
              t.User?.fullName ??
              t.user?.fullName ??
              t.fullName ??
              t.FullName ??
              t.name ??
              `GV #${id}`,
          );
          const email = String(
            t.User?.Email ?? t.User?.email ?? t.user?.email ?? t.email ?? "",
          ).trim();
          const code = String(t.TeacherCode ?? t.teacherCode ?? "");
          return {
            id,
            userId: !isNaN(userId) && userId > 0 ? userId : undefined,
            name,
            email: email || undefined,
            code: code || undefined,
          };
        },
      );
      setTeachers(tList.filter((x: TeacherItem) => x.id > 0));
    } finally {
      setLoadingMeta(false);
    }
  }, []);

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  const sendOfferNotification = async (
    teacher: TeacherItem,
    classItem: ClassItem,
    msg: string,
  ) => {
    if (!teacher.userId && !teacher.email) return;
    const subject = `Lời mời phân công lớp ${classItem.classCode}`;
    const content =
      msg.trim() ||
      `Bạn được mời phụ trách lớp ${classItem.classCode}. Vào mục Đề xuất lớp để chấp nhận hoặc từ chối.`;
    const payload: Record<string, any> = {
      subject,
      content,
      sendNow: false,
    };
    if (teacher.userId) payload.recipientUserId = teacher.userId;
    if (teacher.email) payload.recipientEmail = teacher.email;
    try {
      await apiClient.post("/notifications/email", payload);
    } catch {}
  };

  const handleSubmit = async () => {
    if (!selectedClass) {
      Alert.alert("Thiếu thông tin", "Vui lòng chọn lớp học.");
      return;
    }
    if (!selectedTeacher) {
      Alert.alert("Thiếu thông tin", "Vui lòng chọn giảng viên.");
      return;
    }

    setLoading(true);
    try {
      // Backend CreateClassOfferRequest: classId, teacherId, title*, content*, message?
      const title = `Phân công lớp ${selectedClass.classCode}`;
      const content =
        message.trim() ||
        `Mời giảng viên phụ trách lớp ${selectedClass.classCode}. Vui lòng phản hồi trên app.`;
      await apiClient.post("/class-offers", {
        classId: selectedClass.id,
        teacherId: selectedTeacher.id,
        title,
        content,
        message: content,
      });

      await sendOfferNotification(selectedTeacher, selectedClass, message);

      Alert.alert(
        "Thành công",
        `Đã gửi lời mời phân công lớp ${selectedClass.classCode} tới ${selectedTeacher.name}.\nGiảng viên sẽ thấy ở Đề xuất lớp và chuông thông báo.`,
        [{ text: "OK", onPress: () => router.back() }],
      );

      setSelectedClass(null);
      setSelectedTeacher(null);
      setMessage("");
    } catch (error: any) {
      const d = error?.response?.data;
      Alert.alert("Lỗi", d?.message || d?.error || "Tạo đề xuất lớp thất bại.");
    } finally {
      setLoading(false);
    }
  };

  const renderPicker = () => {
    const data = picker === "class" ? classes : teachers;
    return (
      <Modal visible={!!picker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>
                {picker === "class" ? "Chọn lớp học" : "Chọn giảng viên"}
              </Text>
              <TouchableOpacity onPress={() => setPicker(null)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            {data.length === 0 ? (
              <Text style={styles.emptyPicker}>Không có dữ liệu</Text>
            ) : (
              <FlatList
                data={data as any[]}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.pickerRow}
                    onPress={() => {
                      if (picker === "class")
                        setSelectedClass(item as ClassItem);
                      else setSelectedTeacher(item as TeacherItem);
                      setPicker(null);
                    }}>
                    <Text style={styles.pickerMain}>
                      {picker === "class"
                        ? (item as ClassItem).label
                        : (item as TeacherItem).name}
                    </Text>
                    {picker === "teacher" && (item as TeacherItem).code ? (
                      <Text style={styles.pickerSub}>
                        {(item as TeacherItem).code}
                        {(item as TeacherItem).email
                          ? ` · ${(item as TeacherItem).email}`
                          : ""}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3EEFF" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Phân công giảng viên</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled">
          <View style={styles.banner}>
            <Ionicons name="information-circle" size={20} color="#5B5BD6" />
            <Text style={styles.bannerText}>
              Tạo lời mời phân công (class-offers). GV nhận ngay trong Đề xuất
              lớp và chuông thông báo.
            </Text>
          </View>

          {loadingMeta ? (
            <ActivityIndicator color="#5B5BD6" style={{ marginVertical: 20 }} />
          ) : (
            <>
              <Text style={styles.label}>Lớp học *</Text>
              <TouchableOpacity
                style={styles.select}
                onPress={() => setPicker("class")}>
                <Text
                  style={
                    selectedClass
                      ? styles.selectValue
                      : styles.selectPlaceholder
                  }>
                  {selectedClass ? selectedClass.label : "Chọn lớp học..."}
                </Text>
                <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
              </TouchableOpacity>

              <Text style={styles.label}>Giảng viên *</Text>
              <TouchableOpacity
                style={styles.select}
                onPress={() => setPicker("teacher")}>
                <Text
                  style={
                    selectedTeacher
                      ? styles.selectValue
                      : styles.selectPlaceholder
                  }>
                  {selectedTeacher
                    ? `${selectedTeacher.name}${
                        selectedTeacher.code ? ` (${selectedTeacher.code})` : ""
                      }`
                    : "Chọn giảng viên..."}
                </Text>
                <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
              </TouchableOpacity>

              <Text style={styles.label}>Lời nhắn (message)</Text>
              <TextInput
                style={[styles.input, styles.area]}
                placeholder="VD: Mời thầy/cô nhận lớp CNTT-K18..."
                placeholderTextColor="#9CA3AF"
                value={message}
                onChangeText={setMessage}
                multiline
                textAlignVertical="top"
              />

              <TouchableOpacity
                style={[styles.button, loading && { opacity: 0.7 }]}
                disabled={loading}
                onPress={handleSubmit}>
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="send" size={18} color="#FFF" />
                    <Text style={styles.buttonText}>Gửi lời mời phân công</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {renderPicker()}
    </SafeAreaView>
  );
};

export default AssignTeacher;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F3EEFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  scroll: { padding: 20, paddingBottom: 40 },
  banner: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#EDE9FE",
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
  },
  bannerText: { flex: 1, fontSize: 12.5, color: "#4C1D95", lineHeight: 18 },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
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
  input: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 14,
    fontSize: 15,
    color: "#1A1A1A",
  },
  area: { height: 100, paddingTop: 12 },
  button: {
    marginTop: 12,
    backgroundColor: "#5B5BD6",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  buttonText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
    paddingBottom: 24,
  },
  modalHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalTitle: { fontSize: 16, fontWeight: "700", color: "#1A1A1A" },
  pickerRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  pickerMain: { fontSize: 15, fontWeight: "600", color: "#1A1A1A" },
  pickerSub: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
  emptyPicker: {
    textAlign: "center",
    color: "#9CA3AF",
    padding: 24,
  },
});
