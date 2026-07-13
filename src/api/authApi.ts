import { LoginRequest } from "../type/auth";
import api from "./axios";

export const loginAPI = (data: LoginRequest) => {
  return api.post("/login", data);
};

export const logoutAPI = () => {
  return api.post("/logout");
};

export const forgotPasswordAPI = (email: string) => {
  return api.post("/forgot-password", { email });
};

export const changePasswordAPI = (data: any) => {
  return api.post("/change-password", data);
};
