import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  time: string;
  type: "attendance" | "grade" | "course" | "system";
  read: boolean;
}

const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "1",
    title: "Điểm danh thành công",
    body: "Bạn đã điểm danh buổi học Database Systems lúc 08:15.",
    time: "5 phút trước",
    type: "attendance",
    read: false,
  },
  {
    id: "2",
    title: "Có điểm mới",
    body: "Điểm giữa kỳ môn Web Development đã được cập nhật: 8.5",
    time: "1 giờ trước",
    type: "grade",
    read: false,
  },
  {
    id: "3",
    title: "Đăng ký học phần",
    body: "Bạn đã đăng ký thành công môn Software Engineering - SE101.",
    time: "Hôm nay, 09:30",
    type: "course",
    read: true,
  },
  {
    id: "4",
    title: "Nhắc lịch học",
    body: "Buổi học Database Systems sẽ bắt đầu sau 30 phút tại phòng A101.",
    time: "Hôm qua",
    type: "system",
    read: true,
  },
  {
    id: "5",
    title: "Thông báo hệ thống",
    body: "Hệ thống sẽ bảo trì từ 22:00 đến 23:00 ngày 30/07.",
    time: "2 ngày trước",
    type: "system",
    read: true,
  },
];

const getIcon = (type: NotificationItem["type"]) => {
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
    default:
      return {
        name: "notifications" as const,
        color: "#D97706",
        bg: "#FEF3C7",
      };
  }
};

const Notification = () => {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const renderItem = ({ item }: { item: NotificationItem }) => {
    const icon = getIcon(item.type);
    return (
      <TouchableOpacity
        style={[styles.card, !item.read && styles.cardUnread]}
        activeOpacity={0.7}
        onPress={() => markAsRead(item.id)}>
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

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons
              name="notifications-off-outline"
              size={64}
              color="#D1D5DB"
            />
            <Text style={styles.emptyText}>Chưa có thông báo nào</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default Notification;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F3EEFF",
  },
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
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  markAll: {
    fontSize: 14,
    fontWeight: "600",
    color: "#5B5BD6",
  },
  badgeRow: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  badgeText: {
    fontSize: 14,
    color: "#6B7280",
  },
  badgeCount: {
    fontWeight: "700",
    color: "#5B5BD6",
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
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
  content: {
    flex: 1,
  },
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
  titleUnread: {
    color: "#1A1A1A",
    fontWeight: "700",
  },
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
  time: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  empty: {
    alignItems: "center",
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 16,
    color: "#9CA3AF",
    marginTop: 12,
  },
});
