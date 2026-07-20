import React from "react";
import { ActivityIndicator, Modal, StyleSheet, Text, View } from "react-native";

interface LoadingProps {
  size?: "small" | "medium" | "large";
  text?: string;
  fullScreen?: boolean;
  overlay?: boolean;
}

const Loading: React.FC<LoadingProps> = ({
  size = "medium",
  text = "Đang tải...",
  fullScreen = false,
  overlay = false,
}) => {
  const indicatorSize =
    size === "small" ? "small" : ("large" as "small" | "large");

  const content = (
    <View style={styles.content}>
      <ActivityIndicator size={indicatorSize} color="#2563EB" />

      {text ? <Text style={styles.text}>{text}</Text> : null}
    </View>
  );

  if (fullScreen) {
    return (
      <Modal transparent visible animationType="fade">
        <View style={styles.fullScreen}>{content}</View>
      </Modal>
    );
  }

  if (overlay) {
    return <View style={styles.overlay}>{content}</View>;
  }

  return content;
};

export default Loading;

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },

  content: {
    justifyContent: "center",
    alignItems: "center",
  },

  text: {
    marginTop: 12,
    fontSize: 16,
    color: "#4B5563",
    fontWeight: "500",
  },
});
