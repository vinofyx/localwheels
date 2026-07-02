import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';

function ScoreRing({ score, label, size = 80 }) {
  const r = (size / 2) - 8;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth="6" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`} />
        <text x={size/2} y={size/2 + 5} textAnchor="middle" fontSize="14" fontWeight="bold" fill={color}>{score}</text>
      </svg>
      <div className="text-xs text-gray-500 text-center">{label}</div>
    </div>
  );
}

function MetricCard({ label, value, unit, icon, good }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xl">{icon}</span>
        {good != null && <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${good ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>{good ? 'Good' : 'Needs Work'}</span>}
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}<span className="text-sm font-normal text-gray-400 ml-1">{unit}</span></div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}

export default function DriverPerformance() {
  const [drivers, setDrivers]   = useState([]);
  const [driverId, setDriverId] = useState('');
  const [period, setPeriod]     = useState('monthly');
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ period });
      if (driverId) params.set('driver_id', driverId);
      const r = await api.get(`/driver/performance?${params}`);
      setData(r.data);
    } catch {} finally { setLoading(false); }
  }, [driverId, period]);

  useEffect(() => {
    api.get('/drivers').then(r => setDrivers(r.data?.data?.drivers || r.data?.drivers || [])).catch(() => {});
  }, []);
  useEffect(() => { load(); }, [load]);

  const m = data?.metrics || {};

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Driver Performance</h1>
          <p className="text-sm text-gray-500 mt-1">Analytics and scoring for drivers</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <select value={driverId} onChange={e => setDriverId(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
            <option value="">All Drivers</option>
            {drivers.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
          </select>
          {['daily', 'weekly', 'monthly'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${period === p ? 'bg-blue-600 text-white' : 'border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center h-40 items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : (
        <>
          {/* Score Rings */}
          {driverId && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-800 mb-6 text-center">Performance Scores</h2>
              <div className="flex flex-wrap justify-center gap-8">
                <ScoreRing score={m.overall_score || 0}      label="Overall Score" size={100} />
                <ScoreRing score={m.on_time_pct || 0}        label="On-Time %" />
                <ScoreRing score={m.completion_rate || 0}    label="Completion Rate" />
                <ScoreRing score={m.safety_score || 0}       label="Safety Score" />
              </div>
            </div>
          )}

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard label="Trips Completed"  value={m.trips_completed || 0}  icon="✅" good={(m.completion_rate || 0) >= 80} />
            <MetricCard label="On-Time Deliveries" value={m.on_time_deliveries || 0} icon="⏰" unit={m.trips_completed ? `/ ${m.trips_completed}` : ''} good={(m.on_time_pct || 0) >= 80} />
            <MetricCard label="Total Distance"   value={m.total_distance_km || 0} unit="km" icon="🛣️" />
            <MetricCard label="Fuel Consumed"    value={m.total_fuel_l || 0}     unit="L"  icon="⛽" />
            <MetricCard label="Fuel Efficiency"  value={m.fuel_efficiency_kmpl || 0} unit="km/L" icon="🌿" good={(m.fuel_efficiency_kmpl || 0) >= 5} />
            <MetricCard label="Incidents"        value={m.incidents || 0}        icon="⚠️" good={(m.incidents || 0) === 0} />
            <MetricCard label="Trips Cancelled"  value={m.trips_cancelled || 0}  icon="❌" good={(m.trips_cancelled || 0) === 0} />
            <MetricCard label="Safety Score"     value={m.safety_score || 0}     unit="/100" icon="🛡️" good={(m.safety_score || 0) >= 80} />
          </div>

          {/* All Drivers Table */}
          {!driverId && data?.all_drivers?.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-800">All Active Drivers</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Driver', 'Phone', 'License', 'Status', 'City', 'Joined'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.all_drivers.map(d => (
                      <tr key={d._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{d.name}</td>
                        <td className="px-4 py-3 text-gray-600">{d.phone}</td>
                        <td className="px-4 py-3 font-mono text-xs">{d.license_number}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${d.status === 'available' ? 'bg-green-100 text-green-700' : d.status === 'on_trip' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                            {d.status?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{d.city || '—'}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {d.date_of_joining ? new Date(d.date_of_joining).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* AI Feedback */}
          {driverId && data?.saved?.ai_feedback && (
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🤖</span>
                <span className="font-semibold text-indigo-800">AI Performance Feedback</span>
              </div>
              <p className="text-sm text-gray-700 mb-3">{data.saved.ai_feedback}</p>
              {data.saved.ai_improvements?.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-indigo-600 mb-2">Improvement Areas:</div>
                  <ul className="space-y-1">
                    {data.saved.ai_improvements.map((imp, i) => (
                      <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-indigo-400 mt-0.5">→</span> {imp}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
