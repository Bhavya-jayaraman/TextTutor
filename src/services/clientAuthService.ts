import API from './api.js';
import {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  ForgotPasswordPayload,
  UpdateProfilePayload,
  User,
} from '../types/auth.js';

export const clientAuthService = {
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const response = await API.post<AuthResponse>('/auth/register', payload);
    if (response.data.success && response.data.token && response.data.user) {
      this.saveAuthSession(response.data.token, response.data.user, false);
    }
    return response.data;
  },

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const response = await API.post<AuthResponse>('/auth/login', payload);
    if (response.data.success && response.data.token && response.data.user) {
      this.saveAuthSession(response.data.token, response.data.user, Boolean(payload.rememberMe));
    }
    return response.data;
  },

  async forgotPassword(payload: ForgotPasswordPayload): Promise<AuthResponse> {
    const response = await API.post<AuthResponse>('/auth/forgot-password', payload);
    return response.data;
  },

  async getProfile(): Promise<AuthResponse> {
    const response = await API.get<AuthResponse>('/auth/me');
    if (response.data.success && response.data.user) {
      this.updateStoredUser(response.data.user);
    }
    return response.data;
  },

  async updateProfile(payload: UpdateProfilePayload): Promise<AuthResponse> {
    const response = await API.put<AuthResponse>('/auth/profile', payload);
    if (response.data.success && response.data.user) {
      if (response.data.token) {
        const isRemembered = Boolean(
          localStorage.getItem('texttutor_token') ||
          localStorage.getItem('neuronotes_token') ||
          localStorage.getItem('memomind_token')
        );
        this.saveAuthSession(response.data.token, response.data.user, isRemembered);
      } else {
        this.updateStoredUser(response.data.user);
      }
    }
    return response.data;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<AuthResponse> {
    const response = await API.post<AuthResponse>('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  async deleteAccount(): Promise<AuthResponse> {
    const response = await API.delete<AuthResponse>('/auth/account');
    if (response.data.success) {
      this.logout();
    }
    return response.data;
  },


  saveAuthSession(token: string, user: User, rememberMe: boolean): void {
    this.logout(); // Clear existing tokens
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('texttutor_token', token);
    storage.setItem('texttutor_user', JSON.stringify(user));
    // Backward compatibility mirrors
    storage.setItem('neuronotes_token', token);
    storage.setItem('neuronotes_user', JSON.stringify(user));
  },

  updateStoredUser(user: User): void {
    const keys = ['texttutor_user', 'neuronotes_user', 'memomind_user'];
    for (const key of keys) {
      if (localStorage.getItem(key)) {
        localStorage.setItem(key, JSON.stringify(user));
      } else if (sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, JSON.stringify(user));
      }
    }
  },

  getStoredToken(): string | null {
    return (
      localStorage.getItem('texttutor_token') ||
      sessionStorage.getItem('texttutor_token') ||
      localStorage.getItem('neuronotes_token') ||
      sessionStorage.getItem('neuronotes_token') ||
      localStorage.getItem('memomind_token') ||
      sessionStorage.getItem('memomind_token')
    );
  },

  getStoredUser(): User | null {
    const token = this.getStoredToken();
    if (!token) return null;
    const userStr =
      localStorage.getItem('texttutor_user') ||
      sessionStorage.getItem('texttutor_user') ||
      localStorage.getItem('neuronotes_user') ||
      sessionStorage.getItem('neuronotes_user') ||
      localStorage.getItem('memomind_user') ||
      sessionStorage.getItem('memomind_user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  logout(): void {
    const keys = [
      'texttutor_token',
      'texttutor_user',
      'neuronotes_token',
      'neuronotes_user',
      'memomind_token',
      'memomind_user',
    ];
    for (const key of keys) {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    }
  },
};
