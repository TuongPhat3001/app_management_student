import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { logoutAPI } from "../../api/authApi";

const LogoutScreen = () => {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất?", [
      {
        text: "Hủy",
        style: "cancel",
      },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: async () => {
          setLoading(true);

          try {
            await logoutAPI();

            if (Platform.OS === "web") {
              await AsyncStorage.multiRemove(["jwt_token", "role"]);
            } else {
              await SecureStore.deleteItemAsync("jwt_token");
              await SecureStore.deleteItemAsync("role");
            }

            Alert.alert("Thành công", "Đăng xuất thành công.", [
              {
                text: "OK",
                onPress: () => {
                  router.replace("/(auth)/login");
                },
              },
            ]);
          } catch (error: any) {
            Alert.alert(
              "Lỗi",
              error.response?.data?.message || "Không thể đăng xuất.",
            );
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Đăng xuất</Text>

      <Text style={styles.subtitle}>Bạn muốn đăng xuất khỏi hệ thống?</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={handleLogout}
        disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Đăng xuất</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default LogoutScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 25,
    backgroundColor: "#F8F9FA",
  },

  title: {
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
    color: "#1F2937",
    marginBottom: 15,
  },

  subtitle: {
    textAlign: "center",
    color: "#6B7280",
    marginBottom: 35,
    fontSize: 16,
  },

  button: {
    backgroundColor: "#EF4444",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
