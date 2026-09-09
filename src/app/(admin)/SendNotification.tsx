import apiClient from "@/src/api/axios";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Target = "all" | "students" | "teachers" | "user";

type Recipient = { userId: number; email?: string; name?: string };

const TARGETS: {
  key: Target;
  label: string;
  desc: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
}[] = [
  { key: "all", label: "Tất cả", desc: "SV + Giảng viên", icon: "people" },
  {
    key: "students",
    label: "Sinh viên",
    desc: "Mọi sinh viên",
    icon: "school",
  },
  {
    key: "teachers",
    label: "Giảng viên",
    desc: "Mọi giảng viên",
    icon: "person",
  },
  { key: "user", label: "Cá nhân", desc: "Email hoặc user ID", icon: "mail" },
];

function extractUserId(item: any): number | undefined {
  const candidates = [
    item?.UserID,
    item?.userId,
    item?.user_id,
    item?.User?.ID,
    item?.User?.id,
    item?.user?.ID,
    item?.user?.id,
  ];
  const looksLikeUser =
    (item?.Username || item?.username || item?.Email || item?.email) &&
    !item?.StudentCode &&
    !item?.studentCode &&
    !item?.TeacherCode &&
    !item?.teacherCode &&
    !item?.UserID &&
    !item?.userId;
  if (looksLikeUser) {
    candidates.push(item?.ID, item?.id);
  }
  for (const c of candidates) {
    const n = Number(c);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return undefined;
}

function extractEmail(item: any): string | undefined {
  const e = String(
    item?.User?.Email ??
      item?.User?.email ??
      item?.user?.email ??
      item?.email ??
      item?.Email ??
      "",
  ).trim();
  return e || undefined;
}

function extractName(item: any): string | undefined {
  const n = String(
    item?.User?.FullName ??
      item?.User?.fullName ??
      item?.user?.fullName ??
      item?.FullName ??
      item?.fullName ??
      item?.name ??
      "",
  ).trim();
  return n || undefined;
}

async function fetchRecipients(target: Target): Promise<Recipient[]> {
  const list: Recipient[] = [];
  const pull = async (url: string) => {
    const res = await apiClient.get(url);
    const raw = res.data?.data ?? res.data ?? [];
    const arr = Array.isArray(raw) ? raw : [];
    for (const item of arr) {
      const userId = extractUserId(item);
      if (!userId) continue;
      list.push({
        userId,
        email: extractEmail(item),
        name: extractName(item),
      });
    }
  };

  if (target === "students" || target === "all") {
    try {
      await pull("/students");
    } catch (e) {
      console.log("fetch /students failed", e);
    }
  }
  if (target === "teachers" || target === "all") {
    try {
      await pull("/teachers");
    } catch (e) {
      console.log("fetch /teachers failed", e);
    }
  }

  const map = new Map<number, Recipient>();
  for (const r of list) map.set(r.userId, r);
  return Array.from(map.values());
}

async function sendOne(
  subject: string,
  content: string,
  sendNow: boolean,
  r: { userId?: number; email?: string },
) {
  const payload: Record<string, any> = { subject, content, sendNow };
  if (r.userId) payload.recipientUserId = r.userId;
  if (r.email) payload.recipientEmail = r.email;
  try {
    await apiClient.post("/notifications/email", payload);
  } catch (err: any) {
    if (err?.response?.status === 502) return;
    throw err;
  }
}

const SendNotification: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [target, setTarget] = useState<Target>("all");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientUserId, setRecipientUserId] = useState("");
  const [sendNow, setSendNow] = useState(false);

  const handleSubmit = async () => {
    const subj = subject.trim();
    const body = content.trim();
    if (!subj || !body) {
      Alert.alert("Thiếu thông tin", "Nhập tiêu đề và nội dung.");
      return;
    }

    // —— 1 người ——
    if (target === "user") {
      const email = recipientEmail.trim();
      const idStr = recipientUserId.trim();
      if (!email && !idStr) {
        Alert.alert(
          "Thiếu người nhận",
          "Cần email hoặc recipientUserId (users.id).",
        );
        return;
      }
      if (idStr && (isNaN(Number(idStr)) || Number(idStr) <= 0)) {
        Alert.alert("Sai", "recipientUserId phải là số > 0 (users.id).");
        return;
      }
      setLoading(true);
      try {
        await sendOne(subj, body, sendNow, {
          userId: idStr ? Number(idStr) : undefined,
          email: email || undefined,
        });
        Alert.alert("Thành công", "Đã gửi / lưu thông báo.", [
          { text: "OK", onPress: () => router.back() },
        ]);
        setSubject("");
        setContent("");
        setRecipientEmail("");
        setRecipientUserId("");
      } catch (e: any) {
        const d = e?.response?.data;
        Alert.alert("Lỗi", d?.message || d?.error || "Gửi thất bại.");
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    try {
      const recipients = await fetchRecipients(target);
      if (recipients.length === 0) {
        Alert.alert(
          "Không có người nhận",
          "API /students hoặc /teachers không trả userId.",
        );
        return;
      }

      const results = await Promise.allSettled(
        recipients.map((r) => sendOne(subj, body, false, r)),
      );
      const ok = results.filter((x) => x.status === "fulfilled").length;

      if (ok === 0) {
        Alert.alert("Gửi thất bại", "Không gửi được thông báo nào.");
        return;
      }

      Alert.alert("Thành công", "Đã gửi thành công", [
        { text: "OK", onPress: () => router.back() },
      ]);
      setSubject("");
      setContent("");
      setTarget("all");
    } catch (e: any) {
      Alert.alert(
        "Lỗi",
        e?.response?.data?.message || e?.message || "Thất bại",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3EEFF" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gửi thông báo</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled">
          <Text style={styles.section}>Đối tượng</Text>
          <View style={styles.grid}>
            {TARGETS.map((t) => {
              const on = target === t.key;
              return (
                <TouchableOpacity
                  key={t.key}
                  style={[styles.chip, on && styles.chipOn]}
                  onPress={() => setTarget(t.key)}>
                  <Ionicons
                    name={t.icon}
                    size={18}
                    color={on ? "#5B5BD6" : "#6B7280"}
                  />
                  <Text style={[styles.chipLabel, on && { color: "#5B5BD6" }]}>
                    {t.label}
                  </Text>
                  <Text style={styles.chipDesc}>{t.desc}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.label}>Tiêu đề *</Text>
          <TextInput
            style={styles.input}
            value={subject}
            onChangeText={setSubject}
            placeholder="VD: Thông báo nghỉ học"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.label}>Nội dung *</Text>
          <TextInput
            style={[styles.input, styles.area]}
            value={content}
            onChangeText={setContent}
            placeholder="Nội dung..."
            placeholderTextColor="#9CA3AF"
            multiline
            textAlignVertical="top"
          />

          {target === "user" && (
            <>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={recipientEmail}
                onChangeText={setRecipientEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="email@school.edu"
                placeholderTextColor="#9CA3AF"
              />
              <Text style={styles.label}>recipientUserId (users.id)</Text>
              <TextInput
                style={styles.input}
                value={recipientUserId}
                onChangeText={setRecipientUserId}
                keyboardType="numeric"
                placeholder="VD: 5"
                placeholderTextColor="#9CA3AF"
              />
            </>
          )}

          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchTitle}>Gửi email (sendNow)</Text>
            </View>
            <Switch
              value={sendNow}
              onValueChange={setSendNow}
              trackColor={{ false: "#D1D5DB", true: "#C4B5FD" }}
              thumbColor={sendNow ? "#5B5BD6" : "#F3F4F6"}
            />
          </View>

          <TouchableOpacity
            style={[styles.btn, loading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="send" size={18} color="#FFF" />
                <Text style={styles.btnText}>
                  {target === "user" ? "Gửi 1 người" : "Gửi hàng loạt"}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SendNotification;

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
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "700",
  },
  scroll: { padding: 20, paddingBottom: 40 },
  banner: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#EDE9FE",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  bannerText: { flex: 1, fontSize: 12.5, color: "#4C1D95", lineHeight: 18 },
  section: {
    fontSize: 12,
    fontWeight: "700",
    color: "#5B5BD6",
    textTransform: "uppercase",
    marginBottom: 10,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  chip: {
    width: "47%",
    backgroundColor: "#FFF",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    padding: 12,
    gap: 4,
  },
  chipOn: { borderColor: "#5B5BD6", backgroundColor: "#F5F3FF" },
  chipLabel: { fontSize: 14, fontWeight: "700", color: "#374151" },
  chipDesc: { fontSize: 11, color: "#9CA3AF" },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    fontSize: 15,
    color: "#1A1A1A",
  },
  area: { height: 110, paddingTop: 12 },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 12,
  },
  switchTitle: { fontSize: 15, fontWeight: "600" },
  switchDesc: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
  btn: {
    backgroundColor: "#5B5BD6",
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  btnText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
});
