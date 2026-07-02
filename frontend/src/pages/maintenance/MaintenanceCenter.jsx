import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';

const _BASE = import.meta.env.VITE_API_URL || '/api';

const SEV_COLOR = {
  critical: 'bg-red-50 border-red-200 text-red-700',
  high:     'bg-orange-50 border-orange-200 text-orange-700',
  medium:   'bg-yellow-50 border-yellow-200 text-yellow-700',
  low:      'bg-blue-50 border-blue-200 text-blue-700',
};

export default function MaintenanceCenter() {
  const [predictions, setPredictions] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [scanRunning, setScanRunning] = useState(false);
  const [scheduling, setScheduling] = useState(null);
  const [filter, setFilter] = useState('active');

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get(`${_BASE}/maintenance-ai/predictions?status=${filter}&limit=30`),
      api.get(`${_BASE}/workorders/stats/summary`),
    ])
      .then(([p, s]) => { setPredictions(p.data.predictions || []); setStats({ ...p.data.stats, ...s.data }); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  const runFleetScan = async () => {
    setScanRunning(true);
    try {
      await api.post(`${_BASE}/maintenance-ai/predict-fleet`, {});
      setTimeout(load, 2000);
    } catch {}
    setScanRunning(false);
  };

  const scheduleNow = async (predId) => {
    setScheduling(predId);
    try {
      await api.post(`${_BASE}/maintenance-ai/schedule/${predId}`, {});
      load();
    } catch {}
    setScheduling(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Maintenance AI Center</h1>
          <p className="text-sm text-gray-500 mt-0.5">AI-powered failure predictions and auto-scheduling</p>
        </div>
        <button onClick={runFleetScan} disabled={scanRunning}
          className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50">
          {scanRunning ? '🔍 Scanning Fleet...' : '🤖 Run Fleet AI Scan'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Critical Predictions', value: stats.critical || 0, color: 'red' },
          { label: 'High Priority', value: stats.high || 0, color: 'orange' },
          { label: 'Open Work Orders', value: stats.open || 0, color: 'blue' },
          { label: 'Completed WOs', value: stats.completed || 0, color: 'green' },
        ].map(s => (
          <div key={s.label} className={`border rounded-xl p-4 ${s.color === 'red' ? 'bg-red-50 border-red-200' : s.color === 'orange' ? 'bg-orange-50 border-orange-200' : s.color === 'green' ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
            <div className={`text-2xl font-bold ${s.color === 'red' ? 'text-red-700' : s.color === 'orange' ? 'text-orange-700' : s.color === 'green' ? 'text-green-700' : 'text-blue-700'}`}>{s.value}</div>
            <div className="text-xs text-gray-600 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {['active','scheduled','resolved'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-sm rounded-lg capitalize ${filter === f ? 'bg-indigo-600 text-white' : 'border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Predictions List */}
      {loading ? (
        <div className="p-8 text-center text-gray-400">Loading predictions...</div>
      ) : predictions.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400">
          <div className="text-4xl mb-3">🤖</div>
          <div className="font-medium mb-1">No {filter} predictions</div>
          <div className="text-sm">Run the Fleet AI Scan to generate maintenance predictions</div>
        </div>
      ) : (
        <div className="space-y-3">
          {predictions.map(p => (
            <div key={p._id} className={`border rounded-xl p-4 ${SEV_COLOR[p.severity] || SEV_COLOR.low}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{p.vehicle_number || p.fleet_vehicle_id?.vehicle_number || 'Unknown'}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${SEV_COLOR[p.severity]}`}>{p.severity}</span>
                    <span className="text-xs text-gray-500">{p.component}</span>
                  </div>
                  <div className="text-sm font-medium mt-1">{p.failure_type}</div>
                  <div className="text-xs mt-1 opacity-80">{p.ai_explanation}</div>
                  <div className="flex gap-4 mt-2 text-xs opacity-70 flex-wrap">
                    <span>Probability: <strong>{Math.round((p.failure_probability || 0) * 100)}%</strong></span>
                    {p.days_until_failure && <span>Failure in: <strong>~{p.days_until_failure} days</strong></span>}
                    {p.estimated_cost && <span>Est: <strong>₹{p.estimated_cost.toLocaleString()}</strong></span>}
                    <span>Confidence: {Math.round((p.confidence_score || 0) * 100)}%</span>
                  </div>
                  {p.recommendation && <div className="text-xs mt-2 italic opacity-80">💡 {p.recommendation}</div>}
                </div>
                {p.status === 'active' && (
                  <button onClick={() => scheduleNow(p._id)} disabled={scheduling === p._id}
                    className="shrink-0 px-3 py-1.5 bg-white border text-sm rounded-lg hover:bg-gray-50 disabled:opacity-50">
                    {scheduling === p._id ? '...' : '📅 Schedule'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Links */}
      <div className="flex gap-3 flex-wrap">
        <Link to="/maintenance/workorders" className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">View Work Orders →</Link>
        <Link to="/maintenance/workshops" className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Manage Workshops →</Link>
      </div>
    </div>
  );
}
