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

type Room = {
  id: number;
  name: string;
  building: string;
  capacity: number;
  description: string;
  isActive: boolean;
};

export default function Rooms() {
  const router = useRouter();
  const [list, setList] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [building, setBuilding] = useState("");
  const [capacity, setCapacity] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const mapRoom = (r: any): Room | null => {
    const id = Number(r.ID ?? r.id);
    if (!id) return null;
    return {
      id,
      name: String(r.Name ?? r.name ?? ""),
      building: String(r.Building ?? r.building ?? ""),
      capacity: Number(r.Capacity ?? r.capacity ?? 0),
      description: String(r.Description ?? r.description ?? ""),
      isActive: Boolean(r.IsActive ?? r.isActive ?? true),
    };
  };

  const load = useCallback(async () => {
    try {
      const res = await apiClient.get("/rooms");
      const raw = res.data?.data ?? res.data ?? [];
      setList(
        (Array.isArray(raw) ? raw : []).map(mapRoom).filter(Boolean) as Room[],
      );
    } catch (e: any) {
      console.log("rooms", e?.response?.data || e);
      setList([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load]),
  );

  const openCreate = () => {
    setEditId(null);
    setName("");
    setBuilding("");
    setCapacity("");
    setDescription("");
    setShowForm(true);
  };

  const openEdit = (r: Room) => {
    setEditId(r.id);
    setName(r.name);
    setBuilding(r.building);
    setCapacity(String(r.capacity || ""));
    setDescription(r.description);
    setShowForm(true);
  };

  const onSave = async () => {
    const cap = parseInt(capacity, 10);
    if (!name.trim() || !cap || cap <= 0) {
      Alert.alert("Thiếu thông tin", "Nhập tên phòng và sức chứa > 0.");
      return;
    }
    const body = {
      name: name.trim(),
      building: building.trim(),
      capacity: cap,
      description: description.trim(),
    };
    try {
      setSaving(true);
      if (editId) {
        await apiClient.put(`/rooms/${editId}`, body);
      } else {
        await apiClient.post("/rooms", body);
      }
      setShowForm(false);
      load();
    } catch (e: any) {
      Alert.alert("Lỗi", e?.response?.data?.message || "Lưu phòng thất bại.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.title}>Phòng học</Text>
        <TouchableOpacity style={styles.iconBtn} onPress={openCreate}>
          <Ionicons name="add-circle" size={24} color="#5B5BD6" />
        </TouchableOpacity>
      </View>

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
              <Ionicons name="business-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>Chưa có phòng học</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.8}
              onPress={() => openEdit(item)}>
              <View style={styles.icon}>
                <Ionicons name="home-outline" size={20} color="#5B5BD6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.meta}>
                  {item.building ? `${item.building} · ` : ""}
                  Sức chứa {item.capacity}
                  {!item.isActive ? " · Ngưng" : ""}
                </Text>
                {!!item.description && (
                  <Text style={styles.desc} numberOfLines={2}>
                    {item.description}
                  </Text>
                )}
              </View>
              <Ionicons name="create-outline" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        />
      )}

      <Modal visible={showForm} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>
              {editId ? "Sửa phòng học" : "Thêm phòng học"}
            </Text>
            <Text style={styles.label}>Tên phòng *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="VD: A101"
            />
            <Text style={styles.label}>Tòa nhà</Text>
            <TextInput
              style={styles.input}
              value={building}
              onChangeText={setBuilding}
              placeholder="VD: Tòa A"
            />
            <Text style={styles.label}>Sức chứa *</Text>
            <TextInput
              style={styles.input}
              value={capacity}
              onChangeText={setCapacity}
              keyboardType="number-pad"
              placeholder="VD: 40"
            />
            <Text style={styles.label}>Mô tả</Text>
            <TextInput
              style={[
                styles.input,
                { minHeight: 72, textAlignVertical: "top" },
              ]}
              value={description}
              onChangeText={setDescription}
              multiline
              placeholder="Ghi chú..."
            />
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={onSave}
              disabled={saving}>
              {saving ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.saveBtnText}>Lưu</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowForm(false)}>
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
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    gap: 12,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#EDE9FE",
    justifyContent: "center",
    alignItems: "center",
  },
  name: { fontSize: 15, fontWeight: "700", color: "#1A1A1A" },
  meta: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  desc: { fontSize: 12, color: "#9CA3AF", marginTop: 4 },
  empty: { alignItems: "center", paddingTop: 60, gap: 8 },
  emptyText: { fontWeight: "700", color: "#6B7280" },
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
  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    fontSize: 15,
  },
  saveBtn: {
    backgroundColor: "#5B5BD6",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveBtnText: { color: "#FFF", fontWeight: "700", fontSize: 15 },
  cancel: {
    textAlign: "center",
    color: "#6B7280",
    fontWeight: "600",
    marginTop: 14,
  },
});
