import apiClient from "@/src/api/axios";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
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

type WarningItem = {
  id: number;
  studentName: string;
  studentCode: string;
  semester: string;
  gpa: number;
  failedCourses: number;
  failedCredits: number;
  reason: string;
  status: string;
};

type SemesterItem = { id: number; name: string };

export default function AcademicWarnings() {
  const router = useRouter();
  const [list, setList] = useState<WarningItem[]>([]);
  const [semesters, setSemesters] = useState<SemesterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showGen, setShowGen] = useState(false);
  const [semesterId, setSemesterId] = useState<number | null>(null);
  const [minGpa, setMinGpa] = useState("2.0");
  const [maxFailed, setMaxFailed] = useState("2");

  const mapWarning = (w: any): WarningItem | null => {
    const id = Number(w.ID ?? w.id);
    if (!id) return null;
    const st = w.Student ?? w.student ?? {};
    const user = st.User ?? st.user ?? {};
    const sem = w.Semester ?? w.semester ?? {};
    return {
      id,
      studentName: String(user.FullName ?? user.fullName ?? "SV"),
      studentCode: String(st.StudentCode ?? st.studentCode ?? ""),
      semester: String(sem.Name ?? sem.name ?? sem.Code ?? sem.code ?? ""),
      gpa: Number(w.GPA ?? w.gpa ?? 0),
      failedCourses: Number(w.FailedCourses ?? w.failedCourses ?? 0),
      failedCredits: Number(w.FailedCredits ?? w.failedCredits ?? 0),
      reason: String(w.Reason ?? w.reason ?? ""),
      status: String(w.Status ?? w.status ?? "active"),
    };
  };

  const load = useCallback(async () => {
    try {
      const [wRes, sRes] = await Promise.all([
        apiClient.get("/academic-warnings"),
        apiClient.get("/semesters").catch(() =>
          apiClient.get("/metadata").then((r) => ({
            data: { data: r.data?.data?.semesters ?? r.data?.semesters ?? [] },
          })),
        ),
      ]);
      const raw = wRes.data?.data ?? wRes.data ?? [];
      setList(
        (Array.isArray(raw) ? raw : [])
          .map(mapWarning)
          .filter(Boolean) as WarningItem[],
      );
      const sRaw = sRes.data?.data ?? sRes.data ?? [];
      const sList = (Array.isArray(sRaw) ? sRaw : [])
        .map((s: any) => ({
          id: Number(s.ID ?? s.id),
          name: String(
            s.Name ?? s.name ?? s.Code ?? s.code ?? `HK ${s.ID ?? s.id}`,
          ),
        }))
        .filter((s: SemesterItem) => s.id > 0);
      setSemesters(sList);
      if (!semesterId && sList[0]) setSemesterId(sList[0].id);
    } catch (e: any) {
      console.log("warnings", e?.response?.data || e);
      setList([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [semesterId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load]),
  );

  const onGenerate = async () => {
    if (!semesterId) {
      Alert.alert("Thiếu học kỳ", "Chọn học kỳ để tạo cảnh báo.");
      return;
    }
    try {
      setGenerating(true);
      const res = await apiClient.post("/academic-warnings/generate", {
        semesterId,
        minGpa: parseFloat(minGpa) || 2.0,
        maxFailedCourses: parseInt(maxFailed, 10) || 2,
      });
      const count = res.data?.count ?? res.data?.data?.length ?? 0;
      Alert.alert(
        "Thành công",
        res.data?.message || `Đã tạo/cập nhật ${count} cảnh báo.`,
      );
      setShowGen(false);
      load();
    } catch (e: any) {
      Alert.alert(
        "Lỗi",
        e?.response?.data?.message || "Không tạo được cảnh báo học vụ.",
      );
    } finally {
      setGenerating(false);
    }
  };

  const onDelete = (item: WarningItem) => {
    Alert.alert("Xóa cảnh báo", `Xóa cảnh báo của ${item.studentName}?`, [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            await apiClient.delete(`/academic-warnings/${item.id}`);
            setList((prev) => prev.filter((x) => x.id !== item.id));
          } catch (e: any) {
            Alert.alert("Lỗi", e?.response?.data?.message || "Xóa thất bại.");
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.title}>Cảnh báo học vụ</Text>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => setShowGen(true)}>
          <Ionicons name="add-circle" size={24} color="#5B5BD6" />
        </TouchableOpacity>
      </View>

      <Text style={styles.count}>{list.length} cảnh báo</Text>

      {loading ? (
        <ActivityIndicator
          style={{ marginTop: 40 }}
          color="#5B5BD6"
          size="large"
        />
      ) : (
        <FlatList
          data={list}
          keyExtractor={(i) => String(i.id)}
          contentContainerStyle={{ padding: 14, paddingBottom: 40 }}
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
            <View style={styles.empty}>
              <Ionicons
                name="shield-checkmark-outline"
                size={48}
                color="#D1D5DB"
              />
              <Text style={styles.emptyText}>Chưa có cảnh báo học vụ</Text>
              <Text style={styles.emptyHint}>
                Bấm + để tạo cảnh báo theo GPA / số môn trượt
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.studentName}</Text>
                <Text style={styles.meta}>
                  {item.studentCode} · {item.semester || "—"}
                </Text>
                <Text style={styles.stats}>
                  GPA: {item.gpa.toFixed(2)} · Trượt: {item.failedCourses} môn
                  {item.failedCredits ? ` (${item.failedCredits} TC)` : ""}
                </Text>
                {!!item.reason && (
                  <Text style={styles.reason} numberOfLines={3}>
                    {item.reason}
                  </Text>
                )}
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.status}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => onDelete(item)} hitSlop={8}>
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      <Modal visible={showGen} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Tạo cảnh báo học vụ</Text>
            <Text style={styles.label}>Học kỳ</Text>
            <View style={styles.semRow}>
              {semesters.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[
                    styles.semChip,
                    semesterId === s.id && styles.semChipOn,
                  ]}
                  onPress={() => setSemesterId(s.id)}>
                  <Text
                    style={[
                      styles.semChipText,
                      semesterId === s.id && styles.semChipTextOn,
                    ]}>
                    {s.name}
                  </Text>
                </TouchableOpacity>
              ))}
              {semesters.length === 0 && (
                <Text style={styles.meta}>Không tải được danh sách học kỳ</Text>
              )}
            </View>
            <Text style={styles.label}>GPA tối thiểu (mặc định 2.0)</Text>
            <TextInput
              style={styles.input}
              value={minGpa}
              onChangeText={setMinGpa}
              keyboardType="decimal-pad"
            />
            <Text style={styles.label}>Số môn trượt tối đa (mặc định 2)</Text>
            <TextInput
              style={styles.input}
              value={maxFailed}
              onChangeText={setMaxFailed}
              keyboardType="number-pad"
            />
            <TouchableOpacity
              style={styles.genBtn}
              onPress={onGenerate}
              disabled={generating}>
              {generating ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.genBtnText}>Tạo cảnh báo</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowGen(false)}>
              <Text style={styles.cancel}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F3EEFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  iconBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  title: { flex: 1, textAlign: "center", fontSize: 17, fontWeight: "700" },
  count: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: "#6B7280",
    fontWeight: "600",
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    gap: 10,
  },
  name: { fontSize: 15, fontWeight: "700", color: "#1A1A1A" },
  meta: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  stats: { fontSize: 13, color: "#374151", fontWeight: "600", marginTop: 6 },
  reason: { fontSize: 12, color: "#6B7280", marginTop: 6, lineHeight: 18 },
  badge: {
    alignSelf: "flex-start",
    marginTop: 8,
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: { color: "#DC2626", fontSize: 11, fontWeight: "700" },
  empty: { alignItems: "center", paddingTop: 60, gap: 8 },
  emptyText: { fontWeight: "700", color: "#6B7280" },
  emptyHint: {
    color: "#9CA3AF",
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 24,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
  },
  modalTitle: { fontSize: 18, fontWeight: "800", marginBottom: 14 },
  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    fontSize: 15,
  },
  semRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  semChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
  },
  semChipOn: { backgroundColor: "#5B5BD6" },
  semChipText: { fontSize: 13, color: "#374151", fontWeight: "600" },
  semChipTextOn: { color: "#FFF" },
  genBtn: {
    backgroundColor: "#5B5BD6",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  genBtnText: { color: "#FFF", fontWeight: "700", fontSize: 15 },
  cancel: {
    textAlign: "center",
    color: "#6B7280",
    fontWeight: "600",
    marginTop: 14,
  },
});
