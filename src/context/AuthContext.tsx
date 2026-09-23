import setApiToken from "@/src/api/axios";
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
      if (storedToken) {
        setToken(storedToken);
        setApiToken(storedToken);
        if (storedUser) setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Error loading auth:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (newToken: string, userData?: any) => {
    setToken(newToken);
    setApiToken(newToken);
    if (userData) setUser(userData);
    await AsyncStorage.setItem("authToken", newToken);
    if (userData)
      await AsyncStorage.setItem("userData", JSON.stringify(userData));
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    delete setApiToken.defaults.headers.common.Authorization;
    await AsyncStorage.removeItem("authToken");
    await AsyncStorage.removeItem("userData");
    try {
      if (Platform.OS === "web") {
        await AsyncStorage.removeItem("jwt_token");
      } else {
        await SecureStore.deleteItemAsync("jwt_token");
      }
    } catch {}
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
