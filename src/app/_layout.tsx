import { AuthProvider } from "@/src/context/AuthContext";
import { store } from "@/src/store/store";
import { Slot } from "expo-router";
import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider } from "react-redux";

import { LogBox } from "react-native";
LogBox.ignoreLogs([
  "Too many screens defined",
  'Route "page" is extraneous',
  "AxiosError",
  "status code 404",
  "Request failed with status code 404",
  "Uncaught (in promise",
]);

export default function RootLayout() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <SafeAreaProvider>
          <Slot />
        </SafeAreaProvider>
      </AuthProvider>
    </Provider>
  );
}
