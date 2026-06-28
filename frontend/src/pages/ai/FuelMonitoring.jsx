import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../../api/client';
import toast from 'react-hot-toast';

const STATUS_COLOR = { Normal: 'bg-green-100 text-green-700', 'Under Average': 'bg-yellow-100 text-yellow-700', 'Theft Suspected': 'bg-red-100 text-red-700' };

export default function FuelMonitoring() {
  const [vehicles, setVehicles] = useState([]);
  const [trend, setTrend]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState('All');
  const [tab, setTab]           = useState('vehicles');

  useEffect(() => {
    Promise.all([api.get('/ai/fuel'), api.get('/ai/fuel/analytics')])
      .then(([r1, r2]) => { setVehicles(r1.data); setTrend(r2.data.trend); })
      .catch(() => toast.error('Failed to load fuel data'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = vehicles.filter(v => {
    const ms = !search || v.vehicle_no.includes(search.toUpperCase()) || v.driver.toLowerCase().includes(search.toLowerCase());
    const mf = filter === 'All' || v.status === filter;
    return ms && mf;
  });

  const totalCost = vehicles.reduce((s,v) => s + v.total_cost_today, 0);
  const avgMileage = vehicles.length ? (vehicles.reduce((s,v) => s + v.mileage_kmpl, 0) / vehicles.length).toFixed(1) : 0;
  const theftAlerts = vehicles.filter(v => v.theft_alert).length;

  return (
    <div className="p-3 space-y-3">
      <div className="bg-gradient-to-r from-[#f97316] to-[#ea580c] rounded shadow text-white px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold">⛽ Fuel Monitoring</h1>
          <p className="text-orange-100 text-[12px]">Fuel fill history, mileage tracking, theft detection, driver-wise analytics</p>
        </div>
        <div className="text-right text-[12px] text-orange-100">
          <p>Today's Cost</p>
          <p className="text-lg font-bold text-white">₹{totalCost.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: 'Vehicles Monitored', val: vehicles.length,                                  color: '#f97316' },
          { label: 'Avg Mileage (kmpl)', val: `${avgMileage} km/l`,                             color: '#22c55e' },
          { label: 'Fuel Cost Today',    val: `₹${(totalCost/1000).toFixed(1)}k`,               color: '#0b8fd3' },
          { label: 'Theft Alerts',       val: theftAlerts,                                       color: theftAlerts > 0 ? '#ef4444' : '#22c55e' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded shadow-sm p-3 border-l-4" style={{ borderColor: s.color }}>
            <p className="text-xl font-bold text-gray-800">{s.val}</p>
            <p className="text-[10px] font-semibold text-gray-500 uppercase">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded shadow-sm">
        <div className="border-b px-3 pt-2 flex gap-3">
          {[['vehicles','🚛 Vehicle-wise'],['trend','📈 30-Day Trend']].map(([t,l]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`text-[12px] font-bold pb-2 px-1 border-b-2 ${tab===t ? 'border-orange-500 text-orange-700' : 'border-transparent text-gray-500'}`}>
              {l}
            </button>
          ))}
        </div>

        {tab === 'vehicles' && (
          <div>
            <div className="px-3 py-2 border-b flex items-center justify-between gap-2 flex-wrap">
              <h2 className="text-[13px] font-bold text-gray-700">Vehicle Fuel Register ({filtered.length})</h2>
              <div className="flex gap-2 flex-wrap items-center">
                <input className="border border-gray-300 rounded px-2 py-1 text-[11px] w-32" placeholder="Vehicle / Driver…"
                  value={search} onChange={e => setSearch(e.target.value)} />
                {['All','Normal','Under Average','Theft Suspected'].map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${filter===f ? 'bg-[#f97316] text-white border-[#f97316]' : 'text-gray-600 border-gray-300'}`}>{f}</button>
                ))}
                <button className="text-[11px] font-bold px-3 py-1.5 bg-green-600 text-white rounded">Export</button>
              </div>
            </div>
            {loading ? <div className="p-6 text-center text-gray-400">Loading…</div> : (
              <div className="overflow-x-auto">
                <table className="w-full text-[12px]">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      {['Vehicle','Driver','Fuel Today (L)','Mileage','Expected','Variance','Theft Alert','Last Fill','Last Fill Date','Cost Today','Status'].map(h => (
                        <th key={h} className="text-left px-2 py-2 font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.map(v => (
                      <tr key={v.vehicle_no} className="hover:bg-gray-50">
                        <td className="px-2 py-1.5 font-bold text-orange-700">{v.vehicle_no}</td>
                        <td className="px-2 py-1.5">{v.driver}</td>
                        <td className="px-2 py-1.5">{v.fuel_today_lt} L</td>
                        <td className="px-2 py-1.5">{v.mileage_kmpl} km/l</td>
                        <td className="px-2 py-1.5 text-gray-500">{v.expected_kmpl} km/l</td>
                        <td className={`px-2 py-1.5 font-medium ${v.variance_pct < -5 ? 'text-red-600' : 'text-green-600'}`}>
                          {v.variance_pct > 0 ? '+' : ''}{v.variance_pct}%
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          {v.theft_alert ? <span className="text-red-600 font-bold text-sm">⚠️ YES</span> : <span className="text-green-600">—</span>}
                        </td>
                        <td className="px-2 py-1.5">{v.last_fill_lt} L</td>
                        <td className="px-2 py-1.5">{v.last_fill_date}</td>
                        <td className="px-2 py-1.5 font-medium text-orange-700">₹{v.total_cost_today.toLocaleString('en-IN')}</td>
                        <td className="px-2 py-1.5">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${STATUS_COLOR[v.status]}`}>{v.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'trend' && (
          <div className="p-3 space-y-3">
            <h3 className="text-[12px] font-bold text-gray-700">30-Day Fuel Consumption & Cost Trend</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trend.slice(-14)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={d => d.slice(5)} />
                <YAxis yAxisId="left" tick={{ fontSize: 10 }} unit=" L" />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line yAxisId="left"  type="monotone" dataKey="lt"     stroke="#f97316" name="Litres" strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="cost_rs" stroke="#ef4444" name="Cost"  strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={trend.slice(-14)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} unit=" km/l" domain={[5, 10]} />
                <Tooltip formatter={v => `${v} km/l`} />
                <Bar dataKey="kmpl" name="Mileage (km/l)" fill="#22c55e" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
