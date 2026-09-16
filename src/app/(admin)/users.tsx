import apiClient from "@/src/api/axios";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

type RoleFilter = "all" | "student" | "teacher";

type UserItem = {
  id: number; // students.id hoặc teachers.id
  role: "student" | "teacher";
  fullName: string;
  username: string;
  email: string;
  code: string;
  status?: string;
};

const Users: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ role?: string }>();
  const initialRole = ((): RoleFilter => {
    const r = String(params.role || "").toLowerCase();
    if (r === "student" || r === "teacher") return r;
    return "all";
  })();
  const [items, setItems] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<RoleFilter>(initialRole);

  const load = useCallback(async () => {
    try {
      const [sRes, tRes] = await Promise.all([
        apiClient.get("/students"),
        apiClient.get("/teachers"),
      ]);
      const students = Array.isArray(sRes.data?.data) ? sRes.data.data : [];
      const teachers = Array.isArray(tRes.data?.data) ? tRes.data.data : [];

      const sItems: UserItem[] = students
        .map((s: any) => {
          const id = Number(s.ID ?? s.id);
          if (!id) return null;
          return {
            id,
            role: "student" as const,
            fullName: String(
              s.User?.FullName ?? s.User?.fullName ?? s.fullName ?? "SV",
            ),
            username: String(s.User?.Username ?? s.User?.username ?? ""),
            email: String(s.User?.Email ?? s.User?.email ?? ""),
            code: String(s.StudentCode ?? s.studentCode ?? ""),
            status: String(s.Status ?? s.status ?? "active"),
          };
        })
        .filter(Boolean) as UserItem[];

      const tItems: UserItem[] = teachers
        .map((t: any) => {
          const id = Number(t.ID ?? t.id);
          if (!id) return null;
          return {
            id,
            role: "teacher" as const,
            fullName: String(
              t.User?.FullName ?? t.User?.fullName ?? t.fullName ?? "GV",
            ),
            username: String(t.User?.Username ?? t.User?.username ?? ""),
            email: String(t.User?.Email ?? t.User?.email ?? ""),
            code: String(t.TeacherCode ?? t.teacherCode ?? ""),
            status: "active",
          };
        })
        .filter(Boolean) as UserItem[];

      setItems([...tItems, ...sItems]);
    } catch (e: any) {
      console.log("Users load error", e?.response?.data || e);
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const r = String(params.role || "").toLowerCase();
      if (r === "student" || r === "teacher") setRole(r);
      else if (!params.role) {
        /* giữ filter hiện tại nếu không truyền param */
      }
      setLoading(true);
      load();
    }, [load, params.role]),
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((u) => {
      if (role !== "all" && u.role !== role) return false;
      if (!q) return true;
      return (
        u.fullName.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.code.toLowerCase().includes(q)
      );
    });
  }, [items, search, role]);

  const handleDelete = (u: UserItem) => {
    if (u.role === "student") {
      Alert.alert(
        "Không hỗ trợ",
        "Backend hiện chỉ có xóa giảng viên (DELETE /teachers/:id), chưa có API xóa sinh viên.",
      );
      return;
    }
    Alert.alert("Xóa giảng viên", `Xóa ${u.fullName} (${u.code})?`, [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            await apiClient.delete(`/teachers/${u.id}`);
            Alert.alert("Thành công", "Đã xóa giảng viên.");
            load();
          } catch (e: any) {
            const d = e?.response?.data;
            const detail = String(d?.error || "");
            let msg =
              [d?.message, d?.error].filter(Boolean).join("\n") ||
              "Xóa thất bại.";
            if (/1451|foreign key|FOREIGN KEY/i.test(detail)) {
              msg =
                "Không xóa được vì còn dữ liệu liên quan (thông báo / lớp / phân công).\n" +
                "Khởi động lại backend (đã cập nhật xóa notification) rồi thử lại.\n\n" +
                detail;
            }
            Alert.alert("Lỗi", msg);
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: UserItem }) => {
    const isTeacher = item.role === "teacher";
    return (
      <View style={styles.card}>
        <View
          style={[
            styles.avatar,
            { backgroundColor: isTeacher ? "#E0E7FF" : "#D1FAE5" },
          ]}>
          <Ionicons
            name={isTeacher ? "person" : "school"}
            size={20}
            color={isTeacher ? "#5B5BD6" : "#059669"}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{item.fullName}</Text>
          <Text style={styles.meta}>
            {isTeacher ? "GV" : "SV"} · {item.code || "—"} · {item.username}
          </Text>
          {!!item.email && <Text style={styles.email}>{item.email}</Text>}
        </View>
        {isTeacher && (
          <TouchableOpacity
            style={styles.delBtn}
            onPress={() => handleDelete(item)}>
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.title}>
          {role === "student"
            ? "Sinh viên"
            : role === "teacher"
              ? "Giảng viên"
              : "Người dùng"}
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push("/(admin)/CreateIdStudent")}>
            <Ionicons name="person-add" size={18} color="#5B5BD6" />
            <Text style={styles.addText}>SV</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push("/(admin)/CreateIdTeacher")}>
            <Ionicons name="person-add" size={18} color="#5B5BD6" />
            <Text style={styles.addText}>GV</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm tên, mã, username..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <View style={styles.filters}>
        {(
          [
            ["all", "Tất cả"],
            ["student", "Sinh viên"],
            ["teacher", "Giảng viên"],
          ] as const
        ).map(([v, label]) => (
          <TouchableOpacity
            key={v}
            style={[styles.chip, role === v && styles.chipOn]}
            onPress={() => setRole(v)}>
            <Text style={[styles.chipText, role === v && styles.chipTextOn]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#5B5BD6" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(i) => `${i.role}-${i.id}`}
          renderItem={renderItem}
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
            <Text style={styles.empty}>Không có người dùng</Text>
          }
        />
      )}
    </SafeAreaView>
  );
};

export default Users;

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
  title: { fontSize: 20, fontWeight: "800", color: "#1A1A1A" },
  headerActions: { flexDirection: "row", gap: 8 },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EDE9FE",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addText: { color: "#5B5BD6", fontWeight: "700", fontSize: 13 },
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
  filters: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  chipOn: { backgroundColor: "#5B5BD6", borderColor: "#5B5BD6" },
  chipText: { fontSize: 13, fontWeight: "600", color: "#6B7280" },
  chipTextOn: { color: "#FFF" },
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
    gap: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
  },
  name: { fontSize: 15, fontWeight: "700", color: "#1A1A1A" },
  meta: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  email: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
  delBtn: { padding: 8 },
});
