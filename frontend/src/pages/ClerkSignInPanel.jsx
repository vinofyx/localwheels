import React, { useEffect } from 'react';
import { SignIn, useAuth as useClerkHook } from '@clerk/react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

/**
 * Pure UI component. Renders one of three states:
 *   1. Spinner   — Clerk is signed-in and AuthContext is running (or about to run) the exchange
 *   2. Error     — exchange failed; shows message + retry button
 *   3. SignIn    — Clerk is not signed in; shows Clerk's own sign-in widget
 *
 * This component MUST NOT:
 *   - call getToken()
 *   - call clerkLogin()
 *   - make API requests
 *   - perform navigation
 *   - decide when to authenticate
 *
 * Authentication is driven entirely by AuthContext.
 * This component is a read-only window into that state.
 */
export default function ClerkSignInPanel() {
  const { isSignedIn } = useClerkHook();
  const {
    clerkExchangeLoading,
    clerkExchangeError,
    clerkExchangeResult,
    retryClerkExchange,
    clearClerkExchangeResult,
  } = useAuth();

  // Show a toast once when the exchange succeeds, then clear the result flag.
  // Navigation is handled by Login.useEffect watching user — not here.
  useEffect(() => {
    if (!clerkExchangeResult) return;
    toast.success(clerkExchangeResult.isNew ? 'Account created successfully.' : 'Welcome back.');
    clearClerkExchangeResult();
  }, [clerkExchangeResult, clearClerkExchangeResult]);

  // Exchange failed — show error and allow retry.
  if (clerkExchangeError) {
    return (
      <div className="flex flex-col items-center gap-4 py-6">
        <div className="w-full p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {clerkExchangeError}
        </div>
        <button
          className="text-sm text-blue-600 hover:underline"
          onClick={retryClerkExchange}
        >
          Try again
        </button>
      </div>
    );
  }

  // Clerk says signed-in: exchange is running or is queued (waiting for authReady/clerkReady).
  // Show a spinner so the user never sees the sign-in widget after already having signed in.
  if (isSignedIn) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <svg className="animate-spin w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <p className="text-sm text-gray-500">Signing you in…</p>
      </div>
    );
  }

  // Default: Clerk is not signed in — show the sign-in widget.
  return (
    <div className="flex justify-center">
      <SignIn routing="virtual" />
    </div>
  );
}
