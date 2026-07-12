export interface LoginRequest {
  email: string;

  password: string;
}

export interface LoginResponse {
  access_token: string;

  refresh_token: string;

  role: string;

  user: any;
}
