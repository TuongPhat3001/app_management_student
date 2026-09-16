import { getMySubmissionsAPI } from "@/src/api/authApi";
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
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type SubItem = {
  id: number;
  title: string;
  status: string;
  score?: string;
  submittedAt: string;
  classCode: string;
};

const StudentSubmissions: React.FC = () => {
  const router = useRouter();
  const [list, setList] = useState<SubItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await getMySubmissionsAPI();
      const raw = res.data?.data ?? res.data ?? [];
      const items = (Array.isArray(raw) ? raw : [])
        .map((s: any) => {
          const id = Number(s.ID ?? s.id);
          if (!id) return null;
          const ex = s.Exercise ?? s.exercise ?? {};
          const at = s.SubmittedAt ?? s.submittedAt ?? "";
          const score = s.Score ?? s.score;
          return {
            id,
            title: String(ex.Title ?? ex.title ?? "Bài tập"),
            status: String(s.Status ?? s.status ?? "submitted"),
            score:
              score !== undefined && score !== null && score !== ""
                ? String(score)
                : undefined,
            submittedAt: at ? String(at).slice(0, 16).replace("T", " ") : "—",
            classCode: String(ex.Class?.ClassCode ?? ex.Class?.classCode ?? ""),
          };
        })
        .filter(Boolean) as SubItem[];
      setList(items);
    } catch (e: any) {
      console.log("submissions", e?.response?.data || e);
      setList([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.title}>Bài đã nộp</Text>
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
            <Text style={styles.empty}>Bạn chưa nộp bài tập nào.</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.meta}>
                {item.classCode ? `Lớp ${item.classCode} · ` : ""}
                {item.submittedAt}
              </Text>
              <View style={styles.row}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.status}</Text>
                </View>
                {item.score !== undefined && (
                  <Text style={styles.score}>Điểm: {item.score}</Text>
                )}
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
};

export default StudentSubmissions;

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
  empty: { textAlign: "center", color: "#9CA3AF", marginTop: 40 },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  cardTitle: { fontSize: 16, fontWeight: "700" },
  meta: { fontSize: 12, color: "#9CA3AF", marginTop: 6 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 10,
  },
  badge: {
    backgroundColor: "#EDE9FE",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeText: { color: "#5B5BD6", fontWeight: "700", fontSize: 12 },
  score: { fontWeight: "700", color: "#059669" },
});
