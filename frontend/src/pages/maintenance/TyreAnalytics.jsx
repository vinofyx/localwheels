import { useState, useEffect } from 'react';
import api from '../../api/client';

const _BASE = import.meta.env.VITE_API_URL || '/api';
const TYRE_STATUS_COLOR = { good: 'bg-green-100 text-green-700', low_pressure: 'bg-yellow-100 text-yellow-700', high_temp: 'bg-orange-100 text-orange-700', worn: 'bg-red-100 text-red-600', critical: 'bg-red-200 text-red-800', flat: 'bg-red-300 text-red-900' };
const TYRE_ICON = { FL: '↖', FR: '↗', RL: '↙', RR: '↘', spare: '○' };

function TyreGrid({ tyres }) {
  const positions = ['FL', 'FR', 'RL', 'RR'];
  return (
    <div className="grid grid-cols-2 gap-2">
      {positions.map(pos => {
        const t = tyres?.find(t => t.position === pos);
        return (
          <div key={pos} className={`rounded-lg p-3 text-center text-xs ${t ? TYRE_STATUS_COLOR[t.status] || 'bg-gray-100 text-gray-600' : 'bg-gray-50 text-gray-400'}`}>
            <div className="text-base mb-1">{TYRE_ICON[pos]}</div>
            <div className="font-bold text-sm">{t?.pressure_psi ? t.pressure_psi.toFixed(0) + ' PSI' : '—'}</div>
            <div className="text-gray-500">{pos}</div>
            {t?.temperature && <div>{t.temperature}°C</div>}
          </div>
        );
      })}
    </div>
  );
}

export default function TyreAnalytics() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [urgentCount, setUrgentCount] = useState(0);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [assessing, setAssessing] = useState(null);
  const [fleetAssessing, setFleetAssessing] = useState(false);
  const [manualPressures, setManualPressures] = useState({ fl_pressure: '', fr_pressure: '', rl_pressure: '', rr_pressure: '' });
  const [showManual, setShowManual] = useState(false);

  const load = () => {
    api.get(`${_BASE}/tyre-health?limit=30`)
      .then(r => { setRecords(r.data.records || []); setUrgentCount(r.data.urgent_vehicles || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { api.get(`${_BASE}/fleet/vehicles?limit=50`).then(r => setVehicles(r.data.vehicles || r.data || [])).catch(() => {}); }, []);

  const assess = async () => {
    if (!selectedVehicle) return;
    setAssessing(selectedVehicle);
    try {
      const body = showManual ? { tyres_manual: { fl_pressure: Number(manualPressures.fl_pressure), fr_pressure: Number(manualPressures.fr_pressure), rl_pressure: Number(manualPressures.rl_pressure), rr_pressure: Number(manualPressures.rr_pressure) } } : {};
      await api.post(`${_BASE}/tyre-health/assess/${selectedVehicle}`, body);
      load();
    } catch {}
    setAssessing(null);
  };

  const fleetAssess = async () => {
    setFleetAssessing(true);
    try {
      await api.post(`${_BASE}/tyre-health/fleet-assess`, {});
      setTimeout(load, 3000);
    } catch {}
    setFleetAssessing(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tyre Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">Pressure monitoring, tread analysis, and replacement predictions</p>
        </div>
        <div className="flex items-center gap-3">
          {urgentCount > 0 && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2 text-center"><div className="text-xl font-bold text-red-700">{urgentCount}</div><div className="text-xs text-red-500">Urgent</div></div>}
          <button onClick={fleetAssess} disabled={fleetAssessing} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50">
            {fleetAssessing ? 'Scanning...' : '🛞 Fleet Scan'}
          </button>
        </div>
      </div>

      {/* Assess Panel */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <div className="flex gap-3">
          <select value={selectedVehicle} onChange={e => setSelectedVehicle(e.target.value)} className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400">
            <option value="">Select vehicle</option>
            {vehicles.map(v => <option key={v._id} value={v._id}>{v.vehicle_number}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={showManual} onChange={e => setShowManual(e.target.checked)} className="rounded" />
            Manual input
          </label>
          <button onClick={assess} disabled={!selectedVehicle || assessing === selectedVehicle} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50">
            {assessing === selectedVehicle ? 'Assessing...' : '🛞 Assess'}
          </button>
        </div>
        {showManual && (
          <div className="grid grid-cols-4 gap-3">
            {['fl_pressure', 'fr_pressure', 'rl_pressure', 'rr_pressure'].map(k => (
              <div key={k}>
                <label className="text-xs text-gray-500 mb-1 block">{k.replace('_pressure', '').toUpperCase()} PSI</label>
                <input type="number" value={manualPressures[k]} onChange={e => setManualPressures(p => ({ ...p, [k]: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none" placeholder="30" />
              </div>
            ))}
          </div>
        )}
      </div>

      {loading ? <div className="p-8 text-center text-gray-400">Loading...</div> : records.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400">
          <div className="text-4xl mb-2">🛞</div>
          <div>No tyre assessments. Assess a vehicle or run a fleet scan.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {records.map(r => (
            <div key={r._id} className={`bg-white border rounded-xl p-5 ${r.urgent_action_needed ? 'border-red-300 shadow-sm' : 'border-gray-200'}`}>
              {r.urgent_action_needed && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700 font-medium mb-3">🚨 URGENT: Immediate action required</div>
              )}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-800">{r.vehicle_number}</h3>
                  <p className="text-xs text-gray-400">{new Date(r.assessed_at).toLocaleDateString()}</p>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${r.overall_health_pct >= 80 ? 'text-green-600' : r.overall_health_pct >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>{r.overall_health_pct}%</div>
                  <div className="text-xs text-gray-400">Health</div>
                </div>
              </div>

              <TyreGrid tyres={r.tyres} />

              {r.ai_recommendation && (
                <div className="mt-3 text-xs text-gray-500 border-t border-gray-100 pt-3 italic">{r.ai_recommendation}</div>
              )}

              {r.critical_tyres > 0 && (
                <div className="mt-2 text-xs text-red-600 font-medium">⚠️ {r.critical_tyres} tyre(s) critical</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
