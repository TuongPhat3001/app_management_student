import apiClient from "@/src/api/axios";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
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
  code: string;
  major?: string;
  teacher?: string;
  status?: string;
  maxStudents?: number;
  current?: number;
};

const ClassList: React.FC = () => {
  const router = useRouter();
  const [list, setList] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await apiClient.get("/classes");
      const raw = res.data?.data ?? res.data ?? [];
      const items = (Array.isArray(raw) ? raw : [])
        .map((c: any) => {
          const id = Number(c.ID ?? c.id);
          if (!id) return null;
          return {
            id,
            code: String(c.ClassCode ?? c.classCode ?? id),
            major: c.Major?.Name ?? c.Major?.name,
            teacher:
              c.Teacher?.User?.FullName ??
              c.Teacher?.User?.fullName ??
              c.Teacher?.User?.Username,
            status: String(c.Status ?? c.status ?? ""),
            maxStudents:
              Number(c.MaxStudents ?? c.maxStudents ?? 0) || undefined,
            current: Number(
              c.CurrentStudents ?? c.currentStudents ?? c.current_students ?? 0,
            ),
          };
        })
        .filter(Boolean) as ClassItem[];
      setList(items);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = list.filter((c) => {
    const s = q.trim().toLowerCase();
    if (!s) return true;
    return (
      c.code.toLowerCase().includes(s) ||
      (c.major || "").toLowerCase().includes(s) ||
      (c.teacher || "").toLowerCase().includes(s)
    );
  });

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.title}>Danh sách lớp học</Text>
        <Text style={styles.count}>{list.length}</Text>
      </View>

      <View style={styles.search}>
        <Ionicons name="search" size={18} color="#9CA3AF" />
        <TextInput
          style={{ flex: 1, marginLeft: 8 }}
          placeholder="Tìm mã lớp..."
          value={q}
          onChangeText={setQ}
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
          ListEmptyComponent={
            <Text style={styles.empty}>Không có lớp học</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.code}>{item.code}</Text>
              <Text style={styles.meta}>
                ID {item.id}
                {item.major ? ` · ${item.major}` : ""}
                {item.teacher ? ` · GV: ${item.teacher}` : " · Chưa có GV"}
              </Text>
              <Text style={styles.meta}>
                {item.status || "—"}
                {item.maxStudents
                  ? ` · Sĩ số ${item.current ?? 0}/${item.maxStudents}`
                  : ""}
              </Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
};

export default ClassList;

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
  count: {
    minWidth: 40,
    textAlign: "center",
    fontWeight: "800",
    color: "#5B5BD6",
  },
  search: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    backgroundColor: "#FFF",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { textAlign: "center", color: "#9CA3AF", marginTop: 40 },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  code: { fontSize: 16, fontWeight: "700", color: "#1A1A1A" },
  meta: { fontSize: 12, color: "#6B7280", marginTop: 4 },
});
