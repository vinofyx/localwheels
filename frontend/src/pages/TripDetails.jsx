import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';

const STOP_STATUS = {
  pending:   'bg-gray-100 text-gray-500',
  arrived:   'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  skipped:   'bg-red-100 text-red-500',
};
const TRIP_STATUS_COLOR = {
  planned:     'bg-gray-100 text-gray-600',
  approved:    'bg-blue-100 text-blue-700',
  in_progress: 'bg-green-100 text-green-700',
  completed:   'bg-emerald-100 text-emerald-700',
  cancelled:   'bg-red-100 text-red-700',
  exception:   'bg-orange-100 text-orange-700',
};

export default function TripDetails() {
  const { id }  = useParams();
  const navigate = useNavigate();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg]       = useState(null);
  const [gpsFrm, setGpsFrm] = useState({ lat: '', lng: '', speed_kmh: '' });
  const [podFrm, setPodFrm] = useState({ shipment_id: '', receiver_name: '', notes: '' });
  const [tab, setTab]       = useState('overview');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get(`/driver/trips/${id}`);
      setData(r.data);
    } catch (e) {
      setMsg({ type: 'error', text: e.response?.data?.error || 'Load failed' });
    } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const doAction = async (endpoint, body) => {
    try {
      await api.post(endpoint, body);
      setMsg({ type: 'success', text: 'Action completed!' });
      load();
    } catch (e) {
      setMsg({ type: 'error', text: e.response?.data?.error || 'Error' });
    }
  };

  const submitGPS = async (e) => {
    e.preventDefault();
    try {
      await api.post('/driver/location', {
        driver_id: data.trip.driver_id,
        trip_id: id,
        lat: parseFloat(gpsFrm.lat),
        lng: parseFloat(gpsFrm.lng),
        speed_kmh: parseFloat(gpsFrm.speed_kmh) || 0,
      });
      setMsg({ type: 'success', text: 'Location updated!' });
      setGpsFrm({ lat: '', lng: '', speed_kmh: '' });
    } catch (e) {
      setMsg({ type: 'error', text: e.response?.data?.error || 'GPS update failed' });
    }
  };

  const submitPOD = async (e) => {
    e.preventDefault();
    try {
      await api.post('/driver/pod', {
        ...podFrm,
        trip_id: id,
        stop_sequence: data.shipments.findIndex(s => s._id === podFrm.shipment_id),
      });
      setMsg({ type: 'success', text: 'POD submitted!' });
      setPodFrm({ shipment_id: '', receiver_name: '', notes: '' });
      load();
    } catch (e) {
      setMsg({ type: 'error', text: e.response?.data?.error || 'POD submission failed' });
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  );

  if (!data) return <div className="p-6 text-red-600">Trip not found</div>;

  const { trip, shipments = [], locations = [], incidents = [], checklist } = data;

  const TABS = ['overview', 'stops', 'gps', 'pod', 'incidents', 'checklist'];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/driver/trips')} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600">
          ← Back
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900 font-mono">{trip.trip_number}</h1>
            <span className={`text-xs px-2 py-1 rounded-full font-semibold ${TRIP_STATUS_COLOR[trip.status] || 'bg-gray-100 text-gray-600'}`}>
              {trip.status?.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          <div className="text-sm text-gray-500 mt-1">
            Driver: {trip.driver_name || 'Unassigned'} · Vehicle: {trip.vehicle_id?.registration_number || trip.vehicle_number || '—'}
          </div>
        </div>
        <div className="flex gap-2">
          {trip.status === 'approved' && (
            <button onClick={() => doAction('/driver/trips/start', { trip_id: id })}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
              Start Trip
            </button>
          )}
          {trip.status === 'in_progress' && (
            <>
              <button onClick={() => { const r = window.prompt('Reason?'); if (r) doAction('/driver/trips/pause', { trip_id: id, reason: r }); }}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600">
                Pause
              </button>
              <button onClick={() => doAction('/driver/trips/complete', { trip_id: id })}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                Complete Trip
              </button>
            </>
          )}
          {trip.status === 'exception' && (
            <button onClick={() => doAction('/driver/trips/resume', { trip_id: id })}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600">
              Resume Trip
            </button>
          )}
        </div>
      </div>

      {msg && (
        <div className={`rounded-lg px-4 py-3 text-sm font-medium ${msg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {msg.text}
          <button onClick={() => setMsg(null)} className="ml-4 opacity-60">✕</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit overflow-x-auto">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors whitespace-nowrap ${tab === t ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <h3 className="font-semibold text-gray-800">Trip Details</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Trip Type', trip.trip_type?.replace('_', ' ')],
                ['Total Stops', trip.stops?.length || 0],
                ['Total Weight', trip.total_weight_kg ? `${trip.total_weight_kg} kg` : '—'],
                ['Total Packages', trip.total_packages || '—'],
                ['Distance', trip.total_distance_km ? `${trip.total_distance_km} km` : '—'],
                ['Planned Start', trip.planned_start ? new Date(trip.planned_start).toLocaleString() : '—'],
                ['Actual Start', trip.actual_start ? new Date(trip.actual_start).toLocaleString() : '—'],
                ['Planned End', trip.planned_end ? new Date(trip.planned_end).toLocaleString() : '—'],
                ['Odometer Start', trip.odometer_start ? `${trip.odometer_start} km` : '—'],
                ['Fuel Cost', trip.fuel_cost ? `₹${trip.fuel_cost}` : '—'],
              ].map(([k, v]) => (
                <div key={k}>
                  <div className="text-xs text-gray-400 uppercase tracking-wide">{k}</div>
                  <div className="font-medium text-gray-800">{v || '—'}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-800 mb-3">Shipments ({shipments.length})</h3>
            {shipments.length === 0 ? (
              <div className="text-sm text-gray-400">No shipments linked</div>
            ) : (
              <div className="space-y-2">
                {shipments.map(s => (
                  <div key={s._id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 text-sm">
                    <div>
                      <div className="font-mono text-blue-600 font-medium">{s.lr_number}</div>
                      <div className="text-gray-500 text-xs">{s.receiver_name} · {s.destination}</div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                      {s.status?.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stops Timeline */}
      {tab === 'stops' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Trip Stops</h3>
          {!trip.stops?.length ? (
            <div className="text-sm text-gray-400">No stops defined</div>
          ) : (
            <div className="relative pl-6">
              <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gray-200" />
              {trip.stops.map((stop, i) => (
                <div key={i} className="relative mb-6">
                  <div className={`absolute -left-[18px] w-4 h-4 rounded-full border-2 border-white shadow ${stop.status === 'completed' ? 'bg-green-500' : stop.status === 'arrived' ? 'bg-yellow-400' : 'bg-gray-300'}`} />
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium text-gray-900">Stop {stop.sequence}: {stop.stop_type?.toUpperCase()}</div>
                        <div className="text-sm text-gray-600 mt-0.5">{stop.address}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {stop.receiver_name && `${stop.receiver_name} · `}
                          {stop.packages} pkg · {stop.weight_kg ? `${stop.weight_kg} kg` : ''}
                        </div>
                        {stop.estimated_arrival && (
                          <div className="text-xs text-gray-400">ETA: {new Date(stop.estimated_arrival).toLocaleString()}</div>
                        )}
                        {stop.actual_arrival && (
                          <div className="text-xs text-green-600">Arrived: {new Date(stop.actual_arrival).toLocaleString()}</div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STOP_STATUS[stop.status] || 'bg-gray-100 text-gray-500'}`}>
                          {stop.status?.toUpperCase()}
                        </span>
                        {stop.pod_collected && <span className="text-xs text-green-600 font-medium">✓ POD</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* GPS Updates */}
      {tab === 'gps' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Update Location</h3>
            <form onSubmit={submitGPS} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Latitude *</label>
                  <input type="number" step="any" required value={gpsFrm.lat}
                    onChange={e => setGpsFrm(f => ({ ...f, lat: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. 19.0760"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Longitude *</label>
                  <input type="number" step="any" required value={gpsFrm.lng}
                    onChange={e => setGpsFrm(f => ({ ...f, lng: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. 72.8777"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Speed (km/h)</label>
                <input type="number" value={gpsFrm.speed_kmh}
                  onChange={e => setGpsFrm(f => ({ ...f, speed_kmh: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
              <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                📍 Update Location
              </button>
            </form>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-800 mb-4">GPS History ({locations.length})</h3>
            {locations.length === 0 ? (
              <div className="text-sm text-gray-400">No GPS pings yet</div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {locations.map(loc => (
                  <div key={loc._id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 text-xs">
                    <div className="text-gray-700">
                      {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}
                      {loc.speed_kmh != null && <span className="ml-2 text-gray-400">{loc.speed_kmh} km/h</span>}
                      {loc.is_idle && <span className="ml-2 text-yellow-500">IDLE</span>}
                    </div>
                    <div className="text-gray-400">{new Date(loc.recorded_at).toLocaleTimeString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* POD */}
      {tab === 'pod' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 max-w-lg">
          <h3 className="font-semibold text-gray-800 mb-4">Submit Proof of Delivery</h3>
          <form onSubmit={submitPOD} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Shipment *</label>
              <select required value={podFrm.shipment_id}
                onChange={e => setPodFrm(f => ({ ...f, shipment_id: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Shipment</option>
                {shipments.filter(s => s.status !== 'delivered').map(s => (
                  <option key={s._id} value={s._id}>{s.lr_number} — {s.receiver_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Receiver Name</label>
              <input value={podFrm.receiver_name}
                onChange={e => setPodFrm(f => ({ ...f, receiver_name: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                placeholder="Person who received the goods"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
              <textarea value={podFrm.notes}
                onChange={e => setPodFrm(f => ({ ...f, notes: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Any delivery notes (damages, short qty, etc.)"
              />
            </div>
            <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
              ℹ️ Submitting POD will mark this shipment as delivered and create a tracking event.
            </div>
            <button type="submit"
              disabled={!podFrm.shipment_id}
              className="w-full py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
              ✅ Submit POD
            </button>
          </form>
        </div>
      )}

      {/* Incidents */}
      {tab === 'incidents' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Trip Incidents ({incidents.length})</h3>
          {incidents.length === 0 ? (
            <div className="p-6 text-center text-gray-400 text-sm">No incidents reported for this trip</div>
          ) : (
            <div className="space-y-3">
              {incidents.map(inc => (
                <div key={inc._id} className={`rounded-xl p-4 border ${inc.severity === 'critical' ? 'bg-red-50 border-red-200' : inc.severity === 'high' ? 'bg-orange-50 border-orange-200' : 'bg-yellow-50 border-yellow-200'}`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="font-semibold text-gray-800 capitalize">{inc.type.replace(/_/g, ' ')}</span>
                      <span className="ml-2 text-xs text-gray-400 font-mono">{inc.incident_number}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${inc.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {inc.status?.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{inc.description}</p>
                  {inc.ai_recommendation && (
                    <div className="bg-white rounded-lg p-2 text-xs text-indigo-700 border border-indigo-100">
                      🤖 AI: {inc.ai_recommendation}
                    </div>
                  )}
                  {inc.estimated_delay_min && (
                    <div className="text-xs text-gray-500 mt-1">Estimated delay: {inc.estimated_delay_min} min</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Checklist */}
      {tab === 'checklist' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Pre-Trip Checklist</h3>
          {!checklist ? (
            <div className="text-sm text-gray-400">No checklist available. Start the trip to generate one.</div>
          ) : (
            <div className="space-y-2">
              {checklist.items?.map((item, i) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-lg ${item.checked ? 'bg-green-50' : 'bg-red-50'}`}>
                  <span className={`text-lg ${item.checked ? '✅' : '❌'}`}>{item.checked ? '✅' : '❌'}</span>
                  <div>
                    <div className="text-sm text-gray-700">{item.item}</div>
                    <div className="text-xs text-gray-400 capitalize">{item.category}</div>
                  </div>
                </div>
              ))}
              {checklist.completed_at && (
                <div className="text-xs text-gray-400 pt-2">
                  Completed at: {new Date(checklist.completed_at).toLocaleString()}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
