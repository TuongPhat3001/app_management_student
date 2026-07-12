import * as SecureStore from "expo-secure-store";

export const saveToken = async (token: string) => {
  await SecureStore.setItemAsync("accessToken", token);
};

export const getToken = () => {
  return SecureStore.getItemAsync("accessToken");
};

export const removeToken = () => {
  return SecureStore.deleteItemAsync("accessToken");
};
