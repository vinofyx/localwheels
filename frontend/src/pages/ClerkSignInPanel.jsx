import React, { useEffect, useState } from 'react';
import { SignIn, useAuth as useClerkHook } from '@clerk/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function ClerkSignInPanel() {
  const { isSignedIn, getToken } = useClerkHook();
  const { clerkLogin, user } = useAuth();
  const navigate = useNavigate();
  const [exchanging, setExchanging] = useState(false);
  const [exchangeError, setExchangeError] = useState(null);

  useEffect(() => {
    if (!isSignedIn || user || exchanging) return;

    setExchanging(true);
    setExchangeError(null);

    getToken()
      .then(token => clerkLogin(token))
      .then(lwUser => {
        const msg = lwUser._isNew ? 'Account created successfully.' : 'Welcome back.';
        toast.success(msg);
        navigate('/select-branch');
      })
      .catch(err => {
        const serverMsg = err?.response?.data?.error;
        const status = err?.response?.status;

        let display;
        if (status === 401) {
          display = 'Unable to verify Clerk session. Please sign in again.';
        } else if (status === 403) {
          display = 'Your account has been deactivated. Contact your administrator.';
        } else if (status === 409) {
          display = serverMsg || 'Account conflict. Contact your administrator.';
        } else if (status === 503) {
          display = 'Authentication service unavailable. Try again shortly.';
        } else {
          display = serverMsg || 'Authentication failed. Please try again.';
        }

        setExchangeError(display);
        toast.error(display, { duration: 6000 });
      })
      .finally(() => setExchanging(false));
  }, [isSignedIn]);

  if (exchanging) {
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

  if (exchangeError) {
    return (
      <div className="flex flex-col items-center gap-4 py-6">
        <div className="w-full p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {exchangeError}
        </div>
        <button
          className="text-sm text-blue-600 hover:underline"
          onClick={() => { setExchangeError(null); }}
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <SignIn routing="hash" />
    </div>
  );
}
