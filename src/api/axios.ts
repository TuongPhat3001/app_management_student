// import AsyncStorage from "@react-native-async-storage/async-storage";
// import axios from "axios";
// import * as SecureStore from "expo-secure-store";
// import { Platform } from "react-native";

// const apiClient = axios.create({
//   baseURL: "http://192.168.20.16:8080",
//   headers: {
//     "Content-Type": "application/json",
//   },
// });

// apiClient.interceptors.request.use(async (config) => {
//   console.log("BaseURL:", config.baseURL);
//   console.log("URL:", config.url);

//   const token =
//     Platform.OS === "web"
//       ? await AsyncStorage.getItem("jwt_token")
//       : await SecureStore.getItemAsync("jwt_token");
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }

//   return config;
// });

// export default apiClient;

import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const API_BASE = "http://192.168.20.25:8080";

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

let memoryToken: string | null = null;

export function setApiToken(token: string | null) {
  memoryToken = token;
}

export function getApiToken() {
  return memoryToken;
}

async function resolveToken(): Promise<string | null> {
  if (memoryToken) return memoryToken;
  try {
    const token =
      Platform.OS === "web"
        ? (await AsyncStorage.getItem("jwt_token")) ||
          (await AsyncStorage.getItem("authToken"))
        : (await SecureStore.getItemAsync("jwt_token")) ||
          (await AsyncStorage.getItem("authToken"));
    if (token) memoryToken = token;
    return token;
  } catch {
    return null;
  }
}

apiClient.interceptors.request.use(async (config) => {
  if (
    config.url &&
    !config.url.startsWith("http") &&
    !config.url.startsWith("/")
  ) {
    config.url = `/${config.url}`;
  }
  const token = await resolveToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const method = String(error?.config?.method || "get").toUpperCase();
    if (status === 404 && method === "GET") {
      return Promise.resolve({
        data: error?.response?.data ?? { data: [] },
        status: 404,
        statusText: "Not Found",
        headers: error?.response?.headers ?? {},
        config: error.config,
        request: error.request,
      });
    }
    return Promise.reject(error);
  },
);

export default apiClient;
