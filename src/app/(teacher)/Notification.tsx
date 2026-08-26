import apiClient from "@/src/api/axios";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * GET /notifications — khớp backend models.Notification
 * Subject, Content, Status, Channel, CreatedAt, SentAt
 */

interface NotificationItem {
  id: string;
  subject: string;
  content: string;
  status: string;
  channel: string;
  createdAt?: string;
  sentAt?: string;
  timeLabel: string;
}

const POLL_MS = 15000;

const formatTime = (raw?: string) => {
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return String(raw);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Hôm qua";
  if (days < 7) return `${days} ngày trước`;
  return d.toLocaleDateString("vi-VN");
};

const statusMeta = (status: string) => {
  const s = (status || "").toLowerCase();
  if (s === "sent") return { label: "Mới", color: "#059669", bg: "#D1FAE5" };
  if (s === "failed") return { label: "Lỗi", color: "#DC2626", bg: "#FEE2E2" };
  return { label: "Hệ thống", color: "#5B5BD6", bg: "#EDE9FE" };
};

const normalizeList = (raw: any): NotificationItem[] => {
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.data)
      ? raw.data
      : Array.isArray(raw?.data?.data)
        ? raw.data.data
        : [];

  return list
    .map((item: any, index: number) => {
      const id = String(item.ID ?? item.id ?? `n-${index}`);
      const subject = String(
        item.Subject ?? item.subject ?? item.title ?? "Thông báo",
      ).trim();
      const content = String(
        item.Content ?? item.content ?? item.body ?? "",
      ).trim();
      const status = String(item.Status ?? item.status ?? "created");
      const channel = String(item.Channel ?? item.channel ?? "email");
      const createdAt = item.CreatedAt ?? item.createdAt ?? item.created_at;
      const sentAt = item.SentAt ?? item.sentAt ?? item.sent_at;
      return {
        id,
        subject: subject || "Thông báo",
        content,
        status,
        channel,
        createdAt: createdAt ? String(createdAt) : undefined,
        sentAt: sentAt ? String(sentAt) : undefined,
        timeLabel: formatTime(sentAt || createdAt),
      };
    })
    .sort((a: NotificationItem, b: NotificationItem) => {
      const ta = new Date(b.createdAt || b.sentAt || 0).getTime();
      const tb = new Date(a.createdAt || a.sentAt || 0).getTime();
      return ta - tb;
    });
};

const Notification = () => {
  const router = useRouter();
  const [list, setList] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<NotificationItem | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchList = useCallback(async (silent = false) => {
    try {
      if (!silent) setError("");
      const res = await apiClient.get("/notifications");
      setList(normalizeList(res.data));
    } catch (err: any) {
      if (!silent) {
        setError(
          err?.response?.data?.message ||
            "Không tải được thông báo. Kéo xuống để thử lại.",
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchList(false);
      pollRef.current = setInterval(() => fetchList(true), POLL_MS);
      return () => {
        if (pollRef.current) clearInterval(pollRef.current);
      };
    }, [fetchList]),
  );

  const renderItem = ({ item }: { item: NotificationItem }) => {
    const st = statusMeta(item.status);
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.75}
        onPress={() => setSelected(item)}>
        <View style={styles.iconWrap}>
          <Ionicons name="notifications" size={22} color="#5B5BD6" />
        </View>
        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>
              {item.subject}
            </Text>
            <View style={[styles.badge, { backgroundColor: st.bg }]}>
              <Text style={[styles.badgeText, { color: st.color }]}>
                {st.label}
              </Text>
            </View>
          </View>
          <Text style={styles.preview} numberOfLines={2}>
            {item.content || "(Không có nội dung)"}
          </Text>
          <Text style={styles.time}>{item.timeLabel || "—"}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3EEFF" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông báo</Text>
        <TouchableOpacity onPress={() => fetchList(false)} hitSlop={12}>
          <Ionicons name="refresh" size={22} color="#5B5BD6" />
        </TouchableOpacity>
      </View>

      <Text style={styles.count}>{list.length} thông báo</Text>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#5B5BD6" />
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchList(false);
              }}
              colors={["#5B5BD6"]}
              tintColor="#5B5BD6"
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              {error ? (
                <>
                  <Ionicons name="warning-outline" size={48} color="#F87171" />
                  <Text style={styles.emptyText}>{error}</Text>
                  <TouchableOpacity
                    style={styles.retry}
                    onPress={() => fetchList(false)}>
                    <Text style={styles.retryText}>Thử lại</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Ionicons
                    name="notifications-off-outline"
                    size={64}
                    color="#D1D5DB"
                  />
                  <Text style={styles.emptyText}>Chưa có thông báo nào</Text>
                  <Text style={styles.emptyHint}>
                    Thông báo từ admin sẽ hiện tại đây.
                  </Text>
                </>
              )}
            </View>
          }
        />
      )}

      <Modal
        visible={!!selected}
        transparent
        animationType="slide"
        onRequestClose={() => setSelected(null)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>{selected?.subject}</Text>
              <TouchableOpacity onPress={() => setSelected(null)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalTime}>{selected?.timeLabel}</Text>
            <Text style={styles.modalBody}>
              {selected?.content || "(Không có nội dung)"}
            </Text>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setSelected(null)}>
              <Text style={styles.closeText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Notification;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F3EEFF" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  count: {
    fontSize: 13,
    color: "#6B7280",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  list: { paddingHorizontal: 16, paddingBottom: 24, flexGrow: 1 },
  card: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#EDE9FE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  body: { flex: 1 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  title: { flex: 1, fontSize: 15, fontWeight: "700", color: "#1A1A1A" },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  preview: {
    fontSize: 13.5,
    color: "#6B7280",
    lineHeight: 19,
    marginBottom: 6,
  },
  time: { fontSize: 12, color: "#9CA3AF" },
  empty: { alignItems: "center", paddingTop: 80, paddingHorizontal: 28 },
  emptyText: {
    fontSize: 15,
    color: "#9CA3AF",
    marginTop: 12,
    textAlign: "center",
  },
  emptyHint: {
    fontSize: 13,
    color: "#D1D5DB",
    marginTop: 8,
    textAlign: "center",
  },
  retry: {
    marginTop: 16,
    backgroundColor: "#5B5BD6",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryText: { color: "#FFF", fontWeight: "600" },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
  },
  modalHead: { flexDirection: "row", gap: 12, marginBottom: 8 },
  modalTitle: { flex: 1, fontSize: 18, fontWeight: "700", color: "#1A1A1A" },
  modalTime: { fontSize: 13, color: "#9CA3AF", marginBottom: 14 },
  modalBody: {
    fontSize: 15,
    color: "#374151",
    lineHeight: 22,
    marginBottom: 20,
  },
  closeBtn: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  closeText: { fontSize: 15, fontWeight: "600", color: "#374151" },
});
