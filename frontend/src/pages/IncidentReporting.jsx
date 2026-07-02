import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';

const INCIDENT_TYPES = [
  { value: 'breakdown',          label: 'Vehicle Breakdown', icon: '🔧' },
  { value: 'accident',           label: 'Accident',          icon: '💥' },
  { value: 'delay',              label: 'Delay',             icon: '⏰' },
  { value: 'traffic',            label: 'Traffic Issue',     icon: '🚦' },
  { value: 'customer_unavailable',label: 'Customer Not Available', icon: '👤' },
  { value: 'damaged_goods',      label: 'Damaged Goods',     icon: '📦' },
  { value: 'emergency',          label: 'Emergency SOS',     icon: '🚨' },
  { value: 'fuel_shortage',      label: 'Fuel Shortage',     icon: '⛽' },
  { value: 'route_issue',        label: 'Route Issue',       icon: '🗺️' },
  { value: 'other',              label: 'Other',             icon: '❓' },
];
const STATUS_COLOR = {
  reported:     'bg-yellow-100 text-yellow-700',
  acknowledged: 'bg-blue-100 text-blue-700',
  in_progress:  'bg-orange-100 text-orange-700',
  resolved:     'bg-green-100 text-green-700',
  escalated:    'bg-red-100 text-red-700',
};
const SEVERITY_COLOR = {
  low:      'bg-gray-100 text-gray-500',
  medium:   'bg-yellow-100 text-yellow-700',
  high:     'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

export default function IncidentReporting() {
  const [incidents, setIncidents] = useState([]);
  const [drivers, setDrivers]     = useState([]);
  const [trips, setTrips]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [msg, setMsg]             = useState(null);
  const [tab, setTab]             = useState('list');

  const [frm, setFrm] = useState({
    driver_id: '', trip_id: '', type: '', description: '', lat: '', lng: '', address: '',
  });
  const [aiRec, setAiRec] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [filterStatus, setFilterStatus] = useState('');
  const [filterDriver, setFilterDriver] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set('status', filterStatus);
      if (filterDriver) params.set('driver_id', filterDriver);
      const r = await api.get(`/driver/incidents?${params}&limit=50`);
      setIncidents(r.data.incidents || []);
    } catch {} finally { setLoading(false); }
  }, [filterStatus, filterDriver]);

  useEffect(() => {
    api.get('/drivers').then(r => setDrivers(r.data?.data?.drivers || r.data?.drivers || [])).catch(() => {});
  }, []);
  useEffect(() => { load(); }, [load]);

  const loadTrips = async (driverId) => {
    if (!driverId) return setTrips([]);
    try {
      const r = await api.get(`/driver/trips?driver_id=${driverId}&status=in_progress`);
      setTrips(r.data.trips || []);
    } catch {}
  };

  const handleDriverChange = (driverId) => {
    setFrm(f => ({ ...f, driver_id: driverId, trip_id: '' }));
    loadTrips(driverId);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!frm.driver_id || !frm.type || !frm.description) {
      return setMsg({ type: 'error', text: 'Driver, incident type, and description are required.' });
    }
    setSubmitting(true);
    try {
      const payload = {
        driver_id:   frm.driver_id,
        trip_id:     frm.trip_id || undefined,
        type:        frm.type,
        description: frm.description,
        lat:         frm.lat ? parseFloat(frm.lat) : undefined,
        lng:         frm.lng ? parseFloat(frm.lng) : undefined,
        address:     frm.address || undefined,
      };
      const r = await api.post('/driver/incident', payload);
      setAiRec(r.data.ai_recommendation);
      setMsg({ type: 'success', text: `Incident ${r.data.incident.incident_number} reported.` });
      setFrm({ driver_id: frm.driver_id, trip_id: frm.trip_id, type: '', description: '', lat: '', lng: '', address: '' });
      load();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Report failed' });
    } finally { setSubmitting(false); }
  };

  const triggerSOS = async () => {
    if (!frm.driver_id) return setMsg({ type: 'error', text: 'Select a driver first' });
    if (!window.confirm('🚨 Trigger Emergency SOS? This will alert dispatch immediately.')) return;
    try {
      const r = await api.post('/driver/sos', {
        driver_id:   frm.driver_id,
        trip_id:     frm.trip_id || undefined,
        type:        'other',
        description: 'Emergency SOS triggered via Driver Assistant',
        lat:         frm.lat ? parseFloat(frm.lat) : undefined,
        lng:         frm.lng ? parseFloat(frm.lng) : undefined,
      });
      setMsg({ type: 'success', text: `🚨 SOS ${r.data.sos_number} sent! Dispatch has been alerted.` });
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'SOS failed' });
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Incident Reporting</h1>
          <p className="text-sm text-gray-500 mt-1">Report breakdowns, delays, and emergencies</p>
        </div>
        <button onClick={triggerSOS}
          className="px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 animate-pulse">
          🚨 SOS Emergency
        </button>
      </div>

      {msg && (
        <div className={`rounded-lg px-4 py-3 text-sm font-medium ${msg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {msg.text}
          <button onClick={() => setMsg(null)} className="ml-4 opacity-60">✕</button>
        </div>
      )}

      {/* AI Recommendation */}
      {aiRec && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span>🤖</span>
            <span className="font-semibold text-indigo-800">AI Recommendation</span>
            {aiRec.escalate && <span className="ml-auto text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">ESCALATE</span>}
          </div>
          <p className="text-sm text-gray-700">{aiRec}</p>
          {typeof aiRec === 'object' && (
            <>
              <p className="text-sm text-gray-700">{aiRec.recommendation}</p>
              {aiRec.estimated_delay_min && (
                <p className="text-xs text-gray-500 mt-1">Estimated delay: {aiRec.estimated_delay_min} minutes</p>
              )}
            </>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button onClick={() => setTab('report')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === 'report' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
          Report Incident
        </button>
        <button onClick={() => setTab('list')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === 'list' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
          Incident History
        </button>
      </div>

      {tab === 'report' && (
        <div className="max-w-2xl">
          <form onSubmit={submit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Driver *</label>
                <select required value={frm.driver_id} onChange={e => handleDriverChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="">Select Driver</option>
                  {drivers.map(d => <option key={d._id} value={d._id}>{d.name} — {d.phone}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Active Trip</label>
                <select value={frm.trip_id} onChange={e => setFrm(f => ({ ...f, trip_id: e.target.value }))}
                  disabled={!frm.driver_id}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-50">
                  <option value="">Select Trip (optional)</option>
                  {trips.map(t => <option key={t._id} value={t._id}>{t.trip_number}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Incident Type *</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {INCIDENT_TYPES.map(t => (
                  <button key={t.value} type="button"
                    onClick={() => setFrm(f => ({ ...f, type: t.value }))}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-sm transition-colors ${frm.type === t.value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                    <span>{t.icon}</span>
                    <span className="text-xs font-medium">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Description *</label>
              <textarea required value={frm.description} onChange={e => setFrm(f => ({ ...f, description: e.target.value }))}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                placeholder="Describe the incident in detail..." />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Location Address</label>
              <input value={frm.address} onChange={e => setFrm(f => ({ ...f, address: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                placeholder="Where did this happen?" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">GPS Lat</label>
                <input type="number" step="any" value={frm.lat} onChange={e => setFrm(f => ({ ...f, lat: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="19.0760" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">GPS Lng</label>
                <input type="number" step="any" value={frm.lng} onChange={e => setFrm(f => ({ ...f, lng: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="72.8777" />
              </div>
            </div>

            <button type="submit" disabled={submitting || !frm.type || !frm.description}
              className="w-full py-3 bg-orange-600 text-white rounded-xl text-sm font-semibold hover:bg-orange-700 disabled:opacity-50">
              {submitting ? '⏳ Reporting...' : '⚠️ Report Incident'}
            </button>
          </form>
        </div>
      )}

      {tab === 'list' && (
        <>
          <div className="flex gap-3 flex-wrap">
            <select value={filterDriver} onChange={e => setFilterDriver(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="">All Drivers</option>
              {drivers.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="">All Statuses</option>
              {['reported','acknowledged','in_progress','resolved','escalated'].map(s => (
                <option key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="flex justify-center h-40 items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : incidents.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
              No incidents found
            </div>
          ) : (
            <div className="space-y-3">
              {incidents.map(inc => {
                const t = INCIDENT_TYPES.find(t => t.value === inc.type);
                return (
                  <div key={inc._id} className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{t?.icon || '❓'}</span>
                        <div>
                          <div className="font-semibold text-gray-900">{t?.label || inc.type}</div>
                          <div className="text-xs text-gray-400 font-mono">{inc.incident_number}</div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[inc.status] || 'bg-gray-100 text-gray-500'}`}>
                          {inc.status?.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SEVERITY_COLOR[inc.severity] || 'bg-gray-100 text-gray-500'}`}>
                          {inc.severity?.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{inc.description}</p>
                    {inc.driver_id?.name && <div className="text-xs text-gray-400">Driver: {inc.driver_id.name}</div>}
                    {inc.ai_recommendation && (
                      <div className="mt-2 bg-indigo-50 rounded-lg p-2 text-xs text-indigo-700">
                        🤖 {inc.ai_recommendation}
                      </div>
                    )}
                    {inc.estimated_delay_min && (
                      <div className="text-xs text-gray-500 mt-1">Est. delay: {inc.estimated_delay_min} min</div>
                    )}
                    <div className="text-xs text-gray-400 mt-2">{new Date(inc.createdAt).toLocaleString()}</div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
