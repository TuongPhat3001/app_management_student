import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { env } from "../config/env";

const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(async (config) => {
  console.log("========== REQUEST ==========");
  console.log("BaseURL:", config.baseURL);
  console.log("URL:", config.url);

  const token = await AsyncStorage.getItem("jwt_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default apiClient;
