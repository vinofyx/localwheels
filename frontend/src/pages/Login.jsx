import React, { lazy, Suspense, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const CLERK_ENABLED = !!(CLERK_KEY && CLERK_KEY.startsWith('pk_'));

const ClerkSignInPanel = CLERK_ENABLED ? lazy(() => import('./ClerkSignInPanel')) : null;

export default function Login() {
  const { login, user, branch, authReady } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [useClerk, setUseClerk] = useState(CLERK_ENABLED);

  // Already logged in — skip to right place.
  // Guard with authReady: localStorage may have a stale user object while /auth/me
  // is still validating. Navigating before validation completes causes a flash where
  // the Guard shows AuthLoading then redirects back here on token failure.
  React.useEffect(() => {
    if (!authReady) return;
    if (user && branch) navigate('/dashboard', { replace: true });
    else if (user) navigate('/select-branch', { replace: true });
  }, [user, branch, authReady]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.username, form.password);
      navigate('/select-branch');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

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
          {useClerk && ClerkSignInPanel ? (
            <>
              <Suspense fallback={<div className="text-center py-8 text-gray-400">Loading...</div>}>
                <ClerkSignInPanel />
              </Suspense>
              <button
                className="mt-4 w-full text-xs text-gray-400 hover:text-gray-600 underline"
                onClick={() => setUseClerk(false)}
              >
                Use username & password instead
              </button>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Sign in to your account</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Username</label>
                  <input
                    className="input"
                    placeholder="Enter username"
                    value={form.username}
                    onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                    autoFocus
                    required
                  />
                </div>
                <div>
                  <label className="label">Password</label>
                  <input
                    type="password"
                    className="input"
                    placeholder="Enter password"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    required
                  />
                </div>
                <button type="submit" className="btn-primary w-full py-2.5 mt-2" disabled={loading}>
                  {loading ? 'Signing in…' : 'Sign In'}
                </button>
              </form>
              {CLERK_ENABLED && (
                <button
                  className="mt-4 w-full text-xs text-gray-400 hover:text-gray-600 underline"
                  onClick={() => setUseClerk(true)}
                >
                  Sign in with Clerk instead
                </button>
              )}
              {import.meta.env.DEV && (
                <div className="mt-6 p-3 bg-gray-50 rounded-lg text-xs text-gray-500">
                  <p className="font-semibold mb-1">Dev credentials:</p>
                  <p>dayakar / admin123 &nbsp;·&nbsp; admin / admin123</p>
                </div>
              )}
            </>
          )}
        </div>

        <p className="text-center text-blue-200 text-xs mt-6">
          © 2024 LocalWheels · Multi-branch Logistics SaaS
        </p>
      </div>
    </div>
  );
}
