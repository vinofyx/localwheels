import { useState, useEffect } from 'react';
import api from '../../api/client';

const _BASE = import.meta.env.VITE_API_URL || '/api';

export default function FinancialDashboard() {
  const [trend, setTrend] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`${_BASE}/executive/kpis`),
      api.get(`${_BASE}/executive/trend?days=30`),
      api.get(`${_BASE}/forecast/revenue`),
    ])
      .then(([k, t, f]) => { setKpis(k.data.kpis); setTrend(t.data.trend || []); setForecast(f.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n) => n != null ? '₹' + (n >= 100000 ? (n/100000).toFixed(2)+'L' : n >= 1000 ? (n/1000).toFixed(1)+'K' : n.toFixed(0)) : '—';
  const maxRev = Math.max(...trend.map(t => t.revenue || 0), 1);

  if (loading) return <div className="p-8 text-center text-gray-400">Loading financial data...</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Financial Dashboard</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Revenue Today', value: fmt(kpis?.revenue_today), color: 'green' },
          { label: 'Revenue This Month', value: fmt(kpis?.revenue_month), color: 'indigo' },
          { label: 'Forecast Next Month', value: fmt(forecast?.predicted), color: 'blue' },
          { label: 'Forecast Change', value: forecast?.change_pct != null ? (forecast.change_pct > 0 ? '+' : '') + forecast.change_pct + '%' : '—', color: parseFloat(forecast?.change_pct) >= 0 ? 'green' : 'red' },
        ].map(kpi => (
          <div key={kpi.label} className={`border rounded-xl p-4 ${kpi.color === 'green' ? 'bg-green-50 border-green-200' : kpi.color === 'red' ? 'bg-red-50 border-red-200' : kpi.color === 'blue' ? 'bg-blue-50 border-blue-200' : 'bg-indigo-50 border-indigo-200'}`}>
            <div className={`text-2xl font-bold ${kpi.color === 'green' ? 'text-green-700' : kpi.color === 'red' ? 'text-red-700' : kpi.color === 'blue' ? 'text-blue-700' : 'text-indigo-700'}`}>{kpi.value}</div>
            <div className="text-xs text-gray-600 mt-0.5">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Revenue Trend */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Revenue Trend (30 Days)</h2>
        {trend.length === 0 ? (
          <div className="text-center text-gray-300 py-12">No revenue data yet</div>
        ) : (
          <div className="space-y-1.5">
            {trend.map(day => (
              <div key={day._id} className="flex items-center gap-3 text-xs">
                <span className="text-gray-400 w-20 shrink-0">{day._id?.slice(5)}</span>
                <div className="flex-1 bg-gray-50 rounded h-5 flex items-center">
                  <div className="bg-green-400 h-5 rounded" style={{ width: `${Math.round((day.revenue / maxRev) * 100)}%`, minWidth: day.revenue > 0 ? '4px' : '0' }} />
                </div>
                <span className="text-green-700 font-medium w-20 text-right">{fmt(day.revenue)}</span>
                <span className="text-gray-400 w-10 text-right">{day.count} trips</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Forecast Card */}
      {forecast && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Revenue Forecast</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-400 mb-1">Lower Bound</div>
              <div className="text-lg font-bold text-gray-600">{fmt(forecast.lower_bound)}</div>
            </div>
            <div className="text-center p-3 bg-indigo-50 rounded-lg border border-indigo-200">
              <div className="text-xs text-indigo-500 mb-1">Predicted</div>
              <div className="text-lg font-bold text-indigo-700">{fmt(forecast.predicted)}</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-400 mb-1">Upper Bound</div>
              <div className="text-lg font-bold text-gray-600">{fmt(forecast.upper_bound)}</div>
            </div>
          </div>
          {forecast.ai_explanation && (
            <div className="mt-3 text-sm text-gray-600 bg-indigo-50 rounded-lg p-3">{forecast.ai_explanation}</div>
          )}
        </div>
      )}
    </div>
  );
}
