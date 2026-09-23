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

const API_BASE = "http://192.168.20.16:8080";

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

let memoryToken: string | null = null;
let tokenLoaded = false;

export function setApiToken(token: string | null) {
  memoryToken = token;
  tokenLoaded = true;
}

export function getApiToken() {
  return memoryToken;
}

async function resolveToken(): Promise<string | null> {
  if (tokenLoaded) return memoryToken;
  try {
    const token =
      Platform.OS === "web"
        ? (await AsyncStorage.getItem("jwt_token")) ||
          (await AsyncStorage.getItem("authToken"))
        : (await SecureStore.getItemAsync("jwt_token")) ||
          (await AsyncStorage.getItem("authToken"));
    memoryToken = token;
  } catch {
    memoryToken = null;
  }
  tokenLoaded = true;
  return memoryToken;
}

function looksLikeJwt(s: string): boolean {
  return s.startsWith("eyJ") || (s.length > 80 && s.split(".").length === 3);
}

apiClient.interceptors.request.use(async (config) => {
  const rawUrl = String(config.url ?? "");
  if (looksLikeJwt(rawUrl)) {
    console.warn(
      "[axios] Bỏ request vì URL là JWT, không phải path API:",
      rawUrl.slice(0, 24) + "...",
    );
    return Promise.reject(
      new Error(
        "URL API không hợp lệ (đang dùng JWT làm path). Kiểm tra chỗ gọi api.get(...).",
      ),
    );
  }

  if (config.url && !config.url.startsWith("http")) {
    if (!config.url.startsWith("/")) {
      config.url = "/" + config.url;
    }
  }

  const token = await resolveToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (__DEV__) {
    console.log(
      "[axios]",
      (config.method || "get").toUpperCase(),
      String(config.baseURL || "") + String(config.url || ""),
    );
  }

  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    const url = String(err?.config?.url || "");
    if (status === 404 && url.includes("transcript")) {
      return Promise.reject(err);
    }
    return Promise.reject(err);
  },
);

export default apiClient;
