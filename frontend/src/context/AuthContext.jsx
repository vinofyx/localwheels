import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

/**
 * Single authentication orchestrator for LocalWheels — Clerk-only mode.
 *
 * Responsibility map:
 *   AuthContext        — owns ALL auth state + drives clerk-exchange (one place only)
 *   ClerkAuthBridge    — passive: reads Clerk SDK state, calls updateClerkState() + injects
 *                        token getter into api/client, nothing else
 *   ClerkSignInPanel   — passive: renders UI based on state exposed here, nothing else
 *   Guards             — passive: read user/branch/clerkReady, redirect or render
 *
 * State machine:
 *   INITIAL → (ClerkAuthBridge pushes state) → CLERK_WAITING
 *   CLERK_WAITING → (Clerk loaded + signed in) → EXCHANGE_RUNNING
 *   EXCHANGE_RUNNING → (success) → AUTHENTICATED
 *   EXCHANGE_RUNNING → (failure) → EXCHANGE_ERROR  (retryClerkExchange() → CLERK_WAITING)
 *   AUTHENTICATED → (logout / Clerk session ends) → LOGGED_OUT
 *   LOGGED_OUT → (Clerk signs in again) → EXCHANGE_RUNNING
 */
export function AuthProvider({ children }) {
  // LW user — hydrated from localStorage if present, or set after login / clerk-exchange
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('lw_user')); } catch { return null; }
  });

  // Branch persists across page refreshes via localStorage.
  const [branch, setBranch] = useState(() => {
    try { return JSON.parse(localStorage.getItem('lw_branch')); } catch { return null; }
  });

  // authReady is always true: there is no async LW JWT check on mount.
  // Guards use clerkReady to wait for Clerk to finish loading.
  const authReady = true;

  // ── Clerk bridge (values injected by ClerkAuthBridge via updateClerkState) ────
  const [clerkReady, setClerkReady] = useState(false);
  const [clerkIsSignedIn, setClerkIsSignedIn] = useState(false);
  const clerkGetTokenRef = useRef(null);
  const prevClerkSignedInRef = useRef(false);

  // ── Exchange state (exposed to ClerkSignInPanel for UI feedback) ──────────────
  const [clerkExchangeLoading, setClerkExchangeLoading] = useState(false);
  const [clerkExchangeError, setClerkExchangeError] = useState(null);
  const [clerkExchangeResult, setClerkExchangeResult] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // ── Guards (prevents concurrent requests + logout races) ─────────────────────
  const _exchangeInFlight = useRef(false);
  const _logoutIntentRef  = useRef(false);

  // ── Step 1: ClerkAuthBridge calls this to push Clerk state ───────────────────
  const updateClerkState = useCallback((isLoaded, isSignedIn, getToken) => {
    clerkGetTokenRef.current = getToken;

    // Clerk transitioned from signed-out → signed-in (new login or page refresh with
    // valid session). Clear any pending logout intent so the exchange is allowed.
    if (isSignedIn && !prevClerkSignedInRef.current) {
      _logoutIntentRef.current = false;
    }
    prevClerkSignedInRef.current = isSignedIn;

    setClerkReady(isLoaded);
    setClerkIsSignedIn(isSignedIn);
  }, []);

  // ── Step 2: Auth orchestration ────────────────────────────────────────────────
  // Only location where POST /api/auth/clerk-exchange is called.
  useEffect(() => {
    if (!clerkReady) return;

    // ── Case A: Clerk signed-in, no LW user → sync with backend ─────────────
    if (clerkIsSignedIn && !user) {
      if (_logoutIntentRef.current) return;
      if (_exchangeInFlight.current) return;
      if (clerkExchangeError) return; // wait for explicit retryClerkExchange()

      const getToken = clerkGetTokenRef.current;
      if (!getToken) return;

      _exchangeInFlight.current = true;
      setClerkExchangeLoading(true);

      getToken()
        .then(token => {
          if (!token) throw new Error('No Clerk token available');
          return api.post('/auth/clerk-exchange', {}, {
            headers: { Authorization: `Bearer ${token}` },
          });
        })
        .then(({ data, status }) => {
          setUser(data.user);
          setClerkExchangeResult({ isNew: status === 201 });
        })
        .catch(err => {
          const status    = err?.response?.status;
          const serverMsg = err?.response?.data?.error;
          let display;
          if (!err?.response && (err?.code === 'ERR_NETWORK' || !err?.status)) {
            display = 'Cannot connect to backend server. Please verify the API is running on port 5000.';
          } else if (status === 401) {
            display = serverMsg || 'Unable to verify Clerk session. Please sign in again.';
          } else if (status === 403) {
            display = 'Your account has been deactivated. Contact your administrator.';
          } else if (status === 409) {
            display = serverMsg || 'Account conflict. Contact your administrator.';
          } else if (status === 503) {
            display = serverMsg || 'Authentication service unavailable. Try again shortly.';
          } else {
            display = serverMsg || 'Authentication failed. Please try again.';
          }
          setClerkExchangeError(display);
        })
        .finally(() => {
          _exchangeInFlight.current = false;
          setClerkExchangeLoading(false);
        });

      return;
    }

    // ── Case B: Clerk signed-out while Clerk session is active → force logout ───
    if (!clerkIsSignedIn && user && user.authProvider === 'clerk') {
      _logoutIntentRef.current = true;
      localStorage.removeItem('lw_branch');
      localStorage.removeItem('lw_token');
      localStorage.removeItem('lw_user');
      setUser(null);
      setBranch(null);
      setClerkExchangeError(null);
      setClerkExchangeResult(null);
    }
  }, [clerkReady, clerkIsSignedIn, user, clerkExchangeError, retryCount]);

  // ── Actions ───────────────────────────────────────────────────────────────────

  const logout = useCallback(() => {
    _logoutIntentRef.current = true;
    localStorage.removeItem('lw_branch');
    localStorage.removeItem('lw_token');
    localStorage.removeItem('lw_user');
    setUser(null);
    setBranch(null);
    setClerkExchangeError(null);
    setClerkExchangeResult(null);
  }, []);

  const login = useCallback(async ({ username, password }) => {
    const res = await api.post('/auth/login', { username, password });
    if (res.data?.token) {
      localStorage.setItem('lw_token', res.data.token);
      localStorage.setItem('lw_user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      if (res.data.user.branch_id) {
        const defaultBranch = { _id: res.data.user.branch_id, branch_name: 'Default Branch' };
        localStorage.setItem('lw_branch', JSON.stringify(defaultBranch));
        setBranch(defaultBranch);
      } else {
        try {
          const bRes = await api.get('/branches/user', {
            headers: { Authorization: `Bearer ${res.data.token}` }
          });
          const branches = bRes.data?.data || bRes.data || [];
          if (branches.length > 0) {
            localStorage.setItem('lw_branch', JSON.stringify(branches[0]));
            setBranch(branches[0]);
          }
        } catch (e) {}
      }
      return res.data;
    }
    throw new Error(res.data?.error || 'Login failed');
  }, []);

  const selectBranch = useCallback((b) => {
    localStorage.setItem('lw_branch', JSON.stringify(b));
    setBranch(b);
  }, []);

  const checkSetupStatus = useCallback(async () => {
    try {
      const { data } = await api.get('/companies/setup-status');
      if (!data.setup_completed) return '/setup';
    } catch { /* network error or no company — skip */ }
    return null;
  }, []);

  const retryClerkExchange = useCallback(() => {
    setClerkExchangeError(null);
    setRetryCount(c => c + 1);
  }, []);

  const clearClerkExchangeResult = useCallback(() => {
    setClerkExchangeResult(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      // Core session state
      user, branch, authReady, clerkReady,
      // Exchange feedback (consumed by ClerkSignInPanel for UI only)
      clerkExchangeLoading, clerkExchangeError, clerkExchangeResult,
      // Actions
      login, logout, selectBranch, checkSetupStatus,
      // Bridge hook (ClerkAuthBridge ONLY)
      updateClerkState,
      // ClerkSignInPanel hooks
      retryClerkExchange, clearClerkExchangeResult,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
