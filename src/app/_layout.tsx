import { Slot } from "expo-router";
import React from "react";
import { Provider } from "react-redux";
import { AuthProvider } from "../context/AuthContext";
import { store } from "../store/store";

export default function RootLayout() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <Slot />
      </AuthProvider>
    </Provider>
  );
}
