import React, { createContext, useContext, useState, useCallback } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('lw_user')); } catch { return null; }
  });
  const [branch, setBranch] = useState(() => {
    try { return JSON.parse(localStorage.getItem('lw_branch')); } catch { return null; }
  });

  const login = useCallback(async (username, password) => {
    const { data } = await api.post('/auth/login', { username, password });
    localStorage.setItem('lw_token', data.token);
    localStorage.setItem('lw_user', JSON.stringify(data.user));
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
    setUser(data.user);
    return { ...data.user, _isNew: status === 201 };
  }, []);

  const selectBranch = useCallback((b) => {
    localStorage.setItem('lw_branch', JSON.stringify(b));
    setBranch(b);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('lw_token');
    localStorage.removeItem('lw_user');
    localStorage.removeItem('lw_branch');
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
    <AuthContext.Provider value={{ user, branch, login, clerkLogin, selectBranch, logout, checkSetupStatus }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
