import { useState, useEffect } from 'react';
import api from '../../api/client';

const _BASE = import.meta.env.VITE_API_URL || '/api';

const RISK_COLOR = { none: 'bg-green-100 text-green-700', low: 'bg-blue-100 text-blue-700', medium: 'bg-yellow-100 text-yellow-700', high: 'bg-red-100 text-red-700' };

export default function FuelIntelligence() {
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({});
  const [theftAlerts, setTheftAlerts] = useState([]);
  const [fleetSummary, setFleetSummary] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [days, setDays] = useState(7);

  const load = () => {
    Promise.all([
      api.get(`${_BASE}/fuel-intelligence?limit=20`),
      api.get(`${_BASE}/fuel-intelligence/theft-alerts`),
      api.get(`${_BASE}/fuel-intelligence/fleet-summary`),
    ])
      .then(([r, t, f]) => { setRecords(r.data.records || []); setSummary(r.data.summary || {}); setTheftAlerts(t.data.alerts || []); setFleetSummary(f.data.fleet || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { api.get(`${_BASE}/fleet/vehicles?limit=50`).then(r => setVehicles(r.data.vehicles || r.data || [])).catch(() => {}); }, []);

  const analyze = async () => {
    if (!selectedVehicle) return;
    setAnalyzing(selectedVehicle);
    try {
      await api.post(`${_BASE}/fuel-intelligence/analyze/${selectedVehicle}`, { days });
      load();
    } catch {}
    setAnalyzing(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fuel Intelligence</h1>
          <p className="text-sm text-gray-500 mt-0.5">AI-powered fuel analytics and theft detection</p>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Fuel (L)', value: summary.total_fuel?.toFixed(0) || '0', color: 'blue' },
          { label: 'Total Cost', value: summary.total_cost ? '₹' + Math.round(summary.total_cost / 1000) + 'K' : '₹0', color: 'indigo' },
          { label: 'Avg Mileage', value: summary.avg_mileage ? summary.avg_mileage.toFixed(1) + ' km/L' : '—', color: 'green' },
          { label: 'Theft Events', value: summary.total_theft_events || 0, color: 'red' },
        ].map(s => (
          <div key={s.label} className={`border rounded-xl p-4 ${s.color === 'red' ? 'bg-red-50 border-red-200' : s.color === 'green' ? 'bg-green-50 border-green-200' : s.color === 'blue' ? 'bg-blue-50 border-blue-200' : s.color === 'indigo' ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50 border-gray-200'}`}>
            <div className={`text-2xl font-bold ${s.color === 'red' ? 'text-red-700' : s.color === 'green' ? 'text-green-700' : s.color === 'blue' ? 'text-blue-700' : s.color === 'indigo' ? 'text-indigo-700' : 'text-gray-700'}`}>{s.value}</div>
            <div className="text-xs text-gray-600 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Theft Alerts */}
      {theftAlerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-red-700 mb-3">🚨 Active Theft Alerts</h2>
          <div className="space-y-2">
            {theftAlerts.map(a => (
              <div key={a._id} className="flex items-center justify-between p-3 bg-white border border-red-100 rounded-lg text-sm">
                <div>
                  <span className="font-medium text-gray-800">{a.vehicle_number}</span>
                  <span className="text-gray-500 ml-2">• {a.theft_events} theft events, {a.suspected_theft_liters?.toFixed(1)}L suspected</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${RISK_COLOR[a.theft_risk]}`}>{a.theft_risk} risk</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analyze Panel */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Analyze Vehicle Fuel</h2>
        <div className="flex gap-3 flex-wrap">
          <select value={selectedVehicle} onChange={e => setSelectedVehicle(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400">
            <option value="">Select vehicle</option>
            {vehicles.map(v => <option key={v._id} value={v._id}>{v.vehicle_number}</option>)}
          </select>
          <select value={days} onChange={e => setDays(Number(e.target.value))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400">
            {[7, 14, 30].map(d => <option key={d} value={d}>{d} days</option>)}
          </select>
          <button onClick={analyze} disabled={!selectedVehicle || analyzing === selectedVehicle} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50">
            {analyzing === selectedVehicle ? 'Analyzing...' : '⛽ Analyze Fuel'}
          </button>
        </div>
      </div>

      {/* Fleet Fuel Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 text-sm font-semibold text-gray-700">Fleet Fuel Status</div>
        {loading ? <div className="p-8 text-center text-gray-400">Loading...</div> : fleetSummary.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No fuel data. Analyze vehicles with telemetry data.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Vehicle</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">Mileage</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">Efficiency</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">Cost</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Theft Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {fleetSummary.map((r, i) => (
                <tr key={r._id || i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{r.vehicle_number}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{r.avg_mileage_kmpl ? r.avg_mileage_kmpl.toFixed(1) + ' km/L' : '—'}</td>
                  <td className="px-4 py-3 text-right">
                    {r.efficiency_pct ? (
                      <span className={r.efficiency_pct >= 90 ? 'text-green-600' : r.efficiency_pct >= 70 ? 'text-yellow-600' : 'text-red-600'}>{r.efficiency_pct}%</span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">{r.total_fuel_cost ? '₹' + Math.round(r.total_fuel_cost).toLocaleString() : '—'}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${RISK_COLOR[r.theft_risk || 'none']}`}>{r.theft_risk || 'none'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Recent Analysis */}
      {records.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Recent Fuel Analysis</h2>
          <div className="space-y-3">
            {records.slice(0, 5).map(r => (
              <div key={r._id} className="border border-gray-100 rounded-lg p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-medium text-gray-800">{r.vehicle_number}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {r.total_distance_km?.toFixed(0)}km • {r.total_fuel_consumed_l?.toFixed(1)}L • {r.avg_mileage_kmpl?.toFixed(1)} km/L
                      {r.theft_events > 0 && <span className="text-red-600 ml-2">⚠️ {r.theft_events} theft events</span>}
                    </div>
                    {r.ai_insights && <div className="text-xs text-gray-500 mt-1 italic">{r.ai_insights.slice(0, 120)}...</div>}
                  </div>
                  <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${RISK_COLOR[r.theft_risk]}`}>{r.theft_risk}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
