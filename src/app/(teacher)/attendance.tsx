import React from "react";
import {
  Dimensions,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 48;
const QR_SIZE = 180;

const Attendance = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#EDE7F6" />
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} activeOpacity={0.7}>
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Mã QR điểm danh</Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.content}>
            <Text style={styles.title}>Quét mã QR</Text>
            <Text style={styles.subtitle}>
              Hướng camera của bạn để quét{"\n"}mã QR điểm danh
            </Text>

            <View style={styles.qrWrapper}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />

              <View style={styles.qrCode}>
                <View style={styles.qrInner}>
                  <View style={[styles.finder, { top: 8, left: 8 }]}>
                    <View style={styles.finderInner} />
                  </View>
                  <View style={[styles.finder, { top: 8, right: 8 }]}>
                    <View style={styles.finderInner} />
                  </View>
                  <View style={[styles.finder, { bottom: 8, left: 8 }]}>
                    <View style={styles.finderInner} />
                  </View>
                  <View
                    style={[
                      styles.module,
                      { top: 12, left: 70, width: 10, height: 10 },
                    ]}
                  />
                  <View
                    style={[
                      styles.module,
                      { top: 12, left: 90, width: 20, height: 10 },
                    ]}
                  />
                  <View
                    style={[
                      styles.module,
                      { top: 28, left: 70, width: 10, height: 20 },
                    ]}
                  />
                  <View
                    style={[
                      styles.module,
                      { top: 28, left: 100, width: 10, height: 10 },
                    ]}
                  />
                  <View
                    style={[
                      styles.module,
                      { top: 50, left: 70, width: 30, height: 10 },
                    ]}
                  />
                  <View
                    style={[
                      styles.module,
                      { top: 70, left: 80, width: 10, height: 30 },
                    ]}
                  />
                  <View
                    style={[
                      styles.module,
                      { top: 70, left: 100, width: 20, height: 10 },
                    ]}
                  />
                  <View
                    style={[
                      styles.module,
                      { top: 90, left: 70, width: 10, height: 10 },
                    ]}
                  />
                  <View
                    style={[
                      styles.module,
                      { top: 110, left: 80, width: 30, height: 10 },
                    ]}
                  />
                  <View
                    style={[
                      styles.module,
                      { top: 50, left: 110, width: 10, height: 20 },
                    ]}
                  />
                  <View
                    style={[
                      styles.module,
                      { top: 130, left: 70, width: 20, height: 10 },
                    ]}
                  />
                  <View
                    style={[
                      styles.module,
                      { top: 140, left: 100, width: 10, height: 10 },
                    ]}
                  />
                  <View
                    style={[
                      styles.module,
                      { top: 12, left: 120, width: 10, height: 20 },
                    ]}
                  />
                  <View
                    style={[
                      styles.module,
                      { top: 40, left: 130, width: 10, height: 10 },
                    ]}
                  />
                  <View
                    style={[
                      styles.module,
                      { top: 60, left: 120, width: 20, height: 10 },
                    ]}
                  />
                  <View
                    style={[
                      styles.module,
                      { top: 90, left: 120, width: 10, height: 30 },
                    ]}
                  />
                  <View
                    style={[
                      styles.module,
                      { top: 130, left: 120, width: 20, height: 10 },
                    ]}
                  />
                </View>
              </View>
            </View>

            <View style={styles.sessionInfo}>
              <Text style={styles.sessionText}>
                Phiên: <Text style={styles.sessionBold}>Database Systems</Text>
              </Text>
              <Text style={styles.timerText}>
                Thời gian còn lại: <Text style={styles.timerValue}>16:36</Text>
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.manualButton} activeOpacity={0.7}>
            <Text style={styles.manualText}>Nhập mã thủ công</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Attendance;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#EDE7F6",
  },
  container: {
    flex: 1,
    backgroundColor: "#EDE7F6",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingTop: 16,
    paddingBottom: 32,
    paddingHorizontal: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 28,
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  backArrow: {
    fontSize: 24,
    color: "#1A1A1A",
    fontWeight: "400",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  headerSpacer: {
    width: 36,
  },
  content: {
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#8A8A8A",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 32,
  },
  qrWrapper: {
    width: QR_SIZE + 24,
    height: QR_SIZE + 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
  },
  corner: {
    position: "absolute",
    width: 28,
    height: 28,
    borderColor: "#5B5BD6",
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 6,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 6,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 6,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 6,
  },
  qrCode: {
    width: QR_SIZE,
    height: QR_SIZE,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  qrInner: {
    width: QR_SIZE - 16,
    height: QR_SIZE - 16,
    backgroundColor: "#FFFFFF",
    position: "relative",
  },
  finder: {
    position: "absolute",
    width: 48,
    height: 48,
    borderWidth: 6,
    borderColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
  },
  finderInner: {
    width: 22,
    height: 22,
    backgroundColor: "#000000",
  },
  module: {
    position: "absolute",
    backgroundColor: "#000000",
  },
  sessionInfo: {
    alignItems: "center",
    marginBottom: 8,
  },
  sessionText: {
    fontSize: 15,
    color: "#4A4A4A",
    marginBottom: 6,
  },
  sessionBold: {
    fontWeight: "600",
    color: "#1A1A1A",
  },
  timerText: {
    fontSize: 15,
    color: "#4A4A4A",
  },
  timerValue: {
    fontWeight: "600",
    color: "#1A1A1A",
  },
  manualButton: {
    marginTop: 28,
    alignItems: "center",
    paddingVertical: 8,
  },
  manualText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#5B5BD6",
  },
});
