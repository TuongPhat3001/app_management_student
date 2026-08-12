import apiClient from "@/src/api/axios";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
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

type NotiType =
  | "attendance"
  | "grade"
  | "course"
  | "system"
  | "class_offer"
  | "assignment";

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  time: string;
  type: NotiType;
  read: boolean;
  meta?: {
    classOfferId?: number | string;
    route?: string;
  };
  createdAt?: string;
}

const POLL_MS = 15000;

const formatTime = (raw?: string) => {
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
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

const mapType = (raw: any): NotiType => {
  const t = String(raw?.type || raw?.Type || raw?.category || "").toLowerCase();
  if (t.includes("attend")) return "attendance";
  if (t.includes("grade") || t.includes("score")) return "grade";
  if (t.includes("course") || t.includes("class") || t.includes("đăng ký"))
    return "course";
  if (t.includes("offer") || t.includes("phân công") || t.includes("assign"))
    return "class_offer";
  if (t.includes("exercise") || t.includes("homework") || t.includes("bài"))
    return "assignment";
  return "system";
};

const normalizeList = (raw: any): NotificationItem[] => {
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.data)
      ? raw.data
      : Array.isArray(raw?.data?.data)
        ? raw.data.data
        : Array.isArray(raw?.notifications)
          ? raw.notifications
          : [];

  return list.map((item: any, index: number) => {
    const id = String(item.id ?? item.ID ?? item._id ?? `n-${index}`);
    const createdAt =
      item.createdAt || item.created_at || item.CreatedAt || item.time;
    return {
      id,
      title:
        item.title || item.Title || item.subject || item.Subject || "Thông báo",
      body:
        item.body ||
        item.Body ||
        item.content ||
        item.Content ||
        item.message ||
        item.Message ||
        "",
      time: formatTime(createdAt) || item.time || "",
      type: mapType(item),
      read: Boolean(
        item.read ?? item.isRead ?? item.is_read ?? item.IsRead ?? false,
      ),
      createdAt,
      meta: {
        classOfferId:
          item.classOfferId ||
          item.class_offer_id ||
          item.offerId ||
          item.data?.classOfferId ||
          item.payload?.classOfferId,
        route: item.route || item.link || item.data?.route,
      },
    };
  });
};

const getIcon = (type: NotiType) => {
  switch (type) {
    case "attendance":
      return {
        name: "checkmark-circle" as const,
        color: "#059669",
        bg: "#D1FAE5",
      };
    case "grade":
      return { name: "school" as const, color: "#0EA5E9", bg: "#E0F2FE" };
    case "course":
      return { name: "book" as const, color: "#5B5BD6", bg: "#EDE9FE" };
    case "class_offer":
      return { name: "mail" as const, color: "#7C3AED", bg: "#F5F3FF" };
    case "assignment":
      return {
        name: "document-text" as const,
        color: "#D97706",
        bg: "#FEF3C7",
      };
    default:
      return {
        name: "notifications" as const,
        color: "#D97706",
        bg: "#FEF3C7",
      };
  }
};

const Notification = () => {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNotifications = useCallback(async (silent = false) => {
    try {
      if (!silent) setError("");
      const res = await apiClient.get("/notifications");
      const list = normalizeList(res.data);
      list.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }
        return b.id.localeCompare(a.id);
      });
      setNotifications(list);
    } catch (err: any) {
      console.log("Notification fetch error:", err);
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

  // Vào màn → load ngay + poll mỗi 15s để cập nhật thông báo mới
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchNotifications(false);

      pollRef.current = setInterval(() => {
        fetchNotifications(true);
      }, POLL_MS);

      return () => {
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      };
    }, [fetchNotifications]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications(false);
  };

  const markAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    try {
      await apiClient.patch(`/notifications/${id}/read`);
    } catch {
      try {
        await apiClient.put(`/notifications/${id}/read`);
      } catch {
        /* backend có thể chưa có endpoint */
      }
    }
  };

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await apiClient.post("/notifications/read-all");
    } catch {
      try {
        await apiClient.patch("/notifications/read-all");
      } catch {
        /* ignore */
      }
    }
  };

  const handlePress = async (item: NotificationItem) => {
    if (!item.read) await markAsRead(item.id);

    if (item.type === "class_offer") {
      const offerId = item.meta?.classOfferId;
      if (offerId) {
        router.push(`/(teacher)/class-offers/${offerId}/accept` as any);
        return;
      }
      router.push("/(teacher)/ViewSuggestClass" as any);
      return;
    }
    if (item.meta?.route) {
      router.push(item.meta.route as any);
      return;
    }
    if (item.type === "grade") {
      router.push("/(student)/ViewTranscript" as any);
      return;
    }
    if (item.type === "attendance") {
      router.push("/(student)/QrAttendance" as any);
      return;
    }
    if (item.type === "course") {
      router.push("/(student)/RegisterCourses" as any);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const renderItem = ({ item }: { item: NotificationItem }) => {
    const icon = getIcon(item.type);
    return (
      <TouchableOpacity
        style={[styles.card, !item.read && styles.cardUnread]}
        activeOpacity={0.7}
        onPress={() => handlePress(item)}>
        <View style={[styles.iconWrap, { backgroundColor: icon.bg }]}>
          <Ionicons name={icon.name} size={22} color={icon.color} />
        </View>
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text
              style={[styles.title, !item.read && styles.titleUnread]}
              numberOfLines={1}>
              {item.title}
            </Text>
            {!item.read && <View style={styles.dot} />}
          </View>
          <Text style={styles.body} numberOfLines={2}>
            {item.body}
          </Text>
          <Text style={styles.time}>{item.time}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3EEFF" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Thông báo</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead} activeOpacity={0.7}>
            <Text style={styles.markAll}>Đánh dấu đã đọc</Text>
          </TouchableOpacity>
        )}
      </View>

      {unreadCount > 0 && (
        <View style={styles.badgeRow}>
          <Text style={styles.badgeText}>
            Bạn có <Text style={styles.badgeCount}>{unreadCount}</Text> thông
            báo chưa đọc
          </Text>
        </View>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#5B5BD6" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
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
              {error ? (
                <>
                  <Ionicons name="warning-outline" size={48} color="#F87171" />
                  <Text style={styles.emptyText}>{error}</Text>
                  <TouchableOpacity
                    style={styles.retryBtn}
                    onPress={() => fetchNotifications(false)}>
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
                </>
              )}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

export default Notification;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F3EEFF" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#1A1A1A" },
  markAll: { fontSize: 14, fontWeight: "600", color: "#5B5BD6" },
  badgeRow: { paddingHorizontal: 20, paddingVertical: 10 },
  badgeText: { fontSize: 14, color: "#6B7280" },
  badgeCount: { fontWeight: "700", color: "#5B5BD6" },
  list: { paddingHorizontal: 16, paddingBottom: 24, flexGrow: 1 },
  card: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardUnread: {
    borderLeftWidth: 3,
    borderLeftColor: "#5B5BD6",
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  content: { flex: 1 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
    flex: 1,
  },
  titleUnread: { color: "#1A1A1A", fontWeight: "700" },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#5B5BD6",
    marginLeft: 8,
  },
  body: {
    fontSize: 13.5,
    color: "#6B7280",
    lineHeight: 19,
    marginBottom: 6,
  },
  time: { fontSize: 12, color: "#9CA3AF" },
  empty: { alignItems: "center", paddingTop: 80, paddingHorizontal: 24 },
  emptyText: {
    fontSize: 15,
    color: "#9CA3AF",
    marginTop: 12,
    textAlign: "center",
  },
  retryBtn: {
    marginTop: 16,
    backgroundColor: "#5B5BD6",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryText: { color: "#FFF", fontWeight: "600" },
});
