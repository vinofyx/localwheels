import { useState, useEffect } from 'react';

const _BASE = import.meta.env.VITE_API_URL || '/api';
const h = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}`, 'Content-Type': 'application/json' });

const RISK_TYPES = ['fleet_breakdown','weather_disruption','supplier_failure','demand_shock','regulatory','cybersecurity','fuel_price','staff_shortage','route_blockage','warehouse_fire','natural_disaster'];
const SEV_COLOR  = { critical:'red', high:'orange', medium:'yellow', low:'green' };

export default function RiskSimulation() {
  const [risks, setRisks]       = useState([]);
  const [assessment, setAssessment] = useState(null);
  const [heatmap, setHeatmap]   = useState(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [form, setForm] = useState({ title: '', risk_type: 'weather_disruption', severity: 'medium', likelihood: 'medium', financial_exposure: 0, description: '' });

  const load = async () => {
    const res = await fetch(`${_BASE}/risk-simulation`, { headers: h() });
    if (res.ok) { const d = await res.json(); setRisks(d.data.risks || []); }
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    await fetch(`${_BASE}/risk-simulation`, { method: 'POST', headers: h(), body: JSON.stringify(form) });
    setCreating(false); load();
  };

  const aiAssess = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${_BASE}/risk-simulation/ai-assess`, { method: 'POST', headers: h() });
      if (res.ok) { const d = await res.json(); setAssessment(d.data.assessment); }
    } finally { setLoading(false); }
  };

  const getHeatmap = async () => {
    const res = await fetch(`${_BASE}/risk-simulation/heatmap`, { method: 'POST', headers: h() });
    if (res.ok) { const d = await res.json(); setHeatmap(d.data); }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Risk Simulation</h1>
          <p className="text-gray-500 text-sm mt-1">Identify, assess and simulate operational risks</p>
        </div>
        <div className="flex gap-2">
          <button onClick={getHeatmap} className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm">Heatmap</button>
          <button onClick={aiAssess} disabled={loading} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm">
            {loading ? '...' : '✨ AI Assess'}
          </button>
          <button onClick={() => setCreating(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">+ Register Risk</button>
        </div>
      </div>

      {heatmap && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-3">Risk Heatmap Summary</h3>
          <div className="grid grid-cols-4 gap-3 mb-3">
            {[['critical','red'],['high','orange'],['medium','yellow'],['low','green']].map(([sev,color]) => (
              <div key={sev} className={`bg-${color}-50 rounded-lg p-3 text-center`}>
                <div className={`text-2xl font-bold text-${color}-600`}>{heatmap.summary[sev] || 0}</div>
                <div className="text-xs text-gray-500 capitalize">{sev}</div>
              </div>
            ))}
          </div>
          <div className="text-sm text-gray-600">Total exposure: <strong>₹{(heatmap.summary.total_exposure||0).toLocaleString()}</strong></div>
        </div>
      )}

      {assessment && (
        <div className={`rounded-xl border p-5 ${assessment.overall_risk_level === 'high' ? 'bg-red-50 border-red-200' : assessment.overall_risk_level === 'medium' ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">AI Risk Assessment</h3>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full ${assessment.overall_risk_level === 'high' ? 'bg-red-200 text-red-800' : 'bg-yellow-200 text-yellow-800'}`}>
                {assessment.overall_risk_level?.toUpperCase()} RISK
              </span>
              <span className="text-sm font-bold text-gray-700">Score: {assessment.risk_score}/100</span>
            </div>
          </div>
          <p className="text-sm text-gray-700 mb-2">Top risk: <strong>{assessment.top_risk}</strong></p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {assessment.immediate_actions?.length > 0 && <div>
              <p className="text-xs font-semibold text-red-700 mb-1">Immediate Actions</p>
              {assessment.immediate_actions.map((a,i) => <p key={i} className="text-xs text-gray-600">• {a}</p>)}
            </div>}
            {assessment.strategic_recommendations?.length > 0 && <div>
              <p className="text-xs font-semibold text-blue-700 mb-1">Strategic</p>
              {assessment.strategic_recommendations.map((r,i) => <p key={i} className="text-xs text-gray-600">• {r}</p>)}
            </div>}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {risks.length === 0 && <div className="bg-white rounded-xl border p-8 text-center text-gray-400">No risks registered yet.</div>}
        {risks.map(r => {
          const color = SEV_COLOR[r.severity] || 'gray';
          return (
            <div key={r._id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900">{r.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full bg-${color}-100 text-${color}-700`}>{r.severity}</span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{r.risk_type?.replace(/_/g,' ')}</span>
                  </div>
                  <div className="flex gap-4 mt-1 text-xs text-gray-500">
                    <span>Risk Score: <strong>{r.risk_score}/100</strong></span>
                    <span>Likelihood: {r.likelihood}</span>
                    {r.financial_exposure > 0 && <span>Exposure: ₹{r.financial_exposure.toLocaleString()}</span>}
                  </div>
                </div>
                <button onClick={async () => {
                  await fetch(`${_BASE}/risk-simulation/${r._id}/mitigate`, { method: 'PUT', headers: h(), body: JSON.stringify({ status: 'mitigated' }) });
                  load();
                }} className="text-xs bg-green-50 text-green-600 px-3 py-1.5 rounded hover:bg-green-100">
                  Mitigate
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {creating && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-bold mb-4">Register Risk</h2>
            <div className="space-y-3">
              <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="Risk Title *" className="w-full border rounded-lg px-3 py-2 text-sm" />
              <select value={form.risk_type} onChange={e => setForm(f => ({...f, risk_type: e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm">
                {RISK_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <select value={form.severity} onChange={e => setForm(f => ({...f, severity: e.target.value}))} className="border rounded-lg px-3 py-2 text-sm">
                  {['low','medium','high','critical'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select value={form.likelihood} onChange={e => setForm(f => ({...f, likelihood: e.target.value}))} className="border rounded-lg px-3 py-2 text-sm">
                  {['very_low','low','medium','high','very_high'].map(l => <option key={l} value={l}>{l.replace(/_/g,' ')}</option>)}
                </select>
              </div>
              <input type="number" value={form.financial_exposure} onChange={e => setForm(f => ({...f, financial_exposure: +e.target.value}))} placeholder="Financial Exposure (INR)" className="w-full border rounded-lg px-3 py-2 text-sm" />
              <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="Description" className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={create} className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm">Register</button>
              <button onClick={() => setCreating(false)} className="flex-1 border rounded-lg py-2 text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
