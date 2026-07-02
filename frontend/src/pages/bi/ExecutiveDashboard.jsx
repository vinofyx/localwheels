import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';

const _BASE = import.meta.env.VITE_API_URL || '/api';

const TREND_ICON = { up: '↑', down: '↓', stable: '→' };
const TREND_COLOR = { up: 'text-green-600', down: 'text-red-600', stable: 'text-gray-500' };

function KPICard({ label, value, sub, trend, icon, color = 'indigo' }) {
  const colors = {
    indigo: 'bg-indigo-50 border-indigo-200',
    green: 'bg-green-50 border-green-200',
    red: 'bg-red-50 border-red-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    blue: 'bg-blue-50 border-blue-200',
    orange: 'bg-orange-50 border-orange-200',
  };
  return (
    <div className={`border rounded-xl p-4 ${colors[color] || colors.indigo}`}>
      <div className="flex items-start justify-between">
        <div className="text-lg">{icon}</div>
        {trend && <span className={`text-xs font-bold ${TREND_COLOR[trend]}`}>{TREND_ICON[trend]}</span>}
      </div>
      <div className="mt-2 text-2xl font-bold text-gray-900">{value ?? '—'}</div>
      <div className="text-xs font-medium text-gray-600 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function AlertBadge({ severity, count }) {
  const colors = { critical: 'bg-red-100 text-red-700', warning: 'bg-yellow-100 text-yellow-700', info: 'bg-blue-100 text-blue-700' };
  if (!count) return null;
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[severity]}`}>{count} {severity}</span>;
}

export default function ExecutiveDashboard() {
  const [summary, setSummary] = useState(null);
  const [kpis, setKpis] = useState(null);
  const [trend, setTrend] = useState([]);
  const [alertStats, setAlertStats] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [s, k, t, a, f] = await Promise.all([
        api.get(`${_BASE}/executive/summary`),
        api.get(`${_BASE}/executive/kpis`),
        api.get(`${_BASE}/executive/trend?days=14`),
        api.get(`${_BASE}/alerts/stats`),
        api.get(`${_BASE}/forecast/all`).catch(() => ({ data: null })),
      ]);
      setSummary(s.data.summary);
      setKpis(k.data.kpis);
      setTrend(t.data.trend || []);
      setAlertStats(a.data.stats);
      setForecast(f.data);
    } catch (_) {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const refresh = async () => {
    setRefreshing(true);
    await api.post(`${_BASE}/executive/snapshot`).catch(() => {});
    await api.post(`${_BASE}/alerts/scan`).catch(() => {});
    await load();
    setRefreshing(false);
  };

  const fmt = (n) => n ? (n >= 1000 ? '₹' + (n/1000).toFixed(1) + 'K' : '₹' + n.toFixed(0)) : '₹0';

  if (loading) return <div className="p-8 text-center text-gray-400">Loading executive dashboard...</div>;

  const k = kpis || {};
  const maxTrend = Math.max(...trend.map(t => t.count || 0), 1);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Executive Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Real-time business intelligence · {new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}</p>
        </div>
        <div className="flex gap-3 items-center">
          {alertStats && (
            <div className="flex gap-2">
              <AlertBadge severity="critical" count={alertStats.critical} />
              <AlertBadge severity="warning" count={alertStats.warning} />
            </div>
          )}
          <button onClick={refresh} disabled={refreshing} className="border border-gray-300 px-4 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50">
            {refreshing ? '⟳ Refreshing...' : '⟳ Refresh'}
          </button>
          <Link to="/bi/reports" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
            Reports
          </Link>
        </div>
      </div>

      {/* Primary KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard icon="💰" label="Revenue Today" value={fmt(k.revenue_today)} color="green" />
        <KPICard icon="📦" label="Shipments Today" value={k.shipments_today} color="blue" />
        <KPICard icon="✅" label="Delivered Today" value={k.delivered_today} color="green" />
        <KPICard icon="⏳" label="Pending" value={k.pending_today} color="yellow" />
      </div>

      {/* Secondary KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard icon="📅" label="Revenue This Month" value={fmt(k.revenue_month)} color="indigo" />
        <KPICard icon="🚛" label="Delayed" value={k.delayed_today} color="red" />
        <KPICard icon="😤" label="Open Complaints" value={k.complaints_open} color="orange" />
        <KPICard icon="🚨" label="Critical Alerts" value={k.critical_alerts} color="red" />
      </div>

      {/* Forecast Banner */}
      {forecast && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-4">
            <div className="text-xs text-indigo-500 font-semibold uppercase mb-1">Next Month Revenue Forecast</div>
            <div className="text-2xl font-bold text-indigo-700">
              {fmt(forecast.revenue?.predicted)}
              <span className={`ml-2 text-sm font-medium ${parseFloat(forecast.revenue?.change_pct) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {parseFloat(forecast.revenue?.change_pct) >= 0 ? '+' : ''}{forecast.revenue?.change_pct}%
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-1 capitalize">Trend: {forecast.revenue?.trend} {TREND_ICON[forecast.revenue?.trend]}</div>
          </div>
          <div className="bg-gradient-to-r from-green-50 to-teal-50 border border-green-200 rounded-xl p-4">
            <div className="text-xs text-green-500 font-semibold uppercase mb-1">Next Month Shipment Forecast</div>
            <div className="text-2xl font-bold text-green-700">
              {forecast.shipments?.predicted?.toLocaleString()} shipments
              <span className={`ml-2 text-sm font-medium ${parseFloat(forecast.shipments?.change_pct) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {parseFloat(forecast.shipments?.change_pct) >= 0 ? '+' : ''}{forecast.shipments?.change_pct}%
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-1 capitalize">Trend: {forecast.shipments?.trend} {TREND_ICON[forecast.shipments?.trend]}</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Shipment Trend Chart */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">Shipment & Revenue Trend (14 Days)</h2>
            <Link to="/bi/financial" className="text-xs text-indigo-600 hover:underline">View Details</Link>
          </div>
          {trend.length === 0 ? (
            <div className="text-center text-gray-300 py-12 text-sm">No trend data yet</div>
          ) : (
            <div className="space-y-1.5">
              {trend.map(day => (
                <div key={day._id} className="flex items-center gap-2 text-xs">
                  <span className="text-gray-400 w-20 shrink-0">{day._id?.slice(5)}</span>
                  <div className="flex-1 flex items-center gap-1">
                    <div className="bg-indigo-400 rounded-sm h-4" style={{ width: `${Math.round((day.count / maxTrend) * 100)}%`, minWidth: day.count > 0 ? '4px' : '0' }} title={`${day.count} shipments`} />
                  </div>
                  <span className="text-gray-500 w-6 text-right">{day.count}</span>
                  {day.revenue > 0 && <span className="text-green-600 w-16 text-right">{fmt(day.revenue)}</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Links & Alerts */}
        <div className="space-y-4">
          {/* Alert Summary */}
          {alertStats && alertStats.total > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-700">Active Alerts</h2>
                <Link to="/bi/alerts" className="text-xs text-indigo-600 hover:underline">View All</Link>
              </div>
              <div className="space-y-2">
                {alertStats.critical > 0 && <div className="flex items-center gap-2 text-xs p-2 bg-red-50 rounded-lg text-red-700"><span>🚨</span> {alertStats.critical} critical alert{alertStats.critical !== 1 ? 's' : ''}</div>}
                {alertStats.warning > 0 && <div className="flex items-center gap-2 text-xs p-2 bg-yellow-50 rounded-lg text-yellow-700"><span>⚠️</span> {alertStats.warning} warning{alertStats.warning !== 1 ? 's' : ''}</div>}
                {alertStats.info > 0 && <div className="flex items-center gap-2 text-xs p-2 bg-blue-50 rounded-lg text-blue-700"><span>ℹ️</span> {alertStats.info} info</div>}
              </div>
            </div>
          )}

          {/* Quick Navigation */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">BI Modules</h2>
            <div className="space-y-1">
              {[
                { to: '/bi/intelligence', icon: '🧠', label: 'Business Intelligence' },
                { to: '/bi/forecast', icon: '📈', label: 'Forecast Engine' },
                { to: '/bi/financial', icon: '💰', label: 'Financial Analytics' },
                { to: '/bi/operations', icon: '⚙️', label: 'Operations Analytics' },
                { to: '/bi/customers', icon: '👥', label: 'Customer Analytics' },
                { to: '/bi/copilot', icon: '🤖', label: 'AI Copilot' },
                { to: '/bi/reports', icon: '📄', label: 'Reports' },
                { to: '/bi/alerts', icon: '🔔', label: 'Alerts Center' },
              ].map(item => (
                <Link key={item.to} to={item.to} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
