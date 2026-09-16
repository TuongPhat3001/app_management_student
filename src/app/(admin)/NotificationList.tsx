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
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Noti = {
  id: number;
  subject: string;
  content: string;
  status: string;
  email?: string;
  createdAt?: string;
};

const NotificationList: React.FC = () => {
  const router = useRouter();
  const [list, setList] = useState<Noti[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await apiClient.get("/notifications");
      const raw = res.data?.data ?? res.data ?? [];
      const items = (Array.isArray(raw) ? raw : [])
        .map((n: any) => {
          const id = Number(n.ID ?? n.id);
          if (!id) return null;
          return {
            id,
            subject: String(n.Subject ?? n.subject ?? ""),
            content: String(n.Content ?? n.content ?? ""),
            status: String(n.Status ?? n.status ?? ""),
            email: n.RecipientEmail ?? n.recipientEmail,
            createdAt: n.CreatedAt ?? n.createdAt,
          };
        })
        .filter(Boolean) as Noti[];
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

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.title}>Thông báo</Text>
        <Text style={styles.count}>{list.length}</Text>
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
            <Text style={styles.empty}>Chưa có thông báo</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.subject}>
                {item.subject || "(Không tiêu đề)"}
              </Text>
              <Text style={styles.content} numberOfLines={3}>
                {item.content}
              </Text>
              <Text style={styles.meta}>
                {item.status}
                {item.email ? ` · ${item.email}` : ""}
                {item.createdAt
                  ? ` · ${String(item.createdAt).slice(0, 19).replace("T", " ")}`
                  : ""}
              </Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
};

export default NotificationList;

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
    color: "#2563EB",
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
  subject: { fontSize: 15, fontWeight: "700", color: "#1A1A1A" },
  content: { fontSize: 13, color: "#4B5563", marginTop: 6, lineHeight: 18 },
  meta: { fontSize: 11, color: "#9CA3AF", marginTop: 8 },
});
