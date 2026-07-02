import { useState, useEffect } from 'react';

const _BASE = import.meta.env.VITE_API_URL || '/api';
const h = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}`, 'Content-Type': 'application/json' });

const TYPES = ['dispatch','route','fleet_allocation','warehouse_allocation','pricing','risk_mitigation','cost_optimization','supplier','custom'];
const STATUS_COLOR = { pending_approval:'yellow', approved:'blue', executing:'indigo', completed:'green', rejected:'red', failed:'red', cancelled:'gray' };

export default function AutonomousDecisions() {
  const [decisions, setDecisions] = useState([]);
  const [stats, setStats]         = useState(null);
  const [tab, setTab]             = useState('all');
  const [creating, setCreating]   = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [form, setForm] = useState({ title: '', decision_type: 'dispatch', description: '', priority: 'medium', requires_human_approval: true });

  const load = async () => {
    const [dRes, sRes] = await Promise.all([
      fetch(`${_BASE}/autonomous`, { headers: h() }),
      fetch(`${_BASE}/autonomous/stats/overview`, { headers: h() }),
    ]);
    if (dRes.ok) { const d = await dRes.json(); setDecisions(d.data.decisions || []); }
    if (sRes.ok) { const d = await sRes.json(); setStats(d.data); }
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    await fetch(`${_BASE}/autonomous`, { method: 'POST', headers: h(), body: JSON.stringify(form) });
    setCreating(false); load();
  };

  const approve = async (id) => {
    await fetch(`${_BASE}/autonomous/${id}/approve`, { method: 'POST', headers: h() });
    setTimeout(load, 1500);
  };

  const reject = async (id) => {
    const reason = prompt('Rejection reason:');
    if (reason !== null) {
      await fetch(`${_BASE}/autonomous/${id}/reject`, { method: 'POST', headers: h(), body: JSON.stringify({ reason }) });
      load();
    }
  };

  const aiSuggest = async () => {
    setAiLoading(true);
    try {
      const res = await fetch(`${_BASE}/autonomous/ai-suggest`, { method: 'POST', headers: h(), body: JSON.stringify({ context: 'Current logistics operations' }) });
      if (res.ok) { const d = await res.json(); setSuggestions(d.data.suggestions || []); }
    } finally { setAiLoading(false); }
  };

  const useSuggestion = (s) => {
    setForm({ title: s.title, decision_type: s.decision_type || 'dispatch', description: s.description, priority: s.priority, requires_human_approval: true });
    setCreating(true); setSuggestions([]);
  };

  const filtered = tab === 'all' ? decisions : decisions.filter(d => d.status === tab);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Autonomous Decisions</h1>
          <p className="text-gray-500 text-sm mt-1">AI-driven decisions with human oversight</p>
        </div>
        <div className="flex gap-2">
          <button onClick={aiSuggest} disabled={aiLoading} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm">
            {aiLoading ? '...' : '✨ AI Suggest'}
          </button>
          <button onClick={() => setCreating(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">
            + New Decision
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-5 gap-4">
          {[
            { label: 'Total', value: stats.total, color: 'gray' },
            { label: 'Pending', value: stats.pending, color: 'yellow' },
            { label: 'Approved', value: stats.approved, color: 'blue' },
            { label: 'Completed', value: stats.completed, color: 'green' },
            { label: 'Savings', value: `₹${(stats.total_saving_inr/1000).toFixed(0)}K`, color: 'emerald' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className={`text-xl font-bold text-${s.color}-600 mt-1`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <h3 className="font-semibold text-purple-800 mb-3">AI Suggestions</h3>
          <div className="space-y-2">
            {suggestions.map((s, i) => (
              <div key={i} className="bg-white rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{s.title}</p>
                  <p className="text-xs text-gray-500">{s.decision_type} • {s.priority} priority • Conf: {s.confidence_pct}%</p>
                </div>
                <button onClick={() => useSuggestion(s)} className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded">Use</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 border-b border-gray-200">
        {[['all','All'],['pending_approval','Pending'],['completed','Completed'],['rejected','Rejected']].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)} className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab===k ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>{l}</button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && <div className="bg-white rounded-xl border p-8 text-center text-gray-400">No decisions found.</div>}
        {filtered.map(d => {
          const color = STATUS_COLOR[d.status] || 'gray';
          return (
            <div key={d._id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium text-gray-900">{d.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full bg-${color}-100 text-${color}-700`}>{d.status?.replace(/_/g,' ')}</span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{d.decision_type}</span>
                    {d.priority === 'high' && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">HIGH</span>}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{d.impact_summary || d.description}</p>
                  <div className="flex gap-4 mt-1 text-xs text-gray-400">
                    {d.confidence_pct && <span>Confidence: {d.confidence_pct}%</span>}
                    {d.estimated_saving > 0 && <span className="text-green-600">Saving: ₹{d.estimated_saving.toLocaleString()}</span>}
                  </div>
                </div>
                {d.status === 'pending_approval' && (
                  <div className="flex gap-2 ml-4">
                    <button onClick={() => approve(d._id)} className="bg-green-600 text-white text-xs px-3 py-1.5 rounded">Approve</button>
                    <button onClick={() => reject(d._id)} className="bg-red-500 text-white text-xs px-3 py-1.5 rounded">Reject</button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {creating && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-bold mb-4">New Autonomous Decision</h2>
            <div className="space-y-3">
              <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="Title *" className="w-full border rounded-lg px-3 py-2 text-sm" />
              <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="Description" className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} />
              <select value={form.decision_type} onChange={e => setForm(f => ({...f, decision_type: e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm">
                {TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
              </select>
              <select value={form.priority} onChange={e => setForm(f => ({...f, priority: e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm">
                {['low','medium','high','critical'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.requires_human_approval} onChange={e => setForm(f => ({...f, requires_human_approval: e.target.checked}))} />
                Requires human approval
              </label>
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
