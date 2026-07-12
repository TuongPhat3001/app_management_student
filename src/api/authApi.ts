import api from "./axios";

import { LoginRequest } from "../type/auth";

export const loginAPI = (data: LoginRequest) => {
  return api.post("/Login", data);
};

export const logoutAPI = () => {
  return api.post("/Logout");
};

export const forgotPasswordAPI = (email: string) => {
  return api.post("/ForgotPassword", { email });
};

export const changePasswordAPI = (data: any) => {
  return api.post("/ChangePassword", data);
};
