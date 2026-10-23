import { Platform } from "react-native";
import type { NotifRow } from "./notificationBadge";
import { getNewForPush, markPushed } from "./notificationBadge";

let Notifications: any = null;
try {
  Notifications = require("expo-notifications");
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch {
  Notifications = null;
}

let permissionAsked = false;

export async function ensureNotificationPermission(): Promise<boolean> {
  if (!Notifications) return false;
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === "granted") return true;
    if (permissionAsked) return false;
    permissionAsked = true;
    const { status } = await Notifications.requestPermissionsAsync();
    if (Platform.OS === "android" && Notifications.setNotificationChannelAsync) {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Thông báo",
        importance: Notifications.AndroidImportance?.HIGH ?? 4,
        vibrationPattern: [0, 250, 250, 250],
      });
    }
    return status === "granted";
  } catch {
    return false;
  }
}

/** Kiểm tra thông báo mới và hiện banner trên máy */
export async function pollAndNotifyLocal(): Promise<number> {
  if (!Notifications) return 0;
  const ok = await ensureNotificationPermission();
  if (!ok) return 0;

  const news = await getNewForPush();
  if (!news.length) return 0;

  // Chỉ bắn tối đa 3 cái mỗi lần để tránh spam
  const batch = news.slice(0, 3);
  for (const n of batch) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: n.subject || "Thông báo mới",
          body: (n.content || "").slice(0, 180) || "Bạn có thông báo mới từ nhà trường.",
          data: { notificationId: n.id },
          sound: true,
        },
        trigger: null, // hiện ngay
      });
    } catch (e) {
      console.log("[localPush] schedule error", e);
    }
  }
  await markPushed(news.map((n) => n.id));
  return news.length;
}
