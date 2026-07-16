import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const apiClient = axios.create({
  baseURL: "http://192.168.1.224:8080",
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(async (config) => {
  console.log("BaseURL:", config.baseURL);
  console.log("URL:", config.url);

  const token =
    Platform.OS === "web"
      ? await AsyncStorage.getItem("jwt_token")
      : await SecureStore.getItemAsync("jwt_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default apiClient;
