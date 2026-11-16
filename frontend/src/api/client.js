import axios from 'axios';

// Production (Hostinger): VITE_API_URL is unset — falls back to '/api'.
// LiteSpeed/Nginx proxies /api/* → Express backend on the same domain.
// Development: Vite proxy (vite.config.js) forwards /api → localhost:5000.
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({ baseURL: BASE_URL });

// Injected by ClerkAuthBridge after Clerk loads.
// Returns a fresh Clerk session token (auto-refreshed by the Clerk SDK).
let _clerkGetToken = null;

export function setClerkTokenGetter(fn) {
  _clerkGetToken = fn;
}

// Attach session token to every request.
// Respects local JWT login vs Clerk SSO login without cross-contamination.
api.interceptors.request.use(async cfg => {
  if (!cfg.headers.Authorization) {
    const localToken = localStorage.getItem('lw_token');
    const localUserStr = localStorage.getItem('lw_user');
    let isLocalSession = false;
    try {
      if (localUserStr) {
        const u = JSON.parse(localUserStr);
        if (u && u.authProvider === 'local') isLocalSession = true;
      }
    } catch {}

    // If active local JWT session exists, use local token
    if (isLocalSession && localToken && localToken !== 'null' && localToken !== 'undefined') {
      cfg.headers.Authorization = `Bearer ${localToken}`;
      return cfg;
    }

    // Otherwise, check Clerk SSO token if available
    if (_clerkGetToken) {
      try {
        const token = await _clerkGetToken();
        if (token) {
          cfg.headers.Authorization = `Bearer ${token}`;
          localStorage.setItem('lw_token', token);
          return cfg;
        }
      } catch {
        // Clerk not ready or session ended
      }
    }

    // Fallback to stored token
    if (localToken && localToken !== 'null' && localToken !== 'undefined') {
      cfg.headers.Authorization = `Bearer ${localToken}`;
    }
  }
  return cfg;
});

// clerk-exchange deliberately returns 401/403/409 as part of its flow —
// exclude it from the global auto-logout handler.
const AUTH_ENDPOINTS = ['/auth/clerk-exchange'];

// Auto-logout on 401 — only for protected API calls, not the sync endpoint
api.interceptors.response.use(
  r => r,
  err => {
    const url = err.config?.url || '';
    const isAuthEndpoint = AUTH_ENDPOINTS.some(p => url.includes(p));

    if (err.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('lw_user');
      localStorage.removeItem('lw_branch');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
