import { useState, useEffect } from 'react';

const _BASE = import.meta.env.VITE_API_URL || '/api';
const h = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}`, 'Content-Type': 'application/json' });

export default function DemandPlanning() {
  const [forecasts, setForecasts] = useState([]);
  const [aiForecast, setAiForecast] = useState(null);
  const [aiLoading, setAiLoading]   = useState(false);
  const [loading, setLoading]       = useState(false);
  const [form, setForm] = useState({ period_type: 'monthly', region: 'All', horizon_months: 3 });

  const load = async () => {
    const res = await fetch(`${_BASE}/demand`, { headers: h() });
    if (res.ok) { const d = await res.json(); setForecasts(d.data.forecasts || []); }
  };

  useEffect(() => { load(); }, []);

  const generate = async () => {
    setLoading(true);
    try {
      await fetch(`${_BASE}/demand/forecast`, { method: 'POST', headers: h(), body: JSON.stringify(form) });
      load();
    } finally { setLoading(false); }
  };

  const aiGen = async () => {
    setAiLoading(true);
    try {
      const res = await fetch(`${_BASE}/demand/ai-forecast`, { method: 'POST', headers: h(), body: JSON.stringify({ horizon_months: form.horizon_months }) });
      if (res.ok) { const d = await res.json(); setAiForecast(d.data.forecast); }
    } finally { setAiLoading(false); }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Demand Planning</h1>
          <p className="text-gray-500 text-sm mt-1">AI-powered demand forecasting and planning</p>
        </div>
        <button onClick={aiGen} disabled={aiLoading} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm">
          {aiLoading ? '...' : '✨ AI Forecast'}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Generate Forecast</h2>
        <div className="flex items-end gap-3 flex-wrap">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Period</label>
            <select value={form.period_type} onChange={e => setForm(f => ({...f, period_type: e.target.value}))} className="border rounded-lg px-3 py-2 text-sm">
              {['weekly','monthly','quarterly','annual'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Region</label>
            <input value={form.region} onChange={e => setForm(f => ({...f, region: e.target.value}))} className="border rounded-lg px-3 py-2 text-sm w-32" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Horizon (months)</label>
            <input type="number" value={form.horizon_months} onChange={e => setForm(f => ({...f, horizon_months: +e.target.value}))} className="border rounded-lg px-3 py-2 text-sm w-20" />
          </div>
          <button onClick={generate} disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">
            {loading ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </div>

      {aiForecast && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-purple-800">AI Demand Forecast</h3>
            <div className="flex items-center gap-3 text-sm">
              <span className={`text-${aiForecast.trend === 'up' ? 'green' : aiForecast.trend === 'down' ? 'red' : 'gray'}-600 font-medium`}>
                {aiForecast.trend === 'up' ? '↑' : aiForecast.trend === 'down' ? '↓' : '→'} {aiForecast.growth_pct}% growth
              </span>
              <span className="text-gray-500">Conf: {aiForecast.confidence_pct}%</span>
            </div>
          </div>
          {aiForecast.forecast_units?.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-3">
              {aiForecast.forecast_units.map((m, i) => (
                <div key={i} className="bg-white rounded-lg p-3 text-sm">
                  <div className="font-medium text-gray-900">{m.month}</div>
                  <div className="text-blue-600">{m.units} units</div>
                  <div className="text-green-600">₹{(m.revenue/1000).toFixed(0)}K</div>
                </div>
              ))}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4 text-sm">
            {aiForecast.key_drivers?.length > 0 && (
              <div><p className="text-xs font-semibold text-gray-700 mb-1">Key Drivers</p>
                {aiForecast.key_drivers.map((d,i) => <p key={i} className="text-xs text-gray-600">• {d}</p>)}</div>
            )}
            {aiForecast.risks?.length > 0 && (
              <div><p className="text-xs font-semibold text-red-700 mb-1">Risks</p>
                {aiForecast.risks.map((r,i) => <p key={i} className="text-xs text-gray-600">• {r}</p>)}</div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {forecasts.length === 0 && <div className="bg-white rounded-xl border p-8 text-center text-gray-400">No forecasts yet. Generate one above.</div>}
        {forecasts.map(fc => (
          <div key={fc._id} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-gray-900 capitalize">{fc.period_type} Forecast</h3>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{fc.region}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${fc.trend_direction === 'up' ? 'bg-green-100 text-green-700' : fc.trend_direction === 'down' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                    {fc.trend_direction === 'up' ? '↑' : fc.trend_direction === 'down' ? '↓' : '→'} {fc.growth_pct}%
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-4 text-xs text-gray-500">
                  <div>Forecasted: <strong>{fc.forecasted_units} units</strong></div>
                  <div>Revenue: <strong>₹{(fc.forecasted_revenue/1000).toFixed(0)}K</strong></div>
                  <div>Confidence: <strong>{fc.confidence_pct}%</strong></div>
                </div>
              </div>
              <div className="text-xs text-gray-400">{new Date(fc.createdAt).toLocaleDateString()}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
