import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';

const _BASE = import.meta.env.VITE_API_URL || '/api';

function HealthGauge({ score, size = 120 }) {
  const r = 46;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : score >= 40 ? '#f97316' : '#ef4444';
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="-rotate-90">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#f3f4f6" strokeWidth="8" />
      <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={`${filled} ${circ}`} strokeLinecap="round" />
    </svg>
  );
}

export default function VehicleHealthPage() {
  const [vehicles, setVehicles] = useState([]);
  const [selected, setSelected] = useState(null);
  const [healthDetail, setHealthDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assessing, setAssessing] = useState(false);

  useEffect(() => {
    api.get(`${_BASE}/fleet/vehicles?limit=50`)
      .then(r => setVehicles(r.data.vehicles || r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const selectVehicle = async (v) => {
    setSelected(v);
    try {
      const [eng, bat, tyr, pred] = await Promise.all([
        api.get(`${_BASE}/engine-health?vehicle_id=${v._id}&limit=1`),
        api.get(`${_BASE}/battery-health?vehicle_id=${v._id}&limit=1`),
        api.get(`${_BASE}/tyre-health?vehicle_id=${v._id}&limit=1`),
        api.get(`${_BASE}/maintenance-ai/predictions?vehicle_id=${v._id}&status=active&limit=5`),
      ]);
      setHealthDetail({
        engine: eng.data.records?.[0],
        battery: bat.data.records?.[0],
        tyre: tyr.data.records?.[0],
        predictions: pred.data.predictions || [],
      });
    } catch { setHealthDetail(null); }
  };

  const runAssessment = async (v) => {
    setAssessing(true);
    try {
      await Promise.all([
        api.post(`${_BASE}/engine-health/assess/${v._id}`, {}),
        api.post(`${_BASE}/battery-health/assess/${v._id}`, {}),
        api.post(`${_BASE}/tyre-health/assess/${v._id}`, {}),
        api.post(`${_BASE}/maintenance-ai/predict/${v._id}`, {}),
      ]);
      await selectVehicle(v);
    } catch {}
    setAssessing(false);
  };

  const d = healthDetail;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Vehicle Health Center</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Vehicle List */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 text-sm font-semibold text-gray-700">Fleet Vehicles</div>
          {loading ? <div className="p-8 text-center text-gray-400">Loading...</div> : (
            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
              {vehicles.length === 0 && <div className="p-6 text-center text-gray-400">No vehicles found</div>}
              {vehicles.map(v => (
                <div key={v._id} onClick={() => selectVehicle(v)} className={`px-4 py-3 cursor-pointer hover:bg-gray-50 ${selected?._id === v._id ? 'bg-indigo-50 border-l-2 border-indigo-500' : ''}`}>
                  <div className="font-medium text-sm text-gray-800">{v.vehicle_number}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{v.make} {v.model} • {v.vehicle_type}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Health Detail */}
        <div className="md:col-span-2 space-y-4">
          {!selected ? (
            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400">
              <div className="text-4xl mb-2">🏥</div>
              <div>Select a vehicle to view health metrics</div>
            </div>
          ) : (
            <>
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-gray-800">{selected.vehicle_number}</h2>
                    <p className="text-sm text-gray-500">{selected.make} {selected.model}</p>
                  </div>
                  <button onClick={() => runAssessment(selected)} disabled={assessing}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                    {assessing ? 'Assessing...' : '🔍 Run Full Assessment'}
                  </button>
                </div>

                {!d ? (
                  <div className="text-center text-gray-400 py-6">No health data yet — run assessment</div>
                ) : (
                  <div className="grid grid-cols-3 gap-6">
                    {/* Engine */}
                    <div className="text-center">
                      <div className="relative inline-block">
                        <HealthGauge score={d.engine?.engine_score || 0} />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div><div className="text-lg font-bold text-gray-800">{d.engine?.engine_score || 0}</div><div className="text-xs text-gray-400">Engine</div></div>
                        </div>
                      </div>
                      <div className={`mt-1 text-xs font-medium ${d.engine?.health_status === 'excellent' ? 'text-green-600' : d.engine?.health_status === 'critical' ? 'text-red-600' : 'text-yellow-600'}`}>{d.engine?.health_status || 'Unknown'}</div>
                    </div>
                    {/* Battery */}
                    <div className="text-center">
                      <div className="relative inline-block">
                        <HealthGauge score={d.battery?.health_pct || 0} />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div><div className="text-lg font-bold text-gray-800">{d.battery?.health_pct || 0}</div><div className="text-xs text-gray-400">Battery</div></div>
                        </div>
                      </div>
                      <div className={`mt-1 text-xs font-medium ${d.battery?.health_status === 'excellent' ? 'text-green-600' : d.battery?.health_status === 'replace_now' ? 'text-red-600' : 'text-yellow-600'}`}>{d.battery?.health_status || 'Unknown'}</div>
                    </div>
                    {/* Tyres */}
                    <div className="text-center">
                      <div className="relative inline-block">
                        <HealthGauge score={d.tyre?.overall_health_pct || 0} />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div><div className="text-lg font-bold text-gray-800">{d.tyre?.overall_health_pct || 0}</div><div className="text-xs text-gray-400">Tyres</div></div>
                        </div>
                      </div>
                      {d.tyre?.critical_tyres > 0 && <div className="mt-1 text-xs font-medium text-red-600">{d.tyre.critical_tyres} critical</div>}
                    </div>
                  </div>
                )}
              </div>

              {/* AI Predictions */}
              {d?.predictions?.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">AI Maintenance Predictions</h3>
                  <div className="space-y-2">
                    {d.predictions.map((p, i) => (
                      <div key={p._id || i} className={`flex items-start gap-3 p-3 rounded-lg ${p.severity === 'critical' ? 'bg-red-50' : p.severity === 'high' ? 'bg-orange-50' : 'bg-yellow-50'}`}>
                        <span>{p.severity === 'critical' ? '🚨' : '⚠️'}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-800">{p.failure_type}</div>
                          <div className="text-xs text-gray-600 mt-0.5">{p.recommendation}</div>
                          <div className="flex gap-3 mt-1 text-xs text-gray-400">
                            <span>Probability: {Math.round((p.failure_probability || 0) * 100)}%</span>
                            {p.days_until_failure && <span>In ~{p.days_until_failure} days</span>}
                            {p.estimated_cost && <span>Est. ₹{p.estimated_cost.toLocaleString()}</span>}
                          </div>
                        </div>
                        <Link to="/maintenance/center" className="text-xs text-indigo-600 hover:underline shrink-0">Schedule</Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
