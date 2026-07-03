import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('lw_user')); } catch { return null; }
  });
  const [branch, setBranch] = useState(() => {
    try { return JSON.parse(localStorage.getItem('lw_branch')); } catch { return null; }
  });
  // authReady: true once we've validated (or skipped validation of) the stored session.
  // Prevents RequireAuth from redirecting to /login before the token check completes.
  const [authReady, setAuthReady] = useState(false);

  // On mount, validate the stored token with the server.
  // If it's expired or invalid, clear it so the user is cleanly redirected to login.
  useEffect(() => {
    const token = localStorage.getItem('lw_token');
    if (!token) {
      setAuthReady(true);
      return;
    }

    api.get('/auth/me')
      .then(({ data }) => {
        // Refresh the stored user profile with the latest data from the server
        const refreshed = { ...user, ...data };
        localStorage.setItem('lw_user', JSON.stringify(refreshed));
        setUser(refreshed);
      })
      .catch(() => {
        // Token is expired or invalid — clear everything
        localStorage.removeItem('lw_token');
        localStorage.removeItem('lw_user');
        localStorage.removeItem('lw_branch');
        setUser(null);
        setBranch(null);
      })
      .finally(() => setAuthReady(true));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (username, password) => {
    const { data } = await api.post('/auth/login', { username, password });
    localStorage.setItem('lw_token', data.token);
    localStorage.setItem('lw_user', JSON.stringify(data.user));
    localStorage.removeItem('lw_clerk_session'); // password login — not a Clerk session
    setUser(data.user);
    return data.user;
  }, []);

  // Exchange a Clerk session token for a LocalWheels JWT.
  // Returns the user object annotated with _isNew flag for toast messaging.
  const clerkLogin = useCallback(async (clerkSessionToken) => {
    const { data, status } = await api.post('/auth/clerk-exchange', {}, {
      headers: { Authorization: `Bearer ${clerkSessionToken}` },
    });
    localStorage.setItem('lw_token', data.token);
    localStorage.setItem('lw_user', JSON.stringify(data.user));
    localStorage.setItem('lw_clerk_session', '1'); // marks this LW session as Clerk-backed
    localStorage.removeItem('lw_logout_intent');   // user actively signed in — clear any prior intent
    setUser(data.user);
    return { ...data.user, _isNew: status === 201 };
  }, []);

  const selectBranch = useCallback((b) => {
    localStorage.setItem('lw_branch', JSON.stringify(b));
    setBranch(b);
  }, []);

  const logout = useCallback(() => {
    // Set intent FIRST — ClerkAuthBridge reads this before deciding to re-exchange.
    // Without this flag, clearing `user` while Clerk is still isSignedIn=true would
    // cause ClerkAuthBridge to immediately re-exchange and log the user back in.
    localStorage.setItem('lw_logout_intent', '1');
    localStorage.removeItem('lw_token');
    localStorage.removeItem('lw_user');
    localStorage.removeItem('lw_branch');
    localStorage.removeItem('lw_clerk_session');
    setUser(null);
    setBranch(null);
  }, []);

  // Check if the current company needs setup wizard completion.
  // Returns '/setup' if wizard is needed, null otherwise.
  const checkSetupStatus = useCallback(async () => {
    try {
      const { data } = await api.get('/companies/setup-status');
      if (!data.setup_completed) return '/setup';
    } catch { /* network error or no company — skip */ }
    return null;
  }, []);

  return (
    <AuthContext.Provider value={{ user, branch, authReady, login, clerkLogin, selectBranch, logout, checkSetupStatus }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
