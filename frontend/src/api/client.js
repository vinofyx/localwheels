import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// Attach token to every request
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
