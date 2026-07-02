import { useState, useEffect } from 'react';

const _BASE = import.meta.env.VITE_API_URL || '/api';
const h = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}`, 'Content-Type': 'application/json' });

const TYPE_ICON = { alternative_route: '🗺️', alternative_vehicle: '🚛', alternative_driver: '👤', alternative_warehouse: '🏭', alternative_supplier: '📦', alternative_carrier: '✈️', dynamic_eta: '⏱️', cost_optimization: '💰', capacity_optimization: '📊', delivery_optimization: '🎯', risk_mitigation: '🛡️', other: '🤖' };
const STAT_COLOR = { pending: 'bg-yellow-100 text-yellow-700', accepted: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700', implemented: 'bg-blue-100 text-blue-700', expired: 'bg-gray-100 text-gray-500' };

export default function AIDecisionCenter() {
  const [recs, setRecs]     = useState([]);
  const [stats, setStats]   = useState(null);
  const [tab, setTab]       = useState('recommendations');
  const [genForm, setGenForm] = useState({ problem: '', context: '', type: 'other' });
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 20 });
      if (statusFilter) params.set('status', statusFilter);
      const [r, s] = await Promise.all([
        fetch(`${_BASE}/decision-engine?${params}`, { headers: h() }).then(r => r.json()),
        fetch(`${_BASE}/decision-engine/stats`, { headers: h() }).then(r => r.json()),
      ]);
      setRecs(r.data?.recommendations || []);
      setStats(s.data || s);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, [statusFilter]);

  const generate = async () => {
    if (!genForm.problem.trim()) return;
    setGenerating(true);
    try {
      await fetch(`${_BASE}/decision-engine/generate`, { method: 'POST', headers: h(), body: JSON.stringify(genForm) });
      setGenForm({ problem: '', context: '', type: 'other' });
      setTab('recommendations');
      load();
    } catch { /* ignore */ }
    setGenerating(false);
  };

  const accept = async (id) => {
    await fetch(`${_BASE}/decision-engine/${id}/accept`, { method: 'PUT', headers: h(), body: JSON.stringify({}) });
    load();
  };

  const reject = async (id) => {
    await fetch(`${_BASE}/decision-engine/${id}/reject`, { method: 'PUT', headers: h() });
    load();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Decision Center</h1>
          <p className="text-sm text-gray-500 mt-1">AI-powered recommendations for logistics decisions</p>
        </div>
        <button onClick={() => setTab('generate')} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">Generate Recommendation</button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[['Total', stats.total], ['Pending', stats.pending, 'text-yellow-600'], ['Accepted', stats.accepted, 'text-green-600'], ['Cost Savings', `KES ${(stats.total_savings || 0).toLocaleString()}`, 'text-indigo-600']].map(([l, v, c]) => (
            <div key={l} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-gray-500 uppercase">{l}</p>
              <p className={`text-xl font-bold mt-1 ${c || 'text-gray-900'}`}>{v ?? 0}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 border-b border-gray-200">
        {['recommendations','generate'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{t}</button>
        ))}
      </div>

      {loading && tab === 'recommendations' && <div className="text-center py-12 text-gray-400">Loading…</div>}

      {!loading && tab === 'recommendations' && (
        <div className="space-y-3">
          <div className="flex gap-3">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
              <option value="">All Status</option>
              {['pending','accepted','rejected','implemented','expired'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {recs.map(r => (
            <div key={r._id} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{TYPE_ICON[r.type] || '🤖'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STAT_COLOR[r.status] || 'bg-gray-100 text-gray-700'}`}>{r.status}</span>
                    <span className="text-xs text-gray-400 capitalize">{r.type?.replace(/_/g,' ')}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${r.priority === 'high' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>{r.priority}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900">{r.title}</h3>
                  {r.problem && <p className="text-xs text-gray-500 mt-1">Problem: {r.problem}</p>}
                  {r.recommendation && <p className="text-sm text-gray-700 mt-2 bg-blue-50 p-3 rounded-lg">{r.recommendation}</p>}
                  {r.rationale && <p className="text-xs text-gray-500 mt-2">{r.rationale}</p>}
                  <div className="flex items-center gap-4 mt-3">
                    {r.expected_saving > 0 && <span className="text-xs text-green-700 font-medium">💰 Saves KES {r.expected_saving.toLocaleString()}</span>}
                    {r.confidence_pct > 0 && <span className="text-xs text-indigo-600">{r.confidence_pct}% confidence</span>}
                    {r.expires_at && <span className="text-xs text-gray-400">Expires {new Date(r.expires_at).toLocaleDateString()}</span>}
                  </div>
                  {r.options?.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {r.options.map((opt, i) => (
                        <div key={i} className="flex items-center gap-2 bg-gray-50 rounded px-3 py-1.5">
                          <span className="text-xs font-bold text-indigo-600">{opt.score || '?'}</span>
                          <span className="text-xs font-medium text-gray-700">{opt.label}</span>
                          <span className="text-xs text-gray-500">{opt.description}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {r.status === 'pending' && (
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button onClick={() => accept(r._id)} className="bg-green-600 text-white px-3 py-1.5 rounded text-xs hover:bg-green-700">Accept</button>
                    <button onClick={() => reject(r._id)} className="border border-red-200 text-red-600 px-3 py-1.5 rounded text-xs hover:bg-red-50">Reject</button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {recs.length === 0 && <div className="text-center py-10 text-gray-400">No recommendations yet. Generate one to get started.</div>}
        </div>
      )}

      {tab === 'generate' && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm max-w-2xl">
          <h3 className="font-semibold text-gray-800 mb-2">Generate AI Decision</h3>
          <p className="text-sm text-gray-500 mb-4">Describe a logistics problem and the AI will generate a recommendation with options.</p>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Problem *</label>
              <textarea value={genForm.problem} onChange={e => setGenForm(p => ({...p,problem:e.target.value}))} rows={3} placeholder="e.g. Vehicle KCA 001B has broken down en route to Mombasa with urgent cargo" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Additional Context</label>
              <textarea value={genForm.context} onChange={e => setGenForm(p => ({...p,context:e.target.value}))} rows={2} placeholder="Available alternatives, constraints, deadlines…" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Decision Type</label>
              <select value={genForm.type} onChange={e => setGenForm(p => ({...p,type:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                {['alternative_route','alternative_vehicle','alternative_driver','alternative_warehouse','alternative_supplier','cost_optimization','capacity_optimization','delivery_optimization','risk_mitigation','other'].map(t => <option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button onClick={generate} disabled={generating || !genForm.problem.trim()} className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm disabled:opacity-50">
              {generating ? 'Generating…' : 'Generate with AI'}
            </button>
            <button onClick={() => setTab('recommendations')} className="border border-gray-200 px-5 py-2 rounded-lg text-sm text-gray-600">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
