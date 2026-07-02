import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';

const _BASE = import.meta.env.VITE_API_URL || '/api';

export default function OperationsDashboard() {
  const [kpis, setKpis] = useState(null);
  const [trend, setTrend] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`${_BASE}/executive/kpis`),
      api.get(`${_BASE}/executive/trend?days=14`),
      api.get(`${_BASE}/alerts?limit=5&is_resolved=false`),
    ])
      .then(([k, t, a]) => { setKpis(k.data.kpis); setTrend(t.data.trend || []); setAlerts(a.data.alerts || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-400">Loading operations data...</div>;
  const k = kpis || {};
  const totalShipments = (k.delivered_today || 0) + (k.delayed_today || 0) + (k.pending_today || 0);
  const deliveryPct = totalShipments > 0 ? Math.round(((k.delivered_today || 0) / totalShipments) * 100) : 0;
  const maxCount = Math.max(...trend.map(t => t.count || 0), 1);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Operations Dashboard</h1>

      {/* Ops KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Shipments Today', value: k.shipments_today || 0, color: 'blue' },
          { label: 'Delivered', value: k.delivered_today || 0, color: 'green' },
          { label: 'Delayed', value: k.delayed_today || 0, color: 'red' },
          { label: 'Pending', value: k.pending_today || 0, color: 'yellow' },
        ].map(kpi => (
          <div key={kpi.label} className={`border rounded-xl p-4 ${kpi.color === 'green' ? 'bg-green-50 border-green-200' : kpi.color === 'red' ? 'bg-red-50 border-red-200' : kpi.color === 'yellow' ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200'}`}>
            <div className={`text-2xl font-bold ${kpi.color === 'green' ? 'text-green-700' : kpi.color === 'red' ? 'text-red-700' : kpi.color === 'yellow' ? 'text-yellow-700' : 'text-blue-700'}`}>{kpi.value}</div>
            <div className="text-xs text-gray-600 mt-0.5">{kpi.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Delivery Rate Gauge */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Today's Delivery Rate</h2>
          <div className="flex items-center justify-center py-4">
            <div className="relative w-36 h-36">
              <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#f3f4f6" strokeWidth="10" />
                <circle cx="60" cy="60" r="50" fill="none" stroke={deliveryPct >= 80 ? '#22c55e' : deliveryPct >= 60 ? '#f59e0b' : '#ef4444'} strokeWidth="10"
                  strokeDasharray={`${(deliveryPct / 100) * 314} 314`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-2xl font-bold text-gray-800">{deliveryPct}%</div>
                <div className="text-xs text-gray-400">on time</div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center mt-2">
            <div><div className="text-lg font-bold text-green-600">{k.delivered_today || 0}</div><div className="text-xs text-gray-400">Delivered</div></div>
            <div><div className="text-lg font-bold text-red-500">{k.delayed_today || 0}</div><div className="text-xs text-gray-400">Delayed</div></div>
            <div><div className="text-lg font-bold text-yellow-600">{k.pending_today || 0}</div><div className="text-xs text-gray-400">Pending</div></div>
          </div>
        </div>

        {/* 14-Day Trend */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Shipment Trend (14 Days)</h2>
          {trend.length === 0 ? (
            <div className="text-center text-gray-300 py-8">No data</div>
          ) : (
            <div className="space-y-1.5">
              {trend.map(day => (
                <div key={day._id} className="flex items-center gap-2 text-xs">
                  <span className="text-gray-400 w-16 shrink-0">{day._id?.slice(5)}</span>
                  <div className="flex-1 bg-gray-50 rounded h-4 flex items-center">
                    <div className="bg-indigo-400 h-4 rounded" style={{ width: `${Math.round((day.count / maxCount) * 100)}%`, minWidth: day.count > 0 ? '4px' : '0' }} />
                  </div>
                  <span className="text-gray-600 w-6 text-right">{day.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">Active Alerts</h2>
            <Link to="/bi/alerts" className="text-xs text-indigo-600 hover:underline">View All</Link>
          </div>
          <div className="space-y-2">
            {alerts.map(a => (
              <div key={a._id} className={`flex items-center gap-3 p-2 rounded-lg text-xs ${a.severity === 'critical' ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'}`}>
                <span>{a.severity === 'critical' ? '🚨' : '⚠️'}</span>
                <span className="font-medium">{a.title}</span>
                <span className="opacity-70">— {a.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Module Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { to: '/dispatch/center', icon: '📋', label: 'Dispatch Center' },
          { to: '/routes/optimizer', icon: '🗺️', label: 'Route Optimizer' },
          { to: '/fleet/dashboard', icon: '🚛', label: 'Fleet Dashboard' },
          { to: '/complaints/center', icon: '😤', label: 'Complaints' },
        ].map(l => (
          <Link key={l.to} to={l.to} className="bg-white border border-gray-200 rounded-xl p-4 text-center hover:border-indigo-300 hover:shadow-sm">
            <div className="text-2xl mb-1">{l.icon}</div>
            <div className="text-sm font-medium text-gray-700">{l.label}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
