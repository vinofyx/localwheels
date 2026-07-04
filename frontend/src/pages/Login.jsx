import React, { Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ClerkSignInPanel from './ClerkSignInPanel';

export default function Login() {
  const { user, branch } = useAuth();
  const navigate = useNavigate();

  // Already authenticated — skip to the right place.
  React.useEffect(() => {
    if (user && branch) navigate('/dashboard', { replace: true });
    else if (user)      navigate('/select-branch', { replace: true });
  }, [user, branch, navigate]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
            <svg className="w-9 h-9 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 17a2 2 0 100 4 2 2 0 000-4zm8 0a2 2 0 100 4 2 2 0 000-4zM1 1h3l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 001.95-1.57L22 6H6" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white">LocalWheels</h1>
          <p className="text-blue-200 mt-1 text-sm">Logistics Management Platform</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <Suspense fallback={<div className="text-center py-8 text-gray-400">Loading…</div>}>
            <ClerkSignInPanel />
          </Suspense>
        </div>

        <p className="text-center text-blue-200 text-xs mt-6">
          © 2024 LocalWheels · Multi-branch Logistics SaaS
        </p>
      </div>
    </div>
  );
}
