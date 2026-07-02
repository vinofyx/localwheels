import { useState, useEffect } from 'react';

const _BASE = import.meta.env.VITE_API_URL || '/api';
const h = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}`, 'Content-Type': 'application/json' });

export default function SimulationAnalytics() {
  const [dashboard, setDashboard] = useState(null);
  const [insights, setInsights]   = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [snapLoading, setSnapLoading] = useState(false);

  const load = async () => {
    const res = await fetch(`${_BASE}/simulation-analytics/dashboard`, { headers: h() });
    if (res.ok) { const d = await res.json(); setDashboard(d.data); }
  };

  useEffect(() => { load(); }, []);

  const getInsights = async () => {
    setAiLoading(true);
    try {
      const res = await fetch(`${_BASE}/simulation-analytics/ai-insights`, { method: 'POST', headers: h() });
      if (res.ok) { const d = await res.json(); setInsights(d.data.insights || []); }
    } finally { setAiLoading(false); }
  };

  const saveSnapshot = async () => {
    setSnapLoading(true);
    try {
      await fetch(`${_BASE}/simulation-analytics/snapshot`, { method: 'POST', headers: h() });
      alert('Snapshot saved');
    } finally { setSnapLoading(false); }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Simulation Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">Platform-wide simulation performance and ROI analytics</p>
        </div>
        <div className="flex gap-2">
          <button onClick={saveSnapshot} disabled={snapLoading} className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm">
            {snapLoading ? '...' : 'Save Snapshot'}
          </button>
          <button onClick={getInsights} disabled={aiLoading} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm">
            {aiLoading ? '...' : '✨ AI Insights'}
          </button>
        </div>
      </div>

      {dashboard && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-700 mb-3 text-sm">Simulations (30d)</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Total</span><strong>{dashboard.simulations?.total || 0}</strong></div>
                <div className="flex justify-between"><span className="text-gray-500">Completed</span><strong className="text-green-600">{dashboard.simulations?.completed || 0}</strong></div>
                <div className="flex justify-between"><span className="text-gray-500">Failed</span><strong className="text-red-500">{dashboard.simulations?.failed || 0}</strong></div>
                <div className="flex justify-between"><span className="text-gray-500">Success Rate</span><strong className="text-blue-600">{dashboard.simulations?.success_rate_pct || 0}%</strong></div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-700 mb-3 text-sm">Autonomous Decisions</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Pending</span><strong className="text-yellow-600">{dashboard.decisions?.pending || 0}</strong></div>
                <div className="flex justify-between"><span className="text-gray-500">Completed</span><strong className="text-green-600">{dashboard.decisions?.completed || 0}</strong></div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-700 mb-3 text-sm">Recommendations</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Generated</span><strong>{dashboard.recommendations?.total || 0}</strong></div>
                <div className="flex justify-between"><span className="text-gray-500">Accepted</span><strong className="text-green-600">{dashboard.recommendations?.accepted || 0}</strong></div>
                <div className="flex justify-between"><span className="text-gray-500">Acceptance Rate</span><strong>{dashboard.recommendations?.acceptance_rate_pct || 0}%</strong></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-5">
              <p className="text-sm text-green-700 font-medium">Total Cost Savings</p>
              <p className="text-2xl font-bold text-green-800 mt-1">₹{(dashboard.total_saving_inr||0).toLocaleString()}</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <p className="text-sm text-blue-700 font-medium">Carbon Saved</p>
              <p className="text-2xl font-bold text-blue-800 mt-1">{(dashboard.carbon_saved_kg||0).toFixed(0)} kg CO₂</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-5">
              <p className="text-sm text-red-700 font-medium">High Priority Risks</p>
              <p className="text-2xl font-bold text-red-800 mt-1">{dashboard.high_risks || 0}</p>
            </div>
          </div>
        </>
      )}

      {insights.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-gray-800">AI Strategic Insights</h2>
          {insights.map((ins, i) => (
            <div key={i} className={`bg-white rounded-xl border p-4 border-l-4 ${ins.priority === 'high' ? 'border-l-red-500' : ins.priority === 'medium' ? 'border-l-yellow-500' : 'border-l-blue-400'}`}>
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">{ins.insight}</h3>
                {ins.potential_saving_inr > 0 && (
                  <span className="text-sm text-green-600 font-medium">₹{ins.potential_saving_inr.toLocaleString()}</span>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1">{ins.recommendation}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full mt-2 inline-block ${ins.priority === 'high' ? 'bg-red-100 text-red-700' : ins.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>
                {ins.priority} priority
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
