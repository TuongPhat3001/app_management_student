import apiClient from "@/src/api/axios";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
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

type UserRole = "student" | "teacher" | "admin" | "all";

interface UserItem {
  id: number;
  fullName: string;
  email: string;
  role: string;
  studentId?: string;
  major?: string;
  status?: string;
}

const ROLE_FILTERS: { label: string; value: UserRole }[] = [
  { label: "Tất cả", value: "all" },
  { label: "Sinh viên", value: "student" },
  { label: "Giảng viên", value: "teacher" },
  { label: "Admin", value: "admin" },
];

const MOCK_USERS: UserItem[] = [
  {
    id: 1,
    fullName: "Nguyễn Văn An",
    email: "an.nguyen@student.edu.vn",
    role: "student",
    studentId: "20260001",
    major: "CNTT",
    status: "active",
  },
  {
    id: 2,
    fullName: "Trương Tường Phát",
    email: "phat.truong@teacher.edu.vn",
    role: "teacher",
    status: "active",
  },
  {
    id: 3,
    fullName: "Trần Thị Bình",
    email: "binh.tran@student.edu.vn",
    role: "student",
    studentId: "20260002",
    major: "KTPM",
    status: "active",
  },
  {
    id: 4,
    fullName: "Admin Hệ thống",
    email: "admin@edu.vn",
    role: "admin",
    status: "active",
  },
];

const Users = () => {
  const router = useRouter();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole>("all");

  const fetchUsers = useCallback(async () => {
    try {
      const res = await apiClient.get("/users");
      const data = res.data?.data || res.data || [];
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      setUsers(MOCK_USERS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const filtered = users.filter((u) => {
    const matchRole =
      roleFilter === "all" || u.role?.toLowerCase() === roleFilter;
    const q = search.trim().toLowerCase();
    const matchSearch =
      !q ||
      u.fullName?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.studentId?.toLowerCase().includes(q);
    return matchRole && matchSearch;
  });

  const getRoleBadge = (role: string) => {
    const r = role?.toLowerCase();
    if (r === "student")
      return { label: "Sinh viên", bg: "#DBEAFE", color: "#2563EB" };
    if (r === "teacher")
      return { label: "Giảng viên", bg: "#EDE9FE", color: "#5B5BD6" };
    if (r === "admin")
      return { label: "Admin", bg: "#FEF3C7", color: "#D97706" };
    return { label: role || "—", bg: "#F3F4F6", color: "#6B7280" };
  };

  const handleDelete = (user: UserItem) => {
    Alert.alert("Xóa người dùng", `Bạn có chắc muốn xóa "${user.fullName}"?`, [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            await apiClient.delete(`/users/${user.id}`);
            setUsers((prev) => prev.filter((u) => u.id !== user.id));
            Alert.alert("Thành công", "Đã xóa người dùng.");
          } catch (error: any) {
            Alert.alert(
              "Lỗi",
              error?.response?.data?.message || "Không thể xóa.",
            );
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: UserItem }) => {
    const badge = getRoleBadge(item.role);
    return (
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(item.fullName || "?").charAt(0)}
          </Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{item.fullName}</Text>
          <Text style={styles.cardEmail}>{item.email}</Text>
          {item.studentId ? (
            <Text style={styles.cardMeta}>MSSV: {item.studentId}</Text>
          ) : null}
          {item.major ? (
            <Text style={styles.cardMeta}>Ngành: {item.major}</Text>
          ) : null}
        </View>
        <View style={styles.cardRight}>
          <View style={[styles.roleBadge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.roleText, { color: badge.color }]}>
              {badge.label}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => handleDelete(item)}
            hitSlop={8}
            style={styles.deleteBtn}>
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3EEFF" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản lý người dùng</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm tên, email, MSSV..."
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Role filters */}
      <View style={styles.filterRow}>
        {ROLE_FILTERS.map((f) => (
          <TouchableOpacity
            key={f.value}
            style={[
              styles.filterChip,
              roleFilter === f.value && styles.filterChipActive,
            ]}
            onPress={() => setRoleFilter(f.value)}>
            <Text
              style={[
                styles.filterText,
                roleFilter === f.value && styles.filterTextActive,
              ]}>
              {f.label}
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
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#5B5BD6"]}
              tintColor="#5B5BD6"
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={56} color="#D1D5DB" />
              <Text style={styles.emptyText}>Không có người dùng</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

export default Users;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F3EEFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  headerSpacer: { width: 40 },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#1A1A1A" },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  filterChipActive: {
    backgroundColor: "#5B5BD6",
    borderColor: "#5B5BD6",
  },
  filterText: { fontSize: 13, fontWeight: "600", color: "#6B7280" },
  filterTextActive: { color: "#FFFFFF" },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EDE9FE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: { fontSize: 18, fontWeight: "700", color: "#5B5BD6" },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: "600", color: "#1A1A1A" },
  cardEmail: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  cardMeta: { fontSize: 12, color: "#9CA3AF", marginTop: 1 },
  cardRight: { alignItems: "flex-end", gap: 8 },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  roleText: { fontSize: 11, fontWeight: "600" },
  deleteBtn: { padding: 4 },
  empty: { alignItems: "center", paddingTop: 60 },
  emptyText: { fontSize: 15, color: "#9CA3AF", marginTop: 10 },
});
