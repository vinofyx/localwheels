import { useState, useEffect } from 'react';

const _BASE = import.meta.env.VITE_API_URL || '/api';
const h = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}`, 'Content-Type': 'application/json' });

const ENTITY_TYPES = ['fleet','warehouse','driver','route','overall'];

export default function CapacityPlanning() {
  const [forecasts, setForecasts] = useState([]);
  const [analysis, setAnalysis]   = useState(null);
  const [genLoading, setGenLoading] = useState(false);
  const [aiLoading, setAiLoading]   = useState(false);
  const [form, setForm] = useState({ entity_type: 'overall', horizon_days: 30 });

  const load = async () => {
    const res = await fetch(`${_BASE}/capacity`, { headers: h() });
    if (res.ok) { const d = await res.json(); setForecasts(d.data.forecasts || []); }
  };

  useEffect(() => { load(); }, []);

  const generate = async () => {
    setGenLoading(true);
    try {
      await fetch(`${_BASE}/capacity/forecast`, { method: 'POST', headers: h(), body: JSON.stringify(form) });
      load();
    } finally { setGenLoading(false); }
  };

  const aiAnalyse = async () => {
    setAiLoading(true);
    try {
      const res = await fetch(`${_BASE}/capacity/ai-analysis`, { method: 'POST', headers: h() });
      if (res.ok) { const d = await res.json(); setAnalysis(d.data.analysis); }
    } finally { setAiLoading(false); }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Capacity Planning</h1>
          <p className="text-gray-500 text-sm mt-1">Forecast capacity needs and identify gaps</p>
        </div>
        <button onClick={aiAnalyse} disabled={aiLoading} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm">
          {aiLoading ? '...' : '✨ AI Analysis'}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Generate Forecast</h2>
        <div className="flex items-end gap-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Entity Type</label>
            <select value={form.entity_type} onChange={e => setForm(f => ({...f, entity_type: e.target.value}))} className="border rounded-lg px-3 py-2 text-sm">
              {ENTITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Horizon (days)</label>
            <input type="number" value={form.horizon_days} onChange={e => setForm(f => ({...f, horizon_days: +e.target.value}))} className="border rounded-lg px-3 py-2 text-sm w-24" />
          </div>
          <button onClick={generate} disabled={genLoading} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">
            {genLoading ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </div>

      {analysis && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-5">
          <h3 className="font-semibold text-purple-800 mb-2">AI Capacity Analysis</h3>
          <p className="text-sm text-gray-700 mb-3">{analysis.summary}</p>
          <div className="grid grid-cols-2 gap-4">
            {analysis.bottlenecks?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-red-700 mb-1">Bottlenecks</p>
                <ul className="text-sm text-gray-600 space-y-1">{analysis.bottlenecks.map((b,i) => <li key={i}>• {b}</li>)}</ul>
              </div>
            )}
            {analysis.recommendations?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-green-700 mb-1">Recommendations</p>
                <ul className="text-sm text-gray-600 space-y-1">{analysis.recommendations.map((r,i) => <li key={i}>• {r}</li>)}</ul>
              </div>
            )}
          </div>
          <span className={`mt-2 inline-block text-xs px-2 py-0.5 rounded-full ${analysis.risk_level === 'high' ? 'bg-red-100 text-red-700' : analysis.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
            Risk: {analysis.risk_level}
          </span>
        </div>
      )}

      <div className="space-y-3">
        {forecasts.length === 0 && <div className="bg-white rounded-xl border p-8 text-center text-gray-400">No forecasts yet. Generate one above.</div>}
        {forecasts.map(fc => {
          const hasShortage = fc.shortage_units > 0;
          return (
            <div key={fc._id} className={`bg-white rounded-xl border p-5 ${hasShortage ? 'border-red-200' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900 capitalize">{fc.entity_type} Capacity</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${hasShortage ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {hasShortage ? `Shortage: ${fc.shortage_units}` : `Surplus: ${fc.surplus_units}`}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{fc.horizon_days}d horizon</span>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                    <div><span className="text-gray-500 text-xs">Current</span><p className="font-medium">{fc.current_capacity}</p></div>
                    <div><span className="text-gray-500 text-xs">Demand</span><p className="font-medium">{fc.forecasted_demand}</p></div>
                    <div><span className="text-gray-500 text-xs">Utilization</span><p className={`font-medium ${fc.utilization_pct > 90 ? 'text-red-600' : fc.utilization_pct > 75 ? 'text-yellow-600' : 'text-green-600'}`}>{fc.utilization_pct}%</p></div>
                  </div>
                </div>
                <div className="text-right text-xs text-gray-400">
                  <div>Confidence: {fc.confidence_pct}%</div>
                  <div>{new Date(fc.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
              {fc.recommendations?.length > 0 && (
                <div className="mt-3 text-sm text-gray-600">
                  {fc.recommendations.map((r, i) => <p key={i} className="text-xs">• {r}</p>)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
