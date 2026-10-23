import apiClient from "@/src/api/axios";
import {
  deleteNotificationLocal,
  getDeletedIds,
  getReadIds,
  markAllNotificationsRead,
  markOneRead,
} from "@/src/utils/notificationBadge";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

interface NotificationItem {
  id: string;
  subject: string;
  content: string;
  status: string;
  channel: string;
  createdAt?: string;
  sentAt?: string;
  timeLabel: string;
  isRead?: boolean;
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

const normalizeList = (
  raw: any,
  read: Set<string>,
  deleted: Set<string>,
): NotificationItem[] => {
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
        isRead: read.has(id),
      };
    })
    .filter((n: { id: string }) => !deleted.has(n.id))
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
      const [read, deleted] = await Promise.all([
        getReadIds(),
        getDeletedIds(),
      ]);
      setList(normalizeList(res.data, read, deleted));
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

  const onMarkOneRead = async (item: NotificationItem) => {
    await markOneRead(item.id);
    setList((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)),
    );
    if (selected?.id === item.id) {
      setSelected({ ...item, isRead: true });
    }
  };

  const onMarkAllRead = async () => {
    await markAllNotificationsRead(list.map((n) => n.id));
    setList((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const onDelete = (item: NotificationItem) => {
    Alert.alert("Xóa thông báo", `Xóa "${item.subject}"?`, [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          await deleteNotificationLocal(item.id);
          setList((prev) => prev.filter((n) => n.id !== item.id));
          if (selected?.id === item.id) setSelected(null);
        },
      },
    ]);
  };

  const openDetail = async (item: NotificationItem) => {
    setSelected(item);
    if (!item.isRead) {
      await onMarkOneRead(item);
    }
  };

  const renderItem = ({ item }: { item: NotificationItem }) => {
    const st = statusMeta(item.status);
    return (
      <TouchableOpacity
        style={[styles.card, !item.isRead && styles.cardUnread]}
        activeOpacity={0.75}
        onPress={() => openDetail(item)}>
        <View style={styles.iconWrap}>
          <Ionicons
            name={item.isRead ? "mail-open-outline" : "mail-unread-outline"}
            size={22}
            color={item.isRead ? "#9CA3AF" : "#5B5BD6"}
          />
          {!item.isRead && <View style={styles.dot} />}
        </View>
        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text
              style={[styles.title, !item.isRead && styles.titleUnread]}
              numberOfLines={1}>
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
          <View style={styles.rowActions}>
            <Text style={styles.time}>{item.timeLabel || "—"}</Text>
            <View style={styles.actionBtns}>
              {!item.isRead && (
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => onMarkOneRead(item)}
                  hitSlop={8}>
                  <Ionicons name="checkmark-done" size={16} color="#059669" />
                  <Text style={styles.actionRead}>Đánh dấu đã đọc</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => onDelete(item)}
                hitSlop={8}>
                <Ionicons name="trash-outline" size={16} color="#DC2626" />
                <Text style={styles.actionDelete}>Xóa</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const unreadCount = list.filter((n) => !n.isRead).length;

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

      <View style={styles.toolbar}>
        <Text style={styles.count}>
          {list.length} thông báo
          {unreadCount > 0 ? ` · ${unreadCount} chưa đọc` : ""}
        </Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={onMarkAllRead} hitSlop={8}>
            <Text style={styles.markAll}>Đánh dấu tất cả đã đọc</Text>
          </TouchableOpacity>
        )}
      </View>

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
            <View style={styles.modalActions}>
              {selected && !selected.isRead && (
                <TouchableOpacity
                  style={styles.modalReadBtn}
                  onPress={() => selected && onMarkOneRead(selected)}>
                  <Ionicons name="checkmark-done" size={18} color="#059669" />
                  <Text style={styles.modalReadText}>Đánh dấu đã đọc</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.modalDeleteBtn}
                onPress={() => selected && onDelete(selected)}>
                <Ionicons name="trash-outline" size={18} color="#DC2626" />
                <Text style={styles.modalDeleteText}>Xóa thông báo</Text>
              </TouchableOpacity>
            </View>
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
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  count: { fontSize: 13, color: "#6B7280", fontWeight: "600" },
  markAll: { fontSize: 13, color: "#5B5BD6", fontWeight: "700" },
  list: { paddingHorizontal: 14, paddingBottom: 32 },
  card: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    gap: 12,
  },
  cardUnread: {
    backgroundColor: "#F5F3FF",
    borderColor: "#DDD6FE",
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EDE9FE",
    justifyContent: "center",
    alignItems: "center",
  },
  dot: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
  },
  body: { flex: 1 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  title: { flex: 1, fontSize: 15, fontWeight: "600", color: "#374151" },
  titleUnread: { fontWeight: "800", color: "#1A1A1A" },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: { fontSize: 11, fontWeight: "700" },
  preview: { fontSize: 13, color: "#6B7280", lineHeight: 18, marginBottom: 8 },
  rowActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 6,
  },
  time: { fontSize: 11, color: "#9CA3AF" },
  actionBtns: { flexDirection: "row", alignItems: "center", gap: 12 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  actionRead: { fontSize: 12, color: "#059669", fontWeight: "600" },
  actionDelete: { fontSize: 12, color: "#DC2626", fontWeight: "600" },
  empty: {
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: 32,
    gap: 10,
  },
  emptyText: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    fontWeight: "600",
  },
  emptyHint: { fontSize: 13, color: "#9CA3AF", textAlign: "center" },
  retry: {
    marginTop: 8,
    backgroundColor: "#5B5BD6",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryText: { color: "#FFF", fontWeight: "700" },
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
    paddingBottom: 32,
    maxHeight: "80%",
  },
  modalHead: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 8,
  },
  modalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "800",
    color: "#1A1A1A",
  },
  modalTime: { fontSize: 12, color: "#9CA3AF", marginBottom: 12 },
  modalBody: {
    fontSize: 15,
    color: "#374151",
    lineHeight: 22,
    marginBottom: 16,
  },
  modalActions: { gap: 10, marginBottom: 12 },
  modalReadBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#ECFDF5",
    padding: 12,
    borderRadius: 12,
  },
  modalReadText: { color: "#059669", fontWeight: "700", fontSize: 14 },
  modalDeleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF2F2",
    padding: 12,
    borderRadius: 12,
  },
  modalDeleteText: { color: "#DC2626", fontWeight: "700", fontSize: 14 },
  closeBtn: {
    backgroundColor: "#5B5BD6",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  closeText: { color: "#FFF", fontWeight: "700", fontSize: 15 },
});
