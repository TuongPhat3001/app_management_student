import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";

export default function SplashScreen() {
  useEffect(() => {
    const init = async () => {
      try {
        const [token, role] = await Promise.all([
          SecureStore.getItemAsync("accessToken"),
          SecureStore.getItemAsync("role"),
        ]);

        await new Promise((resolve) => setTimeout(resolve, 1200));

        if (!token) {
          router.replace("/login");
          return;
        }

        switch (role?.toLowerCase()) {
          case "student":
            router.replace("/(student)/home");
            break;
          case "teacher":
            router.replace("/(teacher)/dashboard");
            break;
          case "admin":
            router.replace("/(admin)/dashboard");
            break;
          default:
            router.replace("/login");
        }
      } catch (error) {
        console.error("Lỗi khởi tạo SplashScreen:", error);
        router.replace("/login");
      }
    };

    init();
  }, []);

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/images/logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.title}>Student Management</Text>
      <Text style={styles.subtitle}>System</Text>

      <ActivityIndicator size="large" color="#FFFFFF" style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#3F51F5",
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 120,
    height: 120,
  },
  title: {
    color: "white",
    fontSize: 28,
    fontWeight: "700",
    marginTop: 30,
    textAlign: "center",
  },
  subtitle: {
    color: "white",
    fontSize: 24,
    marginTop: 5,
    textAlign: "center",
  },
  loader: {
    marginTop: 40,
  },
});
