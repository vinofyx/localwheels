import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import toast from 'react-hot-toast';
import { useAuth as useClerkHook } from '@clerk/react';

const CLERK_ENABLED = !!(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY?.startsWith('pk_'));

// Only rendered when CLERK_ENABLED=true (inside ClerkProvider) — hook call is safe.
function ClerkSignOutLink({ onLogout, className }) {
  const { signOut } = useClerkHook();
  async function handle() {
    onLogout();
    try { await signOut(); } catch {}
  }
  return <button onClick={handle} className={className}>Sign out</button>;
}

export default function BranchSelect() {
  const { selectBranch, logout, checkSetupStatus } = useAuth();
  const navigate = useNavigate();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(false);
  const [selected, setSelected] = useState('');

  useEffect(() => {
    api.get('/branches/user')
      .then(r => {
        setBranches(r.data);
        if (r.data.length === 1) setSelected(String(r.data[0]._id || r.data[0].id));
      })
      .catch(() => {
        setError(true);
        toast.error('Could not load branches — please try again.');
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleContinue() {
    const branch = branches.find(b => String(b._id) === selected);
    if (!branch) return toast.error('Please select a branch');
    selectBranch(branch);
    // Redirect to setup wizard if this company hasn't completed setup
    const setupRedirect = await checkSetupStatus();
    navigate(setupRedirect || '/dashboard');
  }

  return (
    /* Hero background — place /public/truck-bg.jpg for the real image;
       gradient is the CSS fallback                                      */
    <div
      className="min-h-screen flex items-center justify-end"
      style={{
        backgroundImage: `url('/truck-bg.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        /* gradient fallback (sky → sand) */
        backgroundColor: '#6ab4d8',
      }}
    >
      {/* Card — floated to the right */}
      <div className="w-[340px] rounded-2xl overflow-hidden shadow-2xl mr-16 my-10"
           style={{ background: 'rgba(255,255,255,0.97)' }}>

        {/* Teal header */}
        <div className="px-6 py-4" style={{ backgroundColor: '#3bb5cc' }}>
          <h2 className="text-white font-bold text-[16px]">Select Branch</h2>
        </div>

        {/* Body */}
        <div className="px-6 py-8 flex flex-col gap-5 bg-white">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="w-5 h-5 border-2 border-[#3bb5cc] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-4">
              <p className="text-red-500 text-sm font-medium mb-3">
                Failed to load branches. Check your connection.
              </p>
              <button
                onClick={() => { setError(false); setLoading(true); api.get('/branches/user').then(r => { setBranches(r.data); if (r.data.length === 1) setSelected(String(r.data[0]._id || r.data[0].id)); }).catch(() => { setError(true); toast.error('Still unavailable — please try again.'); }).finally(() => setLoading(false)); }}
                className="text-[#3bb5cc] underline text-sm font-semibold">
                Retry
              </button>
            </div>
          ) : (
            <select
              value={selected}
              onChange={e => setSelected(e.target.value)}
              className="border border-gray-300 bg-white px-3 py-2.5 text-[13px]
                         focus:outline-none rounded w-full shadow-sm text-gray-700
                         focus:border-[#3bb5cc]">
              <option value="">--Select--</option>
              {branches.map(b => (
                <option key={b._id || b.id} value={String(b._id || b.id)}>{b.branch_name}</option>
              ))}
            </select>
          )}

          <button
            onClick={handleContinue}
            disabled={!selected || loading}
            className="w-full py-3 rounded text-white font-semibold text-[15px]
                       transition-colors shadow-md
                       disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#f5a623' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e09510'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#f5a623'}>
            Next
          </button>

          {CLERK_ENABLED
            ? <ClerkSignOutLink onLogout={logout} className="text-center text-[12px] text-gray-400 hover:text-gray-600 transition-colors" />
            : <button onClick={logout} className="text-center text-[12px] text-gray-400 hover:text-gray-600 transition-colors">Sign out</button>}
        </div>
      </div>
    </div>
  );
}
