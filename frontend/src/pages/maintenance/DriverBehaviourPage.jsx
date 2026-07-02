import { useState, useEffect } from 'react';
import api from '../../api/client';

const _BASE = import.meta.env.VITE_API_URL || '/api';

const GRADE_COLOR = { 'A+': 'text-green-700 bg-green-100', A: 'text-green-600 bg-green-50', B: 'text-blue-600 bg-blue-100', C: 'text-yellow-600 bg-yellow-100', D: 'text-orange-600 bg-orange-100', F: 'text-red-600 bg-red-100' };
const TREND_ICON = { improving: '↑', stable: '→', declining: '↓' };
const TREND_COLOR = { improving: 'text-green-600', stable: 'text-gray-500', declining: 'text-red-500' };

function ScoreBar({ label, value, color = 'indigo' }) {
  const colorMap = { indigo: 'bg-indigo-500', green: 'bg-green-500', blue: 'bg-blue-500', yellow: 'bg-yellow-500' };
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium text-gray-700">{value ?? '—'}/100</span>
      </div>
      <div className="bg-gray-100 rounded-full h-2">
        <div className={`${colorMap[color]} h-2 rounded-full`} style={{ width: `${value || 0}%` }} />
      </div>
    </div>
  );
}

export default function DriverBehaviourPage() {
  const [records, setRecords] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drivers, setDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [analyzing, setAnalyzing] = useState(null);
  const [fleetAvg, setFleetAvg] = useState(null);
  const [view, setView] = useState('leaderboard');

  const load = () => {
    Promise.all([
      api.get(`${_BASE}/driver-behaviour?limit=30`),
      api.get(`${_BASE}/driver-behaviour/leaderboard`),
    ])
      .then(([r, l]) => { setRecords(r.data.records || []); setLeaderboard(l.data.leaderboard || []); setFleetAvg(r.data.fleet_avg_score); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { api.get(`${_BASE}/drivers?limit=50`).then(r => setDrivers(r.data.drivers || r.data || [])).catch(() => {}); }, []);

  const analyze = async () => {
    if (!selectedDriver) return;
    setAnalyzing(selectedDriver);
    try {
      await api.post(`${_BASE}/driver-behaviour/analyze/${selectedDriver}`, { days: 7 });
      load();
    } catch {}
    setAnalyzing(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Driver Behaviour Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">AI-powered safety scoring and driver coaching</p>
        </div>
        {fleetAvg && (
          <div className="text-center bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-2">
            <div className="text-xl font-bold text-indigo-700">{fleetAvg}</div>
            <div className="text-xs text-indigo-500">Fleet Avg Score</div>
          </div>
        )}
      </div>

      {/* Analyze Panel */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Analyze Driver Behaviour</h3>
        <div className="flex gap-3">
          <select value={selectedDriver} onChange={e => setSelectedDriver(e.target.value)} className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400">
            <option value="">Select driver</option>
            {drivers.map(d => <option key={d._id} value={d._id}>{d.full_name || d.name || d.driver_name}</option>)}
          </select>
          <button onClick={analyze} disabled={!selectedDriver || analyzing === selectedDriver}
            className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50">
            {analyzing === selectedDriver ? 'Analyzing...' : '🧠 Analyze (7 days)'}
          </button>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2">
        {[['leaderboard', '🏆 Leaderboard'], ['records', '📋 All Records']].map(([v, l]) => (
          <button key={v} onClick={() => setView(v)} className={`px-3 py-1.5 text-sm rounded-lg ${view === v ? 'bg-indigo-600 text-white' : 'border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>{l}</button>
        ))}
      </div>

      {loading ? <div className="p-8 text-center text-gray-400">Loading...</div> : view === 'leaderboard' ? (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 text-sm font-semibold text-gray-700">Driver Safety Leaderboard</div>
          {leaderboard.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No behaviour data. Run analysis for drivers.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Rank</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Driver</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">Score</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">Safety</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">Eco</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500">Grade</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leaderboard.map((d, i) => (
                  <tr key={d._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-bold text-gray-400">#{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{d.driver_name || 'Unknown'}</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-800">{d.overall_score}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{d.safety_score}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{d.eco_score}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${GRADE_COLOR[d.grade] || 'bg-gray-100 text-gray-600'}`}>{d.grade}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-bold ${TREND_COLOR[d.trend]}`}>{TREND_ICON[d.trend] || '→'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {records.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400">No behaviour records yet</div>
          ) : records.map(r => (
            <div key={r._id} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-800">{r.driver_id?.full_name || r.driver_name || 'Unknown'}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{new Date(r.period_start).toLocaleDateString()} – {new Date(r.period_end).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-bold px-3 py-1 rounded-full ${GRADE_COLOR[r.grade] || 'bg-gray-100 text-gray-600'}`}>{r.grade}</span>
                  <span className={`text-sm font-bold ${TREND_COLOR[r.score_trend]}`}>{TREND_ICON[r.score_trend]}</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <ScoreBar label="Overall Score" value={r.overall_score} color="indigo" />
                <ScoreBar label="Safety Score" value={r.safety_score} color="green" />
                <ScoreBar label="Eco Score" value={r.eco_score} color="blue" />
              </div>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-center mb-4">
                {[
                  { label: 'Hard Brakes', value: r.events?.harsh_braking || 0 },
                  { label: 'Hard Accel', value: r.events?.harsh_acceleration || 0 },
                  { label: 'Speeding', value: r.events?.speeding_events || 0 },
                  { label: 'Violations', value: r.events?.speed_limit_violations || 0 },
                  { label: 'Max Speed', value: r.metrics?.max_speed_kmh ? r.metrics.max_speed_kmh + 'kmh' : '—' },
                  { label: 'Idle %', value: r.metrics?.idle_pct ? r.metrics.idle_pct + '%' : '—' },
                ].map(e => (
                  <div key={e.label} className="bg-gray-50 rounded-lg p-2">
                    <div className={`text-sm font-bold ${(typeof e.value === 'number' && e.value > 5) ? 'text-red-600' : 'text-gray-700'}`}>{e.value}</div>
                    <div className="text-xs text-gray-400">{e.label}</div>
                  </div>
                ))}
              </div>
              {r.ai_coaching && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-xs text-indigo-700">
                  <strong>AI Coach:</strong> {r.ai_coaching}
                </div>
              )}
              {r.improvements?.length > 0 && (
                <div className="mt-2">
                  {r.improvements.map((imp, i) => <div key={i} className="text-xs text-orange-600 mt-1">⚠️ {imp}</div>)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
