import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Linking,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PROGRAMS = [
  {
    id: "01",
    title: "Công nghệ & Kỹ thuật",
    desc: "Phát triển phần mềm, dữ liệu, thiết kế số và các giải pháp công nghệ ứng dụng.",
    accent: "#1B5E3B",
    borderTop: "#1B5E3B",
  },
  {
    id: "02",
    title: "Kinh doanh & Quản trị",
    desc: "Tư duy quản trị, marketing, tài chính và năng lực vận hành trong môi trường hiện đại.",
    accent: "#B8860B",
    borderTop: "#C9A227",
  },
  {
    id: "03",
    title: "Thiết kế & Sáng tạo",
    desc: "Phát triển khả năng thẩm mỹ, tư duy thiết kế và kỹ năng xây dựng sản phẩm sáng tạo.",
    accent: "#1E3A5F",
    borderTop: "#3D5A80",
  },
];

export default function ProgramsScreen() {
  const router = useRouter();

  const contact = () => {
    // Mở email tư vấn — đổi địa chỉ nếu nhà trường có email riêng
    Linking.openURL("mailto:tuvan@ppacademy.edu.vn?subject=Tư vấn ngành học");
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={22} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ngành đào tạo</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}>
          {/* Section header giống web */}
          <View style={styles.sectionHead}>
            <View style={styles.sectionLeft}>
              <Text style={styles.eyebrow}>Khối ngành đào tạo</Text>
              <Text style={styles.sectionTitle}>Các ngành đào tạo</Text>
            </View>
            <Text style={styles.sectionHint}>
              Thông tin các nhóm ngành. Liên hệ nhà trường để được hướng dẫn về
              môn học và kế hoạch đào tạo.
            </Text>
          </View>

          {/* Cards */}
          <View style={styles.cards}>
            {PROGRAMS.map((p) => (
              <View
                key={p.id}
                style={[styles.card, { borderTopColor: p.borderTop }]}>
                <Text style={styles.cardNum}>{p.id}</Text>
                <Text style={styles.cardTitle}>{p.title}</Text>
                <Text style={styles.cardDesc}>{p.desc}</Text>
                <TouchableOpacity
                  style={styles.cardLink}
                  onPress={contact}
                  activeOpacity={0.75}>
                  <Text style={[styles.cardLinkText, { color: p.accent }]}>
                    Liên hệ tư vấn
                  </Text>
                  <Ionicons
                    name="arrow-forward"
                    size={14}
                    color={p.accent}
                    style={{ marginLeft: 4 }}
                  />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* CTA cuối trang */}
          <View style={styles.footerCta}>
            <Text style={styles.footerText}>
              Bạn đã sẵn sàng bắt đầu hành trình học tập?
            </Text>
            <TouchableOpacity
              style={styles.loginBtn}
              onPress={() => router.push("/(auth)/login")}
              activeOpacity={0.9}>
              <Text style={styles.loginBtnText}>Đăng nhập hệ thống</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FAFAF9" },
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  scroll: {
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 40,
  },
  sectionHead: {
    marginBottom: 22,
    gap: 10,
  },
  sectionLeft: { gap: 6 },
  eyebrow: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1B5E3B",
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#0F172A",
    fontStyle: "italic",
    letterSpacing: -0.3,
  },
  sectionHint: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 20,
  },
  cards: {
    gap: 14,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E8EEF4",
    borderTopWidth: 3,
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardNum: {
    fontSize: 13,
    fontWeight: "600",
    color: "#94A3B8",
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    fontStyle: "italic",
    marginBottom: 10,
  },
  cardDesc: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 21,
    marginBottom: 16,
  },
  cardLink: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardLinkText: {
    fontSize: 14,
    fontWeight: "600",
  },
  footerCta: {
    marginTop: 28,
    backgroundColor: "#0F2C24",
    borderRadius: 16,
    padding: 22,
    alignItems: "center",
    gap: 14,
  },
  footerText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  loginBtn: {
    backgroundColor: "#1B5E3B",
    borderRadius: 28,
    paddingVertical: 12,
    paddingHorizontal: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loginBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
});
