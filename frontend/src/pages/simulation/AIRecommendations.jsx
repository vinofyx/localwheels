import { useState, useEffect } from 'react';

const _BASE = import.meta.env.VITE_API_URL || '/api';
const h = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}`, 'Content-Type': 'application/json' });

const PRIORITY_COLOR = { high:'red', medium:'yellow', low:'blue', critical:'red' };

export default function AIRecommendations() {
  const [recs, setRecs]         = useState([]);
  const [simRecs, setSimRecs]   = useState([]);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [tab, setTab]           = useState('scenario');

  const load = async () => {
    setLoading(true);
    try {
      const [scRes, siRes] = await Promise.all([
        fetch(`${_BASE}/scenarios/recommendations/all`, { headers: h() }),
        fetch(`${_BASE}/scenarios/optimizations/list`, { headers: h() }),
      ]);
      if (scRes.ok) { const d = await scRes.json(); setRecs(d.data.recommendations || []); }
      if (siRes.ok) { const d = await siRes.json(); setSimRecs(d.data.optimizations || []); }
    } finally { setLoading(false); }
  };

  const loadInsights = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${_BASE}/simulation-analytics/ai-insights`, { method: 'POST', headers: h() });
      if (res.ok) { const d = await res.json(); setInsights(d.data.insights || []); }
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const accept = async (id) => {
    await fetch(`${_BASE}/scenarios/recommendations/${id}/accept`, { method: 'PUT', headers: h() });
    load();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Recommendations</h1>
          <p className="text-gray-500 text-sm mt-1">All AI-generated optimisation recommendations across Phase 18</p>
        </div>
        <button onClick={loadInsights} disabled={loading} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm">
          {loading ? '...' : '✨ Refresh Insights'}
        </button>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        {[['scenario','Scenario Recs'],['optimization','Optimisations'],['insights','Strategic Insights']].map(([k,l]) => (
          <button key={k} onClick={() => { setTab(k); if (k==='insights' && insights.length===0) loadInsights(); }} className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab===k ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>{l}</button>
        ))}
      </div>

      {tab === 'scenario' && (
        <div className="space-y-3">
          {recs.length === 0 && <div className="bg-white rounded-xl border p-8 text-center text-gray-400">No scenario recommendations yet. Run an AI analysis on a scenario.</div>}
          {recs.map(rec => {
            const color = PRIORITY_COLOR[rec.priority] || 'gray';
            return (
              <div key={rec._id} className={`bg-white rounded-xl border border-l-4 border-l-${color}-500 border-gray-200 p-4`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-gray-900">{rec.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full bg-${color}-100 text-${color}-700`}>{rec.priority}</span>
                      {rec.status === 'accepted' && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✓ Accepted</span>}
                      {rec.ai_generated && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">AI</span>}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                    {rec.estimated_saving > 0 && (
                      <p className="text-sm text-green-600 mt-1 font-medium">₹{rec.estimated_saving.toLocaleString()} estimated saving</p>
                    )}
                    {rec.actions?.length > 0 && (
                      <div className="mt-2 flex gap-1 flex-wrap">
                        {rec.actions.map((a, i) => <span key={i} className="text-xs bg-gray-100 rounded px-2 py-0.5 text-gray-600">{a}</span>)}
                      </div>
                    )}
                  </div>
                  {rec.status !== 'accepted' && (
                    <button onClick={() => accept(rec._id)} className="ml-4 text-xs bg-green-600 text-white px-3 py-1.5 rounded flex-shrink-0">Accept</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'optimization' && (
        <div className="space-y-3">
          {simRecs.length === 0 && <div className="bg-white rounded-xl border p-8 text-center text-gray-400">No optimisation recommendations yet. Generate from Executive Simulation Center.</div>}
          {simRecs.map(opt => {
            const color = PRIORITY_COLOR[opt.priority] || 'gray';
            return (
              <div key={opt._id} className={`bg-white rounded-xl border border-l-4 border-l-${color}-500 border-gray-200 p-4`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900">{opt.title}</h3>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{opt.domain}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full bg-${color}-100 text-${color}-700`}>{opt.priority}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{opt.description}</p>
                    {opt.estimated_impact && (
                      <div className="flex gap-4 mt-2 text-xs">
                        {opt.estimated_impact.cost_saving_inr > 0 && <span className="text-green-600">₹{opt.estimated_impact.cost_saving_inr.toLocaleString()} saving</span>}
                        {opt.estimated_impact.efficiency_gain_pct > 0 && <span className="text-blue-600">+{opt.estimated_impact.efficiency_gain_pct}% efficiency</span>}
                        {opt.estimated_impact.carbon_saving_kg > 0 && <span className="text-emerald-600">{opt.estimated_impact.carbon_saving_kg}kg CO₂</span>}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 ml-4 flex-shrink-0">
                    Conf: {opt.confidence_pct}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'insights' && (
        <div className="space-y-3">
          {insights.length === 0 && !loading && (
            <div className="bg-white rounded-xl border p-8 text-center text-gray-400">Click "Refresh Insights" to generate AI strategic insights.</div>
          )}
          {insights.map((ins, i) => {
            const color = PRIORITY_COLOR[ins.priority] || 'gray';
            return (
              <div key={i} className={`bg-white rounded-xl border border-l-4 border-l-${color}-500 border-gray-200 p-4`}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{ins.insight}</h3>
                    <p className="text-sm text-gray-600 mt-1">{ins.recommendation}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full bg-${color}-100 text-${color}-700 mt-2 inline-block`}>{ins.priority} priority</span>
                  </div>
                  {ins.potential_saving_inr > 0 && (
                    <span className="text-sm text-green-600 font-bold ml-4">₹{ins.potential_saving_inr.toLocaleString()}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
