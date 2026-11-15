import React, { useState, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ClerkSignInPanel from './ClerkSignInPanel';
import toast from 'react-hot-toast';

export default function Login() {
  const { user, branch, login } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('local'); // 'local' or 'clerk'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (user && branch) navigate('/dashboard', { replace: true });
    else if (user)      navigate('/select-branch', { replace: true });
  }, [user, branch, navigate]);

  const handleLocalLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      toast.error('Please enter username and password');
      return;
    }
    try {
      setLoading(true);
      await login({ username: username.trim(), password });
      toast.success('Logged in successfully');
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

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
          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              type="button"
              onClick={() => setTab('local')}
              className={`flex-1 pb-2 text-sm font-semibold text-center border-b-2 transition ${
                tab === 'local' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              System Login
            </button>
            <button
              type="button"
              onClick={() => setTab('clerk')}
              className={`flex-1 pb-2 text-sm font-semibold text-center border-b-2 transition ${
                tab === 'clerk' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              Clerk SSO
            </button>
          </div>

          {tab === 'local' ? (
            <form onSubmit={handleLocalLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  autoComplete="username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="admin or staff username"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm shadow transition disabled:opacity-50">
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>
          ) : (
            <Suspense fallback={<div className="text-center py-8 text-gray-400">Loading…</div>}>
              <ClerkSignInPanel />
            </Suspense>
          )}
        </div>

        <p className="text-center text-blue-200 text-xs mt-6">
          © 2024 LocalWheels · Multi-branch Logistics SaaS
        </p>
      </div>
    </div>
  );
}
