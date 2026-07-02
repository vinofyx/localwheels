import { useState, useEffect } from 'react';
import api from '../../api/client';

const _BASE = import.meta.env.VITE_API_URL || '/api';
const STATUS_COLOR = { excellent: 'bg-green-100 text-green-700', good: 'bg-blue-100 text-blue-700', fair: 'bg-yellow-100 text-yellow-700', poor: 'bg-orange-100 text-orange-700', critical: 'bg-red-100 text-red-700' };

function Gauge({ score }) {
  const r = 40;
  const circ = 2 * Math.PI * r;
  const color = score >= 85 ? '#22c55e' : score >= 70 ? '#3b82f6' : score >= 50 ? '#f59e0b' : score >= 30 ? '#f97316' : '#ef4444';
  return (
    <svg width="100" height="100" viewBox="0 0 100 100" className="-rotate-90">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#f3f4f6" strokeWidth="8" />
      <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={`${(score / 100) * circ} ${circ}`} strokeLinecap="round" />
    </svg>
  );
}

export default function EngineAnalytics() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fleetAvg, setFleetAvg] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [assessing, setAssessing] = useState(null);
  const [history, setHistory] = useState([]);

  const load = () => {
    api.get(`${_BASE}/engine-health?limit=30`)
      .then(r => { setRecords(r.data.records || []); setFleetAvg(r.data.fleet_avg_engine_score); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { api.get(`${_BASE}/fleet/vehicles?limit=50`).then(r => setVehicles(r.data.vehicles || r.data || [])).catch(() => {}); }, []);

  const assess = async () => {
    if (!selectedVehicle) return;
    setAssessing(selectedVehicle);
    try {
      await api.post(`${_BASE}/engine-health/assess/${selectedVehicle}`, {});
      const h = await api.get(`${_BASE}/engine-health/${selectedVehicle}/history`);
      setHistory(h.data.records || []);
      load();
    } catch {}
    setAssessing(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Engine Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">Engine health scoring, RPM analysis and oil life tracking</p>
        </div>
        {fleetAvg && <div className="text-center bg-blue-50 border border-blue-200 rounded-xl px-4 py-2"><div className="text-xl font-bold text-blue-700">{fleetAvg}</div><div className="text-xs text-blue-500">Fleet Avg Engine Score</div></div>}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 flex gap-3">
        <select value={selectedVehicle} onChange={e => setSelectedVehicle(e.target.value)} className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400">
          <option value="">Select vehicle to assess</option>
          {vehicles.map(v => <option key={v._id} value={v._id}>{v.vehicle_number}</option>)}
        </select>
        <button onClick={assess} disabled={!selectedVehicle || assessing === selectedVehicle} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50">
          {assessing === selectedVehicle ? 'Assessing...' : '⚙️ Assess Engine'}
        </button>
      </div>

      {loading ? <div className="p-8 text-center text-gray-400">Loading...</div> : records.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400">
          <div className="text-4xl mb-2">⚙️</div>
          <div>No engine assessments. Select a vehicle with telemetry data and assess.</div>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map(r => (
            <div key={r._id} className={`bg-white border rounded-xl p-5 ${r.health_status === 'critical' ? 'border-red-300' : r.health_status === 'poor' ? 'border-orange-300' : 'border-gray-200'}`}>
              <div className="flex items-start gap-6">
                <div className="relative shrink-0">
                  <Gauge score={r.engine_score || 0} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-800">{r.engine_score || 0}</div>
                      <div className="text-xs text-gray-400">Score</div>
                    </div>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-800">{r.vehicle_number}</h3>
                      <p className="text-xs text-gray-400">{r.fleet_vehicle_id?.make} {r.fleet_vehicle_id?.model}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[r.health_status]}`}>{r.health_status}</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: 'RPM (avg)', value: r.averages?.avg_rpm || r.current?.rpm || '—' },
                      { label: 'Coolant (max)', value: r.averages?.max_coolant_temp ? r.averages.max_coolant_temp + '°C' : '—' },
                      { label: 'Engine Load', value: r.averages?.avg_load ? r.averages.avg_load + '%' : '—' },
                      { label: 'Overtemp Events', value: r.averages?.overtemp_events || 0 },
                    ].map(m => (
                      <div key={m.label} className="bg-gray-50 rounded-lg p-2 text-center">
                        <div className="text-sm font-bold text-gray-700">{m.value}</div>
                        <div className="text-xs text-gray-400">{m.label}</div>
                      </div>
                    ))}
                  </div>
                  {r.active_dtc_codes?.length > 0 && (
                    <div className="mt-3 flex gap-2 flex-wrap">
                      {r.active_dtc_codes.map(code => <span key={code} className="text-xs bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded">{code}</span>)}
                    </div>
                  )}
                  {r.ai_analysis && <div className="mt-3 text-xs text-gray-500 italic">{r.ai_analysis}</div>}
                  {r.predicted_issues?.length > 0 && (
                    <div className="mt-2">{r.predicted_issues.map((p, i) => <div key={i} className="text-xs text-orange-600 mt-1">⚠️ {p}</div>)}</div>
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
