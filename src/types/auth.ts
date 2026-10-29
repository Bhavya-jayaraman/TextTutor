export interface User {
  id: number;
  name: string;
  email: string;
  created_at?: string;
  updated_at?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
}

export interface LoginPayload {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface UpdateProfilePayload {
  name: string;
  email: string;
}
