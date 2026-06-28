import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../api/client';
import toast from 'react-hot-toast';

export default function RouteOptimization() {
  const [routes, setRoutes]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [optimizing, setOpt]    = useState(false);
  const [result, setResult]     = useState(null);
  const [search, setSearch]     = useState('');
  const [form, setForm]         = useState({ origin: '', destination: '', stops: '' });

  useEffect(() => {
    api.get('/ai/routes')
      .then(r => setRoutes(r.data))
      .catch(() => toast.error('Failed to load routes'))
      .finally(() => setLoading(false));
  }, []);

  function optimize() {
    if (!form.origin || !form.destination) return toast.error('Origin and destination required');
    setOpt(true);
    api.post('/ai/routes/optimize', { origin: form.origin, destination: form.destination, stops: form.stops.split(',').map(s => s.trim()).filter(Boolean) })
      .then(r => { setResult(r.data); toast.success('Route optimized by AI'); })
      .catch(() => toast.error('Optimization failed'))
      .finally(() => setOpt(false));
  }

  const filtered = routes.filter(r =>
    !search || r.route.toLowerCase().includes(search.toLowerCase()) || r.status.toLowerCase().includes(search.toLowerCase())
  );

  const statusColor = s => ({ 'Optimized': 'text-green-700 bg-green-100', 'Pending Review': 'text-yellow-700 bg-amber-100', 'Manual Override': 'text-blue-700 bg-blue-100' }[s] || 'text-gray-600 bg-gray-100');

  return (
    <div className="p-3 space-y-3">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0b8fd3] to-[#0066aa] rounded shadow text-white px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold flex items-center gap-2">🗺️ AI Route Optimization</h1>
          <p className="text-blue-100 text-[12px]">Traffic prediction, weather alerts, toll minimization, ETA accuracy</p>
        </div>
        <span className="bg-white/20 text-white text-[11px] font-bold px-2 py-1 rounded">AI Powered</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Optimizer Form */}
        <div className="bg-white rounded shadow-sm p-3 space-y-2">
          <h2 className="text-[13px] font-bold text-gray-700 border-b pb-1">🧠 Optimize New Route</h2>
          <div>
            <label className="text-[11px] font-semibold text-gray-600">Origin</label>
            <input className="w-full border border-gray-300 rounded px-2 py-1.5 text-[12px] mt-0.5" placeholder="e.g. Mumbai"
              value={form.origin} onChange={e => setForm(f => ({ ...f, origin: e.target.value }))} />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-gray-600">Destination</label>
            <input className="w-full border border-gray-300 rounded px-2 py-1.5 text-[12px] mt-0.5" placeholder="e.g. Pune"
              value={form.destination} onChange={e => setForm(f => ({ ...f, destination: e.target.value }))} />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-gray-600">Stops (comma separated)</label>
            <input className="w-full border border-gray-300 rounded px-2 py-1.5 text-[12px] mt-0.5" placeholder="Lonavala, Khopoli"
              value={form.stops} onChange={e => setForm(f => ({ ...f, stops: e.target.value }))} />
          </div>
          <button onClick={optimize} disabled={optimizing}
            className="w-full bg-[#0b8fd3] hover:bg-[#0066aa] text-white text-[12px] font-bold py-2 rounded transition-colors disabled:opacity-50">
            {optimizing ? 'Optimizing…' : '⚡ Optimize with AI'}
          </button>

          {result && (
            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-[11px] space-y-1">
              <p className="font-bold text-green-700">✅ Optimization Complete</p>
              <p>Original: <b>{result.original_distance_km} km</b> → Optimized: <b>{result.optimized_distance_km} km</b></p>
              <p>Fuel saved: <b>{result.fuel_saving_lt} L</b> | Time saved: <b>{result.time_saving_min} min</b></p>
              <p>Toll saving: <b>₹{result.toll_saving_rs.toLocaleString('en-IN')}</b></p>
              <p>Traffic: <b>{result.traffic_condition}</b></p>
              {result.weather_alert && <p className="text-amber-600">⚠️ {result.weather_alert}</p>}
              <p className="text-gray-500">ETA: {new Date(result.eta).toLocaleString('en-IN')}</p>
            </div>
          )}
        </div>

        {/* Savings Chart */}
        <div className="bg-white rounded shadow-sm p-3 lg:col-span-2">
          <h2 className="text-[13px] font-bold text-gray-700 border-b pb-1 mb-2">Fuel Savings by Route (%)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={routes}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="route" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 10 }} unit="%" />
              <Tooltip formatter={v => `${v}%`} />
              <Bar dataKey="fuel_savings_pct" name="Fuel Saving" fill="#0b8fd3" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Routes Table */}
      <div className="bg-white rounded shadow-sm">
        <div className="px-3 py-2 border-b flex items-center justify-between gap-2 flex-wrap">
          <h2 className="text-[13px] font-bold text-gray-700">All Routes ({filtered.length})</h2>
          <div className="flex items-center gap-2">
            <input className="border border-gray-300 rounded px-2 py-1 text-[12px] w-40"
              placeholder="Search route…" value={search} onChange={e => setSearch(e.target.value)} />
            <button className="bg-green-600 text-white text-[11px] font-bold px-3 py-1.5 rounded hover:bg-green-700">
              Export Excel
            </button>
          </div>
        </div>
        {loading ? (
          <div className="p-6 text-center text-gray-400 text-sm">Loading…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Route','Dist (km)','Vehicles','Avg Time','Fuel Saving','Toll Saving','ETA Accuracy','AI Suggestion','Status'].map(h => (
                    <th key={h} className="text-left px-3 py-2 font-semibold text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium text-blue-700">{r.route}</td>
                    <td className="px-3 py-2">{r.distance_km}</td>
                    <td className="px-3 py-2">{r.vehicles}</td>
                    <td className="px-3 py-2">{r.avg_time_hrs}h</td>
                    <td className="px-3 py-2 text-green-600 font-medium">{r.fuel_savings_pct}%</td>
                    <td className="px-3 py-2">₹{r.toll_savings.toLocaleString('en-IN')}</td>
                    <td className="px-3 py-2">{r.eta_accuracy}%</td>
                    <td className="px-3 py-2 text-[11px] text-gray-500 italic">{r.ai_suggestion}</td>
                    <td className="px-3 py-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColor(r.status)}`}>{r.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
