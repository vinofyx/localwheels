import { useEffect } from 'react';
import { useAuth as useClerkHook } from '@clerk/react';
import { useAuth } from '../context/AuthContext';

/**
 * Passive Clerk-state observer.
 *
 * Responsibility: read Clerk's isLoaded / isSignedIn / getToken and push them
 * into AuthContext via updateClerkState(). Nothing else.
 *
 * This component MUST NOT:
 *   - call clerkLogin() or getToken() for auth purposes
 *   - call logout()
 *   - perform navigation
 *   - make any API requests
 *   - make any authentication decisions
 *
 * All authentication decisions live in AuthContext's auth orchestration effect.
 */
export default function ClerkAuthBridge({ children }) {
  const { isLoaded, isSignedIn, getToken } = useClerkHook();
  const { updateClerkState } = useAuth();

  // Push Clerk state into AuthContext whenever isLoaded or isSignedIn changes.
  // getToken is excluded from deps: it is a stable function reference from the
  // Clerk SDK that doesn't change between renders. AuthContext's updateClerkState
  // always stores the latest reference so the exchange always gets a fresh token.
  useEffect(() => {
    updateClerkState(isLoaded, isSignedIn, getToken);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn, updateClerkState]);

  return children;
}
