import { useState } from 'react';

const _BASE = import.meta.env.VITE_API_URL || '/api';
const h = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}`, 'Content-Type': 'application/json' });

const CATEGORIES = ['demand','supply','risk','cost','capacity','route','weather','custom'];

export default function ScenarioBuilder() {
  const [form, setForm]   = useState({ name: '', category: 'demand', description: '', parameters: '{}', assumptions: '' });
  const [saved, setSaved] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading]   = useState(false);

  const save = async () => {
    setLoading(true);
    try {
      let params = {};
      try { params = JSON.parse(form.parameters); } catch { params = {}; }
      const assumptions = form.assumptions ? form.assumptions.split('\n').filter(Boolean) : [];
      const res = await fetch(`${_BASE}/scenarios`, {
        method: 'POST', headers: h(),
        body: JSON.stringify({ ...form, parameters: params, assumptions }),
      });
      if (res.ok) { const d = await res.json(); setSaved(d.data); }
    } finally { setLoading(false); }
  };

  const analyse = async () => {
    if (!saved) return;
    setLoading(true);
    try {
      const res = await fetch(`${_BASE}/scenarios/${saved._id}/ai-analyse`, { method: 'POST', headers: h() });
      if (res.ok) { const d = await res.json(); setAnalysis(d.data.recommendations); }
    } finally { setLoading(false); }
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Scenario Builder</h1>
        <p className="text-gray-500 text-sm mt-1">Design and analyse custom what-if scenarios</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-800">Build Scenario</h2>
        <div className="grid grid-cols-2 gap-4">
          <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="Scenario Name *" className="border rounded-lg px-3 py-2 text-sm col-span-2" />
          <select value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))} className="border rounded-lg px-3 py-2 text-sm">
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="Description" className="border rounded-lg px-3 py-2 text-sm" rows={2} />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Parameters (JSON)</label>
          <textarea value={form.parameters} onChange={e => setForm(f => ({...f, parameters: e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm font-mono" rows={4} placeholder='{"demand_increase_pct": 30, "duration_days": 14}' />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Assumptions (one per line)</label>
          <textarea value={form.assumptions} onChange={e => setForm(f => ({...f, assumptions: e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm" rows={3} placeholder="Fuel price stays constant&#10;Fleet availability at 80%&#10;No new routes added" />
        </div>
        <div className="flex gap-2">
          <button onClick={save} disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
            {loading ? 'Saving...' : 'Save Scenario'}
          </button>
          {saved && (
            <button onClick={analyse} disabled={loading} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700">
              {loading ? 'Analysing...' : 'AI Analyse'}
            </button>
          )}
        </div>
      </div>

      {saved && !analysis && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-green-700 font-medium">✓ Scenario saved: <strong>{saved.name}</strong></p>
          <p className="text-green-600 text-sm mt-1">Click "AI Analyse" to get recommendations from Claude AI</p>
        </div>
      )}

      {analysis?.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-gray-800">AI Recommendations</h2>
          {analysis.map((rec, i) => (
            <div key={i} className={`bg-white rounded-xl border p-4 border-l-4 ${rec.priority === 'high' ? 'border-l-red-500' : rec.priority === 'medium' ? 'border-l-yellow-500' : 'border-l-blue-400'}`}>
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">{rec.title}</h3>
                <span className="text-xs text-gray-500">Confidence: {rec.confidence_pct || rec.ai_generated ? '85%' : '—'}</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
              {rec.estimated_saving > 0 && (
                <p className="text-sm text-green-600 mt-1 font-medium">Estimated saving: ₹{rec.estimated_saving.toLocaleString()}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
