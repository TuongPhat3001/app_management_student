import { setApiToken } from "@/src/api/axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { Platform } from "react-native";

interface AuthContextType {
  token: string | null;
  user: any;
  login: (token: string, userData?: any) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function readJwt(): Promise<string | null> {
  try {
    if (Platform.OS === "web") {
      return (
        (await AsyncStorage.getItem("jwt_token")) ||
        (await AsyncStorage.getItem("authToken"))
      );
    }
    return (
      (await SecureStore.getItemAsync("jwt_token")) ||
      (await AsyncStorage.getItem("authToken"))
    );
  } catch {
    return null;
  }
}

async function readRole(): Promise<string | null> {
  try {
    if (Platform.OS === "web") {
      return await AsyncStorage.getItem("role");
    }
    return (
      (await SecureStore.getItemAsync("role")) ||
      (await AsyncStorage.getItem("role"))
    );
  } catch {
    return null;
  }
}

async function writeJwt(token: string) {
  await AsyncStorage.setItem("authToken", token);
  if (Platform.OS === "web") {
    await AsyncStorage.setItem("jwt_token", token);
  } else {
    await SecureStore.setItemAsync("jwt_token", token);
  }
}

async function writeRole(role: string) {
  await AsyncStorage.setItem("role", role);
  if (Platform.OS !== "web") {
    await SecureStore.setItemAsync("role", role);
  }
}

async function clearAuthStorage() {
  await AsyncStorage.multiRemove([
    "authToken",
    "jwt_token",
    "userData",
    "role",
  ]);
  if (Platform.OS !== "web") {
    try {
      await SecureStore.deleteItemAsync("jwt_token");
    } catch {}
    try {
      await SecureStore.deleteItemAsync("role");
    } catch {}
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await readJwt();
      const storedUser = await AsyncStorage.getItem("userData");
      const storedRole = await readRole();

      if (storedToken) {
        setToken(storedToken);
        setApiToken(storedToken);

        let parsed: any = null;
        if (storedUser) {
          try {
            parsed = JSON.parse(storedUser);
          } catch {
            parsed = null;
          }
        }
        if (parsed) {
          if (!parsed.role && storedRole) parsed.role = storedRole;
          setUser(parsed);
        } else if (storedRole) {
          setUser({ role: storedRole });
        }
      }
    } catch (error) {
      console.log("Error loading auth:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (newToken: string, userData?: any) => {
    setToken(newToken);
    setApiToken(newToken);

    const role = String(userData?.role || "").toLowerCase();
    const merged = userData
      ? { ...userData, role: role || userData.role }
      : null;
    if (merged) setUser(merged);

    await writeJwt(newToken);
    if (merged) {
      await AsyncStorage.setItem("userData", JSON.stringify(merged));
    }
    if (role) {
      await writeRole(role);
    }
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    setApiToken(null);
    await clearAuthStorage();
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
