import axios from 'axios';

// In production (Vercel), VITE_API_URL = https://your-backend.onrender.com/api
// In development, Vite proxy forwards /api → localhost:5000/api
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({ baseURL: BASE_URL });

// Attach JWT token to every request
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('lw_token');
  if (token && !cfg.headers.Authorization) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// Auth endpoints that deliberately return 401/403 as part of their flow —
// these must NOT trigger a global redirect, they handle their own errors.
const AUTH_ENDPOINTS = ['/auth/login', '/auth/clerk-exchange'];

// Auto-logout on 401 — but only for protected API calls, not auth flows
api.interceptors.response.use(
  r => r,
  err => {
    const url = err.config?.url || '';
    const isAuthEndpoint = AUTH_ENDPOINTS.some(p => url.includes(p));

    if (err.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('lw_token');
      localStorage.removeItem('lw_user');
      localStorage.removeItem('lw_branch');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
