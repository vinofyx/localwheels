import axios from 'axios';

// In production (Vercel), VITE_API_URL = https://your-backend.onrender.com/api
// In development, Vite proxy forwards /api → localhost:5000/api
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({ baseURL: BASE_URL });

// Attach JWT token to every request
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('lw_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// Auto-logout on 401
api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('lw_token');
      localStorage.removeItem('lw_user');
      localStorage.removeItem('lw_branch');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
