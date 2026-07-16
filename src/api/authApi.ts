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

export interface ChangePasswordRequest {
  new_password: string;
}

export const changePasswordAPI = (data: ChangePasswordRequest) => {
  return api.post("/change-password", data);
};
