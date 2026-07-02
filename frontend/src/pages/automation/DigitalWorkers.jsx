import { useState, useEffect } from 'react';

const _BASE = import.meta.env.VITE_API_URL || '/api';
const h  = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}` });
const jh = () => ({ ...h(), 'Content-Type': 'application/json' });

const STATUS_COLOR = {
  idle:    'bg-gray-100 text-gray-600',
  running: 'bg-blue-100 text-blue-700',
  paused:  'bg-yellow-100 text-yellow-700',
  error:   'bg-red-100 text-red-700',
  offline: 'bg-gray-200 text-gray-500',
};

const WORKER_TYPES = ['data_entry','report_generator','invoice_processor','lead_qualifier','shipment_tracker','maintenance_scheduler','inventory_monitor','complaint_router','document_classifier','alert_monitor','custom'];
const AVATARS = { data_entry:'📝', report_generator:'📊', invoice_processor:'💰', lead_qualifier:'🎯', shipment_tracker:'📦', maintenance_scheduler:'🔧', inventory_monitor:'📋', complaint_router:'🎫', document_classifier:'📂', alert_monitor:'🔔', custom:'🤖' };

export default function DigitalWorkers() {
  const [tab, setTab]         = useState('list');
  const [overview, setOverview] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [form, setForm] = useState({ name: '', worker_type: 'custom', description: '', capabilities: '', avatar_icon: '🤖' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetch(`${_BASE}/digital-workers/stats/overview`, { headers: h() }).then(r => r.json())
      .then(r => setOverview(r.data || r)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    setSaving(true);
    try {
      const caps = form.capabilities.split(',').map(c => c.trim()).filter(Boolean);
      await fetch(`${_BASE}/digital-workers`, { method: 'POST', headers: jh(), body: JSON.stringify({ ...form, capabilities: caps }) });
      setForm({ name: '', worker_type: 'custom', description: '', capabilities: '', avatar_icon: '🤖' });
      load(); setTab('list');
    } catch (_) {} finally { setSaving(false); }
  };

  const activate   = async id => { await fetch(`${_BASE}/digital-workers/${id}/activate`,   { method: 'POST', headers: jh(), body: '{}' }); load(); };
  const deactivate = async id => { await fetch(`${_BASE}/digital-workers/${id}/deactivate`, { method: 'POST', headers: jh(), body: '{}' }); load(); };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Digital Workers</h1>
        <p className="text-sm text-gray-500 mt-1">AI-powered virtual workers that automate repetitive tasks</p>
      </div>

      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[['Total Workers', overview.total],['Active', overview.active, 'text-green-600'],['Running Now', overview.running, 'text-blue-600'],['Tasks Done', overview.total_tasks_completed, 'text-indigo-600']].map(([l,v,c]) => (
            <div key={l} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm text-center">
              <p className="text-xs text-gray-500">{l}</p>
              <p className={`text-2xl font-bold mt-0.5 ${c || 'text-gray-900'}`}>{v ?? 0}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 border-b border-gray-200">
        {[['list','Workers'],['create','Create Worker']].map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{label}</button>
        ))}
      </div>

      {tab === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading && <div className="col-span-3 text-center py-10 text-gray-400">Loading…</div>}
          {!loading && (overview?.workers || []).length === 0 && (
            <div className="col-span-3 text-center py-12 text-gray-400">
              <p className="text-4xl mb-3">🤖</p>
              <p>No digital workers yet. Create your first worker.</p>
            </div>
          )}
          {(overview?.workers || []).map(w => (
            <div key={w._id} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{w.avatar_icon || AVATARS[w.worker_type] || '🤖'}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">{w.name}</h3>
                    <p className="text-xs text-gray-500">{w.worker_type?.replace('_', ' ')}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[w.current_status] || 'bg-gray-100 text-gray-600'}`}>{w.current_status}</span>
              </div>
              <p className="text-sm text-gray-500 mb-3">{w.description || '—'}</p>
              {w.capabilities?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {w.capabilities.slice(0,3).map(c => <span key={c} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">{c}</span>)}
                </div>
              )}
              <div className="flex justify-between text-xs text-gray-400 mb-3">
                <span>Tasks: {w.tasks_completed}</span>
                <span>Uptime: {w.uptime_pct}%</span>
              </div>
              <div className="flex gap-2">
                {w.is_active
                  ? <button onClick={() => deactivate(w._id)} className="flex-1 text-xs border border-gray-200 text-gray-600 py-1.5 rounded-lg hover:bg-gray-50">Deactivate</button>
                  : <button onClick={() => activate(w._id)}   className="flex-1 text-xs bg-indigo-600 text-white py-1.5 rounded-lg hover:bg-indigo-700">Activate</button>
                }
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'create' && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-gray-800">New Digital Worker</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Invoice Bot" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.worker_type}
                onChange={e => setForm(f => ({ ...f, worker_type: e.target.value, avatar_icon: AVATARS[e.target.value] || '🤖' }))}>
                {WORKER_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
              </select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Avatar</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.avatar_icon}
                onChange={e => setForm(f => ({ ...f, avatar_icon: e.target.value }))} placeholder="Emoji e.g. 🤖" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Capabilities (comma-separated)</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.capabilities}
                onChange={e => setForm(f => ({ ...f, capabilities: e.target.value }))} placeholder="e.g. PDF generation, Email, API calls" /></div>
            <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={2} value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What does this worker do?" /></div>
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={create} disabled={saving || !form.name}
              className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">
              {saving ? 'Creating…' : 'Create Worker'}
            </button>
            <button onClick={() => setTab('list')} className="border border-gray-300 text-gray-600 px-5 py-2 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
