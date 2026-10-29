/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import API from './api.js';

export const clientAuthService = {
  async register(payload) {
    const response = await API.post('/auth/register', payload);
    if (response.data.success && response.data.token && response.data.user) {
      this.saveAuthSession(response.data.token, response.data.user, false);
    }
    return response.data;
  },

  async login(payload) {
    const response = await API.post('/auth/login', payload);
    if (response.data.success && response.data.token && response.data.user) {
      this.saveAuthSession(response.data.token, response.data.user, Boolean(payload.rememberMe));
    }
    return response.data;
  },

  async forgotPassword(payload) {
    const response = await API.post('/auth/forgot-password', payload);
    return response.data;
  },

  async getProfile() {
    const response = await API.get('/auth/me');
    if (response.data.success && response.data.user) {
      this.updateStoredUser(response.data.user);
    }
    return response.data;
  },

  async updateProfile(payload) {
    const response = await API.put('/auth/profile', payload);
    if (response.data.success && response.data.user) {
      if (response.data.token) {
        const isRemembered = Boolean(
          localStorage.getItem('texttutor_token') ||
          localStorage.getItem('neuronotes_token')
        );
        this.saveAuthSession(response.data.token, response.data.user, isRemembered);
      } else {
        this.updateStoredUser(response.data.user);
      }
    }
    return response.data;
  },

  async changePassword(currentPassword, newPassword) {
    const response = await API.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  async deleteAccount() {
    const response = await API.delete('/auth/account');
    if (response.data.success) {
      this.logout();
    }
    return response.data;
  },

  saveAuthSession(token, user, rememberMe) {
    this.logout();
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('texttutor_token', token);
    storage.setItem('texttutor_user', JSON.stringify(user));
    // Compatibility mirror
    storage.setItem('neuronotes_token', token);
    storage.setItem('neuronotes_user', JSON.stringify(user));
  },

  updateStoredUser(user) {
    const keys = ['texttutor_user', 'neuronotes_user', 'memomind_user'];
    for (const key of keys) {
      if (localStorage.getItem(key)) {
        localStorage.setItem(key, JSON.stringify(user));
      } else if (sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, JSON.stringify(user));
      }
    }
  },

  getStoredToken() {
    return (
      localStorage.getItem('texttutor_token') ||
      sessionStorage.getItem('texttutor_token') ||
      localStorage.getItem('neuronotes_token') ||
      sessionStorage.getItem('neuronotes_token') ||
      localStorage.getItem('memomind_token') ||
      sessionStorage.getItem('memomind_token')
    );
  },

  getStoredUser() {
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

  logout() {
    const keys = [
      'texttutor_token', 'texttutor_user',
      'neuronotes_token', 'neuronotes_user',
      'memomind_token', 'memomind_user'
    ];
    for (const key of keys) {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    }
  },
};

export default clientAuthService;
