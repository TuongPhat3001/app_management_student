import { useAuth } from "@/src/context/AuthContext";
import { Redirect } from "expo-router";
import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

function dashboardByRole(role?: string | null) {
  const r = (role || "").toLowerCase();
  if (r === "admin") return "/(admin)/DashboardAdmin";
  if (r === "teacher") return "/(teacher)/DashboardTeacher";
  if (r === "student") return "/(student)/DashboardStudent";
  return null;
}

export default function Index() {
  const { token, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#5B5BD6" />
      </View>
    );
  }

  if (token) {
    const href = dashboardByRole(user?.role) || "/(auth)/login";
    return <Redirect href={href as any} />;
  }

  return <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
});
