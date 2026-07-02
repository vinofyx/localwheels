import { useEffect } from 'react';
import { useAuth as useClerkHook } from '@clerk/react';
import { useAuth } from '../context/AuthContext';

// Runs only when Clerk is configured.
// After page refresh, if the Clerk session is still alive but the LW token
// has expired (or was cleared), silently re-exchanges the Clerk token so
// the user doesn't have to sign in again.
export default function ClerkAuthBridge({ children }) {
  const { isLoaded, isSignedIn, getToken } = useClerkHook();
  const { user, authReady, clerkLogin } = useAuth();

  useEffect(() => {
    // Wait for both systems to finish their initialization
    if (!isLoaded || !authReady) return;
    // Clerk user is signed in but we have no LW session — silently re-exchange
    if (isSignedIn && !user) {
      getToken()
        .then(token => token && clerkLogin(token))
        .catch(() => {
          // Exchange failed (e.g. network error) — user will be redirected to /login by RequireAuth
        });
    }
  }, [isLoaded, isSignedIn, authReady, user]);

  return children;
}
