import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";
import Colors from "../../theme/colors";

interface Props {
  title: string;
  loading?: boolean;
  onPress: () => void;
}

export default function AppButton({ title, loading, onPress }: Props) {
  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
      disabled={loading}>
      {loading ? (
        <ActivityIndicator color="white" />
      ) : (
        <Text style={styles.text}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 55,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  text: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 18,
  },
});
