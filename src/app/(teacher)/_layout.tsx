import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";

export default function TeacherLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: "#3F51F5" }}>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Trang chủ",
          tabBarIcon: ({ color }) => (
            <Ionicons name="grid" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="attendance"
        options={{
          title: "Điểm danh",
          tabBarIcon: ({ color }) => (
            <Ionicons name="qr-code" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
