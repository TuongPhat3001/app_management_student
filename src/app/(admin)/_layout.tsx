import { Stack } from "expo-router";
import React from "react";

export default function AdminLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DashboardAdmin" />
      <Stack.Screen name="CreateIdStudent" />
      <Stack.Screen name="CreateIdTeacher" />
      <Stack.Screen name="CreateClass" />
      <Stack.Screen name="AssignTeacher" />
      <Stack.Screen name="SendNotification" />
      <Stack.Screen name="Users" />
      <Stack.Screen name="Courses" />
      <Stack.Screen name="Exams" />
      <Stack.Screen name="Reports" />
    </Stack>
  );
}
