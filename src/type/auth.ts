export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  first_login: boolean;
  user: {
    id: number;
    username: string;
    fullName: string;
    role: string;
  };
  message: string;
}
