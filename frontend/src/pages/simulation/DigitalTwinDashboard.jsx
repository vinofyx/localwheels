import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const _BASE = import.meta.env.VITE_API_URL || '/api';
const h = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}`, 'Content-Type': 'application/json' });

export default function DigitalTwinDashboard() {
  const [stats, setStats]   = useState(null);
  const [twins, setTwins]   = useState([]);
  const [creating, setCreating] = useState(false);
  const [form, setForm]     = useState({ name: '', description: '', twin_type: 'enterprise' });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [sRes, tRes] = await Promise.all([
        fetch(`${_BASE}/digital-twin/stats/overview`, { headers: h() }),
        fetch(`${_BASE}/digital-twin`, { headers: h() }),
      ]);
      if (sRes.ok) { const d = await sRes.json(); setStats(d.data); }
      if (tRes.ok) { const d = await tRes.json(); setTwins(d.data.twins || []); }
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    const res = await fetch(`${_BASE}/digital-twin`, { method: 'POST', headers: h(), body: JSON.stringify(form) });
    if (res.ok) { setCreating(false); setForm({ name: '', description: '', twin_type: 'enterprise' }); load(); }
  };

  const sync = async (id) => {
    await fetch(`${_BASE}/digital-twin/${id}/sync`, { method: 'POST', headers: h() });
    setTimeout(load, 1500);
  };

  const snapshot = async (id) => {
    await fetch(`${_BASE}/digital-twin/${id}/snapshot`, { method: 'POST', headers: h(), body: JSON.stringify({ label: 'Manual snapshot' }) });
    alert('Snapshot saved');
  };

  if (loading) return <div className="p-8 text-gray-400">Loading Digital Twin...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Enterprise Digital Twin</h1>
          <p className="text-gray-500 text-sm mt-1">Real-time virtual replica of your logistics network</p>
        </div>
        <button onClick={() => setCreating(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
          + Create Twin
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Twins',      value: stats.total_twins,    color: 'blue'  },
            { label: 'Active Twins',     value: stats.active_twins,   color: 'green' },
            { label: 'Snapshots',        value: stats.snapshots,      color: 'purple'},
            { label: 'Platform Health',  value: `${stats.platform_health}%`, color: 'emerald'},
          ].map(s => (
            <div key={s.label} className={`bg-white rounded-xl border border-gray-200 p-4`}>
              <p className="text-sm text-gray-500">{s.label}</p>
              <p className={`text-2xl font-bold text-${s.color}-600 mt-1`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {twins.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
            No digital twins yet. Create one to get started.
          </div>
        )}
        {twins.map(twin => (
          <div key={twin._id} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{twin.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${twin.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {twin.status}
                  </span>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{twin.twin_type}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{twin.description}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <span>Health: <strong className="text-green-600">{twin.health_score}%</strong></span>
                  <span>Entities: {twin.total_entities}</span>
                  <span>Replicas: {twin.replicas?.length || 0}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => sync(twin._id)} className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded hover:bg-blue-100">Sync</button>
                <button onClick={() => snapshot(twin._id)} className="text-xs bg-purple-50 text-purple-600 px-3 py-1.5 rounded hover:bg-purple-100">Snapshot</button>
              </div>
            </div>
            {twin.replicas?.length > 0 && (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {twin.replicas.slice(0,8).map(r => (
                  <div key={r.entity_type} className="bg-gray-50 rounded p-2 text-xs">
                    <div className="font-medium text-gray-700 capitalize">{r.entity_type}</div>
                    <div className="text-green-600">Health: {r.health}%</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {creating && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-bold mb-4">Create Digital Twin</h2>
            <div className="space-y-3">
              <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="Twin Name *" className="w-full border rounded-lg px-3 py-2 text-sm" />
              <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="Description" className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} />
              <select value={form.twin_type} onChange={e => setForm(f => ({...f, twin_type: e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm">
                {['enterprise','fleet','warehouse','route','supply_chain'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={create} className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm">Create</button>
              <button onClick={() => setCreating(false)} className="flex-1 border rounded-lg py-2 text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
