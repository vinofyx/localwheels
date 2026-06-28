import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import api from '../../api/client';
import toast from 'react-hot-toast';

export default function DemandForecasting() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState('monthly');

  useEffect(() => {
    api.get('/ai/forecast')
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load forecast data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-center text-gray-400">Loading forecast data…</div>;
  if (!data) return null;

  return (
    <div className="p-3 space-y-3">
      <div className="bg-gradient-to-r from-[#6366f1] to-[#4f46e5] rounded shadow text-white px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold">📈 AI Demand Forecasting</h1>
          <p className="text-indigo-100 text-[12px]">Shipment forecast, revenue prediction, vehicle requirements, seasonal analysis</p>
        </div>
        <span className="bg-white/20 text-white text-[11px] font-bold px-2 py-1 rounded">ML Powered</span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: 'Vehicles Needed Next Mo.', val: data.vehicles_needed_next_month, color: '#6366f1' },
          { label: 'Revenue Forecast',          val: `₹${(data.revenue_forecast_rs/10000000).toFixed(1)} Cr`, color: '#22c55e' },
          { label: 'Seasonal Peaks',            val: data.seasonal_peaks.length,                               color: '#f97316' },
          { label: 'AI Insights',               val: data.ai_insights.length,                                  color: '#ec4899' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded shadow-sm p-3 border-l-4" style={{ borderColor: s.color }}>
            <p className="text-xl font-bold text-gray-800">{s.val}</p>
            <p className="text-[10px] font-semibold text-gray-500 uppercase">{s.label}</p>
          </div>
        ))}
      </div>

      {/* AI Insights */}
      <div className="bg-white rounded shadow-sm p-3">
        <h2 className="text-[13px] font-bold text-gray-700 mb-2">🧠 AI Insights & Recommendations</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {data.ai_insights.map((insight, i) => (
            <div key={i} className="flex items-start gap-2 p-2 bg-indigo-50 rounded text-[12px]">
              <span className="text-indigo-500 font-bold">#{i+1}</span>
              <p className="text-gray-700">{insight}</p>
            </div>
          ))}
        </div>
        <div className="mt-2 p-2 bg-orange-50 rounded text-[11px]">
          <p className="font-bold text-orange-700">📅 Seasonal Peaks Identified:</p>
          <div className="flex flex-wrap gap-2 mt-1">
            {data.seasonal_peaks.map(p => (
              <span key={p} className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-medium">{p}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded shadow-sm">
        <div className="border-b px-3 pt-2 flex gap-3">
          {[['monthly','📅 Monthly Trend'],['branch','🏢 Branch Demand']].map(([t,l]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`text-[12px] font-bold pb-2 px-1 border-b-2 ${tab===t ? 'border-indigo-500 text-indigo-700' : 'border-transparent text-gray-500'}`}>
              {l}
            </button>
          ))}
        </div>

        {tab === 'monthly' && (
          <div className="p-3 space-y-4">
            <div>
              <h3 className="text-[12px] font-bold text-gray-700 mb-2">Actual vs AI Forecast — Monthly Shipments</h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={data.monthly_trend}>
                  <defs>
                    <linearGradient id="actual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="forecast" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="actual"   stroke="#6366f1" fill="url(#actual)"   name="Actual"   strokeWidth={2} />
                  <Area type="monotone" dataKey="forecast" stroke="#f97316" fill="url(#forecast)" name="Forecast" strokeWidth={2} strokeDasharray="5 3" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div>
              <h3 className="text-[12px] font-bold text-gray-700 mb-2">Vehicles Required — Monthly Projection</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={data.monthly_trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="vehicles_needed" name="Vehicles Required" fill="#6366f1" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead className="bg-gray-50 border-b border-t">
                  <tr>
                    {['Month','Actual Shipments','Forecast','Revenue (₹)','Vehicles Needed'].map(h => (
                      <th key={h} className="text-left px-3 py-2 font-semibold text-gray-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.monthly_trend.map(m => (
                    <tr key={m.month} className="hover:bg-gray-50">
                      <td className="px-3 py-1.5 font-bold text-indigo-700">{m.month}</td>
                      <td className="px-3 py-1.5">{m.actual.toLocaleString('en-IN')}</td>
                      <td className="px-3 py-1.5 text-orange-600">{m.forecast.toLocaleString('en-IN')}</td>
                      <td className="px-3 py-1.5">₹{(m.revenue/100000).toFixed(1)} L</td>
                      <td className="px-3 py-1.5">{m.vehicles_needed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'branch' && (
          <div className="p-3">
            <h3 className="text-[12px] font-bold text-gray-700 mb-2">Branch-wise Demand Forecast</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.branch_demand}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="branch" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="current"  name="Current"  fill="#6366f1" radius={[3,3,0,0]} />
                <Bar dataKey="forecast" name="Forecast" fill="#f97316" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead className="bg-gray-50 border-b border-t">
                  <tr>
                    {['Branch','Current Shipments','Forecast','Growth %'].map(h => (
                      <th key={h} className="text-left px-3 py-2 font-semibold text-gray-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.branch_demand.map(b => (
                    <tr key={b.branch} className="hover:bg-gray-50">
                      <td className="px-3 py-1.5 font-bold text-indigo-700">{b.branch}</td>
                      <td className="px-3 py-1.5">{b.current.toLocaleString('en-IN')}</td>
                      <td className="px-3 py-1.5 text-orange-600">{b.forecast.toLocaleString('en-IN')}</td>
                      <td className="px-3 py-1.5">
                        <span className={b.growth_pct >= 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                          {b.growth_pct >= 0 ? '+' : ''}{b.growth_pct}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
