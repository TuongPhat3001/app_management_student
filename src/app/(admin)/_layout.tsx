import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";

export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#5B5BD6",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
      }}>
      <Tabs.Screen
        name="DashboardAdmin"
        options={{
          title: "Trang chủ",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? "home" : "home-outline"}
              color={color}
              focused={focused}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="Users"
        options={{
          title: "Người dùng",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? "people" : "people-outline"}
              color={color}
              focused={focused}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="Courses"
        options={{
          title: "Môn học",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? "book" : "book-outline"}
              color={color}
              focused={focused}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="Reports"
        options={{
          title: "Báo cáo",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? "stats-chart" : "stats-chart-outline"}
              color={color}
              focused={focused}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="Profile"
        options={{
          title: "Hồ sơ",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? "person" : "person-outline"}
              color={color}
              focused={focused}
            />
          ),
        }}
      />

      <Tabs.Screen name="CreateIdStudent" options={{ href: null }} />
      <Tabs.Screen name="AddStudentToClass" options={{ href: null }} />
      <Tabs.Screen name="CreateIdTeacher" options={{ href: null }} />
      <Tabs.Screen name="CreateClass" options={{ href: null }} />
      <Tabs.Screen name="AssignTeacher" options={{ href: null }} />
      <Tabs.Screen name="SendNotification" options={{ href: null }} />
      <Tabs.Screen name="Exams" options={{ href: null }} />
    </Tabs>
  );
}

function TabIcon({
  name,
  color,
  focused,
}: {
  name: React.ComponentProps<typeof Ionicons>["name"];
  color: string;
  focused: boolean;
}) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Ionicons name={name} size={22} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    height: Platform.OS === "ios" ? 88 : 64,
    paddingTop: 6,
    paddingBottom: Platform.OS === "ios" ? 28 : 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 10,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  tabItem: {
    paddingTop: 2,
  },
  iconWrap: {
    width: 36,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  iconWrapActive: {
    backgroundColor: "#EDE9FE",
  },
});
