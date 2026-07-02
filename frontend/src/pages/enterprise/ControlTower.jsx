import { useState, useEffect, useCallback } from 'react';

const _BASE = import.meta.env.VITE_API_URL || '/api';
const h = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}` });

const SEV_COLOR = { info: 'bg-blue-100 text-blue-800', warning: 'bg-yellow-100 text-yellow-800', critical: 'bg-red-100 text-red-800', emergency: 'bg-red-900 text-white' };
const SEV_DOT   = { info: 'bg-blue-400', warning: 'bg-yellow-400', critical: 'bg-red-500', emergency: 'bg-red-700' };

function KpiCard({ label, value, sub, color = 'text-gray-900' }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{value ?? '—'}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function ControlTower() {
  const [dash, setDash]     = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [feed, setFeed]     = useState([]);
  const [tab, setTab]       = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [d, a, f] = await Promise.all([
        fetch(`${_BASE}/control-tower/dashboard`, { headers: h() }).then(r => r.json()),
        fetch(`${_BASE}/control-tower/alerts?is_resolved=false&limit=20`, { headers: h() }).then(r => r.json()),
        fetch(`${_BASE}/control-tower/live-feed`, { headers: h() }).then(r => r.json()),
      ]);
      setDash(d.data || d);
      setAlerts((a.data?.alerts || a.alerts) || []);
      setFeed((f.data?.feed || f.feed) || []);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!autoRefresh) return;
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [autoRefresh, load]);

  const resolveAlert = async (id) => {
    await fetch(`${_BASE}/control-tower/alerts/${id}/resolve`, { method: 'PUT', headers: h() });
    setAlerts(prev => prev.filter(a => a._id !== id));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Control Tower</h1>
          <p className="text-sm text-gray-500 mt-1">Enterprise-wide operational visibility</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} className="rounded" />
            Auto-refresh (30s)
          </label>
          <button onClick={load} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">
            Refresh
          </button>
        </div>
      </div>

      {dash && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <KpiCard label="In Transit" value={dash.shipments?.in_transit} color="text-blue-600" />
          <KpiCard label="Delayed" value={dash.shipments?.delayed} color={dash.shipments?.delayed > 0 ? 'text-red-600' : 'text-green-600'} />
          <KpiCard label="Active Vehicles" value={dash.fleet?.active} sub={`${dash.fleet?.utilization_pct}% utilization`} />
          <KpiCard label="Active Drivers" value={dash.drivers?.active} />
          <KpiCard label="Open Alerts" value={dash.alerts?.total} color={dash.alerts?.critical > 0 ? 'text-red-600' : 'text-gray-900'} sub={dash.alerts?.critical > 0 ? `${dash.alerts.critical} critical` : ''} />
          <KpiCard label="Warehouse Util" value={`${dash.warehouse?.utilization_pct}%`} sub={`${dash.warehouse?.available_docks} docks free`} />
        </div>
      )}

      <div className="flex gap-2 border-b border-gray-200">
        {['dashboard','alerts','feed','exceptions'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t.replace('_', ' ')}
            {t === 'alerts' && alerts.length > 0 && <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5">{alerts.length}</span>}
          </button>
        ))}
      </div>

      {loading && <div className="text-center py-12 text-gray-400">Loading…</div>}

      {!loading && tab === 'dashboard' && dash && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-3">Shipment Overview</h3>
            {[['Total', dash.shipments?.total], ['In Transit', dash.shipments?.in_transit], ['Delivered', dash.shipments?.delivered], ['Delayed', dash.shipments?.delayed]].map(([label, val]) => (
              <div key={label} className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-500">{label}</span>
                <span className="text-sm font-semibold text-gray-900">{val ?? 0}</span>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-3">Fleet & Drivers</h3>
            {[['Total Vehicles', dash.fleet?.total], ['Active Vehicles', dash.fleet?.active], ['Fleet Utilization', `${dash.fleet?.utilization_pct}%`], ['Active Drivers', dash.drivers?.active]].map(([label, val]) => (
              <div key={label} className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-500">{label}</span>
                <span className="text-sm font-semibold text-gray-900">{val ?? 0}</span>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-3">Warehouse Status</h3>
            {[['Total Bins', dash.warehouse?.total_bins], ['Empty Bins', dash.warehouse?.empty_bins], ['Utilization', `${dash.warehouse?.utilization_pct}%`], ['Available Docks', dash.warehouse?.available_docks]].map(([label, val]) => (
              <div key={label} className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-500">{label}</span>
                <span className="text-sm font-semibold text-gray-900">{val ?? 0}</span>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-3">Risk & Incidents</h3>
            {[['Open Alerts', dash.alerts?.total], ['Critical Alerts', dash.alerts?.critical], ['Open Incidents', dash.incidents?.open], ['Active Risks', dash.risks?.active]].map(([label, val]) => (
              <div key={label} className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-500">{label}</span>
                <span className="text-sm font-semibold text-gray-900">{val ?? 0}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && tab === 'alerts' && (
        <div className="space-y-3">
          {alerts.length === 0 && <div className="text-center py-10 text-gray-400">No active alerts</div>}
          {alerts.map(a => (
            <div key={a._id} className="bg-white rounded-lg border border-gray-100 p-4 flex items-start gap-3 shadow-sm">
              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${SEV_DOT[a.severity] || 'bg-gray-400'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${SEV_COLOR[a.severity] || 'bg-gray-100 text-gray-700'}`}>{a.severity}</span>
                  <span className="text-xs text-gray-400">{new Date(a.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-sm font-medium text-gray-900">{a.title}</p>
                {a.message && <p className="text-xs text-gray-500 mt-0.5">{a.message}</p>}
              </div>
              <button onClick={() => resolveAlert(a._id)} className="text-xs text-green-600 hover:text-green-700 whitespace-nowrap">Resolve</button>
            </div>
          ))}
        </div>
      )}

      {!loading && tab === 'feed' && (
        <div className="space-y-2">
          {feed.length === 0 && <div className="text-center py-10 text-gray-400">No recent activity</div>}
          {feed.map((item, i) => (
            <div key={i} className="flex items-start gap-3 bg-white rounded-lg border border-gray-50 px-4 py-3 shadow-sm">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${item.feed_type === 'alert' ? 'bg-red-100 text-red-700' : item.feed_type === 'incident' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>{item.feed_type}</span>
              <p className="text-sm text-gray-700 flex-1">{item.title || item.message || item.description || 'Event'}</p>
              <span className="text-xs text-gray-400 whitespace-nowrap">{new Date(item.createdAt).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      )}

      {!loading && tab === 'exceptions' && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">Exception Management</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Delayed Shipments', count: dash?.shipments?.delayed || 0, color: 'bg-red-50 border-red-200', text: 'text-red-700' },
              { label: 'Critical Alerts', count: dash?.alerts?.critical || 0, color: 'bg-orange-50 border-orange-200', text: 'text-orange-700' },
              { label: 'Active Risks', count: dash?.risks?.active || 0, color: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-700' },
            ].map(e => (
              <div key={e.label} className={`rounded-lg border p-4 ${e.color}`}>
                <p className={`text-2xl font-bold ${e.text}`}>{e.count}</p>
                <p className="text-sm text-gray-600 mt-1">{e.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
