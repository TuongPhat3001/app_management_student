import AsyncStorage from "@react-native-async-storage/async-storage";
import apiClient from "@/src/api/axios";

const READ_KEY = "notif_read_ids_v1";
const DELETED_KEY = "notif_deleted_ids_v1";
const PUSHED_KEY = "notif_pushed_ids_v1";

export type NotifRow = {
  id: number;
  subject?: string;
  content?: string;
  createdAt?: string;
  sentAt?: string;
};

function extractList(data: any): NotifRow[] {
  const raw = data?.data ?? data ?? [];
  const arr = Array.isArray(raw) ? raw : [];
  return arr
    .map((n: any) => ({
      id: Number(n.id ?? n.ID ?? 0),
      subject: String(n.subject ?? n.Subject ?? "Thông báo"),
      content: String(n.content ?? n.Content ?? ""),
      createdAt: n.createdAt ?? n.CreatedAt ?? n.created_at,
      sentAt: n.sentAt ?? n.SentAt ?? n.sent_at,
    }))
    .filter((n) => n.id > 0);
}

async function loadIdSet(key: string): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr.map(String) : []);
  } catch {
    return new Set();
  }
}

async function saveIdSet(key: string, set: Set<string>) {
  await AsyncStorage.setItem(key, JSON.stringify([...set]));
}

export async function fetchNotifications(): Promise<NotifRow[]> {
  const res = await apiClient.get("/notifications");
  return extractList(res.data);
}

export async function getDeletedIds(): Promise<Set<string>> {
  return loadIdSet(DELETED_KEY);
}

export async function getReadIds(): Promise<Set<string>> {
  return loadIdSet(READ_KEY);
}

/** Số chưa đọc (bỏ tin đã xóa local) */
export async function getUnreadCount(): Promise<number> {
  try {
    const list = await fetchNotifications();
    const read = await loadIdSet(READ_KEY);
    const deleted = await loadIdSet(DELETED_KEY);
    return list.filter(
      (n) => !deleted.has(String(n.id)) && !read.has(String(n.id)),
    ).length;
  } catch {
    return 0;
  }
}

export async function markOneRead(id: string | number): Promise<void> {
  const read = await loadIdSet(READ_KEY);
  read.add(String(id));
  await saveIdSet(READ_KEY, read);
}

export async function markAllNotificationsRead(
  ids?: Array<string | number>,
): Promise<void> {
  try {
    const read = await loadIdSet(READ_KEY);
    if (ids && ids.length) {
      ids.forEach((id) => read.add(String(id)));
    } else {
      const list = await fetchNotifications();
      list.forEach((n) => read.add(String(n.id)));
    }
    await saveIdSet(READ_KEY, read);
  } catch {
    /* ignore */
  }
}

/** Xóa local (ẩn khỏi danh sách, không gọi API vì backend chưa có DELETE) */
export async function deleteNotificationLocal(
  id: string | number,
): Promise<void> {
  const deleted = await loadIdSet(DELETED_KEY);
  deleted.add(String(id));
  await saveIdSet(DELETED_KEY, deleted);
  // cũng coi như đã đọc
  await markOneRead(id);
}

export async function getNewForPush(): Promise<NotifRow[]> {
  try {
    const list = await fetchNotifications();
    const pushed = await loadIdSet(PUSHED_KEY);
    const deleted = await loadIdSet(DELETED_KEY);
    return list.filter(
      (n) => !pushed.has(String(n.id)) && !deleted.has(String(n.id)),
    );
  } catch {
    return [];
  }
}

export async function markPushed(ids: number[]): Promise<void> {
  const pushed = await loadIdSet(PUSHED_KEY);
  ids.forEach((id) => pushed.add(String(id)));
  await saveIdSet(PUSHED_KEY, pushed);
}
