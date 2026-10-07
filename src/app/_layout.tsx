import { AuthProvider } from "@/src/context/AuthContext";
import { store } from "@/src/store/store";
import { Slot } from "expo-router";
import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider } from "react-redux";

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
