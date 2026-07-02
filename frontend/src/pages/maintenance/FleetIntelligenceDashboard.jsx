import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';

const _BASE = import.meta.env.VITE_API_URL || '/api';

const SEVERITY_COLOR = { critical: 'red', high: 'orange', medium: 'yellow', low: 'blue' };

export default function FleetIntelligenceDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [devices, setDevices] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`${_BASE}/maintenance-ai/dashboard`),
      api.get(`${_BASE}/iot/devices?limit=5`),
    ])
      .then(([d, dev]) => { setDashboard(d.data); setDevices(dev.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-400">Loading Fleet Intelligence...</div>;

  const kpis = dashboard?.kpis || {};
  const topAlerts = dashboard?.top_alerts || [];
  const deviceStats = devices?.stats || {};

  const kpiCards = [
    { label: 'Active Vehicles', value: kpis.active_vehicles || 0, color: 'blue', icon: '🚛' },
    { label: 'Critical Alerts', value: kpis.critical_alerts || 0, color: 'red', icon: '🚨' },
    { label: 'Open Work Orders', value: kpis.open_work_orders || 0, color: 'orange', icon: '🔧' },
    { label: 'Fleet Health Score', value: kpis.fleet_health_score ? kpis.fleet_health_score + '%' : '—', color: 'green', icon: '💚' },
    { label: 'Devices Online', value: deviceStats.online || 0, color: 'indigo', icon: '📡' },
    { label: 'Overdue Schedules', value: kpis.overdue_schedules || 0, color: 'yellow', icon: '⏰' },
    { label: 'Uptime %', value: kpis.uptime_pct ? kpis.uptime_pct + '%' : '—', color: 'teal', icon: '✅' },
    { label: 'Maintenance Cost', value: kpis.maintenance_cost_month ? '₹' + Math.round(kpis.maintenance_cost_month / 1000) + 'K' : '₹0', color: 'purple', icon: '💰' },
  ];

  const colorMap = {
    red:    'bg-red-50 border-red-200 text-red-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    green:  'bg-green-50 border-green-200 text-green-700',
    blue:   'bg-blue-50 border-blue-200 text-blue-700',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    teal:   'bg-teal-50 border-teal-200 text-teal-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
  };

  const navLinks = [
    { to: '/maintenance/telemetry', icon: '📡', label: 'Live Telemetry' },
    { to: '/maintenance/vehicle-health', icon: '🏥', label: 'Vehicle Health' },
    { to: '/maintenance/center', icon: '🔮', label: 'Maintenance AI' },
    { to: '/maintenance/workorders', icon: '📋', label: 'Work Orders' },
    { to: '/maintenance/workshops', icon: '🏭', label: 'Workshops' },
    { to: '/maintenance/fuel', icon: '⛽', label: 'Fuel Intelligence' },
    { to: '/maintenance/driver-behaviour', icon: '🧠', label: 'Driver Behaviour' },
    { to: '/maintenance/battery', icon: '🔋', label: 'Battery Analytics' },
    { to: '/maintenance/engine', icon: '⚙️', label: 'Engine Analytics' },
    { to: '/maintenance/tyres', icon: '🛞', label: 'Tyre Analytics' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fleet Intelligence Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">AI-powered predictive maintenance & IoT monitoring</p>
        </div>
        <div className="flex gap-2">
          <Link to="/maintenance/center" className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">Run AI Predictions</Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiCards.map(k => (
          <div key={k.label} className={`border rounded-xl p-4 ${colorMap[k.color]}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xl">{k.icon}</span>
              <span className={`text-2xl font-bold`}>{k.value}</span>
            </div>
            <div className="text-xs font-medium opacity-80">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top AI Alerts */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">AI Maintenance Predictions</h2>
            <Link to="/maintenance/center" className="text-xs text-indigo-600 hover:underline">View All</Link>
          </div>
          {topAlerts.length === 0 ? (
            <div className="text-center text-gray-300 py-6">
              <div className="text-3xl mb-2">🤖</div>
              <div className="text-sm">No active predictions — run fleet scan</div>
            </div>
          ) : (
            <div className="space-y-3">
              {topAlerts.map((a, i) => (
                <div key={a._id || i} className={`flex items-start gap-3 p-3 rounded-lg border ${a.severity === 'critical' ? 'bg-red-50 border-red-200' : a.severity === 'high' ? 'bg-orange-50 border-orange-200' : 'bg-yellow-50 border-yellow-200'}`}>
                  <span className="text-lg">{a.severity === 'critical' ? '🚨' : a.severity === 'high' ? '⚠️' : '💡'}</span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-800">{a.vehicle_number || a.fleet_vehicle_id?.vehicle_number || 'Unknown Vehicle'}</div>
                    <div className="text-xs text-gray-600 mt-0.5">{a.failure_type} — <span className="font-medium">{Math.round((a.failure_probability || 0) * 100)}%</span> probability</div>
                    {a.days_until_failure && <div className="text-xs text-red-600 mt-0.5">⏱ {a.days_until_failure} days</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* IoT Device Status */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">IoT Device Status</h2>
            <Link to="/maintenance/telemetry" className="text-xs text-indigo-600 hover:underline">Manage Devices</Link>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{deviceStats.online || 0}</div>
              <div className="text-xs text-gray-500">Online</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">{deviceStats.offline || 0}</div>
              <div className="text-xs text-gray-500">Offline</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-700">{deviceStats.total || 0}</div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
          </div>
          {deviceStats.total > 0 && (
            <div className="bg-gray-100 rounded-full h-3">
              <div className="bg-green-500 h-3 rounded-full transition-all" style={{ width: `${Math.round(((deviceStats.online || 0) / deviceStats.total) * 100)}%` }} />
            </div>
          )}
          <div className="mt-3 text-xs text-gray-500 text-center">
            {deviceStats.total > 0 ? `${Math.round(((deviceStats.online || 0) / deviceStats.total) * 100)}% devices online` : 'No devices registered'}
          </div>
        </div>
      </div>

      {/* Module Navigation */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Fleet Intelligence Modules</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {navLinks.map(l => (
            <Link key={l.to} to={l.to} className="bg-white border border-gray-200 rounded-xl p-4 text-center hover:border-indigo-300 hover:shadow-sm transition-all">
              <div className="text-2xl mb-1">{l.icon}</div>
              <div className="text-xs font-medium text-gray-700">{l.label}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
