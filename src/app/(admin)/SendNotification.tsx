// import apiClient from "@/src/api/axios";
// import { Ionicons } from "@expo/vector-icons";
// import { useRouter } from "expo-router";
// import React, { useState } from "react";
// import {
//   ActivityIndicator,
//   Alert,
//   KeyboardAvoidingView,
//   Platform,
//   ScrollView,
//   StatusBar,
//   StyleSheet,
//   Switch,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";

// const SendNotification: React.FC = () => {
//   const router = useRouter();
//   const [loading, setLoading] = useState(false);
//   const [subject, setSubject] = useState("");
//   const [content, setContent] = useState("");
//   const [recipientEmail, setRecipientEmail] = useState("");
//   const [recipientUserId, setRecipientUserId] = useState("");
//   const [sendNow, setSendNow] = useState(true);

//   const handleSubmit = async () => {
//     const subj = subject.trim();
//     const body = content.trim();
//     const email = recipientEmail.trim();
//     const idStr = recipientUserId.trim();

//     if (!subj) {
//       Alert.alert("Thiếu thông tin", "Vui lòng nhập tiêu đề (subject).");
//       return;
//     }
//     if (!body) {
//       Alert.alert("Thiếu thông tin", "Vui lòng nhập nội dung (content).");
//       return;
//     }
//     if (!email && !idStr) {
//       Alert.alert(
//         "Thiếu người nhận",
//         "Backend yêu cầu email người nhận hoặc recipientUserId.",
//       );
//       return;
//     }
//     if (idStr && (isNaN(Number(idStr)) || Number(idStr) <= 0)) {
//       Alert.alert("Sai định dạng", "recipientUserId phải là số nguyên > 0.");
//       return;
//     }

//     // Payload đúng contract backend
//     const payload: Record<string, any> = {
//       subject: subj,
//       content: body,
//       sendNow,
//     };
//     if (email) payload.recipientEmail = email;
//     if (idStr) payload.recipientUserId = Number(idStr);

//     setLoading(true);
//     try {
//       const res = await apiClient.post("/notifications/email", payload);
//       const msg =
//         res.data?.message ||
//         (sendNow ? "Gửi email thành công" : "Tạo thông báo email thành công");

//       Alert.alert("Thành công", msg, [
//         {
//           text: "OK",
//           onPress: () => {
//             setSubject("");
//             setContent("");
//             setRecipientEmail("");
//             setRecipientUserId("");
//             setSendNow(true);
//             router.back();
//           },
//         },
//       ]);
//     } catch (error: any) {
//       const d = error?.response?.data;
//       let msg = d?.message || d?.error || "Gửi thông báo thất bại.";
//       if (d?.error && d?.message && String(d.error) !== String(d.message)) {
//         msg = `${d.message}\n${d.error}`;
//       }
//       if (!error?.response) {
//         msg = "Không kết nối được server. Kiểm tra mạng / IP backend.";
//       }
//       // 502: đã lưu nhưng SMTP fail
//       if (error?.response?.status === 502) {
//         Alert.alert("Cảnh báo", msg, [
//           { text: "OK", onPress: () => router.back() },
//         ]);
//         return;
//       }
//       Alert.alert("Lỗi", String(msg));
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <SafeAreaView style={styles.safeArea} edges={["top"]}>
//       <StatusBar barStyle="dark-content" backgroundColor="#F3EEFF" />

//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
//           <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>Gửi thông báo</Text>
//         <View style={{ width: 40 }} />
//       </View>

//       <KeyboardAvoidingView
//         style={{ flex: 1 }}
//         behavior={Platform.OS === "ios" ? "padding" : undefined}>
//         <ScrollView
//           contentContainerStyle={styles.scroll}
//           keyboardShouldPersistTaps="handled"
//           showsVerticalScrollIndicator={false}>
//           {/* Banner */}
//           <View style={styles.banner}>
//             <View style={styles.bannerIcon}>
//               <Ionicons name="mail" size={22} color="#5B5BD6" />
//             </View>
//             <View style={{ flex: 1 }}>
//               <Text style={styles.bannerTitle}>Gửi email thông báo</Text>
//               <Text style={styles.bannerText}>
//                 API backend: POST /notifications/email — cần{" "}
//                 <Text style={styles.bold}>email</Text> hoặc{" "}
//                 <Text style={styles.bold}>recipientUserId</Text>.
//               </Text>
//             </View>
//           </View>

//           {/* Người nhận */}
//           <Text style={styles.section}>Người nhận</Text>

//           <Text style={styles.label}>Email người nhận</Text>
//           <View style={styles.inputWrap}>
//             <Ionicons name="mail-outline" size={18} color="#9CA3AF" />
//             <TextInput
//               style={styles.input}
//               placeholder="vd: student@school.edu.vn"
//               placeholderTextColor="#9CA3AF"
//               value={recipientEmail}
//               onChangeText={setRecipientEmail}
//               keyboardType="email-address"
//               autoCapitalize="none"
//               autoCorrect={false}
//             />
//           </View>

//           <Text style={styles.or}>hoặc</Text>

//           <Text style={styles.label}>ID người dùng (recipientUserId)</Text>
//           <View style={styles.inputWrap}>
//             <Ionicons name="person-outline" size={18} color="#9CA3AF" />
//             <TextInput
//               style={styles.input}
//               placeholder="VD: 15"
//               placeholderTextColor="#9CA3AF"
//               value={recipientUserId}
//               onChangeText={setRecipientUserId}
//               keyboardType="numeric"
//             />
//           </View>
//           <Text style={styles.hint}>
//             Nếu nhập ID, backend tự lấy email từ tài khoản đó.
//           </Text>

//           {/* Nội dung */}
//           <Text style={[styles.section, { marginTop: 8 }]}>Nội dung</Text>

//           <Text style={styles.label}>Tiêu đề (subject) *</Text>
//           <View style={styles.inputWrap}>
//             <Ionicons name="text-outline" size={18} color="#9CA3AF" />
//             <TextInput
//               style={styles.input}
//               placeholder="VD: Thông báo nghỉ lễ"
//               placeholderTextColor="#9CA3AF"
//               value={subject}
//               onChangeText={setSubject}
//             />
//           </View>

//           <Text style={styles.label}>Nội dung (content) *</Text>
//           <TextInput
//             style={[styles.inputBox, styles.area]}
//             placeholder="Nhập nội dung email gửi tới người nhận..."
//             placeholderTextColor="#9CA3AF"
//             value={content}
//             onChangeText={setContent}
//             multiline
//             textAlignVertical="top"
//           />

//           {/* sendNow */}
//           <View style={styles.switchCard}>
//             <View style={{ flex: 1 }}>
//               <Text style={styles.switchTitle}>Gửi ngay (sendNow)</Text>
//               <Text style={styles.switchDesc}>
//                 Bật: gửi email qua SMTP. Tắt: chỉ lưu vào database.
//               </Text>
//             </View>
//             <Switch
//               value={sendNow}
//               onValueChange={setSendNow}
//               trackColor={{ false: "#D1D5DB", true: "#C4B5FD" }}
//               thumbColor={sendNow ? "#5B5BD6" : "#F3F4F6"}
//             />
//           </View>

//           <TouchableOpacity
//             style={[styles.submit, loading && { opacity: 0.7 }]}
//             onPress={handleSubmit}
//             disabled={loading}
//             activeOpacity={0.9}>
//             {loading ? (
//               <ActivityIndicator color="#FFFFFF" />
//             ) : (
//               <>
//                 <Ionicons name="send" size={18} color="#FFFFFF" />
//                 <Text style={styles.submitText}>Gửi thông báo</Text>
//               </>
//             )}
//           </TouchableOpacity>
//         </ScrollView>
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// };

// export default SendNotification;

// const styles = StyleSheet.create({
//   safeArea: { flex: 1, backgroundColor: "#F3EEFF" },
//   header: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingHorizontal: 12,
//     paddingVertical: 12,
//     backgroundColor: "#FFFFFF",
//     borderBottomWidth: 1,
//     borderBottomColor: "#F0F0F0",
//   },
//   backBtn: {
//     width: 40,
//     height: 40,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   headerTitle: {
//     flex: 1,
//     textAlign: "center",
//     fontSize: 17,
//     fontWeight: "700",
//     color: "#1A1A1A",
//   },
//   scroll: { padding: 20, paddingBottom: 40 },

//   banner: {
//     flexDirection: "row",
//     gap: 12,
//     backgroundColor: "#FFFFFF",
//     borderRadius: 16,
//     padding: 14,
//     marginBottom: 22,
//     borderWidth: 1,
//     borderColor: "#EDE9FE",
//   },
//   bannerIcon: {
//     width: 44,
//     height: 44,
//     borderRadius: 12,
//     backgroundColor: "#EDE9FE",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   bannerTitle: {
//     fontSize: 15,
//     fontWeight: "700",
//     color: "#1A1A1A",
//     marginBottom: 4,
//   },
//   bannerText: { fontSize: 12.5, color: "#6B7280", lineHeight: 18 },
//   bold: { fontWeight: "700", color: "#4C1D95" },

//   section: {
//     fontSize: 12,
//     fontWeight: "700",
//     color: "#5B5BD6",
//     textTransform: "uppercase",
//     letterSpacing: 0.5,
//     marginBottom: 12,
//   },
//   label: {
//     fontSize: 13,
//     fontWeight: "600",
//     color: "#374151",
//     marginBottom: 8,
//   },
//   inputWrap: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 10,
//     backgroundColor: "#FFFFFF",
//     borderWidth: 1,
//     borderColor: "#E5E7EB",
//     borderRadius: 12,
//     paddingHorizontal: 14,
//     marginBottom: 12,
//     minHeight: 48,
//   },
//   input: {
//     flex: 1,
//     fontSize: 15,
//     color: "#1A1A1A",
//     paddingVertical: 12,
//   },
//   inputBox: {
//     backgroundColor: "#FFFFFF",
//     borderWidth: 1,
//     borderColor: "#E5E7EB",
//     borderRadius: 12,
//     paddingHorizontal: 14,
//     paddingVertical: 12,
//     fontSize: 15,
//     color: "#1A1A1A",
//     marginBottom: 12,
//   },
//   area: { height: 130, paddingTop: 12 },
//   or: {
//     textAlign: "center",
//     color: "#9CA3AF",
//     marginBottom: 10,
//     fontSize: 12,
//   },
//   hint: {
//     fontSize: 12,
//     color: "#9CA3AF",
//     marginTop: -4,
//     marginBottom: 16,
//     lineHeight: 17,
//   },

//   switchCard: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#FFFFFF",
//     borderRadius: 14,
//     padding: 14,
//     marginTop: 4,
//     marginBottom: 22,
//     borderWidth: 1,
//     borderColor: "#E5E7EB",
//     gap: 12,
//   },
//   switchTitle: { fontSize: 15, fontWeight: "600", color: "#1A1A1A" },
//   switchDesc: { fontSize: 12, color: "#9CA3AF", marginTop: 3, lineHeight: 16 },

//   submit: {
//     backgroundColor: "#5B5BD6",
//     borderRadius: 14,
//     paddingVertical: 16,
//     alignItems: "center",
//     justifyContent: "center",
//     flexDirection: "row",
//     gap: 8,
//   },
//   submitText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
// });

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

/**
 * Khớp backend: controllers/notification_controller.go
 *
 * POST /notifications/email
 * {
 *   subject: string,            // required
 *   content: string,            // required
 *   sendNow: boolean,
 *   target?: "all" | "students" | "teachers",  // gửi nhóm
 *   recipientEmail?: string,    // gửi 1 người
 *   recipientUserId?: number    // gửi 1 người
 * }
 */

type Target = "all" | "students" | "teachers" | "user";

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
    desc: "Chỉ sinh viên",
    icon: "school",
  },
  {
    key: "teachers",
    label: "Giảng viên",
    desc: "Chỉ giảng viên",
    icon: "person",
  },
  { key: "user", label: "Cá nhân", desc: "Email hoặc ID", icon: "mail" },
];

const SendNotification: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [target, setTarget] = useState<Target>("all");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientUserId, setRecipientUserId] = useState("");
  const [sendNow, setSendNow] = useState(true);

  const handleSubmit = async () => {
    const subj = subject.trim();
    const body = content.trim();

    if (!subj) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập tiêu đề (subject).");
      return;
    }
    if (!body) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập nội dung (content).");
      return;
    }

    // Payload khớp SendNotificationRequest backend
    const payload: Record<string, any> = {
      subject: subj,
      content: body,
      sendNow,
    };

    if (target === "user") {
      const email = recipientEmail.trim();
      const idStr = recipientUserId.trim();
      if (!email && !idStr) {
        Alert.alert(
          "Thiếu người nhận",
          "Gửi cá nhân cần recipientEmail hoặc recipientUserId.",
        );
        return;
      }
      if (idStr) {
        const id = Number(idStr);
        if (isNaN(id) || id <= 0) {
          Alert.alert("Sai định dạng", "recipientUserId phải là số > 0.");
          return;
        }
        payload.recipientUserId = id;
      }
      if (email) payload.recipientEmail = email;
    } else {
      // all | students | teachers
      payload.target = target;
    }

    setLoading(true);
    try {
      const res = await apiClient.post("/notifications/email", payload);
      const data = res.data?.data;
      let msg =
        res.data?.message ||
        (sendNow ? "Gửi thông báo thành công" : "Tạo thông báo thành công");

      if (data && typeof data.total === "number") {
        msg += `\nThành công: ${data.success}/${data.total}`;
        if (data.failed) msg += `\nLỗi: ${data.failed}`;
      }

      Alert.alert("Thành công", msg, [
        {
          text: "OK",
          onPress: () => {
            setSubject("");
            setContent("");
            setRecipientEmail("");
            setRecipientUserId("");
            setTarget("all");
            setSendNow(true);
            router.back();
          },
        },
      ]);
    } catch (error: any) {
      const d = error?.response?.data;
      let msg = d?.message || d?.error || "Gửi thông báo thất bại.";
      if (d?.error && d?.message && String(d.error) !== String(d.message)) {
        msg = `${d.message}\n${d.error}`;
      }
      if (!error?.response) {
        msg = "Không kết nối được server. Kiểm tra mạng / IP backend.";
      }
      if (error?.response?.status === 502) {
        Alert.alert("Cảnh báo", msg, [
          { text: "OK", onPress: () => router.back() },
        ]);
        return;
      }
      Alert.alert("Lỗi", String(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3EEFF" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
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
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.banner}>
            <View style={styles.bannerIcon}>
              <Ionicons name="megaphone" size={22} color="#5B5BD6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle}>POST /notifications/email</Text>
              <Text style={styles.bannerText}>
                Chọn nhóm (target) hoặc gửi cá nhân bằng email /
                recipientUserId.
              </Text>
            </View>
          </View>

          <Text style={styles.section}>Đối tượng (target)</Text>
          <View style={styles.grid}>
            {TARGETS.map((t) => {
              const active = target === t.key;
              return (
                <TouchableOpacity
                  key={t.key}
                  style={[styles.chip, active && styles.chipOn]}
                  onPress={() => setTarget(t.key)}
                  activeOpacity={0.85}>
                  <Ionicons
                    name={t.icon}
                    size={18}
                    color={active ? "#5B5BD6" : "#6B7280"}
                  />
                  <Text
                    style={[styles.chipLabel, active && styles.chipLabelOn]}>
                    {t.label}
                  </Text>
                  <Text style={styles.chipDesc}>{t.desc}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.section}>Nội dung</Text>

          <Text style={styles.label}>Tiêu đề (subject) *</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: Thông báo nghỉ lễ"
            placeholderTextColor="#9CA3AF"
            value={subject}
            onChangeText={setSubject}
          />

          <Text style={styles.label}>Nội dung (content) *</Text>
          <TextInput
            style={[styles.input, styles.area]}
            placeholder="Nhập nội dung thông báo..."
            placeholderTextColor="#9CA3AF"
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
          />

          {target === "user" && (
            <View style={styles.personal}>
              <Text style={styles.section}>Người nhận cụ thể</Text>
              <Text style={styles.label}>recipientEmail</Text>
              <TextInput
                style={styles.input}
                placeholder="vd: sv@school.edu.vn"
                placeholderTextColor="#9CA3AF"
                value={recipientEmail}
                onChangeText={setRecipientEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Text style={styles.or}>hoặc</Text>
              <Text style={styles.label}>recipientUserId</Text>
              <TextInput
                style={styles.input}
                placeholder="VD: 15"
                placeholderTextColor="#9CA3AF"
                value={recipientUserId}
                onChangeText={setRecipientUserId}
                keyboardType="numeric"
              />
            </View>
          )}

          <View style={styles.switchCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchTitle}>sendNow</Text>
              <Text style={styles.switchDesc}>
                Bật: gửi email SMTP. Tắt: chỉ lưu DB.
              </Text>
            </View>
            <Switch
              value={sendNow}
              onValueChange={setSendNow}
              trackColor={{ false: "#D1D5DB", true: "#C4B5FD" }}
              thumbColor={sendNow ? "#5B5BD6" : "#F3F4F6"}
            />
          </View>

          <TouchableOpacity
            style={[styles.submit, loading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.9}>
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="send" size={18} color="#FFF" />
                <Text style={styles.submitText}>
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
  safeArea: { flex: 1, backgroundColor: "#F3EEFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
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
  scroll: { padding: 20, paddingBottom: 40 },
  banner: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#EDE9FE",
  },
  bannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#EDE9FE",
    justifyContent: "center",
    alignItems: "center",
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  bannerText: { fontSize: 12.5, color: "#6B7280", lineHeight: 18 },
  section: {
    fontSize: 12,
    fontWeight: "700",
    color: "#5B5BD6",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  chip: {
    width: "47%",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    padding: 12,
    gap: 4,
  },
  chipOn: { borderColor: "#5B5BD6", backgroundColor: "#F5F3FF" },
  chipLabel: { fontSize: 14, fontWeight: "700", color: "#374151" },
  chipLabelOn: { color: "#5B5BD6" },
  chipDesc: { fontSize: 11, color: "#9CA3AF" },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 14,
    fontSize: 15,
    color: "#1A1A1A",
  },
  area: { height: 120, paddingTop: 12 },
  personal: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  or: {
    textAlign: "center",
    color: "#9CA3AF",
    marginBottom: 10,
    fontSize: 12,
  },
  switchCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 12,
  },
  switchTitle: { fontSize: 15, fontWeight: "600", color: "#1A1A1A" },
  switchDesc: { fontSize: 12, color: "#9CA3AF", marginTop: 3 },
  submit: {
    backgroundColor: "#5B5BD6",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  submitText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
});
