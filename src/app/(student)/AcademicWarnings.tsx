import apiClient from "@/src/api/axios";
import { useAuth } from "@/src/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
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
  semester: string;
  gpa: number;
  failedCourses: number;
  reason: string;
  status: string;
};

export default function StudentAcademicWarnings() {
  const router = useRouter();
  const { user } = useAuth();
  const [list, setList] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const params: any = { _t: Date.now() };
      const res = await apiClient.get("/academic-warnings", { params });
      const raw = res.data?.data ?? res.data ?? [];
      const mapped = (Array.isArray(raw) ? raw : [])
        .map((w: any) => {
          const id = Number(w.ID ?? w.id);
          if (!id) return null;
          const sem = w.Semester ?? w.semester ?? {};
          return {
            id,
            semester: String(sem.Name ?? sem.name ?? sem.Code ?? ""),
            gpa: Number(w.GPA ?? w.gpa ?? 0),
            failedCourses: Number(w.FailedCourses ?? w.failedCourses ?? 0),
            reason: String(w.Reason ?? w.reason ?? ""),
            status: String(w.Status ?? w.status ?? ""),
          };
        })
        .filter(Boolean) as Item[];
      setList(mapped);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load]),
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.title}>Cảnh báo học vụ</Text>
        <View style={styles.back} />
      </View>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#5B5BD6" />
      ) : (
        <FlatList
          data={list}
          keyExtractor={(i) => String(i.id)}
          contentContainerStyle={{ padding: 14 }}
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
              <Text style={styles.emptyText}>Bạn không có cảnh báo học vụ</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.sem}>{item.semester || "Học kỳ"}</Text>
              <Text style={styles.stats}>
                GPA: {item.gpa.toFixed(2)} · Môn trượt: {item.failedCourses}
              </Text>
              {!!item.reason && (
                <Text style={styles.reason}>{item.reason}</Text>
              )}
              <Text style={styles.status}>{item.status}</Text>
            </View>
          )}
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
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  back: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  title: { flex: 1, textAlign: "center", fontWeight: "700", fontSize: 17 },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  sem: { fontWeight: "800", fontSize: 15, color: "#1A1A1A" },
  stats: { marginTop: 6, fontWeight: "600", color: "#374151" },
  reason: { marginTop: 8, color: "#6B7280", lineHeight: 19 },
  status: { marginTop: 8, color: "#DC2626", fontWeight: "700", fontSize: 12 },
  empty: { alignItems: "center", paddingTop: 60, gap: 8 },
  emptyText: { color: "#6B7280", fontWeight: "600" },
});
