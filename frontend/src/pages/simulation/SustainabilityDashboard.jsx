import { useState, useEffect } from 'react';

const _BASE = import.meta.env.VITE_API_URL || '/api';
const h = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}`, 'Content-Type': 'application/json' });

const GRADE_COLOR = { 'A+':'green', A:'green', 'B+':'blue', B:'blue', C:'yellow', D:'orange', F:'red' };

export default function SustainabilityDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [targets, setTargets]     = useState([]);
  const [calculating, setCalculating] = useState(false);

  const load = async () => {
    const [dRes, tRes] = await Promise.all([
      fetch(`${_BASE}/sustainability/dashboard`, { headers: h() }),
      fetch(`${_BASE}/sustainability/targets`, { headers: h() }),
    ]);
    if (dRes.ok) { const d = await dRes.json(); setDashboard(d.data); }
    if (tRes.ok) { const d = await tRes.json(); setTargets(d.data.targets || []); }
  };

  useEffect(() => { load(); }, []);

  const calculate = async () => {
    setCalculating(true);
    try {
      await fetch(`${_BASE}/sustainability/score`, { method: 'POST', headers: h(), body: JSON.stringify({ period_type: 'monthly' }) });
      load();
    } finally { setCalculating(false); }
  };

  const latest = dashboard?.latest;
  const history = dashboard?.history || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sustainability Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">ESG scores, carbon targets and green fleet metrics</p>
        </div>
        <button onClick={calculate} disabled={calculating} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm">
          {calculating ? 'Calculating...' : '⟳ Recalculate Score'}
        </button>
      </div>

      {!latest && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 text-center">
          <p className="text-yellow-800">No sustainability score yet. Click "Recalculate Score" to generate your first ESG score.</p>
        </div>
      )}

      {latest && (
        <>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className={`text-5xl font-black text-${GRADE_COLOR[latest.grade] || 'gray'}-600`}>{latest.grade}</div>
                <div className="text-sm text-gray-500 mt-1">ESG Grade</div>
              </div>
              <div className="flex-1 grid grid-cols-4 gap-4">
                {[
                  { label: 'Overall', value: latest.overall_score, color: 'blue' },
                  { label: 'Carbon', value: latest.carbon_score, color: 'red' },
                  { label: 'Fuel', value: latest.fuel_score, color: 'orange' },
                  { label: 'Route', value: latest.route_score, color: 'purple' },
                ].map(s => (
                  <div key={s.label}>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{s.label}</span><span>{s.value}/100</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className={`bg-${s.color}-500 h-2 rounded-full`} style={{ width: `${s.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
              <div><span className="text-gray-500">CO₂/km:</span> <strong>{latest.co2_per_km} kg</strong></div>
              <div><span className="text-gray-500">EV Fleet:</span> <strong>{latest.ev_fleet_pct?.toFixed(1)}%</strong></div>
              <div><span className="text-gray-500">Green Trips:</span> <strong>{latest.green_trips_pct?.toFixed(1)}%</strong></div>
            </div>
          </div>

          {latest.recommendations?.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <h3 className="font-semibold text-green-800 mb-2">Recommendations</h3>
              <ul className="space-y-1">
                {latest.recommendations.map((r, i) => <li key={i} className="text-sm text-green-700">• {r}</li>)}
              </ul>
            </div>
          )}
        </>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-800 mb-4">2026-2027 Sustainability Targets</h2>
        <div className="space-y-3">
          {targets.map(t => (
            <div key={t.metric} className="flex items-center justify-between py-2 border-b border-gray-50">
              <div>
                <div className="font-medium text-sm text-gray-900">{t.metric}</div>
                <div className="text-xs text-gray-500">Target: {t.target} {t.unit} by {t.deadline}</div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full bg-${t.category === 'carbon' ? 'red' : t.category === 'fleet' ? 'blue' : 'green'}-100 text-${t.category === 'carbon' ? 'red' : t.category === 'fleet' ? 'blue' : 'green'}-700`}>
                {t.category}
              </span>
            </div>
          ))}
        </div>
      </div>

      {history.length > 1 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Score History</h2>
          <div className="flex items-end gap-2 h-24">
            {history.slice(0,6).reverse().map((s, i) => {
              const height = `${s.overall_score}%`;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-gray-500">{s.overall_score}</span>
                  <div className="w-full bg-green-400 rounded-sm" style={{ height }} title={`${s.grade}: ${s.overall_score}`} />
                  <span className="text-xs text-gray-400">{new Date(s.score_date).toLocaleDateString('en',{month:'short'})}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
