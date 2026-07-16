import { Stack } from "expo-router";
import React from "react";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="ForgotPassword" />
      <Stack.Screen name="ChangePassword" />
      <Stack.Screen name="Logout" />
    </Stack>
  );
}
// import { Stack } from "expo-router";
// import React from "react";

// export default function AuthLayout() {
//   return <Stack screenOptions={{ headerShown: false }} />;
// }
