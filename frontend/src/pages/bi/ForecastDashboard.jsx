import { useState, useEffect } from 'react';
import api from '../../api/client';

const _BASE = import.meta.env.VITE_API_URL || '/api';

const TREND_COLOR = { up: 'text-green-600', down: 'text-red-600', stable: 'text-gray-500' };
const TREND_ICON = { up: '↑', down: '↓', stable: '→' };

function MiniBar({ values, color = 'bg-indigo-400' }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-0.5 h-12">
      {values.map((v, i) => (
        <div key={i} className={`flex-1 rounded-sm ${color}`} style={{ height: `${Math.round((v / max) * 100)}%`, minHeight: v > 0 ? '4px' : '0' }} />
      ))}
    </div>
  );
}

export default function ForecastDashboard() {
  const [all, setAll] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`${_BASE}/forecast/all`),
      api.get(`${_BASE}/forecast/revenue`),
    ])
      .then(([a, r]) => { setAll(a.data); setRevenue(r.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n) => n ? (n >= 100000 ? '₹' + (n/100000).toFixed(1) + 'L' : n >= 1000 ? '₹' + (n/1000).toFixed(0) + 'K' : '₹' + n) : '₹0';

  if (loading) return <div className="p-8 text-center text-gray-400">Loading forecasts...</div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Forecast Engine</h1>
        <p className="text-sm text-gray-500 mt-0.5">AI-powered business predictions based on historical trends</p>
      </div>

      {/* Revenue Forecast */}
      {all && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold text-gray-700">Revenue Forecast — Next Month</h2>
              <span className={`text-sm font-bold ${TREND_COLOR[all.revenue?.trend]}`}>
                {TREND_ICON[all.revenue?.trend]} {all.revenue?.change_pct > 0 ? '+' : ''}{all.revenue?.change_pct}%
              </span>
            </div>
            <div className="text-3xl font-bold text-indigo-700 mt-2">{fmt(all.revenue?.predicted)}</div>
            {revenue && (
              <>
                <div className="text-xs text-gray-400 mt-0.5">Range: {fmt(revenue.lower_bound)} – {fmt(revenue.upper_bound)}</div>
                <div className="mt-3">
                  <MiniBar values={all.revenue?.history || []} color="bg-indigo-400" />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>6 months ago</span><span>Now</span>
                  </div>
                </div>
                {revenue.ai_explanation && (
                  <div className="mt-3 text-xs text-gray-600 bg-indigo-50 rounded-lg p-3">{revenue.ai_explanation}</div>
                )}
              </>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold text-gray-700">Shipment Volume Forecast — Next Month</h2>
              <span className={`text-sm font-bold ${TREND_COLOR[all.shipments?.trend]}`}>
                {TREND_ICON[all.shipments?.trend]} {all.shipments?.change_pct > 0 ? '+' : ''}{all.shipments?.change_pct}%
              </span>
            </div>
            <div className="text-3xl font-bold text-green-700 mt-2">{all.shipments?.predicted?.toLocaleString()} <span className="text-base font-normal text-gray-500">shipments</span></div>
            <div className="mt-3">
              <MiniBar values={all.shipments?.history || []} color="bg-green-400" />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>6 months ago</span><span>Now</span>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="bg-green-50 rounded-lg p-2 text-center">
                <div className="text-xs text-gray-500">Lower Bound</div>
                <div className="text-sm font-bold text-green-700">{Math.round((all.shipments?.predicted || 0) * 0.9)}</div>
              </div>
              <div className="bg-green-50 rounded-lg p-2 text-center">
                <div className="text-xs text-gray-500">Upper Bound</div>
                <div className="text-sm font-bold text-green-700">{Math.round((all.shipments?.predicted || 0) * 1.1)}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Historical Months Table */}
      {all?.months && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Historical Data (6 Months)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 text-xs text-gray-500 font-medium">Month</th>
                  <th className="text-right py-2 text-xs text-gray-500 font-medium">Revenue</th>
                  <th className="text-right py-2 text-xs text-gray-500 font-medium">Shipments</th>
                </tr>
              </thead>
              <tbody>
                {all.months.map((month, i) => (
                  <tr key={month} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 text-gray-700">{month}</td>
                    <td className="py-2 text-right text-gray-700">{fmt(all.revenue?.history?.[i] || 0)}</td>
                    <td className="py-2 text-right text-gray-700">{(all.shipments?.history?.[i] || 0).toLocaleString()}</td>
                  </tr>
                ))}
                <tr className="bg-indigo-50 font-semibold">
                  <td className="py-2 text-indigo-700">Next Month (Forecast)</td>
                  <td className="py-2 text-right text-indigo-700">{fmt(all.revenue?.predicted)}</td>
                  <td className="py-2 text-right text-indigo-700">{all.shipments?.predicted?.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Forecast Types Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: 'Fleet Demand', icon: '🚛', note: 'Based on shipment forecast' },
          { label: 'Driver Demand', icon: '👤', note: 'Correlates with shipment volume' },
          { label: 'Fuel Cost', icon: '⛽', note: 'Based on fleet utilization trend' },
          { label: 'Maintenance Cost', icon: '🔧', note: 'Based on fleet age & mileage' },
          { label: 'Complaint Volume', icon: '📋', note: 'Based on shipment trend' },
          { label: 'Sales Pipeline', icon: '💼', note: 'Based on CRM data' },
        ].map(item => (
          <div key={item.label} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-xl mb-1">{item.icon}</div>
            <div className="text-sm font-medium text-gray-700">{item.label}</div>
            <div className="text-xs text-gray-400 mt-0.5">{item.note}</div>
            <div className="text-xs text-indigo-500 mt-2">Coming soon</div>
          </div>
        ))}
      </div>
    </div>
  );
}
