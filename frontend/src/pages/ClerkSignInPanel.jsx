import React, { useEffect } from 'react';
import { SignIn, useAuth as useClerkHook } from '@clerk/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// Rendered only when VITE_CLERK_PUBLISHABLE_KEY is configured.
// After Clerk signs the user in, it exchanges the Clerk session token
// for a LocalWheels JWT via POST /api/auth/clerk-exchange.
export default function ClerkSignInPanel() {
  const { isSignedIn, getToken } = useClerkHook();
  const { clerkLogin, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isSignedIn && !user) {
      getToken()
        .then(token => clerkLogin(token))
        .then(() => navigate('/select-branch'))
        .catch(() => {
          toast.error('Your Clerk account is not linked to a LocalWheels user. Please use the username/password form.');
        });
    }
  }, [isSignedIn]);

  return (
    <div className="flex justify-center">
      <SignIn routing="hash" />
    </div>
  );
}
