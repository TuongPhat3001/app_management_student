import { getStudentExercisesAPI, submitExerciseAPI } from "@/src/api/authApi";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
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

type ExerciseItem = {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  classCode: string;
  teacherName: string;
};

const StudentExercises: React.FC = () => {
  const router = useRouter();
  const [list, setList] = useState<ExerciseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<ExerciseItem | null>(null);
  const [content, setContent] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await getStudentExercisesAPI();
      const raw = res.data?.data ?? res.data ?? [];
      const items = (Array.isArray(raw) ? raw : [])
        .map((e: any) => {
          const id = Number(e.ID ?? e.id);
          if (!id) return null;
          const due = e.DueDate ?? e.dueDate ?? "";
          return {
            id,
            title: String(e.Title ?? e.title ?? "Bài tập"),
            description: String(e.Description ?? e.description ?? ""),
            dueDate: due ? String(due).slice(0, 16).replace("T", " ") : "—",
            classCode: String(
              e.Class?.ClassCode ?? e.Class?.classCode ?? e.classCode ?? "",
            ),
            teacherName: String(
              e.Teacher?.User?.FullName ??
                e.Teacher?.User?.fullName ??
                e.teacherName ??
                "",
            ),
          };
        })
        .filter(Boolean) as ExerciseItem[];
      setList(items);
    } catch (e: any) {
      console.log("exercises", e?.response?.data || e);
      setList([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async () => {
    if (!selected) return;
    if (!content.trim() && !fileUrl.trim()) {
      Alert.alert("Thiếu nội dung", "Nhập nội dung bài làm hoặc link file.");
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("content", content.trim());
      formData.append("fileUrl", fileUrl.trim());
      await submitExerciseAPI(selected.id, formData);
      Alert.alert("Thành công", "Đã nộp bài tập.");
      setSelected(null);
      setContent("");
      setFileUrl("");
    } catch (e: any) {
      const d = e?.response?.data;
      Alert.alert(
        "Lỗi",
        [d?.message, d?.error].filter(Boolean).join("\n") ||
          "Nộp bài thất bại.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.title}>Bài tập đang mở</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#5B5BD6" />
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(i) => String(i.id)}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
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
            <Text style={styles.empty}>
              Chưa có bài tập nào (cần đăng ký lớp và GV tạo bài tập).
            </Text>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              {!!item.description && (
                <Text style={styles.desc} numberOfLines={3}>
                  {item.description}
                </Text>
              )}
              <Text style={styles.meta}>
                {item.classCode ? `Lớp ${item.classCode} · ` : ""}
                Hạn: {item.dueDate}
              </Text>
              {!!item.teacherName && (
                <Text style={styles.meta}>GV: {item.teacherName}</Text>
              )}
              <TouchableOpacity
                style={styles.btn}
                onPress={() => {
                  setSelected(item);
                  setContent("");
                  setFileUrl("");
                }}>
                <Text style={styles.btnText}>Nộp bài</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      <Modal visible={!!selected} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle} numberOfLines={2}>
                {selected?.title}
              </Text>
              <TouchableOpacity onPress={() => setSelected(null)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <Text style={styles.label}>Nội dung bài làm</Text>
            <TextInput
              style={[
                styles.input,
                { minHeight: 100, textAlignVertical: "top" },
              ]}
              multiline
              value={content}
              onChangeText={setContent}
              placeholder="Viết bài làm..."
              placeholderTextColor="#9CA3AF"
            />
            <Text style={styles.label}>Link file (tuỳ chọn)</Text>
            <TextInput
              style={styles.input}
              value={fileUrl}
              onChangeText={setFileUrl}
              placeholder="https://..."
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={[styles.btn, submitting && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={submitting}>
              {submitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.btnText}>Gửi bài</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default StudentExercises;

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
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { textAlign: "center", color: "#9CA3AF", marginTop: 40, padding: 16 },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#1A1A1A" },
  desc: { fontSize: 13, color: "#4B5563", marginTop: 6, lineHeight: 18 },
  meta: { fontSize: 12, color: "#9CA3AF", marginTop: 6 },
  btn: {
    marginTop: 12,
    backgroundColor: "#D97706",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  btnText: { color: "#FFF", fontWeight: "700" },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: 32,
  },
  modalHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: { flex: 1, fontSize: 16, fontWeight: "700", marginRight: 8 },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 8, color: "#374151" },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    fontSize: 15,
  },
});
