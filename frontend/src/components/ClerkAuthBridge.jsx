import { useEffect } from 'react';
import { useAuth as useClerkHook } from '@clerk/react';
import { useAuth } from '../context/AuthContext';
import { setClerkTokenGetter } from '../api/client';

/**
 * Passive Clerk-state observer.
 *
 * Responsibilities:
 *   1. Push Clerk's isLoaded / isSignedIn / getToken into AuthContext via updateClerkState().
 *   2. Inject getToken into the axios client (setClerkTokenGetter) so every protected
 *      API request automatically carries a fresh Clerk session token.
 *
 * This component MUST NOT:
 *   - call getToken() for auth purposes
 *   - perform navigation
 *   - make any API requests
 *   - make any authentication decisions
 *
 * All authentication decisions live in AuthContext's orchestration effect.
 */
export default function ClerkAuthBridge({ children }) {
  const { isLoaded, isSignedIn, getToken } = useClerkHook();
  const { updateClerkState } = useAuth();

  useEffect(() => {
    // Inject the token getter so the axios request interceptor can attach
    // a fresh Clerk token to every outgoing API request.
    setClerkTokenGetter(getToken);

    // Push Clerk state into AuthContext for the auth orchestration effect.
    updateClerkState(isLoaded, isSignedIn, getToken);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn, updateClerkState]);

  return children;
}
