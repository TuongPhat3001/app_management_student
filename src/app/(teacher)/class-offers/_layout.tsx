import { Stack } from "expo-router";
import React from "react";

export default function ClassOffersLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="ViewSuggestClass" />
      <Stack.Screen name="RespondClassOffer" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
