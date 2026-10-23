import { pollAndNotifyLocal } from "@/src/utils/localPush";
import { getUnreadCount } from "@/src/utils/notificationBadge";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

type Props = {
  onPress: () => void;
  style?: ViewStyle;
  iconColor?: string;
  pollMs?: number;
};

export default function BellButton({
  onPress,
  style,
  iconColor = "#1A1A1A",
  pollMs = 25000,
}: Props) {
  const [count, setCount] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const n = await getUnreadCount();
      setCount(n);
      await pollAndNotifyLocal();
    } catch {
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
      timer.current = setInterval(refresh, pollMs);
      return () => {
        if (timer.current) clearInterval(timer.current);
      };
    }, [refresh, pollMs]),
  );

  const label = count > 99 ? "99+" : String(count);

  return (
    <TouchableOpacity
      style={[styles.btn, style]}
      onPress={onPress}
      activeOpacity={0.8}>
      <Ionicons name="notifications-outline" size={22} color={iconColor} />
      {count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },
});
