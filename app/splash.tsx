import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";

export default function SplashScreen() {
  useEffect(() => {
    const init = async () => {
      try {
        const token = await SecureStore.getItemAsync("accessToken");
        const role = await SecureStore.getItemAsync("role");

        setTimeout(() => {
          if (!token) {
            router.replace("/login");
            return;
          }

          switch (role) {
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
        }, 1500);
      } catch (error) {
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
      />

      <Text style={styles.title}>Student Management</Text>

      <Text style={styles.subtitle}>System</Text>

      <ActivityIndicator
        size="large"
        color="#3F51F5"
        style={{
          marginTop: 40,
        }}
      />
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

    resizeMode: "contain",
  },

  title: {
    color: "white",

    fontSize: 28,

    fontWeight: "700",

    marginTop: 30,
  },

  subtitle: {
    color: "white",

    fontSize: 24,

    marginTop: 5,
  },
});
