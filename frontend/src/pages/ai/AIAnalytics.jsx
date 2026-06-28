import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import api from '../../api/client';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'overview',   label: '📊 Overview' },
  { id: 'fleet',      label: '🚛 Fleet' },
  { id: 'drivers',    label: '👤 Drivers' },
  { id: 'logistics',  label: '📦 Logistics' },
  { id: 'fuel',       label: '⛽ Fuel' },
];

const DELAY_COLORS = ['#ef4444','#f97316','#f59e0b','#6366f1','#14b8a6','#8b5cf6'];

export default function AIAnalytics() {
  const [data, setData]     = useState(null);
  const [fuel, setFuel]     = useState(null);
  const [loading, setLoad]  = useState(true);
  const [tab, setTab]       = useState('overview');

  useEffect(() => {
    Promise.all([
      api.get('/ai/analytics'),
      api.get('/ai/fuel/analytics'),
    ])
      .then(([a, f]) => { setData(a.data); setFuel(f.data); })
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoad(false));
  }, []);

  if (loading) return (
    <div className="p-6 flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!data) return null;

  return (
    <div className="p-3 space-y-3">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] rounded shadow text-white px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold">📊 AI Analytics Dashboard</h1>
          <p className="text-indigo-100 text-[12px]">30-day performance metrics across fleet, drivers, logistics and fuel</p>
        </div>
        <span className="bg-white/20 text-white text-[11px] font-bold px-2 py-1 rounded">10 Charts</span>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded shadow-sm">
        <div className="border-b px-3 pt-2 flex gap-1 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`text-[12px] font-bold pb-2 px-3 border-b-2 whitespace-nowrap ${tab === t.id ? 'border-indigo-500 text-indigo-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-4 space-y-6">

          {/* ── OVERVIEW ─────────────────────────────────────────────── */}
          {tab === 'overview' && (
            <>
              {/* Chart 1 — Revenue vs Cost Trend */}
              <div>
                <h3 className="text-[13px] font-bold text-gray-700 mb-3">Revenue vs Cost — 30 Day Trend (₹)</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={data.days}>
                    <defs>
                      <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="gCost" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                    <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={d => d.slice(5)} interval={4}/>
                    <YAxis tick={{ fontSize: 9 }} tickFormatter={v => `₹${(v/100000).toFixed(1)}L`}/>
                    <Tooltip formatter={v => `₹${v.toLocaleString('en-IN')}`}/>
                    <Legend wrapperStyle={{ fontSize: 11 }}/>
                    <Area type="monotone" dataKey="revenue" stroke="#22c55e" fill="url(#gRev)" name="Revenue" strokeWidth={2}/>
                    <Area type="monotone" dataKey="cost"    stroke="#ef4444" fill="url(#gCost)" name="Cost"    strokeWidth={2}/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Chart 2 — On-Time Delivery % */}
              <div>
                <h3 className="text-[13px] font-bold text-gray-700 mb-3">On-Time Delivery % — Daily</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={data.days}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                    <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={d => d.slice(5)} interval={4}/>
                    <YAxis domain={[60, 100]} tick={{ fontSize: 9 }} tickFormatter={v => `${v}%`}/>
                    <Tooltip formatter={v => `${v}%`}/>
                    <Line type="monotone" dataKey="on_time_pct" stroke="#6366f1" strokeWidth={2} dot={false} name="On-Time %"/>
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          )}

          {/* ── FLEET ────────────────────────────────────────────────── */}
          {tab === 'fleet' && (
            <>
              {/* Chart 3 — Fleet Utilization */}
              <div>
                <h3 className="text-[13px] font-bold text-gray-700 mb-3">Fleet Utilization % — By Vehicle</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={data.fleet_utilization} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false}/>
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 9 }} tickFormatter={v => `${v}%`}/>
                    <YAxis type="category" dataKey="vehicle" tick={{ fontSize: 9 }} width={90}/>
                    <Tooltip formatter={v => `${v}%`}/>
                    <Bar dataKey="utilization_pct" name="Utilization %" fill="#6366f1" radius={[0,3,3,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Chart 4 — Maintenance Costs */}
              <div>
                <h3 className="text-[13px] font-bold text-gray-700 mb-3">Maintenance Cost — This Month vs Last Month (₹)</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.maintenance_costs}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                    <XAxis dataKey="vehicle" tick={{ fontSize: 8 }}/>
                    <YAxis tick={{ fontSize: 9 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`}/>
                    <Tooltip formatter={v => `₹${v.toLocaleString('en-IN')}`}/>
                    <Legend wrapperStyle={{ fontSize: 11 }}/>
                    <Bar dataKey="this_month" name="This Month" fill="#f97316" radius={[3,3,0,0]}/>
                    <Bar dataKey="prev_month" name="Prev Month" fill="#fcd34d" radius={[3,3,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}

          {/* ── DRIVERS ──────────────────────────────────────────────── */}
          {tab === 'drivers' && (
            <>
              {/* Chart 5 — Driver Performance */}
              <div>
                <h3 className="text-[13px] font-bold text-gray-700 mb-3">Driver Performance — Safety Score & On-Time %</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={data.driver_rankings}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                    <XAxis dataKey="driver" tick={{ fontSize: 8 }} angle={-20} textAnchor="end" height={40}/>
                    <YAxis domain={[0, 100]} tick={{ fontSize: 9 }}/>
                    <Tooltip/>
                    <Legend wrapperStyle={{ fontSize: 11 }}/>
                    <Bar dataKey="safety_score"  name="Safety Score"  fill="#22c55e" radius={[3,3,0,0]}/>
                    <Bar dataKey="on_time_pct"   name="On-Time %"     fill="#3b82f6" radius={[3,3,0,0]}/>
                    <Bar dataKey="fuel_efficiency" name="Fuel Efficiency %" fill="#f59e0b" radius={[3,3,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Chart 6 — Driver Trips Table */}
              <div>
                <h3 className="text-[13px] font-bold text-gray-700 mb-3">Driver Trips & Rating — This Month</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-[12px]">
                    <thead className="bg-indigo-50 border-b">
                      <tr>
                        {['#','Driver','Trips','On-Time %','Safety Score','Fuel Eff %','Rating'].map(h => (
                          <th key={h} className="text-left px-3 py-2 font-semibold text-indigo-700">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {[...data.driver_rankings].sort((a, b) => b.safety_score - a.safety_score).map((d, i) => (
                        <tr key={d.driver} className="hover:bg-gray-50">
                          <td className="px-3 py-2 font-bold text-gray-400">{i + 1}</td>
                          <td className="px-3 py-2 font-semibold text-gray-800">{d.driver}</td>
                          <td className="px-3 py-2">{d.trips_month}</td>
                          <td className="px-3 py-2">
                            <span className={d.on_time_pct >= 90 ? 'text-green-600 font-bold' : d.on_time_pct >= 80 ? 'text-yellow-600 font-bold' : 'text-red-600 font-bold'}>
                              {d.on_time_pct}%
                            </span>
                          </td>
                          <td className="px-3 py-2">{d.safety_score}</td>
                          <td className="px-3 py-2">{d.fuel_efficiency}%</td>
                          <td className="px-3 py-2">
                            <span className="font-bold text-yellow-600">{'⭐'.repeat(Math.round(d.rating))} {d.rating}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ── LOGISTICS ────────────────────────────────────────────── */}
          {tab === 'logistics' && (
            <>
              {/* Chart 7 — Delay Analysis PieChart */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-[13px] font-bold text-gray-700 mb-3">Delay Root-Cause Analysis</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={data.delay_analysis} dataKey="count" nameKey="reason" cx="50%" cy="50%" outerRadius={80} label={({ reason, percent }) => `${reason}: ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {data.delay_analysis.map((_, i) => (
                          <Cell key={i} fill={DELAY_COLORS[i % DELAY_COLORS.length]}/>
                        ))}
                      </Pie>
                      <Tooltip/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Chart 8 — Branch Performance */}
                <div>
                  <h3 className="text-[13px] font-bold text-gray-700 mb-3">Branch Performance — Revenue & Profit %</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={data.branch_performance}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                      <XAxis dataKey="branch" tick={{ fontSize: 9 }} angle={-15} textAnchor="end" height={36}/>
                      <YAxis yAxisId="left" tick={{ fontSize: 9 }} tickFormatter={v => `${(v/10000000).toFixed(1)}Cr`}/>
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9 }} tickFormatter={v => `${v}%`}/>
                      <Tooltip/>
                      <Legend wrapperStyle={{ fontSize: 11 }}/>
                      <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill="#6366f1" radius={[3,3,0,0]}/>
                      <Bar yAxisId="right" dataKey="profit_pct" name="Profit %" fill="#22c55e" radius={[3,3,0,0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 9 — Trips per Day */}
              <div>
                <h3 className="text-[13px] font-bold text-gray-700 mb-3">Daily Trip Count — 30 Days</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={data.days}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                    <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={d => d.slice(5)} interval={4}/>
                    <YAxis tick={{ fontSize: 9 }}/>
                    <Tooltip/>
                    <Bar dataKey="trips" name="Trips" fill="#14b8a6" radius={[2,2,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}

          {/* ── FUEL ─────────────────────────────────────────────────── */}
          {tab === 'fuel' && fuel && (
            <>
              {/* Chart 10 — Fuel Consumption Trend */}
              <div>
                <h3 className="text-[13px] font-bold text-gray-700 mb-3">Fuel Consumption Trend — 30 Days (Litres)</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={fuel.trend}>
                    <defs>
                      <linearGradient id="gFuel" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                    <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={d => d.slice(5)} interval={4}/>
                    <YAxis tick={{ fontSize: 9 }}/>
                    <Tooltip/>
                    <Area type="monotone" dataKey="lt" stroke="#f97316" fill="url(#gFuel)" name="Litres" strokeWidth={2}/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Chart — Mileage by Vehicle */}
              <div>
                <h3 className="text-[13px] font-bold text-gray-700 mb-3">Mileage (km/l) — By Vehicle This Month</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={fuel.by_vehicle}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                    <XAxis dataKey="vehicle" tick={{ fontSize: 8 }} angle={-20} textAnchor="end" height={40}/>
                    <YAxis domain={[0, 12]} tick={{ fontSize: 9 }}/>
                    <Tooltip/>
                    <Bar dataKey="kmpl" name="km/l" fill="#8b5cf6" radius={[3,3,0,0]}
                         label={{ position: 'top', fontSize: 9, formatter: v => `${v}` }}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
