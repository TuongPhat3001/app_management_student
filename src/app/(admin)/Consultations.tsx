import apiClient from "@/src/api/axios";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Item = {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  program: string;
  location: string;
  preferredSession: string;
  message: string;
  status: string;
  createdAt: string;
};

const STATUS: { key: string; label: string; color: string; bg: string }[] = [
  { key: "new", label: "Mới", color: "#2563EB", bg: "#DBEAFE" },
  { key: "contacted", label: "Đã liên hệ", color: "#D97706", bg: "#FEF3C7" },
  { key: "completed", label: "Hoàn tất", color: "#059669", bg: "#D1FAE5" },
];

export default function Consultations() {
  const router = useRouter();
  const [list, setList] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const mapItem = (c: any): Item | null => {
    const id = Number(c.ID ?? c.id);
    if (!id) return null;
    return {
      id,
      fullName: String(c.FullName ?? c.fullName ?? ""),
      email: String(c.Email ?? c.email ?? ""),
      phone: String(c.Phone ?? c.phone ?? ""),
      program: String(c.Program ?? c.program ?? ""),
      location: String(c.Location ?? c.location ?? ""),
      preferredSession: String(c.PreferredSession ?? c.preferredSession ?? ""),
      message: String(c.Message ?? c.message ?? ""),
      status: String(c.Status ?? c.status ?? "new").toLowerCase(),
      createdAt: String(c.CreatedAt ?? c.createdAt ?? ""),
    };
  };

  const load = useCallback(async () => {
    try {
      const res = await apiClient.get("/consultations");
      const raw = res.data?.data ?? res.data ?? [];
      setList(
        (Array.isArray(raw) ? raw : []).map(mapItem).filter(Boolean) as Item[],
      );
    } catch (e: any) {
      console.log("consultations", e?.response?.data || e);
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

  const setStatus = async (item: Item, status: string) => {
    try {
      await apiClient.put(`/consultations/${item.id}`, { status });
      setList((prev) =>
        prev.map((x) => (x.id === item.id ? { ...x, status } : x)),
      );
    } catch (e: any) {
      Alert.alert("Lỗi", e?.response?.data?.message || "Cập nhật thất bại");
    }
  };

  const stMeta = (s: string) => STATUS.find((x) => x.key === s) || STATUS[0];

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.title}>Yêu cầu tư vấn</Text>
        <View style={styles.iconBtn} />
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
              <Ionicons name="chatbubbles-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>Chưa có yêu cầu tư vấn</Text>
            </View>
          }
          renderItem={({ item }) => {
            const st = stMeta(item.status);
            return (
              <View style={styles.card}>
                <View style={styles.row}>
                  <Text style={styles.name}>{item.fullName}</Text>
                  <View style={[styles.badge, { backgroundColor: st.bg }]}>
                    <Text style={[styles.badgeText, { color: st.color }]}>
                      {st.label}
                    </Text>
                  </View>
                </View>
                <Text style={styles.meta}>
                  {item.phone} · {item.email}
                </Text>
                <Text style={styles.meta}>
                  {item.program} · {item.preferredSession}
                </Text>
                {!!item.location && (
                  <Text style={styles.meta}>{item.location}</Text>
                )}
                {!!item.message && (
                  <Text style={styles.msg} numberOfLines={4}>
                    {item.message}
                  </Text>
                )}
                <View style={styles.actions}>
                  {STATUS.map((s) => (
                    <TouchableOpacity
                      key={s.key}
                      style={[
                        styles.chip,
                        item.status === s.key && { backgroundColor: s.bg },
                      ]}
                      onPress={() => setStatus(item, s.key)}>
                      <Text
                        style={[
                          styles.chipText,
                          item.status === s.key && { color: s.color },
                        ]}>
                        {s.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            );
          }}
        />
      )}
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
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  name: { flex: 1, fontSize: 15, fontWeight: "700", color: "#1A1A1A" },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  meta: { fontSize: 12, color: "#6B7280", marginTop: 4 },
  msg: { fontSize: 13, color: "#374151", marginTop: 8, lineHeight: 19 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
  },
  chipText: { fontSize: 12, fontWeight: "600", color: "#6B7280" },
  empty: { alignItems: "center", paddingTop: 60, gap: 8 },
  emptyText: { fontWeight: "700", color: "#6B7280" },
});
