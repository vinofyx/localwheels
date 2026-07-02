import { useState, useEffect } from 'react';

const _BASE = import.meta.env.VITE_API_URL || '/api';
const h = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}`, 'Content-Type': 'application/json' });

export default function CarbonDashboard() {
  const [dashboard, setDashboard]   = useState(null);
  const [emissions, setEmissions]   = useState([]);
  const [simResult, setSimResult]   = useState(null);
  const [recs, setRecs]             = useState([]);
  const [recLoading, setRecLoading] = useState(false);
  const [form, setForm]     = useState({ distance_km: 100, fuel_litres: 12, fuel_type: 'diesel', source_type: 'vehicle' });
  const [simForm, setSimForm] = useState({ ev_fleet_pct: 20, route_optimization_pct: 15, load_factor_improvement: 10 });

  const load = async () => {
    const [dRes, eRes] = await Promise.all([
      fetch(`${_BASE}/carbon/dashboard`, { headers: h() }),
      fetch(`${_BASE}/carbon?limit=10`, { headers: h() }),
    ]);
    if (dRes.ok) { const d = await dRes.json(); setDashboard(d.data); }
    if (eRes.ok) { const d = await eRes.json(); setEmissions(d.data.emissions || []); }
  };

  useEffect(() => { load(); }, []);

  const record = async () => {
    await fetch(`${_BASE}/carbon`, { method: 'POST', headers: h(), body: JSON.stringify(form) });
    load();
  };

  const simulate = async () => {
    const res = await fetch(`${_BASE}/carbon/simulate`, { method: 'POST', headers: h(), body: JSON.stringify(simForm) });
    if (res.ok) { const d = await res.json(); setSimResult(d.data); }
  };

  const getAiRecs = async () => {
    setRecLoading(true);
    try {
      const res = await fetch(`${_BASE}/carbon/ai-recommendations`, { method: 'POST', headers: h() });
      if (res.ok) { const d = await res.json(); setRecs(d.data.recommendations || []); }
    } finally { setRecLoading(false); }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Carbon Intelligence</h1>
          <p className="text-gray-500 text-sm mt-1">Track, simulate and reduce your carbon footprint</p>
        </div>
        <button onClick={getAiRecs} disabled={recLoading} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm">
          {recLoading ? '...' : '✨ AI Recommendations'}
        </button>
      </div>

      {dashboard && (
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'CO₂ Last 30d', value: `${dashboard.co2_last_30d_kg?.toLocaleString() || 0} kg`, color: 'red' },
            { label: 'CO₂ Last 7d',  value: `${dashboard.co2_last_7d_kg?.toLocaleString() || 0} kg`, color: 'orange' },
            { label: 'CO₂/km',       value: `${dashboard.co2_per_km || 0} kg`, color: 'yellow' },
            { label: 'Total KM',     value: `${(dashboard.total_distance_km || 0).toLocaleString()} km`, color: 'blue' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className={`text-lg font-bold text-${s.color}-600 mt-1`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Record Emission</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500">Distance (km)</label>
                <input type="number" value={form.distance_km} onChange={e => setForm(f => ({...f, distance_km: +e.target.value}))} className="w-full border rounded px-2 py-1.5 text-sm mt-0.5" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Fuel (litres)</label>
                <input type="number" value={form.fuel_litres} onChange={e => setForm(f => ({...f, fuel_litres: +e.target.value}))} className="w-full border rounded px-2 py-1.5 text-sm mt-0.5" />
              </div>
            </div>
            <select value={form.fuel_type} onChange={e => setForm(f => ({...f, fuel_type: e.target.value}))} className="w-full border rounded px-2 py-1.5 text-sm">
              {['diesel','petrol','cng','ev','hybrid'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <button onClick={record} className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm">Record</button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Carbon Reduction Simulator</h2>
          <div className="space-y-3">
            <div><label className="text-xs text-gray-500">EV Fleet %</label>
              <input type="range" min="0" max="100" value={simForm.ev_fleet_pct} onChange={e => setSimForm(f => ({...f, ev_fleet_pct: +e.target.value}))} className="w-full" />
              <span className="text-xs text-blue-600">{simForm.ev_fleet_pct}%</span>
            </div>
            <div><label className="text-xs text-gray-500">Route Optimisation %</label>
              <input type="range" min="0" max="50" value={simForm.route_optimization_pct} onChange={e => setSimForm(f => ({...f, route_optimization_pct: +e.target.value}))} className="w-full" />
              <span className="text-xs text-blue-600">{simForm.route_optimization_pct}%</span>
            </div>
            <div><label className="text-xs text-gray-500">Load Factor Improvement %</label>
              <input type="range" min="0" max="30" value={simForm.load_factor_improvement} onChange={e => setSimForm(f => ({...f, load_factor_improvement: +e.target.value}))} className="w-full" />
              <span className="text-xs text-blue-600">{simForm.load_factor_improvement}%</span>
            </div>
            <button onClick={simulate} className="w-full bg-green-600 text-white rounded-lg py-2 text-sm">Simulate Reduction</button>
          </div>
          {simResult && (
            <div className="mt-3 bg-green-50 rounded-lg p-3 text-sm">
              <div className="font-semibold text-green-700">CO₂ Reduction: {simResult.reduction_pct}%</div>
              <div className="text-green-600">Save {simResult.reduction_kg} kg CO₂</div>
              <div className="text-gray-500 text-xs mt-1">≈ {simResult.annual_saving_trees} trees/yr</div>
            </div>
          )}
        </div>
      </div>

      {recs.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-gray-800">AI Recommendations</h2>
          {recs.map((r, i) => (
            <div key={i} className={`bg-white rounded-xl border p-4 border-l-4 ${r.effort === 'low' ? 'border-l-green-500' : r.effort === 'medium' ? 'border-l-yellow-500' : 'border-l-red-500'}`}>
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">{r.action}</h3>
                <div className="flex gap-2 text-xs">
                  <span className="text-green-600">-{r.reduction_kg}kg CO₂</span>
                  <span className="text-blue-600">₹{(r.cost_saving_inr||0).toLocaleString()}</span>
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-1">Effort: {r.effort} • Priority: {r.priority}</div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-800 mb-3">Recent Emission Records</h2>
        {emissions.length === 0 ? (
          <div className="text-center text-gray-400 py-4">No emission records yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-gray-500 border-b">
              <th className="pb-2">Date</th><th>Source</th><th>Fuel</th><th>Distance</th><th className="text-right">CO₂ (kg)</th>
            </tr></thead>
            <tbody>{emissions.map(e => (
              <tr key={e._id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-2 text-gray-500">{new Date(e.record_date).toLocaleDateString()}</td>
                <td>{e.source_type}</td>
                <td><span className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{e.fuel_type}</span></td>
                <td>{e.distance_km} km</td>
                <td className="text-right font-medium text-red-600">{e.co2_kg?.toFixed(1)}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}
