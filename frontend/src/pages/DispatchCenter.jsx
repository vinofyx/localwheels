import { useState, useEffect, useCallback } from 'react';
import {
  Truck, User, Package, AlertTriangle, CheckCircle, Clock,
  RefreshCw, Play, MapPin, FileText, Zap, Calendar,
  ChevronDown, ChevronRight, X, Plus, ArrowRight, Loader,
  BarChart2, List, Activity, Navigation,
} from 'lucide-react';
import axios from 'axios';

const _BASE = import.meta.env.VITE_API_URL || '/api';
const API = `${_BASE}/dispatch`;

// ─── Helpers ─────────────────────────────────────────────────────────────────
const STATUS_COLORS = {
  pending:    'bg-yellow-100 text-yellow-800',
  ready:      'bg-blue-100 text-blue-800',
  assigned:   'bg-indigo-100 text-indigo-800',
  loading:    'bg-orange-100 text-orange-800',
  dispatched: 'bg-green-100 text-green-800',
  delayed:    'bg-red-100 text-red-800',
  cancelled:  'bg-gray-100 text-gray-600',
  planned:    'bg-blue-100 text-blue-800',
  approved:   'bg-indigo-100 text-indigo-800',
  in_progress:'bg-green-100 text-green-800',
  completed:  'bg-gray-100 text-gray-700',
  exception:  'bg-red-100 text-red-800',
};

const PRIORITY_COLORS = {
  emergency: 'bg-red-600 text-white',
  high:      'bg-orange-500 text-white',
  normal:    'bg-blue-500 text-white',
  low:       'bg-gray-400 text-white',
};

function Badge({ label, colorClass }) {
  return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${colorClass}`}>{label}</span>;
}

function KpiCard({ label, value, sub, color = 'text-gray-800', icon: Icon }) {
  return (
    <div className="bg-white rounded-xl shadow p-4 flex items-start gap-3">
      {Icon && <div className="p-2 bg-indigo-50 rounded-lg"><Icon size={18} className="text-indigo-600" /></div>}
      <div>
        <p className="text-xs text-gray-500 mb-0.5">{label}</p>
        <p className={`text-2xl font-bold ${color}`}>{value ?? '—'}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function DispatchCenter() {
  const [tab, setTab]         = useState('live');
  const [live, setLive]       = useState(null);
  const [queue, setQueue]     = useState({ items: [], status_counts: {} });
  const [plans, setPlans]     = useState([]);
  const [trips, setTrips]     = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [calendar, setCalendar]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [optimizing, setOptimizing] = useState(false);
  const [ops, setOps]               = useState({});
  const [opsLoading, setOpsLoading] = useState(false);

  // Modals / panels
  const [showAddQueue, setShowAddQueue]   = useState(false);
  const [showException, setShowException] = useState(false);
  const [activeTripId, setActiveTripId]   = useState(null);
  const [selectedPlan, setSelectedPlan]   = useState(null);

  const token = localStorage.getItem('lw_token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchLive = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/live`, { headers });
      setLive(data);
    } catch { /* silent */ }
  }, []);

  const fetchQueue = useCallback(async () => {
    const { data } = await axios.get(`${API}/queue`, { headers });
    setQueue(data);
  }, []);

  const fetchPlans = useCallback(async () => {
    const { data } = await axios.get(`${API}/plans`, { headers });
    setPlans(data.plans || []);
  }, []);

  const fetchTrips = useCallback(async () => {
    const { data } = await axios.get(`${API}/trips`, { headers });
    setTrips(data.trips || []);
  }, []);

  const fetchAnalytics = useCallback(async () => {
    const { data } = await axios.get(`${API}/analytics?days=30`, { headers });
    setAnalytics(data);
  }, []);

  const fetchCalendar = useCallback(async () => {
    const { data } = await axios.get(`${API}/calendar`, { headers });
    setCalendar(data || []);
  }, []);

  useEffect(() => {
    fetchLive();
    const iv = setInterval(fetchLive, 30000);
    return () => clearInterval(iv);
  }, [fetchLive]);

  useEffect(() => {
    if (tab === 'queue')     fetchQueue();
    if (tab === 'plans')     { fetchPlans(); fetchQueue(); }
    if (tab === 'trips')     fetchTrips();
    if (tab === 'analytics') fetchAnalytics();
    if (tab === 'calendar')  fetchCalendar();
  }, [tab]);

  // ── AI Optimize ──────────────────────────────────────────────────────────────
  const handleOptimize = async () => {
    setOptimizing(true);
    setError('');
    try {
      const { data } = await axios.post(`${API}/optimize`, {}, { headers });
      alert(`${data.plans_created} dispatch plan(s) created by AI`);
      fetchPlans();
      fetchQueue();
      setTab('plans');
    } catch (err) {
      setError(err.response?.data?.error || 'Optimize failed');
    } finally {
      setOptimizing(false);
    }
  };

  // ── Approve Plan → Create Trip ────────────────────────────────────────────
  const handleApprovePlan = async (planId) => {
    setLoading(true);
    try {
      await axios.post(`${API}/create`, { dispatch_plan_id: planId, approve: true }, { headers });
      fetchPlans();
      fetchTrips();
      setTab('trips');
    } catch (err) {
      setError(err.response?.data?.error || 'Approval failed');
    } finally {
      setLoading(false);
    }
  };

  // ── Start trip ────────────────────────────────────────────────────────────
  const handleStartTrip = async (tripId) => {
    setLoading(true);
    try {
      await axios.post(`${API}/start-trip`, { trip_id: tripId }, { headers });
      fetchTrips();
      fetchLive();
    } catch (err) {
      setError(err.response?.data?.error || 'Start failed');
    } finally {
      setLoading(false);
    }
  };

  // ── Complete trip ─────────────────────────────────────────────────────────
  const handleCompleteTrip = async (tripId) => {
    setLoading(true);
    try {
      await axios.post(`${API}/complete-trip`, { trip_id: tripId }, { headers });
      fetchTrips();
      fetchLive();
    } catch (err) {
      setError(err.response?.data?.error || 'Complete failed');
    } finally {
      setLoading(false);
    }
  };

  // ── Generate manifest ─────────────────────────────────────────────────────
  const handleGenerateManifest = async (tripId) => {
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/generate-manifest`, { trip_id: tripId }, { headers });
      alert(`Manifest ${data.manifest.manifest_number} generated`);
    } catch (err) {
      setError(err.response?.data?.error || 'Manifest failed');
    } finally {
      setLoading(false);
    }
  };

  // ─── TABS ─────────────────────────────────────────────────────────────────
  const TABS = [
    { id: 'live',      label: 'Live View',    icon: Activity },
    { id: 'queue',     label: 'Queue',        icon: List },
    { id: 'plans',     label: 'AI Plans',     icon: Zap },
    { id: 'trips',     label: 'Trips',        icon: Navigation },
    { id: 'analytics', label: 'Analytics',    icon: BarChart2 },
    { id: 'calendar',  label: 'Calendar',     icon: Calendar },
    { id: 'ops',       label: 'Dispatcher Ops', icon: User },
  ];

  return (
    <div className="p-4 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dispatch Center</h1>
          <p className="text-sm text-gray-500">AI-powered dispatch management &amp; live tracking</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchLive}
            className="flex items-center gap-1 px-3 py-2 bg-white border rounded-lg text-sm hover:bg-gray-50"
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            onClick={handleOptimize}
            disabled={optimizing}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60"
          >
            {optimizing ? <Loader size={14} className="animate-spin" /> : <Zap size={14} />}
            {optimizing ? 'Optimizing…' : 'AI Optimize'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded-lg mb-4 flex items-center gap-2">
          <AlertTriangle size={14} /> {error}
          <button onClick={() => setError('')} className="ml-auto"><X size={14} /></button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* ── LIVE VIEW ─────────────────────────────────────────────────────── */}
      {tab === 'live' && (
        <div className="space-y-4">
          {/* Queue KPIs */}
          {live && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: 'Pending',    value: live.queue_counts?.pending    || 0, color: 'text-yellow-600' },
                { label: 'Assigned',   value: live.queue_counts?.assigned   || 0, color: 'text-indigo-600' },
                { label: 'Loading',    value: live.queue_counts?.loading    || 0, color: 'text-orange-600' },
                { label: 'Dispatched', value: live.queue_counts?.dispatched || 0, color: 'text-green-600' },
                { label: 'Delayed',    value: live.queue_counts?.delayed    || 0, color: 'text-red-600' },
                { label: 'Cancelled',  value: live.queue_counts?.cancelled  || 0, color: 'text-gray-500' },
              ].map(k => (
                <div key={k.label} className="bg-white rounded-xl shadow p-3 text-center">
                  <p className="text-xs text-gray-500">{k.label}</p>
                  <p className={`text-3xl font-bold ${k.color}`}>{k.value}</p>
                </div>
              ))}
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-4">
            {/* Active Trips */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow p-4">
              <h2 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><Truck size={16}/> Active Trips</h2>
              {live?.active_trips?.length === 0 && <p className="text-sm text-gray-400">No active trips</p>}
              <div className="space-y-2">
                {live?.active_trips?.map(t => (
                  <div key={t._id} className="flex items-center justify-between border rounded-lg px-3 py-2 hover:bg-gray-50">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{t.trip_number}</p>
                      <p className="text-xs text-gray-500">{t.vehicle_number} · {t.driver_name} · {t.total_stops || 1} stop(s)</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {t.has_exception && <Badge label="Exception" colorClass="bg-red-100 text-red-700" />}
                      <Badge label={t.status} colorClass={STATUS_COLORS[t.status] || 'bg-gray-100'} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Resources panel */}
            <div className="space-y-4">
              <div className="bg-white rounded-xl shadow p-4">
                <h2 className="font-semibold text-gray-700 mb-2 flex items-center gap-2"><Truck size={16}/> Available Vehicles ({live?.available_vehicles?.length || 0})</h2>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {live?.available_vehicles?.map(v => (
                    <div key={v._id} className="flex justify-between text-xs py-1 border-b last:border-0">
                      <span className="font-medium">{v.vehicle_number}</span>
                      <span className="text-gray-500">{v.vehicle_type} · ❤ {v.health_score}</span>
                    </div>
                  ))}
                  {!live?.available_vehicles?.length && <p className="text-xs text-gray-400">None available</p>}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow p-4">
                <h2 className="font-semibold text-gray-700 mb-2 flex items-center gap-2"><User size={16}/> Available Drivers ({live?.available_drivers?.length || 0})</h2>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {live?.available_drivers?.map(d => (
                    <div key={d._id} className="flex justify-between text-xs py-1 border-b last:border-0">
                      <span className="font-medium">{d.name}</span>
                      <span className="text-gray-500">{d.phone}</span>
                    </div>
                  ))}
                  {!live?.available_drivers?.length && <p className="text-xs text-gray-400">None available</p>}
                </div>
              </div>

              {/* Open exceptions */}
              {live?.open_exceptions?.length > 0 && (
                <div className="bg-white rounded-xl shadow p-4">
                  <h2 className="font-semibold text-red-600 mb-2 flex items-center gap-2"><AlertTriangle size={16}/> Open Exceptions ({live.open_exceptions.length})</h2>
                  <div className="space-y-1">
                    {live.open_exceptions.slice(0, 5).map(ex => (
                      <div key={ex._id} className="text-xs border-l-4 border-red-400 pl-2 py-1">
                        <p className="font-medium text-gray-700">{ex.exception_type?.replace(/_/g,' ')}</p>
                        <p className="text-gray-500">{ex.description?.slice(0, 60)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Pending AI Plans */}
          {live?.pending_plans?.length > 0 && (
            <div className="bg-white rounded-xl shadow p-4">
              <h2 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><Zap size={16}/> Pending AI Plans</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {live.pending_plans.map(p => (
                  <div key={p._id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm font-semibold">{p.plan_number}</p>
                      <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">{p.ai_confidence}% conf</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">{p.total_stops || (p.lr_numbers?.length || 0)} shipment(s) · {p.vehicle_number || 'No vehicle'}</p>
                    <button
                      onClick={() => handleApprovePlan(p._id)}
                      className="w-full text-xs bg-green-600 text-white py-1.5 rounded hover:bg-green-700"
                    >Approve &amp; Create Trip</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── QUEUE ─────────────────────────────────────────────────────────── */}
      {tab === 'queue' && (
        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-3">
              <h2 className="font-semibold text-gray-700">Dispatch Queue</h2>
              <span className="text-sm text-gray-400">{queue.total || 0} total</span>
              <div className="flex gap-1">
                {Object.entries(queue.status_counts || {}).map(([s, c]) => (
                  <span key={s} className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[s] || 'bg-gray-100'}`}>{s}: {c}</span>
                ))}
              </div>
            </div>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 border-b">
                <th className="py-2 text-left">LR #</th>
                <th className="text-left">Receiver</th>
                <th className="text-left">Destination</th>
                <th className="text-left">Priority</th>
                <th className="text-left">Status</th>
                <th className="text-left">SLA Deadline</th>
              </tr>
            </thead>
            <tbody>
              {queue.items?.map(q => (
                <tr key={q._id} className="border-b hover:bg-gray-50">
                  <td className="py-2 font-mono text-xs text-indigo-700">{q.lr_number}</td>
                  <td className="text-xs text-gray-700">{q.receiver_name}</td>
                  <td className="text-xs text-gray-500">{q.destination}</td>
                  <td><Badge label={q.priority} colorClass={PRIORITY_COLORS[q.priority] || 'bg-gray-100'} /></td>
                  <td><Badge label={q.status} colorClass={STATUS_COLORS[q.status] || 'bg-gray-100'} /></td>
                  <td className="text-xs text-gray-500">
                    {q.sla_deadline ? new Date(q.sla_deadline).toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
              {!queue.items?.length && (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">Queue is empty</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── AI PLANS ──────────────────────────────────────────────────────── */}
      {tab === 'plans' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold text-gray-700">AI Dispatch Plans</h2>
            <button
              onClick={handleOptimize}
              disabled={optimizing}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-60"
            >
              {optimizing ? <Loader size={14} className="animate-spin" /> : <Zap size={14} />}
              Run AI Optimize
            </button>
          </div>

          {plans.map(p => (
            <div key={p._id} className="bg-white rounded-xl shadow p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-gray-800">{p.plan_number}</p>
                  <p className="text-xs text-gray-500">
                    {p.lr_numbers?.length || 0} shipment(s) · {p.total_weight_kg} kg ·
                    {p.vehicle_number || 'No vehicle'} / {p.driver_name || 'No driver'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">AI: {p.ai_confidence}%</span>
                  <Badge label={p.status} colorClass={STATUS_COLORS[p.status] || 'bg-gray-100'} />
                  <Badge label={p.load_type} colorClass="bg-gray-100 text-gray-600" />
                </div>
              </div>

              {p.ai_reasoning && (
                <p className="text-xs text-gray-500 italic mb-2 border-l-2 border-indigo-200 pl-2">{p.ai_reasoning}</p>
              )}

              {p.ai_risks?.length > 0 && (
                <div className="flex gap-1 flex-wrap mb-2">
                  {p.ai_risks.map((r, i) => (
                    <span key={i} className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded">{r}</span>
                  ))}
                </div>
              )}

              {(p.status === 'draft' || p.status === 'approved') && !p.trip_id && (
                <button
                  onClick={() => handleApprovePlan(p._id)}
                  disabled={loading}
                  className="mt-2 px-4 py-1.5 bg-green-600 text-white rounded text-xs font-semibold hover:bg-green-700 disabled:opacity-60"
                >
                  Approve &amp; Create Trip
                </button>
              )}
            </div>
          ))}

          {plans.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <Zap size={40} className="mx-auto mb-2 opacity-30" />
              <p>No dispatch plans yet. Click <strong>Run AI Optimize</strong> to generate plans.</p>
            </div>
          )}
        </div>
      )}

      {/* ── TRIPS ─────────────────────────────────────────────────────────── */}
      {tab === 'trips' && (
        <div className="space-y-3">
          <h2 className="font-semibold text-gray-700">Trips</h2>
          {trips.map(t => (
            <TripCard
              key={t._id}
              trip={t}
              onStart={handleStartTrip}
              onComplete={handleCompleteTrip}
              onManifest={handleGenerateManifest}
              loading={loading}
            />
          ))}
          {trips.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <Truck size={40} className="mx-auto mb-2 opacity-30" />
              <p>No trips yet. Approve a dispatch plan to create trips.</p>
            </div>
          )}
        </div>
      )}

      {/* ── ANALYTICS ─────────────────────────────────────────────────────── */}
      {tab === 'analytics' && analytics && (
        <AnalyticsView analytics={analytics} />
      )}

      {/* ── CALENDAR ──────────────────────────────────────────────────────── */}
      {tab === 'calendar' && (
        <CalendarView events={calendar} />
      )}

      {/* ── DISPATCHER OPS ────────────────────────────────────────────────── */}
      {tab === 'ops' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-700">Dispatcher Operations</h2>
            <button disabled={opsLoading} onClick={async () => {
              setOpsLoading(true);
              try {
                const [perf, shifts, approvals, impact] = await Promise.all([
                  axios.get(`${API}/performance`, { headers }),
                  axios.get(`${API}/shifts`, { headers }),
                  axios.get(`${API}/approvals`, { headers }),
                  axios.get(`${API}/impact`, { headers }),
                ]);
                setOps({ performance: perf.data, shifts: shifts.data, approvals: approvals.data, impact: impact.data });
              } catch { /* graceful */ } finally { setOpsLoading(false); }
            }} className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg disabled:opacity-50">
              {opsLoading ? 'Loading…' : 'Refresh Ops Data'}
            </button>
          </div>

          {!ops.performance && !opsLoading && (
            <div className="text-center py-10 text-gray-400">
              <User size={36} className="mx-auto mb-2 text-gray-300" />
              <p>Click "Refresh Ops Data" to load dispatcher intelligence.</p>
            </div>
          )}

          {/* Dispatcher Performance */}
          {ops.performance && (
            <div className="bg-white border rounded-xl p-5">
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><BarChart2 size={16} /> Dispatcher Performance</h3>
              {(ops.performance.dispatchers||[]).length === 0 ? <p className="text-gray-400 text-sm">No performance data yet.</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b text-xs text-gray-500 uppercase">
                      <th className="pb-2 text-left">Dispatcher</th>
                      <th className="pb-2 text-center">Plans Created</th>
                      <th className="pb-2 text-center">Plans Approved</th>
                      <th className="pb-2 text-center">Approval Rate</th>
                      <th className="pb-2 text-center">Avg Planning (min)</th>
                    </tr></thead>
                    <tbody className="divide-y">
                      {(ops.performance.dispatchers||[]).map((d,i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="py-2">{d.dispatcher_id}</td>
                          <td className="py-2 text-center">{d.plans_created}</td>
                          <td className="py-2 text-center">{d.plans_approved}</td>
                          <td className="py-2 text-center">
                            <span className={`font-medium ${d.approval_rate_pct >= 80 ? 'text-green-600' : d.approval_rate_pct >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {d.approval_rate_pct}%
                            </span>
                          </td>
                          <td className="py-2 text-center">{d.avg_planning_time_min}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Active Shifts */}
          {ops.shifts && (
            <div className="bg-white border rounded-xl p-5">
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><Clock size={16} /> Dispatcher Shifts</h3>
              {(ops.shifts.shifts||[]).length === 0 ? <p className="text-gray-400 text-sm">No active shifts.</p> : (
                <div className="space-y-2">
                  {(ops.shifts.shifts||[]).map((s,i) => (
                    <div key={i} className="flex items-center justify-between border rounded-lg p-3">
                      <div>
                        <div className="font-medium text-sm">{s.dispatcher_name}</div>
                        <div className="text-xs text-gray-400">
                          Started {new Date(s.shift_start).toLocaleTimeString()}
                          {s.handed_over_to_name ? ` → Handed over to ${s.handed_over_to_name}` : ''}
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {s.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Pending Approvals */}
          {ops.approvals && (
            <div className="bg-white border rounded-xl p-5">
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><CheckCircle size={16} /> Pending Approvals</h3>
              {(ops.approvals.approvals||[]).length === 0 ? <p className="text-gray-400 text-sm">No pending approvals.</p> : (
                <div className="space-y-2">
                  {(ops.approvals.approvals||[]).filter(a => a.status === 'pending').map((a,i) => (
                    <div key={i} className="border border-orange-200 bg-orange-50 rounded-lg p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium text-sm">{a.reason?.replace(/_/g,' ')}</div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            By {a.requested_by_name} · ₹{a.value_amount?.toLocaleString()}
                            {a.risk_notes && ` · ${a.risk_notes}`}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={async () => {
                            await axios.post(`${API}/approve`, { approval_id: a._id, approve: true }, { headers });
                            const { data } = await axios.get(`${API}/approvals`, { headers });
                            setOps(prev => ({ ...prev, approvals: data }));
                          }} className="px-2 py-1 text-xs bg-green-600 text-white rounded">Approve</button>
                          <button onClick={async () => {
                            await axios.post(`${API}/approve`, { approval_id: a._id, approve: false }, { headers });
                            const { data } = await axios.get(`${API}/approvals`, { headers });
                            setOps(prev => ({ ...prev, approvals: data }));
                          }} className="px-2 py-1 text-xs bg-red-600 text-white rounded">Reject</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Customer Impact */}
          {ops.impact && (
            <div className="bg-white border rounded-xl p-5">
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><AlertTriangle size={16} /> Customer Impact Events</h3>
              {(ops.impact.events||[]).length === 0 ? <p className="text-gray-400 text-sm">No impact events recorded.</p> : (
                <div className="space-y-2">
                  {(ops.impact.events||[]).slice(0,10).map((ev,i) => (
                    <div key={i} className="flex items-start gap-3 border rounded-lg p-3">
                      <AlertTriangle size={16} className="text-orange-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm capitalize">{ev.change_type?.replace(/_/g,' ')}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{ev.change_reason}</div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {ev.affected_customers?.length || 0} customers affected · {new Date(ev.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Trip Card ───────────────────────────────────────────────────────────────
function TripCard({ trip, onStart, onComplete, onManifest, loading }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow p-4">
      <div
        className="flex items-start justify-between cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <p className="font-semibold text-gray-800">{trip.trip_number}</p>
            {trip.has_exception && <AlertTriangle size={14} className="text-red-500" />}
          </div>
          <p className="text-xs text-gray-500">
            {trip.vehicle_number || '—'} · {trip.driver_name || '—'} ·
            {trip.total_stops || trip.shipment_ids?.length || 1} stop(s)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge label={trip.status} colorClass={STATUS_COLORS[trip.status] || 'bg-gray-100'} />
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t space-y-3">
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div><p className="text-gray-400">Planned Start</p><p>{trip.planned_start ? new Date(trip.planned_start).toLocaleString() : '—'}</p></div>
            <div><p className="text-gray-400">Distance</p><p>{trip.total_distance_km ? `${trip.total_distance_km} km` : '—'}</p></div>
            <div><p className="text-gray-400">Fuel Cost</p><p>{trip.fuel_cost ? `₹${trip.fuel_cost}` : '—'}</p></div>
          </div>

          {trip.stops?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-1">Stops</p>
              <div className="space-y-1">
                {trip.stops.map(s => (
                  <div key={s.sequence} className="flex items-center gap-2 text-xs">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0">{s.sequence}</span>
                    <MapPin size={11} className="text-gray-400" />
                    <span className="text-gray-700 truncate">{s.address}</span>
                    <Badge label={s.status} colorClass={STATUS_COLORS[s.status] || 'bg-gray-100'} />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            {trip.status === 'planned' || trip.status === 'approved' ? (
              <button
                onClick={() => onStart(trip._id)}
                disabled={loading}
                className="px-3 py-1.5 bg-green-600 text-white rounded text-xs font-semibold hover:bg-green-700 disabled:opacity-60 flex items-center gap-1"
              >
                <Play size={12}/> Start Trip
              </button>
            ) : null}

            {trip.status === 'in_progress' && (
              <button
                onClick={() => onComplete(trip._id)}
                disabled={loading}
                className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700 disabled:opacity-60 flex items-center gap-1"
              >
                <CheckCircle size={12}/> Complete
              </button>
            )}

            {!trip.manifest_id && (
              <button
                onClick={() => onManifest(trip._id)}
                disabled={loading}
                className="px-3 py-1.5 bg-gray-600 text-white rounded text-xs font-semibold hover:bg-gray-700 disabled:opacity-60 flex items-center gap-1"
              >
                <FileText size={12}/> Generate Manifest
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Analytics View ───────────────────────────────────────────────────────────
function AnalyticsView({ analytics: a }) {
  const kpis = [
    { label: 'Total Trips',         value: a.trips?.total_trips    || 0, icon: Truck },
    { label: 'Completed Trips',     value: a.trips?.completed      || 0, icon: CheckCircle, color: 'text-green-600' },
    { label: 'Exceptions',          value: a.trips?.with_exception || 0, icon: AlertTriangle, color: 'text-red-500' },
    { label: 'AI Plans',            value: a.plans?.total_plans    || 0, icon: Zap },
    { label: 'AI Acceptance Rate',  value: `${a.ai_acceptance_rate || 0}%`, icon: Activity, color: 'text-indigo-600' },
    { label: 'SLA Compliance',      value: `${a.sla_compliance_pct || 0}%`, icon: Clock, color: 'text-green-600' },
    { label: 'Avg Vehicle Util.',   value: `${Math.round(a.plans?.avg_utilization || 0)}%`, icon: Package },
    { label: 'Total Distance',      value: `${Math.round(a.trips?.total_km || 0)} km`, icon: Navigation },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">Last {a.period_days} days</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {kpis.map(k => <KpiCard key={k.label} {...k} />)}
      </div>

      {a.exceptions_by_type?.length > 0 && (
        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="font-semibold text-gray-700 mb-3">Exceptions by Type</h3>
          <div className="space-y-2">
            {a.exceptions_by_type.map(e => (
              <div key={e._id} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-40 truncate">{e._id?.replace(/_/g,' ')}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-orange-400 h-2 rounded-full"
                    style={{ width: `${Math.min(100, (e.count / (a.exceptions_by_type[0]?.count || 1)) * 100)}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 w-8 text-right">{e.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {a.daily_volume?.length > 0 && (
        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="font-semibold text-gray-700 mb-3">Daily Trip Volume (7 days)</h3>
          <div className="flex items-end gap-2 h-32">
            {a.daily_volume.map(d => {
              const max = Math.max(...a.daily_volume.map(x => x.trips), 1);
              const pct = (d.trips / max) * 100;
              return (
                <div key={d._id} className="flex flex-col items-center flex-1">
                  <span className="text-xs text-gray-400 mb-1">{d.trips}</span>
                  <div className="w-full bg-indigo-500 rounded-t" style={{ height: `${pct}%`, minHeight: '4px' }} />
                  <span className="text-[10px] text-gray-400 mt-1">{d._id?.slice(5)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Calendar View ────────────────────────────────────────────────────────────
function CalendarView({ events }) {
  const STATUS_BG = {
    planned:     'bg-blue-200 text-blue-900',
    approved:    'bg-indigo-200 text-indigo-900',
    loading:     'bg-orange-200 text-orange-900',
    in_progress: 'bg-green-200 text-green-900',
    completed:   'bg-gray-200 text-gray-700',
    cancelled:   'bg-red-100 text-red-700',
    exception:   'bg-red-300 text-red-900',
  };

  const days = [];
  const now = new Date();
  for (let i = -3; i <= 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    days.push(d);
  }

  const byDay = {};
  events.forEach(ev => {
    const key = new Date(ev.start).toDateString();
    if (!byDay[key]) byDay[key] = [];
    byDay[key].push(ev);
  });

  return (
    <div className="bg-white rounded-xl shadow p-4">
      <h2 className="font-semibold text-gray-700 mb-4 flex items-center gap-2"><Calendar size={16}/> Trip Calendar (−3 to +7 days)</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {days.map(d => {
          const key = d.toDateString();
          const dayEvents = byDay[key] || [];
          const isToday = key === now.toDateString();
          return (
            <div key={key} className={`rounded-lg border p-3 ${isToday ? 'border-indigo-400 bg-indigo-50' : 'border-gray-100'}`}>
              <p className={`text-xs font-semibold mb-2 ${isToday ? 'text-indigo-700' : 'text-gray-500'}`}>
                {isToday ? 'TODAY · ' : ''}{d.toLocaleDateString('en-IN', { weekday:'short', month:'short', day:'numeric' })}
              </p>
              {dayEvents.length === 0 && <p className="text-xs text-gray-300">No trips</p>}
              <div className="space-y-1">
                {dayEvents.map(ev => (
                  <div key={ev.id} className={`rounded px-1.5 py-1 text-[10px] ${STATUS_BG[ev.status] || 'bg-gray-100'}`}>
                    <p className="font-semibold truncate">{ev.title}</p>
                    {ev.driver && <p className="opacity-70">{ev.driver}</p>}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
