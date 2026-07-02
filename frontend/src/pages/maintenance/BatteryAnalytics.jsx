import { useState, useEffect } from 'react';
import api from '../../api/client';

const _BASE = import.meta.env.VITE_API_URL || '/api';
const STATUS_COLOR = { excellent: 'bg-green-100 text-green-700', good: 'bg-blue-100 text-blue-700', fair: 'bg-yellow-100 text-yellow-700', replace_soon: 'bg-orange-100 text-orange-700', replace_now: 'bg-red-100 text-red-700' };
const URGENCY_COLOR = { none: 'text-green-600', monitor: 'text-blue-600', plan: 'text-yellow-600', urgent: 'text-orange-600', immediate: 'text-red-600' };

export default function BatteryAnalytics() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [criticalCount, setCriticalCount] = useState(0);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [assessing, setAssessing] = useState(null);

  const load = () => {
    api.get(`${_BASE}/battery-health?limit=50`)
      .then(r => { setRecords(r.data.records || []); setCriticalCount(r.data.critical_batteries || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { api.get(`${_BASE}/fleet/vehicles?limit=50`).then(r => setVehicles(r.data.vehicles || r.data || [])).catch(() => {}); }, []);

  const assess = async () => {
    if (!selectedVehicle) return;
    setAssessing(selectedVehicle);
    try {
      await api.post(`${_BASE}/battery-health/assess/${selectedVehicle}`, {});
      load();
    } catch {}
    setAssessing(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Battery Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">Battery health monitoring and replacement predictions</p>
        </div>
        {criticalCount > 0 && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2 text-center"><div className="text-xl font-bold text-red-700">{criticalCount}</div><div className="text-xs text-red-500">Critical Batteries</div></div>}
      </div>

      {/* Assess */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex gap-3">
        <select value={selectedVehicle} onChange={e => setSelectedVehicle(e.target.value)} className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400">
          <option value="">Select vehicle to assess</option>
          {vehicles.map(v => <option key={v._id} value={v._id}>{v.vehicle_number}</option>)}
        </select>
        <button onClick={assess} disabled={!selectedVehicle || assessing === selectedVehicle} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50">
          {assessing === selectedVehicle ? 'Assessing...' : '🔋 Assess Battery'}
        </button>
      </div>

      {loading ? <div className="p-8 text-center text-gray-400">Loading...</div> : records.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400">
          <div className="text-4xl mb-2">🔋</div>
          <div>No battery assessments yet. Run telemetry data collection and assess.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {records.map(r => (
            <div key={r._id} className={`bg-white border rounded-xl p-5 ${r.replacement_urgency === 'immediate' ? 'border-red-300' : r.replacement_urgency === 'urgent' ? 'border-orange-300' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-800">{r.vehicle_number}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Assessed {new Date(r.assessed_at).toLocaleDateString()}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[r.health_status] || 'bg-gray-100 text-gray-600'}`}>{r.health_status?.replace('_', ' ')}</span>
              </div>

              {/* Health Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">Battery Health</span>
                  <span className="font-bold text-gray-800">{r.health_pct}%</span>
                </div>
                <div className="bg-gray-100 rounded-full h-3">
                  <div className={`h-3 rounded-full ${r.health_pct >= 80 ? 'bg-green-500' : r.health_pct >= 65 ? 'bg-blue-500' : r.health_pct >= 45 ? 'bg-yellow-500' : r.health_pct >= 25 ? 'bg-orange-500' : 'bg-red-500'}`}
                    style={{ width: `${r.health_pct}%` }} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-3 text-center">
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="text-sm font-bold text-gray-700">{r.voltage_current?.toFixed(1) || '—'}V</div>
                  <div className="text-xs text-gray-400">Current</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="text-sm font-bold text-gray-700">{r.avg_voltage?.toFixed(1) || '—'}V</div>
                  <div className="text-xs text-gray-400">Avg (7d)</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="text-sm font-bold text-gray-700">{r.low_voltage_events || 0}</div>
                  <div className="text-xs text-gray-400">Low Events</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs">
                  <span className="text-gray-500">Replace in: </span>
                  <span className="font-medium text-gray-700">{r.estimated_remaining_months || '?'} months</span>
                </div>
                <span className={`text-xs font-medium ${URGENCY_COLOR[r.replacement_urgency] || 'text-gray-500'}`}>
                  {r.replacement_urgency === 'none' ? '✅ OK' : r.replacement_urgency === 'immediate' ? '🚨 Replace Now' : r.replacement_urgency === 'urgent' ? '⚠️ Urgent' : r.replacement_urgency === 'plan' ? '📅 Plan' : '👁 Monitor'}
                </span>
              </div>

              {r.ai_recommendation && (
                <div className="mt-3 text-xs text-gray-500 italic border-t border-gray-100 pt-3">{r.ai_recommendation}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
