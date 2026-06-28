import React, { useState, useEffect } from 'react';
import { RadialBarChart, RadialBar, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../api/client';
import toast from 'react-hot-toast';

const STATUS_COLORS = { Good: 'bg-green-100 text-green-700', Warning: 'bg-yellow-100 text-yellow-700', Critical: 'bg-red-100 text-red-700', 'In Service': 'bg-blue-100 text-blue-700' };
const HEALTH_COLOR  = s => ({ Good: '#22c55e', Warning: '#f59e0b', Critical: '#ef4444', 'In Service': '#0b8fd3' }[s] || '#94a3b8');

export default function FleetMaintenance() {
  const [fleet, setFleet]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState('All');
  const [selected, setSel]    = useState(null);

  useEffect(() => {
    api.get('/ai/maintenance')
      .then(r => setFleet(r.data))
      .catch(() => toast.error('Failed to load maintenance data'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = fleet.filter(v => {
    const ms = !search || v.vehicle_no.includes(search.toUpperCase());
    const mf = filter === 'All' || v.status === filter;
    return ms && mf;
  });

  const avgHealth = fleet.length ? (fleet.reduce((s,v)=>s+v.health_score,0)/fleet.length).toFixed(1) : 0;

  return (
    <div className="p-3 space-y-3">
      <div className="bg-gradient-to-r from-[#ef4444] to-[#dc2626] rounded shadow text-white px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold">🔧 Fleet Maintenance AI</h1>
          <p className="text-red-100 text-[12px]">Predictive maintenance, tyre/oil/battery alerts, downtime prediction</p>
        </div>
        <div className="text-right text-[12px] text-red-100">
          <p>Fleet Health Score</p>
          <p className="text-2xl font-bold text-white">{avgHealth}%</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: 'Good',       val: fleet.filter(v=>v.status==='Good').length,        color: '#22c55e' },
          { label: 'Warning',    val: fleet.filter(v=>v.status==='Warning').length,      color: '#f59e0b' },
          { label: 'Critical',   val: fleet.filter(v=>v.status==='Critical').length,     color: '#ef4444' },
          { label: 'In Service', val: fleet.filter(v=>v.status==='In Service').length,   color: '#0b8fd3' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded shadow-sm p-3 border-l-4" style={{ borderColor: s.color }}>
            <p className="text-xl font-bold text-gray-800">{s.val}</p>
            <p className="text-[10px] font-semibold text-gray-500 uppercase">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Health Chart */}
        <div className="bg-white rounded shadow-sm p-3">
          <h2 className="text-[13px] font-bold text-gray-700 border-b pb-1 mb-2">Vehicle Health Scores</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={fleet.slice(0, 6)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="vehicle_no" tick={{ fontSize: 9 }} width={80} />
              <Tooltip formatter={v => `${v}%`} />
              <Bar dataKey="health_score" name="Health %" fill="#ef4444" radius={[0,3,3,0]}
                label={{ position: 'right', style: { fontSize: 9 }, formatter: v => `${v}%` }} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Table */}
        <div className="bg-white rounded shadow-sm lg:col-span-2">
          <div className="px-3 py-2 border-b flex items-center justify-between gap-2 flex-wrap">
            <h2 className="text-[13px] font-bold text-gray-700">Fleet Maintenance Register ({filtered.length})</h2>
            <div className="flex gap-2 flex-wrap items-center">
              <input className="border border-gray-300 rounded px-2 py-1 text-[11px] w-28" placeholder="Vehicle No…"
                value={search} onChange={e => setSearch(e.target.value)} />
              {['All','Good','Warning','Critical','In Service'].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${filter===f ? 'bg-[#ef4444] text-white border-[#ef4444]' : 'text-gray-600 border-gray-300'}`}>{f}</button>
              ))}
              <button className="text-[11px] font-bold px-3 py-1.5 bg-green-600 text-white rounded">Export</button>
            </div>
          </div>
          {loading ? <div className="p-6 text-center text-gray-400">Loading…</div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {['Vehicle','Health%','Next Service','Tyre%','Oil KM','Battery V','Engine°C','Alerts','Downtime Risk','AI Prediction','Status'].map(h => (
                      <th key={h} className="text-left px-2 py-2 font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map(v => (
                    <tr key={v.vehicle_no} onClick={() => setSel(v)}
                      className={`hover:bg-gray-50 cursor-pointer ${selected?.vehicle_no===v.vehicle_no?'bg-red-50':''}`}>
                      <td className="px-2 py-1.5 font-bold text-red-700">{v.vehicle_no}</td>
                      <td className="px-2 py-1.5">
                        <div className="flex items-center gap-1">
                          <div className="w-10 bg-gray-200 rounded-full h-1.5">
                            <div className="h-1.5 rounded-full" style={{ width:`${v.health_score}%`, background: HEALTH_COLOR(v.status) }} />
                          </div>
                          <span>{v.health_score}%</span>
                        </div>
                      </td>
                      <td className="px-2 py-1.5 text-[11px]">{v.next_service}</td>
                      <td className="px-2 py-1.5">{v.tyre_pct}%</td>
                      <td className="px-2 py-1.5">{v.oil_km_left.toLocaleString('en-IN')}</td>
                      <td className="px-2 py-1.5 text-[11px]">{v.battery_v}V</td>
                      <td className="px-2 py-1.5">{v.engine_temp}°C</td>
                      <td className="px-2 py-1.5">
                        {v.alerts > 0 ? <span className="text-red-600 font-bold">⚠️ {v.alerts}</span> : <span className="text-green-600">—</span>}
                      </td>
                      <td className="px-2 py-1.5 text-orange-600 font-medium">{v.downtime_risk_pct}%</td>
                      <td className="px-2 py-1.5 text-[11px] text-gray-500 italic">{v.ai_prediction}</td>
                      <td className="px-2 py-1.5">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${STATUS_COLORS[v.status]}`}>{v.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Detail */}
      {selected && (
        <div className="bg-white rounded shadow-sm p-3">
          <h2 className="text-[13px] font-bold text-gray-700 border-b pb-1 mb-2">
            Vehicle Detail — {selected.vehicle_no}
            <span className={`ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[selected.status]}`}>{selected.status}</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 text-[12px]">
            {[
              ['Health Score',  `${selected.health_score}%`],
              ['Next Service',   selected.next_service],
              ['Last Service',   selected.last_service],
              ['Tyre Condition', `${selected.tyre_pct}%`],
              ['Oil Life',      `${selected.oil_km_left.toLocaleString('en-IN')} km`],
              ['Battery',       `${selected.battery_v}V`],
              ['Engine Temp',   `${selected.engine_temp}°C`],
              ['Downtime Risk', `${selected.downtime_risk_pct}%`],
              ['Active Alerts', selected.alerts],
              ['AI Prediction', selected.ai_prediction],
            ].map(([k,v]) => (
              <div key={k} className="bg-gray-50 rounded p-2">
                <p className="text-[10px] text-gray-400 uppercase font-semibold">{k}</p>
                <p className="font-medium text-gray-800 mt-0.5 text-[11px]">{v}</p>
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-2 flex-wrap">
            <button onClick={() => { toast.success('Service scheduled'); setSel(null); }}
              className="text-[11px] font-bold px-3 py-1.5 bg-[#ef4444] text-white rounded">📅 Schedule Service</button>
            <button className="text-[11px] font-bold px-3 py-1.5 bg-[#0b8fd3] text-white rounded">📄 Service History</button>
            <button className="text-[11px] font-bold px-3 py-1.5 bg-orange-500 text-white rounded">🔔 Alert Driver</button>
            <button onClick={() => setSel(null)} className="text-[11px] font-bold px-3 py-1.5 bg-gray-200 text-gray-700 rounded">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
