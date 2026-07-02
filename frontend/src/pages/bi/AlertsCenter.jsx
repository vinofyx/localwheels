import { useState, useEffect } from 'react';
import api from '../../api/client';

const _BASE = import.meta.env.VITE_API_URL || '/api';

const SEV_COLOR = {
  critical: 'border-red-200 bg-red-50',
  warning: 'border-yellow-200 bg-yellow-50',
  info: 'border-blue-200 bg-blue-50',
};
const SEV_TEXT = { critical: 'text-red-700', warning: 'text-yellow-700', info: 'text-blue-700' };
const SEV_ICON = { critical: '🚨', warning: '⚠️', info: 'ℹ️' };
const SEV_BADGE = { critical: 'bg-red-100 text-red-700', warning: 'bg-yellow-100 text-yellow-700', info: 'bg-blue-100 text-blue-700' };

export default function AlertsCenter() {
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState(null);
  const [total, setTotal] = useState(0);
  const [severity, setSeverity] = useState('');
  const [showResolved, setShowResolved] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: 30, is_resolved: showResolved });
    if (severity) params.set('severity', severity);
    Promise.all([
      api.get(`${_BASE}/alerts?${params}`),
      api.get(`${_BASE}/alerts/stats`),
    ])
      .then(([a, s]) => { setAlerts(a.data.alerts || []); setTotal(a.data.total || 0); setStats(s.data.stats); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [severity, showResolved]);

  const scan = async () => {
    setScanning(true);
    const r = await api.post(`${_BASE}/alerts/scan`).catch(() => ({ data: { created: 0 } }));
    load();
    setScanning(false);
    if (r.data.created > 0) alert(`${r.data.created} new alert(s) detected`);
  };

  const resolve = async (id) => {
    await api.post(`${_BASE}/alerts/${id}/resolve`);
    load();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alerts Center</h1>
          <p className="text-sm text-gray-500 mt-0.5">Automated business event monitoring</p>
        </div>
        <button onClick={scan} disabled={scanning} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
          {scanning ? '🔍 Scanning...' : '🔍 Scan Now'}
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          {['critical','warning','info'].map(s => (
            <div key={s} className={`border rounded-xl p-4 ${SEV_COLOR[s]}`}>
              <div className="text-2xl font-bold">{stats[s] || 0}</div>
              <div className={`text-xs font-medium capitalize ${SEV_TEXT[s]}`}>{s}</div>
            </div>
          ))}
          <div className="border border-gray-200 bg-gray-50 rounded-xl p-4">
            <div className="text-2xl font-bold text-gray-800">{stats.total || 0}</div>
            <div className="text-xs font-medium text-gray-500">Total Active</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <button onClick={() => setSeverity('')} className={`px-3 py-1.5 rounded-full text-xs font-medium ${!severity ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>All</button>
        {['critical','warning','info'].map(s => (
          <button key={s} onClick={() => setSeverity(s)} className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize ${severity === s ? 'bg-gray-800 text-white' : `${SEV_BADGE[s]} hover:opacity-80`}`}>{s}</button>
        ))}
        <label className="flex items-center gap-2 text-xs text-gray-600 ml-auto cursor-pointer">
          <input type="checkbox" checked={showResolved} onChange={e => setShowResolved(e.target.checked)} />
          Show Resolved
        </label>
        <span className="self-center text-xs text-gray-400">{total} alert{total !== 1 ? 's' : ''}</span>
      </div>

      {/* Alert List */}
      {loading ? (
        <div className="text-center text-gray-400 py-8">Loading...</div>
      ) : alerts.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
          <div className="text-3xl mb-2">✅</div>
          <div className="text-green-700 font-medium">No active alerts</div>
          <div className="text-sm text-green-600 mt-1">All systems operating normally</div>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map(alert => (
            <div key={alert._id} className={`border rounded-xl p-4 ${SEV_COLOR[alert.severity] || 'border-gray-200 bg-white'} ${alert.is_resolved ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <span className="text-xl shrink-0">{SEV_ICON[alert.severity]}</span>
                  <div>
                    <div className={`font-semibold text-sm ${SEV_TEXT[alert.severity]}`}>{alert.title}</div>
                    <div className="text-xs mt-0.5 text-gray-700">{alert.message}</div>
                    <div className="flex gap-3 mt-1.5 text-xs text-gray-400">
                      <span className={`px-2 py-0.5 rounded-full ${SEV_BADGE[alert.severity]} font-medium`}>{alert.severity}</span>
                      <span className="capitalize">{alert.source_module}</span>
                      <span>{new Date(alert.createdAt).toLocaleString()}</span>
                      {alert.is_resolved && <span className="text-green-600">✓ Resolved</span>}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  {alert.action_url && (
                    <a href={alert.action_url} className="text-xs text-indigo-600 hover:underline">View →</a>
                  )}
                  {!alert.is_resolved && (
                    <button onClick={() => resolve(alert._id)} className="text-xs text-gray-500 hover:text-green-600">Resolve</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
