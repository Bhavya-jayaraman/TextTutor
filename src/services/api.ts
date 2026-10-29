import axios from 'axios';

const API = axios.create({
  baseURL: (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Authorization Bearer token to requests if present
API.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem('texttutor_token') ||
      sessionStorage.getItem('texttutor_token') ||
      localStorage.getItem('neuronotes_token') ||
      sessionStorage.getItem('neuronotes_token') ||
      localStorage.getItem('memomind_token') ||
      sessionStorage.getItem('memomind_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global response error handler
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token on 401 unauthenticated response if expired
      localStorage.removeItem('texttutor_token');
      sessionStorage.removeItem('texttutor_token');
      localStorage.removeItem('texttutor_user');
      sessionStorage.removeItem('texttutor_user');
      localStorage.removeItem('neuronotes_token');
      sessionStorage.removeItem('neuronotes_token');
      localStorage.removeItem('neuronotes_user');
      sessionStorage.removeItem('neuronotes_user');
      localStorage.removeItem('memomind_token');
      sessionStorage.removeItem('memomind_token');
      localStorage.removeItem('memomind_user');
      sessionStorage.removeItem('memomind_user');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
    }
    return Promise.reject(error);
  }
);

export default API;
