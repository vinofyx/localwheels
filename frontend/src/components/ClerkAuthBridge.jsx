import { useEffect } from 'react';
import { useAuth as useClerkHook } from '@clerk/react';
import { useAuth } from '../context/AuthContext';

// Runs only when Clerk is configured.
// Keeps Clerk session state and the LocalWheels JWT in sync:
//   • Clerk signed-in  + no LW session  → silently re-exchange (refresh recovery)
//   • Clerk signed-out + Clerk-backed LW session → force logout (session revocation)
export default function ClerkAuthBridge({ children }) {
  const { isLoaded, isSignedIn, getToken } = useClerkHook();
  const { user, authReady, clerkLogin, logout } = useAuth();

  useEffect(() => {
    // Wait for both systems to finish their initialization
    if (!isLoaded || !authReady) return;

    if (isSignedIn && !user) {
      // If the user intentionally signed out (lw_logout_intent=1), don't re-exchange.
      // They should see the login page and choose to sign in again.
      // The flag is cleared by clerkLogin() when they actively authenticate.
      if (localStorage.getItem('lw_logout_intent') === '1') return;

      // Clerk session alive but LW JWT missing (e.g. refresh after JWT expiry) — re-exchange
      getToken()
        .then(token => token && clerkLogin(token))
        .catch(() => {
          // Exchange failed (network error) — RequireAuth will redirect to /login
        });
      return;
    }

    // Clerk session ended while a Clerk-backed LW session is still present.
    // This covers: token revocation, sign-out in another tab, session expiry.
    // Force-logout so RequireAuth redirects to /login immediately.
    if (!isSignedIn && user && localStorage.getItem('lw_clerk_session') === '1') {
      logout();
    }
  }, [isLoaded, isSignedIn, authReady, user]);

  return children;
}
