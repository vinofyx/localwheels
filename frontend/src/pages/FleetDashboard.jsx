import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import toast from 'react-hot-toast';
import {
  Truck, User, AlertTriangle, CheckCircle, XCircle, Clock,
  Fuel, Wrench, FileText, BarChart2, Plus, RefreshCw, Search,
  TrendingUp, Zap, Star, Activity, Shield, ChevronDown, ChevronUp,
  MapPin, Calendar, DollarSign, Eye, Navigation, Battery,
  ChevronRight, X,
} from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const STATUS_COLOR = {
  available:     'bg-green-900 text-green-300',
  assigned:      'bg-blue-900 text-blue-300',
  on_trip:       'bg-indigo-900 text-indigo-300',
  loading:       'bg-yellow-900 text-yellow-300',
  unloading:     'bg-yellow-900 text-yellow-300',
  maintenance:   'bg-orange-900 text-orange-300',
  breakdown:     'bg-red-900 text-red-300',
  accident:      'bg-red-950 text-red-200',
  idle:          'bg-slate-700 text-slate-300',
  reserved:      'bg-purple-900 text-purple-300',
  out_of_service:'bg-gray-800 text-gray-400',
  inactive:      'bg-gray-900 text-gray-500',
};

const ALERT_COLOR = {
  overdue:  'bg-red-900/50 border-red-700 text-red-300',
  critical: 'bg-red-800/50 border-red-600 text-red-200',
  warning:  'bg-yellow-900/50 border-yellow-700 text-yellow-300',
  notice:   'bg-blue-900/50 border-blue-700 text-blue-300',
};

const GRADE_COLOR = {
  A: 'text-green-400',  B: 'text-blue-400',
  C: 'text-yellow-400', D: 'text-orange-400', F: 'text-red-400',
};

const scoreColor = s => s >= 80 ? 'text-green-400' : s >= 60 ? 'text-yellow-400' : 'text-red-400';

function StatusBadge({ status }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[status] || 'bg-slate-700 text-slate-300'}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, sub, color = 'text-blue-400', onClick }) {
  return (
    <button onClick={onClick} disabled={!onClick}
      className={`bg-slate-800 border border-slate-700 rounded-xl p-4 text-left w-full ${onClick ? 'hover:bg-slate-750 cursor-pointer' : 'cursor-default'}`}>
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 ${color}`}><Icon size={18} /></div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-400 uppercase tracking-wide truncate">{label}</p>
          <p className="text-xl font-bold text-white mt-0.5">{value}</p>
          {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
        </div>
      </div>
    </button>
  );
}

function HealthBar({ score, grade }) {
  const pct = score || 0;
  const bg  = pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-yellow-500' : pct >= 40 ? 'bg-orange-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${bg}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-bold ${GRADE_COLOR[grade] || 'text-slate-400'}`}>{grade || '?'}</span>
    </div>
  );
}

// ─── Vehicle Form Modal ───────────────────────────────────────────────────────
function VehicleFormModal({ vehicle, onClose, onSave }) {
  const isEdit = !!vehicle?._id;
  const [form, setForm] = useState(vehicle || {
    vehicle_number: '', registration_number: '', vehicle_type: 'truck',
    manufacturer: '', model: '', year: '', fuel_type: 'diesel',
    capacity_tons: '', ownership_type: 'owned', purchase_cost: '',
    engine_number: '', chassis_number: '', fuel_tank_liters: 100,
    insurance_expiry: '', fitness_expiry: '', permit_expiry: '', pollution_expiry: '',
  });
  const [saving, setSaving] = useState(false);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    if (!form.vehicle_number || !form.registration_number)
      return toast.error('Vehicle number and registration are required');
    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/fleet/${vehicle._id}`, form);
        toast.success('Vehicle updated');
      } else {
        await api.post('/fleet', form);
        toast.success('Vehicle added to fleet');
      }
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const Field = ({ label, k, type = 'text', options }) => (
    <div>
      <label className="text-xs text-slate-400 block mb-1">{label}</label>
      {options ? (
        <select value={form[k] || ''} onChange={set(k)}
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
          {options.map(o => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}
        </select>
      ) : (
        <input type={type} value={form[k] || ''} onChange={set(k)}
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500" />
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <h2 className="font-semibold text-white">{isEdit ? 'Edit Vehicle' : 'Add Fleet Vehicle'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
        </div>
        <div className="p-6 grid grid-cols-2 gap-4">
          <Field label="Vehicle Number *"  k="vehicle_number" />
          <Field label="Registration No. *" k="registration_number" />
          <Field label="Vehicle Type" k="vehicle_type" options={[
            'truck','mini_truck','tempo','trailer','container','bike','bus','tanker','tipper',
          ]} />
          <Field label="Fuel Type" k="fuel_type" options={['diesel','petrol','cng','electric','hybrid']} />
          <Field label="Manufacturer"     k="manufacturer" />
          <Field label="Model"            k="model" />
          <Field label="Year"             k="year" type="number" />
          <Field label="Capacity (Tons)"  k="capacity_tons" type="number" />
          <Field label="Ownership Type"   k="ownership_type" options={['owned','leased','hired','contracted']} />
          <Field label="Purchase Cost (₹)" k="purchase_cost" type="number" />
          <Field label="Engine Number"    k="engine_number" />
          <Field label="Chassis Number"   k="chassis_number" />
          <Field label="Tank Capacity (L)" k="fuel_tank_liters" type="number" />
          <div />
          <Field label="Insurance Expiry" k="insurance_expiry" type="date" />
          <Field label="Fitness Expiry"   k="fitness_expiry"   type="date" />
          <Field label="Permit Expiry"    k="permit_expiry"    type="date" />
          <Field label="PUC Expiry"       k="pollution_expiry" type="date" />
        </div>
        <div className="px-6 py-4 border-t border-slate-700 flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg text-sm">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium">
            {saving ? 'Saving…' : isEdit ? 'Update' : 'Add Vehicle'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Fuel Log Modal ───────────────────────────────────────────────────────────
function FuelModal({ vehicleId, vehicleNumber, onClose, onSave }) {
  const [form, setForm] = useState({ liters_filled: '', price_per_liter: '', odometer_after: '', filling_station: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    if (!form.liters_filled) return toast.error('Liters filled is required');
    setSaving(true);
    try {
      const { data } = await api.post('/fleet/fuel', { ...form, fleet_vehicle_id: vehicleId, liters_filled: Number(form.liters_filled), price_per_liter: Number(form.price_per_liter), odometer_after: Number(form.odometer_after) });
      if (data.is_suspicious) toast.error('⚠️ Suspicious fuel entry detected!', { duration: 5000 });
      else toast.success('Fuel log added');
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <h2 className="font-semibold text-white"><Fuel size={16} className="inline mr-1" />Fuel Log — {vehicleNumber}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-3">
          {[
            ['Liters Filled *', 'liters_filled', 'number'],
            ['Price/Liter (₹)', 'price_per_liter', 'number'],
            ['Odometer (km)', 'odometer_after', 'number'],
            ['Filling Station', 'filling_station', 'text'],
            ['Notes', 'notes', 'text'],
          ].map(([lbl, k, t]) => (
            <div key={k}>
              <label className="text-xs text-slate-400 block mb-1">{lbl}</label>
              <input type={t} value={form[k]} onChange={set(k)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
            </div>
          ))}
        </div>
        <div className="px-6 py-4 border-t border-slate-700 flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg text-sm">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium">
            {saving ? 'Saving…' : 'Log Fuel'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function FleetDashboard() {
  const [activeTab, setActiveTab]       = useState('overview');
  const [vehicles, setVehicles]         = useState([]);
  const [totalVehicles, setTotal]       = useState(0);
  const [statusCounts, setStatusCounts] = useState({});
  const [alerts, setAlerts]             = useState({ compliance: [], maintenance: [], total: 0, critical: 0 });
  const [analytics, setAnalytics]       = useState(null);
  const [healthData, setHealthData]     = useState([]);
  const [selectedVehicle, setSelected]  = useState(null);
  const [detailVehicle, setDetail]      = useState(null);
  const [showAddModal, setShowAdd]      = useState(false);
  const [showFuelModal, setFuelModal]   = useState(null); // { id, number }
  const [loading, setLoading]           = useState(false);
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [predictive, setPredictive]     = useState(null);
  const [predLoading, setPredLoading]   = useState(false);
  const [expandedAlert, setExpandedAlert] = useState(null);

  // Allocation panel
  const [allocReq, setAllocReq]         = useState({ weight_tons: '', vehicle_type: '', priority: 'normal' });
  const [allocResult, setAllocResult]   = useState(null);
  const [allocLoading, setAllocLoading] = useState(false);

  const loadVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 100 });
      if (search)       params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      const { data } = await api.get(`/fleet?${params}`);
      setVehicles(data.vehicles || []);
      setTotal(data.total || 0);
      setStatusCounts(data.status_counts || {});
    } catch { } finally { setLoading(false); }
  }, [search, statusFilter]);

  const loadAlerts    = async () => { try { const { data } = await api.get('/fleet/alerts'); setAlerts(data); } catch {} };
  const loadAnalytics = async () => { try { const { data } = await api.get('/fleet/analytics?days=30'); setAnalytics(data); } catch {} };
  const loadHealth    = async () => { try { const { data } = await api.get('/fleet/health'); setHealthData(data); } catch {} };

  useEffect(() => { loadVehicles(); }, [loadVehicles]);
  useEffect(() => { loadAlerts(); loadAnalytics(); loadHealth(); }, []);

  const loadDetail = async (v) => {
    try {
      const { data } = await api.get(`/fleet/${v._id}`);
      setDetail(data);
    } catch { setDetail(v); }
  };

  const runHealthCheck = async (vehicleId) => {
    try {
      const { data } = await api.post(`/fleet/${vehicleId}/health-check`);
      toast.success(`Health assessed: ${data.grade} (${data.score}/100)`);
      loadVehicles(); loadHealth();
    } catch (err) { toast.error(err.response?.data?.error || 'Health check failed'); }
  };

  const runPredictive = async (vehicleId) => {
    setPredLoading(true); setPredictive(null);
    try {
      const { data } = await api.post(`/fleet/${vehicleId}/predictive-maintenance`);
      setPredictive(data);
    } catch { toast.error('AI prediction failed'); } finally { setPredLoading(false); }
  };

  const runAllocation = async () => {
    setAllocLoading(true); setAllocResult(null);
    try {
      const { data } = await api.get(`/fleet/available?weight_tons=${allocReq.weight_tons || 0}&vehicle_type=${allocReq.vehicle_type || ''}&priority=${allocReq.priority}`);
      setAllocResult(data);
    } catch { toast.error('Allocation failed'); } finally { setAllocLoading(false); }
  };

  const autoSchedule = async () => {
    try {
      const { data } = await api.post('/fleet/maintenance/auto-schedule');
      toast.success(`Auto-scheduled ${data.scheduled} maintenance task(s)`);
    } catch { toast.error('Auto-schedule failed'); }
  };

  const TABS = [
    { id: 'overview',    label: 'Overview',    icon: BarChart2 },
    { id: 'vehicles',    label: 'Vehicles',    icon: Truck },
    { id: 'alerts',      label: `Alerts ${alerts.critical > 0 ? `(${alerts.critical})` : ''}`, icon: AlertTriangle },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench },
    { id: 'allocation',  label: 'AI Allocation', icon: Zap },
    { id: 'analytics',   label: 'Analytics',   icon: TrendingUp },
  ];

  const available  = (statusCounts.available || 0) + (statusCounts.idle || 0);
  const onTrip     = statusCounts.on_trip || 0;
  const maintenance= statusCounts.maintenance || 0;
  const breakdown  = (statusCounts.breakdown || 0) + (statusCounts.accident || 0);
  const total      = totalVehicles || Object.values(statusCounts).reduce((s, v) => s + v, 0);
  const utilPct    = total > 0 ? Math.round(((onTrip + (statusCounts.assigned || 0)) / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Modals */}
      {showAddModal && (
        <VehicleFormModal onClose={() => setShowAdd(false)} onSave={() => { setShowAdd(false); loadVehicles(); }} />
      )}
      {showFuelModal && (
        <FuelModal vehicleId={showFuelModal.id} vehicleNumber={showFuelModal.number}
          onClose={() => setFuelModal(null)} onSave={() => { setFuelModal(null); loadVehicles(); }} />
      )}

      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Truck className="text-blue-400" size={22} />
              Fleet Management
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">Phase 5 — AI-Powered Fleet & Vehicle Allocation</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${activeTab === t.id ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}
                  ${t.id === 'alerts' && alerts.critical > 0 ? 'ring-1 ring-red-500' : ''}`}>
                <t.icon size={14} />{t.label}
              </button>
            ))}
            <button onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-green-700 hover:bg-green-600 text-white">
              <Plus size={14} /> Add Vehicle
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">

        {/* ── OVERVIEW ─────────────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* KPI row */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              <StatCard icon={Truck}         label="Total Fleet"    value={total}       color="text-slate-300"  onClick={() => setActiveTab('vehicles')} />
              <StatCard icon={CheckCircle}   label="Available"      value={available}   color="text-green-400"  onClick={() => { setStatusFilter('available'); setActiveTab('vehicles'); }} />
              <StatCard icon={Navigation}    label="On Trip"        value={onTrip}      color="text-blue-400"   onClick={() => { setStatusFilter('on_trip'); setActiveTab('vehicles'); }} />
              <StatCard icon={Wrench}        label="Maintenance"    value={maintenance} color="text-orange-400" onClick={() => setActiveTab('maintenance')} />
              <StatCard icon={AlertTriangle} label="Breakdown"      value={breakdown}   color="text-red-400" />
              <StatCard icon={Activity}      label="Utilization"    value={`${utilPct}%`} color="text-purple-400" />
              <StatCard icon={Shield}        label="Alerts"         value={alerts.total} sub={`${alerts.critical} critical`} color="text-yellow-400" onClick={() => setActiveTab('alerts')} />
            </div>

            {/* Fleet health snapshot */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Health overview */}
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-4 flex items-center gap-1">
                  <Activity size={14} /> Fleet Health Snapshot
                </h2>
                {healthData.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-6">Run health checks on vehicles to see data.</p>
                ) : (
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {healthData.slice(0, 15).map((h, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="font-mono text-blue-300 text-xs w-24 flex-shrink-0 truncate">{h.vehicle_number}</span>
                        <div className="flex-1">
                          <HealthBar score={h.health?.score} grade={h.health?.grade} />
                        </div>
                        <span className={`text-xs font-bold w-8 text-right ${scoreColor(h.health?.score)}`}>{h.health?.score}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Critical alerts preview */}
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-4 flex items-center gap-1">
                  <AlertTriangle size={14} /> Critical Alerts
                  <button onClick={autoSchedule} className="ml-auto text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                    <Wrench size={10} /> Auto-Schedule
                  </button>
                </h2>
                {alerts.critical === 0 ? (
                  <div className="text-center py-6">
                    <CheckCircle size={28} className="text-green-400 mx-auto mb-2" />
                    <p className="text-green-400 text-sm">No critical alerts</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {[...alerts.compliance, ...alerts.maintenance]
                      .filter(a => ['critical','overdue'].includes(a.alert_level))
                      .slice(0, 10)
                      .map((a, i) => (
                        <div key={i} className={`border rounded-lg px-3 py-2 text-xs ${ALERT_COLOR[a.alert_level]}`}>
                          <span className="font-mono font-bold">{a.vehicle_number}</span>
                          <span className="mx-1">·</span>
                          <span>{a.label}</span>
                          {a.days_remaining !== undefined && (
                            <span className="ml-1">({a.days_remaining < 0 ? `${Math.abs(a.days_remaining)}d overdue` : `${a.days_remaining}d left`})</span>
                          )}
                          {a.km_overdue !== undefined && (
                            <span className="ml-1">(+{a.km_overdue} km overdue)</span>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* Status distribution */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-4">Fleet Status Distribution</h2>
              <div className="flex flex-wrap gap-3">
                {Object.entries(statusCounts).map(([status, count]) => (
                  <button key={status} onClick={() => { setStatusFilter(status); setActiveTab('vehicles'); }}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
                    <StatusBadge status={status} />
                    <span className="text-white font-bold text-sm">{count}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── VEHICLES ─────────────────────────────────────────────────────── */}
        {activeTab === 'vehicles' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex gap-3 flex-wrap">
              <div className="relative flex-1 min-w-48">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vehicles…"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500" />
              </div>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
                <option value="">All Statuses</option>
                {['available','assigned','on_trip','loading','unloading','maintenance','breakdown','accident','idle','reserved','out_of_service'].map(s => (
                  <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                ))}
              </select>
              <button onClick={loadVehicles} className="flex items-center gap-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm">
                <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
              </button>
            </div>

            {/* Vehicle grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {vehicles.map(v => (
                <div key={v._id} className={`bg-slate-800 border rounded-xl p-4 cursor-pointer hover:border-blue-600 transition-colors ${selectedVehicle?._id === v._id ? 'border-blue-500' : 'border-slate-700'}`}
                  onClick={() => { setSelected(v); loadDetail(v); setDetail(null); }}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-mono font-bold text-white text-base">{v.vehicle_number}</p>
                      <p className="text-xs text-slate-400">{v.vehicle_type?.replace(/_/g, ' ')} • {v.manufacturer} {v.model}</p>
                    </div>
                    <StatusBadge status={v.status} />
                  </div>

                  <HealthBar score={v.health_score} grade={v.health_grade} />

                  <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                    <div>
                      <p className="text-xs text-slate-500">Capacity</p>
                      <p className="text-sm font-semibold text-white">{v.capacity_tons}T</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Odometer</p>
                      <p className="text-sm font-semibold text-white">{(v.odometer_km || 0).toLocaleString()} km</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Fuel</p>
                      <p className={`text-sm font-semibold ${v.fuel_level_pct < 20 ? 'text-red-400' : 'text-white'}`}>{v.fuel_level_pct}%</p>
                    </div>
                  </div>

                  {v.current_driver_name && (
                    <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                      <User size={11} />{v.current_driver_name}
                    </p>
                  )}

                  <div className="flex gap-2 mt-3">
                    <button onClick={e => { e.stopPropagation(); runHealthCheck(v._id); }}
                      className="flex-1 text-xs py-1.5 bg-blue-900 hover:bg-blue-800 text-blue-300 rounded-lg">
                      Health Check
                    </button>
                    <button onClick={e => { e.stopPropagation(); setFuelModal({ id: v._id, number: v.vehicle_number }); }}
                      className="flex-1 text-xs py-1.5 bg-orange-900 hover:bg-orange-800 text-orange-300 rounded-lg">
                      Log Fuel
                    </button>
                    <button onClick={e => { e.stopPropagation(); runPredictive(v._id); setActiveTab('maintenance'); }}
                      className="flex-1 text-xs py-1.5 bg-purple-900 hover:bg-purple-800 text-purple-300 rounded-lg">
                      AI Predict
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {vehicles.length === 0 && !loading && (
              <div className="text-center py-16 text-slate-500">
                <Truck size={40} className="mx-auto mb-3 text-slate-700" />
                <p>No vehicles found. Add your first vehicle to get started.</p>
              </div>
            )}

            {/* Vehicle detail panel */}
            {detailVehicle && (
              <div className="mt-6 bg-slate-800 border border-slate-700 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-white">
                    {detailVehicle.vehicle_number} — Detail
                    <StatusBadge status={detailVehicle.status} />
                  </h2>
                  <button onClick={() => setDetail(null)} className="text-slate-400 hover:text-white"><X size={16} /></button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div><p className="text-xs text-slate-400">Registration</p><p className="text-sm font-mono text-white">{detailVehicle.registration_number}</p></div>
                  <div><p className="text-xs text-slate-400">Engine No.</p><p className="text-sm text-white">{detailVehicle.engine_number || '—'}</p></div>
                  <div><p className="text-xs text-slate-400">Chassis No.</p><p className="text-sm text-white">{detailVehicle.chassis_number || '—'}</p></div>
                  <div><p className="text-xs text-slate-400">Year</p><p className="text-sm text-white">{detailVehicle.year || '—'}</p></div>
                  <div><p className="text-xs text-slate-400">Fuel Type</p><p className="text-sm text-white capitalize">{detailVehicle.fuel_type}</p></div>
                  <div><p className="text-xs text-slate-400">Ownership</p><p className="text-sm text-white capitalize">{detailVehicle.ownership_type}</p></div>
                  <div><p className="text-xs text-slate-400">Total Trips</p><p className="text-sm text-white">{detailVehicle.total_trips}</p></div>
                  <div><p className="text-xs text-slate-400">Breakdowns</p><p className={`text-sm font-bold ${detailVehicle.breakdown_count > 2 ? 'text-red-400' : 'text-white'}`}>{detailVehicle.breakdown_count}</p></div>
                </div>

                {/* Compliance */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  {[
                    ['Insurance', detailVehicle.insurance_expiry],
                    ['Fitness',   detailVehicle.fitness_expiry],
                    ['Permit',    detailVehicle.permit_expiry],
                    ['PUC',       detailVehicle.pollution_expiry],
                  ].map(([label, date]) => {
                    const days = date ? Math.ceil((new Date(date) - new Date()) / 86400000) : null;
                    const color = days === null ? 'text-slate-500' : days < 0 ? 'text-red-400' : days < 30 ? 'text-yellow-400' : 'text-green-400';
                    return (
                      <div key={label} className="bg-slate-700 rounded-lg p-3">
                        <p className="text-xs text-slate-400">{label}</p>
                        <p className={`text-sm font-semibold ${color}`}>
                          {date ? new Date(date).toLocaleDateString() : '—'}
                        </p>
                        {days !== null && <p className={`text-xs ${color}`}>{days < 0 ? `${Math.abs(days)}d expired` : `${days}d left`}</p>}
                      </div>
                    );
                  })}
                </div>

                {/* Recent maintenance */}
                {detailVehicle.recent_maintenance?.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Recent Maintenance</p>
                    <div className="space-y-1">
                      {detailVehicle.recent_maintenance.map((m, i) => (
                        <div key={i} className="flex items-center justify-between text-xs bg-slate-700 rounded px-3 py-1.5">
                          <span className="text-white">{m.maintenance_type?.replace(/_/g, ' ')}</span>
                          <span className={`px-2 py-0.5 rounded-full ${m.status === 'completed' ? 'bg-green-900 text-green-300' : m.status === 'overdue' ? 'bg-red-900 text-red-300' : 'bg-yellow-900 text-yellow-300'}`}>{m.status}</span>
                          <span className="text-slate-400">{m.cost > 0 ? `₹${m.cost}` : '—'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── ALERTS ───────────────────────────────────────────────────────── */}
        {activeTab === 'alerts' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-white">Fleet Alerts ({alerts.total})</h2>
              <button onClick={() => { loadAlerts(); autoSchedule(); }}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-700 hover:bg-blue-600 text-white text-sm rounded-lg">
                <Wrench size={14} /> Auto-Schedule All
              </button>
            </div>

            {/* Compliance alerts */}
            {alerts.compliance?.length > 0 && (
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-1"><FileText size={14} /> Compliance Alerts ({alerts.compliance.length})</h3>
                <div className="space-y-2">
                  {alerts.compliance.map((a, i) => (
                    <div key={i} className={`border rounded-lg px-4 py-3 flex items-center justify-between ${ALERT_COLOR[a.alert_level]}`}>
                      <div>
                        <span className="font-mono font-bold">{a.vehicle_number}</span>
                        <span className="mx-2">·</span>
                        <span className="font-medium">{a.label}</span>
                        {a.expiry_date && <span className="text-xs ml-2 opacity-75">expires {new Date(a.expiry_date).toLocaleDateString()}</span>}
                      </div>
                      <span className="text-xs font-bold uppercase px-2 py-1 rounded bg-black/20">
                        {a.days_remaining < 0 ? `${Math.abs(a.days_remaining)}d OVERDUE` : `${a.days_remaining}d left`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Maintenance alerts */}
            {alerts.maintenance?.length > 0 && (
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-1"><Wrench size={14} /> Maintenance Alerts ({alerts.maintenance.length})</h3>
                <div className="space-y-2">
                  {alerts.maintenance.map((a, i) => (
                    <div key={i} className={`border rounded-lg px-4 py-3 flex items-center justify-between ${ALERT_COLOR[a.alert_level]}`}>
                      <div>
                        <span className="font-mono font-bold">{a.vehicle_number}</span>
                        <span className="mx-2">·</span>
                        <span className="font-medium">{a.label}</span>
                      </div>
                      <span className="text-xs font-bold uppercase px-2 py-1 rounded bg-black/20">
                        {a.km_overdue !== undefined ? `+${a.km_overdue} km overdue` : `${a.km_remaining} km remaining`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {alerts.total === 0 && (
              <div className="text-center py-16">
                <CheckCircle size={48} className="text-green-400 mx-auto mb-3" />
                <p className="text-green-400 font-semibold">All Clear — No alerts at this time</p>
              </div>
            )}
          </div>
        )}

        {/* ── MAINTENANCE ──────────────────────────────────────────────────── */}
        {activeTab === 'maintenance' && (
          <div className="space-y-5">
            {/* AI Predictive output */}
            {predLoading && (
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 text-center">
                <RefreshCw size={24} className="animate-spin text-purple-400 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">Running AI predictive analysis…</p>
              </div>
            )}
            {predictive && (
              <div className="bg-slate-800 border border-purple-700 rounded-xl p-5">
                <h2 className="font-semibold text-white mb-1 flex items-center gap-2">
                  <Zap className="text-purple-400" size={16} /> AI Predictive Maintenance Report
                </h2>
                <p className="text-sm text-slate-400 mb-4">{predictive.health_insight}</p>
                {predictive.predicted_issues?.length > 0 && (
                  <div className="space-y-2 mb-4">
                    <p className="text-xs text-slate-400 uppercase tracking-wide">Predicted Issues</p>
                    {predictive.predicted_issues.map((issue, i) => (
                      <div key={i} className={`border rounded-lg px-3 py-2 ${
                        issue.urgency === 'critical' ? 'border-red-700 bg-red-900/30' :
                        issue.urgency === 'high'     ? 'border-orange-700 bg-orange-900/20' :
                        'border-yellow-700 bg-yellow-900/20'}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-white">{issue.component} — {issue.issue}</span>
                          <div className="flex gap-2">
                            <span className="text-xs text-slate-400">{Math.round((issue.probability || 0) * 100)}% likely</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase
                              ${issue.urgency === 'critical' ? 'bg-red-900 text-red-300' :
                                issue.urgency === 'high'     ? 'bg-orange-900 text-orange-300' :
                                'bg-yellow-900 text-yellow-300'}`}>
                              {issue.urgency}
                            </span>
                          </div>
                        </div>
                        {issue.estimated_days !== undefined && (
                          <p className="text-xs text-slate-400 mt-0.5">Est. {issue.estimated_days} days</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {predictive.replacement_recommendation && (
                  <div className="border border-red-700 bg-red-900/20 rounded-lg px-3 py-2">
                    <p className="text-sm font-semibold text-red-300">⚠️ Replacement Recommended</p>
                    <p className="text-xs text-slate-400">{predictive.replacement_reason}</p>
                  </div>
                )}
              </div>
            )}

            <p className="text-sm text-slate-400">Select a vehicle from the <button onClick={() => setActiveTab('vehicles')} className="text-blue-400 hover:underline">Vehicles tab</button> and click "AI Predict" to run predictive maintenance analysis.</p>
          </div>
        )}

        {/* ── AI ALLOCATION ────────────────────────────────────────────────── */}
        {activeTab === 'allocation' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4">
              <h2 className="font-semibold text-white flex items-center gap-2"><Zap className="text-blue-400" size={16} /> AI Vehicle Allocation</h2>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Load Weight (Tons)</label>
                <input type="number" value={allocReq.weight_tons} onChange={e => setAllocReq(r => ({ ...r, weight_tons: e.target.value }))}
                  placeholder="e.g. 5"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Vehicle Type Preference</label>
                <select value={allocReq.vehicle_type} onChange={e => setAllocReq(r => ({ ...r, vehicle_type: e.target.value }))}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
                  <option value="">-- Any Type --</option>
                  {['truck','mini_truck','tempo','trailer','container','bike'].map(t => (
                    <option key={t} value={t}>{t.replace(/_/g,' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Priority</label>
                <select value={allocReq.priority} onChange={e => setAllocReq(r => ({ ...r, priority: e.target.value }))}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
                  {['emergency','high','normal','low'].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <button onClick={runAllocation} disabled={allocLoading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
                {allocLoading ? <><RefreshCw size={15} className="animate-spin" /> Analyzing Fleet…</> : <><Zap size={15} /> Find Best Vehicle</>}
              </button>
            </div>

            {/* Results */}
            <div className="space-y-4">
              {!allocResult ? (
                <div className="bg-slate-800 border border-dashed border-slate-600 rounded-xl p-12 text-center">
                  <Truck size={36} className="text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">Set requirements and click "Find Best Vehicle" to get AI allocation recommendations.</p>
                </div>
              ) : (
                <>
                  {/* AI recommendation */}
                  {allocResult.ai && (
                    <div className="bg-slate-800 border border-blue-700 rounded-xl p-5">
                      <div className="flex items-start gap-2 mb-3">
                        <Star className="text-yellow-400 flex-shrink-0 mt-0.5" size={16} />
                        <div>
                          <p className="text-sm font-semibold text-white">AI Recommendation</p>
                          <p className="text-sm text-slate-300 mt-1">{allocResult.ai.recommendation}</p>
                          <p className="text-xs text-slate-400 mt-1">{allocResult.ai.reasoning}</p>
                        </div>
                      </div>
                      {allocResult.ai.utilization_insight && (
                        <p className="text-xs text-blue-300 mt-2 border-t border-slate-700 pt-2">{allocResult.ai.utilization_insight}</p>
                      )}
                      {allocResult.ai.risks?.length > 0 && (
                        <ul className="mt-2 space-y-0.5">
                          {allocResult.ai.risks.map((r, i) => (
                            <li key={i} className="text-xs text-yellow-300 flex items-center gap-1"><AlertTriangle size={10} />{r}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  {/* Fleet stats */}
                  {allocResult.fleet_stats && (
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        ['Total',  allocResult.fleet_stats.total],
                        ['Avail.', allocResult.fleet_stats.available],
                        ['On Trip',allocResult.fleet_stats.on_trip],
                        ['Maint.', allocResult.fleet_stats.maintenance],
                      ].map(([l, v]) => (
                        <div key={l} className="bg-slate-800 border border-slate-700 rounded-lg p-2 text-center">
                          <p className="text-xs text-slate-400">{l}</p>
                          <p className="text-lg font-bold text-white">{v}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Candidate vehicles */}
                  <div className="space-y-3">
                    {allocResult.candidates?.map((v, i) => (
                      <div key={v._id} className={`bg-slate-800 border rounded-xl p-4 ${i === 0 ? 'border-blue-500' : 'border-slate-700'}`}>
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <span className="font-mono font-bold text-white">{v.vehicle_number}</span>
                            {i === 0 && <span className="ml-2 text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded-full">Best Match</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400">Score</span>
                            <span className={`font-bold ${scoreColor(v.allocation_score)}`}>{v.allocation_score}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                          <div><span className="text-slate-400">Type: </span><span className="text-white">{v.vehicle_type}</span></div>
                          <div><span className="text-slate-400">Cap: </span><span className="text-white">{v.capacity_tons}T</span></div>
                          <div><span className="text-slate-400">Fuel: </span><span className={v.fuel_level_pct < 20 ? 'text-red-400' : 'text-white'}>{v.fuel_level_pct}%</span></div>
                        </div>
                        <HealthBar score={v.health_score} grade={v.health_grade} />
                        <p className="text-xs text-slate-400 mt-2">{v.allocation_reason}</p>
                      </div>
                    ))}
                    {allocResult.candidates?.length === 0 && (
                      <div className="bg-slate-800 border border-red-800 rounded-xl p-6 text-center">
                        <XCircle size={28} className="text-red-400 mx-auto mb-2" />
                        <p className="text-red-400 text-sm">No vehicles available matching these requirements.</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── ANALYTICS ────────────────────────────────────────────────────── */}
        {activeTab === 'analytics' && (
          <div className="space-y-5">
            {analytics ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard icon={Truck}       label="Total Fleet"      value={analytics.fleet?.total || 0}          color="text-blue-400" />
                  <StatCard icon={Activity}    label="Avg Health"       value={`${analytics.fleet?.avg_health?.toFixed(0) || 0}/100`} color="text-green-400" />
                  <StatCard icon={TrendingUp}  label="Fleet Utilization" value={`${analytics.fleet?.utilization_pct || 0}%`} color="text-purple-400" />
                  <StatCard icon={DollarSign}  label="Total Expenses"   value={`₹${(analytics.total_expenses || 0).toLocaleString()}`} color="text-orange-400" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard icon={Fuel}        label="Total Fuel Cost"  value={`₹${(analytics.fuel?.total_cost || 0).toLocaleString()}`} color="text-yellow-400" />
                  <StatCard icon={Wrench}      label="Maint. Cost"      value={`₹${(analytics.maintenance?.total_cost || 0).toLocaleString()}`} color="text-red-400" />
                  <StatCard icon={Navigation}  label="Total KM"         value={`${(analytics.fleet?.total_km || 0).toLocaleString()}`} color="text-cyan-400" />
                  <StatCard icon={DollarSign}  label="Cost / KM"        value={analytics.cost_per_km ? `₹${analytics.cost_per_km}` : '—'} color="text-slate-400" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Expense breakdown */}
                  <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-4">Expense Breakdown (30 Days)</h3>
                    {analytics.expense_breakdown?.length > 0 ? (
                      <div className="space-y-2">
                        {analytics.expense_breakdown.map((e, i) => {
                          const total = analytics.total_expenses || 1;
                          const pct   = Math.round((e.total / total) * 100);
                          return (
                            <div key={i}>
                              <div className="flex items-center justify-between text-sm mb-1">
                                <span className="text-slate-300 capitalize">{e._id?.replace(/_/g,' ')}</span>
                                <span className="text-white">₹{e.total.toLocaleString()} <span className="text-slate-400 text-xs">({pct}%)</span></span>
                              </div>
                              <div className="h-1.5 bg-slate-700 rounded-full"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} /></div>
                            </div>
                          );
                        })}
                      </div>
                    ) : <p className="text-slate-500 text-sm text-center py-4">No expense data yet.</p>}
                  </div>

                  {/* By vehicle type */}
                  <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-4">Fleet by Vehicle Type</h3>
                    {analytics.by_vehicle_type?.length > 0 ? (
                      <div className="space-y-3">
                        {analytics.by_vehicle_type.map((t, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <span className="text-sm text-slate-300 capitalize">{t._id?.replace(/_/g,' ')}</span>
                            <div className="flex items-center gap-3 text-xs text-slate-400">
                              <span>{t.count} vehicles</span>
                              <span className={`font-semibold ${scoreColor(t.avg_health)}`}>{t.avg_health?.toFixed(0)}/100</span>
                              <span>{t.on_trip}/{t.count} active</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-slate-500 text-sm text-center py-4">No fleet data yet.</p>}
                  </div>
                </div>

                {/* Health distribution */}
                {analytics.health_distribution?.length > 0 && (
                  <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-4">Health Grade Distribution</h3>
                    <div className="flex gap-4 flex-wrap">
                      {analytics.health_distribution.map((h, i) => (
                        <div key={i} className="flex items-center gap-2 bg-slate-700 rounded-lg px-4 py-2">
                          <span className={`text-2xl font-black ${GRADE_COLOR[h._id]}`}>{h._id}</span>
                          <span className="text-white font-bold">{h.count}</span>
                          <span className="text-slate-400 text-sm">vehicles</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Fuel stats */}
                {analytics.fuel?.fill_count > 0 && (
                  <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-4 flex items-center gap-1"><Fuel size={14} /> Fuel Analytics (30 Days)</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      {[
                        ['Total Liters',  analytics.fuel.total_liters?.toFixed(0) + ' L'],
                        ['Total Cost',    '₹' + analytics.fuel.total_cost?.toLocaleString()],
                        ['Avg Mileage',   analytics.fuel.avg_mileage?.toFixed(1) + ' km/L'],
                        ['Fuel Entries',  analytics.fuel.fill_count],
                      ].map(([l, v]) => (
                        <div key={l} className="bg-slate-700 rounded-lg p-3">
                          <p className="text-xs text-slate-400">{l}</p>
                          <p className="text-base font-bold text-white mt-1">{v}</p>
                        </div>
                      ))}
                    </div>
                    {analytics.fuel.suspicious > 0 && (
                      <p className="text-sm text-red-400 mt-3 flex items-center gap-1">
                        <AlertTriangle size={14} /> {analytics.fuel.suspicious} suspicious fuel entry/entries detected — possible theft risk
                      </p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16 text-slate-500">
                <BarChart2 size={40} className="mx-auto mb-3 text-slate-700" />
                <p>No analytics data yet. Add vehicles and log fuel/maintenance to see reports.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
