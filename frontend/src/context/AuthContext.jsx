import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

/**
 * Single authentication orchestrator for LocalWheels.
 *
 * Responsibility map:
 *   AuthContext        — owns ALL auth state + drives clerk-exchange (one place only)
 *   ClerkAuthBridge    — passive: reads Clerk SDK state, calls updateClerkState(), nothing else
 *   ClerkSignInPanel   — passive: renders UI based on state exposed here, nothing else
 *   Login              — passive: navigates when user becomes non-null, nothing else
 *   Guards             — passive: read user/branch/authReady/clerkReady, redirect or render
 *
 * State machine (internal):
 *   INITIAL → (mount) → LW_VALIDATING
 *   LW_VALIDATING → (/auth/me resolves) → CLERK_WAITING  (authReady=true)
 *   CLERK_WAITING → (ClerkAuthBridge pushes state) → EXCHANGE_PENDING  (clerkReady=true)
 *   EXCHANGE_PENDING → (no LW user + Clerk signed in) → EXCHANGE_RUNNING
 *   EXCHANGE_RUNNING → (success) → AUTHENTICATED
 *   EXCHANGE_RUNNING → (failure) → EXCHANGE_ERROR  (retryClerkExchange() → EXCHANGE_PENDING)
 *   AUTHENTICATED → (logout) → LOGGED_OUT
 *   LOGGED_OUT → (Clerk false→true transition) → EXCHANGE_PENDING
 */
export function AuthProvider({ children }) {
  // ── LocalWheels session ───────────────────────────────────────────────────────
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('lw_user')); } catch { return null; }
  });
  const [branch, setBranch] = useState(() => {
    try { return JSON.parse(localStorage.getItem('lw_branch')); } catch { return null; }
  });
  // authReady becomes true once /auth/me has resolved (or was skipped because no token
  // existed). Guards MUST wait for this before making any routing decisions.
  const [authReady, setAuthReady] = useState(false);

  // ── Clerk bridge (values injected by ClerkAuthBridge via updateClerkState) ────
  const [clerkReady, setClerkReady] = useState(false);
  const [clerkIsSignedIn, setClerkIsSignedIn] = useState(false);
  // Ref keeps the latest getToken function from Clerk without causing re-renders.
  const clerkGetTokenRef = useRef(null);
  // Tracks the previous isSignedIn value to detect false→true transitions.
  const prevClerkSignedInRef = useRef(false);

  // ── Exchange state (exposed to ClerkSignInPanel for UI feedback) ──────────────
  const [clerkExchangeLoading, setClerkExchangeLoading] = useState(false);
  const [clerkExchangeError, setClerkExchangeError] = useState(null);
  // { isNew: bool } set on success; ClerkSignInPanel reads this to show a toast once.
  const [clerkExchangeResult, setClerkExchangeResult] = useState(null);
  // Incrementing this re-triggers the auth orchestration effect after an error.
  const [retryCount, setRetryCount] = useState(0);

  // ── Exchange guard (prevents concurrent requests) ─────────────────────────────
  const _exchangeInFlight = useRef(false);

  // ── Logout intent (in-memory; intentionally cleared on page refresh) ──────────
  // Prevents auto-re-exchange while Clerk's signOut() is still completing.
  // Stored as a ref (not state) so it doesn't trigger re-renders.
  const _logoutIntentRef = useRef(false);

  // ── Step 1: Validate the stored LW JWT on mount ───────────────────────────────
  // Runs exactly once. Sets authReady=true when done regardless of outcome.
  useEffect(() => {
    const token = localStorage.getItem('lw_token');
    if (!token) {
      setAuthReady(true);
      return;
    }
    api.get('/auth/me')
      .then(({ data }) => {
        const refreshed = { ...user, ...data };
        localStorage.setItem('lw_user', JSON.stringify(refreshed));
        setUser(refreshed);
      })
      .catch(() => {
        // Token expired or invalid — clear everything; Guard will redirect to /login.
        localStorage.removeItem('lw_token');
        localStorage.removeItem('lw_user');
        localStorage.removeItem('lw_branch');
        setUser(null);
        setBranch(null);
      })
      .finally(() => setAuthReady(true));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Step 2: ClerkAuthBridge calls this to push Clerk state in ─────────────────
  // This is the ONLY function that may be called by ClerkAuthBridge.
  // It does NOT initiate authentication — it just makes Clerk state available
  // to the auth orchestration effect below.
  const updateClerkState = useCallback((isLoaded, isSignedIn, getToken) => {
    // Always refresh the token getter so the exchange uses the freshest token.
    clerkGetTokenRef.current = getToken;

    // When Clerk transitions from signed-out → signed-in, the user has actively
    // re-authenticated (either fresh load with existing session, or re-login after
    // logout). Clear any pending logout intent so the exchange is allowed to proceed.
    // NOTE: this also clears intent on initial app load (Clerk goes unknown→true),
    // which is intentional — a page refresh should not honour a prior logout intent.
    if (isSignedIn && !prevClerkSignedInRef.current) {
      _logoutIntentRef.current = false;
      localStorage.removeItem('lw_logout_intent');
    }
    prevClerkSignedInRef.current = isSignedIn;

    setClerkReady(isLoaded);
    setClerkIsSignedIn(isSignedIn);
  }, []);

  // ── Step 3: The single auth orchestration effect ──────────────────────────────
  // This is the ONLY location where POST /auth/clerk-exchange is called.
  // No UI component, guard, or page may call clerkLogin() or getToken() independently.
  useEffect(() => {
    if (!authReady || !clerkReady) return;

    // ── Case A: Clerk signed-in but no LW session → perform exchange ────────────
    if (clerkIsSignedIn && !user) {
      if (_logoutIntentRef.current) return;   // logout in progress, wait for signOut()
      if (_exchangeInFlight.current) return;  // already running, exactly-once guarantee
      if (clerkExchangeError) return;         // failed — wait for explicit retryClerkExchange()

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
          localStorage.setItem('lw_token', data.token);
          localStorage.setItem('lw_user', JSON.stringify(data.user));
          localStorage.setItem('lw_clerk_session', '1');
          setUser(data.user);
          setClerkExchangeResult({ isNew: status === 201 });
        })
        .catch(err => {
          const status = err?.response?.status;
          const serverMsg = err?.response?.data?.error;
          let display;
          if (status === 401)      display = 'Unable to verify Clerk session. Please sign in again.';
          else if (status === 403) display = 'Your account has been deactivated. Contact your administrator.';
          else if (status === 409) display = serverMsg || 'Account conflict. Contact your administrator.';
          else if (status === 503) display = 'Authentication service unavailable. Try again shortly.';
          else                     display = serverMsg || 'Authentication failed. Please try again.';
          setClerkExchangeError(display);
        })
        .finally(() => {
          _exchangeInFlight.current = false;
          setClerkExchangeLoading(false);
        });

      return;
    }

    // ── Case B: Clerk signed-out while a Clerk-backed LW session is active ──────
    // This covers: Clerk token revoked, session expired in another tab, etc.
    // Force-logout so Guards redirect to /login immediately.
    if (!clerkIsSignedIn && user && localStorage.getItem('lw_clerk_session') === '1') {
      _logoutIntentRef.current = true;
      localStorage.setItem('lw_logout_intent', '1');
      localStorage.removeItem('lw_token');
      localStorage.removeItem('lw_user');
      localStorage.removeItem('lw_branch');
      localStorage.removeItem('lw_clerk_session');
      setUser(null);
      setBranch(null);
      setClerkExchangeError(null);
      setClerkExchangeResult(null);
    }
  }, [authReady, clerkReady, clerkIsSignedIn, user, clerkExchangeError, retryCount]);

  // ── Actions ───────────────────────────────────────────────────────────────────

  const login = useCallback(async (username, password) => {
    const { data } = await api.post('/auth/login', { username, password });
    localStorage.setItem('lw_token', data.token);
    localStorage.setItem('lw_user', JSON.stringify(data.user));
    localStorage.removeItem('lw_clerk_session');
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    // Set intent BEFORE clearing user: auth effect re-runs when user→null but
    // Clerk is still isSignedIn=true (signOut() hasn't completed yet).
    // The intent flag blocks auto-re-exchange during that brief window.
    _logoutIntentRef.current = true;
    localStorage.setItem('lw_logout_intent', '1');
    localStorage.removeItem('lw_token');
    localStorage.removeItem('lw_user');
    localStorage.removeItem('lw_branch');
    localStorage.removeItem('lw_clerk_session');
    setUser(null);
    setBranch(null);
    setClerkExchangeError(null);
    setClerkExchangeResult(null);
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

  // Called by ClerkSignInPanel "Try again" button after an exchange failure.
  const retryClerkExchange = useCallback(() => {
    setClerkExchangeError(null);
    setRetryCount(c => c + 1);
  }, []);

  // Called by ClerkSignInPanel after it has shown the "Welcome back" toast.
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
      // Bridge hook (ClerkAuthBridge ONLY — no other component should call this)
      updateClerkState,
      // ClerkSignInPanel hooks
      retryClerkExchange, clearClerkExchangeResult,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
