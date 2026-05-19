import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import toast from 'react-hot-toast';

const ROLE_BADGE = {
  superadmin: 'bg-red-100 text-red-700',
  admin: 'bg-purple-100 text-purple-700',
  manager: 'bg-blue-100 text-blue-700',
  staff: 'bg-gray-100 text-gray-600',
};

function CreateUserModal({ branches, onClose, onDone }) {
  const [form, setForm] = useState({ username: '', password: '', full_name: '', email: '', role: 'staff', branch_ids: [] });
  const [loading, setLoading] = useState(false);

  function toggleBranch(id) {
    const sid = String(id);
    setForm(f => ({
      ...f,
      branch_ids: f.branch_ids.includes(sid)
        ? f.branch_ids.filter(b => b !== sid)
        : [...f.branch_ids, sid],
    }));
  }

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/users', form);
      toast.success('User created');
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create user');
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h3 className="font-bold text-lg mb-4">Add New User</h3>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Username</label>
              <input className="input" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" className="input" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
            </div>
          </div>
          <div>
            <label className="label">Full Name</label>
            <input className="input" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div>
            <label className="label">Role</label>
            <select className="input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
              <option value="staff">Staff</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="label">Assign Branches</label>
            <div className="space-y-1 max-h-36 overflow-y-auto border border-gray-200 rounded-lg p-2">
              {branches.map(b => {
              const bid = String(b._id || b.id);
              return (
                <label key={bid} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                  <input
                    type="checkbox"
                    checked={form.branch_ids.includes(bid)}
                    onChange={() => toggleBranch(bid)}
                    className="text-blue-600"
                  />
                  <span className="text-sm">{b.branch_name}</span>
                </label>
              ); })}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Creating…' : 'Create User'}</button>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Users() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  function fetchAll() {
    setLoading(true);
    Promise.all([
      api.get('/users'),
      api.get('/branches'),
    ]).then(([u, b]) => { setUsers(u.data); setBranches(b.data); })
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchAll(); }, []);

  if (!['admin', 'superadmin'].includes(user?.role)) {
    return <p className="text-gray-500">Access denied.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add User
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="table-th">Name</th>
                <th className="table-th">Username</th>
                <th className="table-th">Role</th>
                <th className="table-th">Email</th>
                <th className="table-th">Branches</th>
                <th className="table-th">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="table-td font-medium">{u.full_name || '—'}</td>
                  <td className="table-td">{u.username}</td>
                  <td className="table-td">
                    <span className={`badge ${ROLE_BADGE[u.role] || 'bg-gray-100 text-gray-600'}`}>{u.role}</span>
                  </td>
                  <td className="table-td">{u.email || '—'}</td>
                  <td className="table-td text-xs text-gray-500">{u.branches || 'None'}</td>
                  <td className="table-td">
                    <span className={`badge ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showCreate && (
        <CreateUserModal
          branches={branches}
          onClose={() => setShowCreate(false)}
          onDone={() => { setShowCreate(false); fetchAll(); }}
        />
      )}
    </div>
  );
}
