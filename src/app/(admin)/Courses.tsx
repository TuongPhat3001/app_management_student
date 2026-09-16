import apiClient from "@/src/api/axios";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
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

/**
 * GET/POST /courses
 * PUT/DELETE /courses/:id
 * CourseRequest: code*, name*, credits*, majorId*, semesterId*, isActive?
 */

type MetaItem = { id: number; label: string };
type CourseItem = {
  id: number;
  code: string;
  name: string;
  credits: number;
  majorId: number;
  semesterId: number;
  majorName?: string;
  semesterName?: string;
  isActive: boolean;
};

const Courses: React.FC = () => {
  const [list, setList] = useState<CourseItem[]>([]);
  const [majors, setMajors] = useState<MetaItem[]>([]);
  const [semesters, setSemesters] = useState<MetaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<CourseItem | null>(null);
  const [form, setForm] = useState({
    code: "",
    name: "",
    credits: "3",
    majorId: 0,
    semesterId: 0,
  });
  const [picker, setPicker] = useState<"major" | "semester" | null>(null);

  const mapCourse = (raw: any): CourseItem | null => {
    const id = Number(raw?.ID ?? raw?.id);
    if (!id) return null;
    return {
      id,
      code: String(raw?.Code ?? raw?.code ?? ""),
      name: String(raw?.Name ?? raw?.name ?? ""),
      credits: Number(raw?.Credits ?? raw?.credits ?? 0),
      majorId: Number(raw?.MajorID ?? raw?.majorId ?? raw?.Major?.ID ?? 0),
      semesterId: Number(
        raw?.SemesterID ?? raw?.semesterId ?? raw?.Semester?.ID ?? 0,
      ),
      majorName: raw?.Major?.Name ?? raw?.Major?.name ?? raw?.major?.name,
      semesterName:
        raw?.Semester?.Name ?? raw?.Semester?.name ?? raw?.semester?.name,
      isActive: raw?.IsActive ?? raw?.isActive ?? true,
    };
  };

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
    } catch {
      /* ignore */
    }
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await apiClient.get("/courses");
      const raw = res.data?.data ?? res.data ?? [];
      setList(
        (Array.isArray(raw) ? raw : [])
          .map(mapCourse)
          .filter(Boolean) as CourseItem[],
      );
    } catch (e: any) {
      console.log("courses error", e?.response?.data);
      setList([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadMeta();
    load();
  }, [load, loadMeta]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        (c.majorName || "").toLowerCase().includes(q),
    );
  }, [list, search]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      code: "",
      name: "",
      credits: "3",
      majorId: majors[0]?.id || 0,
      semesterId: semesters[0]?.id || 0,
    });
    setModal(true);
  };

  const openEdit = (c: CourseItem) => {
    setEditing(c);
    setForm({
      code: c.code,
      name: c.name,
      credits: String(c.credits || 3),
      majorId: c.majorId,
      semesterId: c.semesterId,
    });
    setModal(true);
  };

  const handleSave = async () => {
    const code = form.code.trim();
    const name = form.name.trim();
    const credits = Number(form.credits);
    if (!code || !name) {
      Alert.alert("Thiếu thông tin", "Nhập mã môn và tên môn.");
      return;
    }
    if (!credits || credits <= 0) {
      Alert.alert("Sai", "Số tín chỉ phải > 0.");
      return;
    }
    if (!form.majorId || !form.semesterId) {
      Alert.alert("Thiếu thông tin", "Chọn chuyên ngành và học kỳ.");
      return;
    }

    const payload = {
      code,
      name,
      credits,
      majorId: form.majorId,
      semesterId: form.semesterId,
      isActive: true,
    };

    setSaving(true);
    try {
      if (editing) {
        await apiClient.put(`/courses/${editing.id}`, payload);
        Alert.alert("Thành công", "Đã cập nhật môn học.");
      } else {
        await apiClient.post("/courses", payload);
        Alert.alert("Thành công", "Đã thêm môn học.");
      }
      setModal(false);
      load();
    } catch (e: any) {
      const d = e?.response?.data;
      Alert.alert(
        "Lỗi",
        [d?.message, d?.error].filter(Boolean).join("\n") || "Lưu thất bại.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (c: CourseItem) => {
    Alert.alert("Xóa môn học", `Xóa ${c.code} — ${c.name}?`, [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            await apiClient.delete(`/courses/${c.id}`);
            Alert.alert("Thành công", "Đã xóa môn học.");
            load();
          } catch (e: any) {
            const d = e?.response?.data;
            Alert.alert(
              "Lỗi",
              [d?.message, d?.error].filter(Boolean).join("\n") ||
                "Xóa thất bại (có thể môn đã có SV đăng ký).",
            );
          }
        },
      },
    ]);
  };

  const majorLabel =
    majors.find((m) => m.id === form.majorId)?.label || "Chọn ngành...";
  const semesterLabel =
    semesters.find((s) => s.id === form.semesterId)?.label || "Chọn học kỳ...";

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.title}>Môn học</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
          <Ionicons name="add" size={22} color="#FFF" />
          <Text style={styles.addText}>Thêm</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm mã / tên môn..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#5B5BD6" />
        </View>
      ) : (
        <FlatList
          data={filtered}
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
          ListEmptyComponent={<Text style={styles.empty}>Chưa có môn học</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.code}>{item.code}</Text>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.meta}>
                  {item.credits} TC
                  {item.majorName ? ` · ${item.majorName}` : ""}
                  {item.semesterName ? ` · ${item.semesterName}` : ""}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => openEdit(item)}>
                <Ionicons name="create-outline" size={20} color="#5B5BD6" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => handleDelete(item)}>
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      <Modal visible={modal} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>
                {editing ? "Sửa môn học" : "Thêm môn học"}
              </Text>
              <TouchableOpacity onPress={() => setModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView
              contentContainerStyle={{ padding: 16 }}
              keyboardShouldPersistTaps="handled">
              <Text style={styles.label}>Mã môn *</Text>
              <TextInput
                style={styles.input}
                value={form.code}
                onChangeText={(v) => setForm((p) => ({ ...p, code: v }))}
                autoCapitalize="characters"
                placeholder="CSDL301"
                placeholderTextColor="#9CA3AF"
              />
              <Text style={styles.label}>Tên môn *</Text>
              <TextInput
                style={styles.input}
                value={form.name}
                onChangeText={(v) => setForm((p) => ({ ...p, name: v }))}
                placeholder="Cơ sở dữ liệu"
                placeholderTextColor="#9CA3AF"
              />
              <Text style={styles.label}>Tín chỉ *</Text>
              <TextInput
                style={styles.input}
                value={form.credits}
                onChangeText={(v) => setForm((p) => ({ ...p, credits: v }))}
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
              <Text style={styles.label}>Chuyên ngành (majorId) *</Text>
              <TouchableOpacity
                style={styles.select}
                onPress={() => setPicker("major")}>
                <Text style={styles.selectText}>{majorLabel}</Text>
                <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
              </TouchableOpacity>
              <Text style={styles.label}>Học kỳ (semesterId) *</Text>
              <TouchableOpacity
                style={styles.select}
                onPress={() => setPicker("semester")}>
                <Text style={styles.selectText}>{semesterLabel}</Text>
                <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                onPress={handleSave}
                disabled={saving}>
                {saving ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.saveText}>
                    {editing ? "Cập nhật" : "Thêm môn"}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={!!picker} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={[styles.modal, { maxHeight: "50%" }]}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>
                {picker === "major" ? "Chuyên ngành" : "Học kỳ"}
              </Text>
              <TouchableOpacity onPress={() => setPicker(null)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={picker === "major" ? majors : semesters}
              keyExtractor={(i) => String(i.id)}
              ListEmptyComponent={
                <Text style={styles.empty}>Không có dữ liệu /metadata</Text>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickRow}
                  onPress={() => {
                    if (picker === "major")
                      setForm((p) => ({ ...p, majorId: item.id }));
                    else setForm((p) => ({ ...p, semesterId: item.id }));
                    setPicker(null);
                  }}>
                  <Text style={styles.name}>{item.label}</Text>
                  <Text style={styles.meta}>ID: {item.id}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Courses;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F3EEFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  title: { fontSize: 20, fontWeight: "800" },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#5B5BD6",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addText: { color: "#FFF", fontWeight: "700" },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    marginBottom: 8,
    backgroundColor: "#FFF",
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    height: 44,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { textAlign: "center", color: "#9CA3AF", marginTop: 40 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  code: { fontSize: 13, fontWeight: "700", color: "#5B5BD6" },
  name: { fontSize: 15, fontWeight: "700", color: "#1A1A1A", marginTop: 2 },
  meta: { fontSize: 12, color: "#9CA3AF", marginTop: 4 },
  iconBtn: { padding: 8 },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "85%",
  },
  modalHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalTitle: { fontSize: 17, fontWeight: "700" },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 8, color: "#374151" },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 15,
  },
  select: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 12,
  },
  selectText: { flex: 1, fontSize: 15 },
  saveBtn: {
    backgroundColor: "#5B5BD6",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  saveText: { color: "#FFF", fontWeight: "700", fontSize: 16 },
  pickRow: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
});
