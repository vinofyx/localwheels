// phase10-driver-dashboard
import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';

const STATUS_COLOR = {
  available: 'bg-green-100 text-green-700',
  on_trip:   'bg-blue-100 text-blue-700',
  leave:     'bg-yellow-100 text-yellow-700',
  inactive:  'bg-gray-100 text-gray-500',
};
const TRIP_STATUS_COLOR = {
  planned:     'bg-gray-100 text-gray-600',
  approved:    'bg-blue-100 text-blue-700',
  loading:     'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-green-100 text-green-700',
  completed:   'bg-emerald-100 text-emerald-700',
  cancelled:   'bg-red-100 text-red-700',
  exception:   'bg-orange-100 text-orange-700',
};

function KpiCard({ label, value, sub, color = 'blue', icon }) {
  const colors = {
    blue:   'from-blue-500 to-blue-600',
    green:  'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600',
    red:    'from-red-500 to-red-600',
    purple: 'from-purple-500 to-purple-600',
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-xl p-4 text-white`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        <span className="text-3xl font-bold">{value}</span>
      </div>
      <div className="font-semibold text-sm opacity-90">{label}</div>
      {sub && <div className="text-xs mt-1 opacity-75">{sub}</div>}
    </div>
  );
}

export default function DriverDashboard() {
  const [data, setData]         = useState(null);
  const [drivers, setDrivers]   = useState([]);
  const [driverId, setDriverId] = useState('');
  const [loading, setLoading]   = useState(true);
  const [actionTripId, setActionTripId]   = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const loadDrivers = useCallback(async () => {
    try {
      const r = await api.get('/drivers');
      setDrivers(r.data?.data?.drivers || r.data?.drivers || []);
    } catch {}
  }, []);

  const loadDashboard = useCallback(async (did) => {
    setLoading(true);
    try {
      const url = did ? `/driver/dashboard?driver_id=${did}` : '/driver/dashboard';
      const r = await api.get(url);
      setData(r.data);
    } catch (e) {
      setMsg({ type: 'error', text: e.response?.data?.error || 'Failed to load dashboard' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDrivers();
    loadDashboard('');
  }, [loadDrivers, loadDashboard]);

  useEffect(() => {
    loadDashboard(driverId);
  }, [driverId, loadDashboard]);

  const startTrip = async (tripId) => {
    setActionLoading(true);
    try {
      await api.post('/driver/trips/start', { trip_id: tripId });
      setMsg({ type: 'success', text: 'Trip started successfully!' });
      loadDashboard(driverId);
    } catch (e) {
      setMsg({ type: 'error', text: e.response?.data?.error || 'Failed to start trip' });
    } finally {
      setActionLoading(false);
    }
  };

  const completeTrip = async (tripId) => {
    setActionLoading(true);
    try {
      await api.post('/driver/trips/complete', { trip_id: tripId });
      setMsg({ type: 'success', text: 'Trip completed!' });
      loadDashboard(driverId);
    } catch (e) {
      setMsg({ type: 'error', text: e.response?.data?.error || 'Failed to complete trip' });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  );

  const { driver, todayTrips = [], activeTrips = [], recentIncidents = [], unreadNotifs = 0, aiInsight, expiryAlert = [] } = data || {};

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Driver Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Live trip and driver operations overview</p>
        </div>
        <select
          value={driverId}
          onChange={e => setDriverId(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Drivers</option>
          {drivers.map(d => (
            <option key={d._id} value={d._id}>{d.name} — {d.phone}</option>
          ))}
        </select>
      </div>

      {msg && (
        <div className={`rounded-lg px-4 py-3 text-sm font-medium ${msg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {msg.text}
          <button onClick={() => setMsg(null)} className="ml-4 opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Driver Info */}
      {driver && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-600">
            {driver.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="font-semibold text-gray-900 text-lg">{driver.name}</div>
            <div className="text-sm text-gray-500">{driver.phone} · License: {driver.license_number}</div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLOR[driver.status] || 'bg-gray-100 text-gray-600'}`}>
            {(driver.status || 'available').replace('_', ' ').toUpperCase()}
          </span>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Today's Trips"   value={todayTrips.length}    icon="🚛" color="blue" />
        <KpiCard label="Active Trips"    value={activeTrips.length}   icon="📍" color="green" sub="In progress" />
        <KpiCard label="Open Incidents"  value={recentIncidents.length} icon="⚠️" color="orange" />
        <KpiCard label="Notifications"   value={unreadNotifs}          icon="🔔" color="purple" sub="Unread" />
      </div>

      {/* Document Expiry Alerts */}
      {expiryAlert.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="font-semibold text-yellow-800 mb-2">⚠️ Document Expiry Alerts ({expiryAlert.length})</div>
          <div className="space-y-1">
            {expiryAlert.map(d => (
              <div key={d._id} className="text-sm text-yellow-700 flex justify-between">
                <span>{d.title}</span>
                <span className="font-medium">{d.expiry_date ? new Date(d.expiry_date).toLocaleDateString() : 'No expiry'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Trips */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Today's Trips</h2>
            <a href="/driver/trips" className="text-sm text-blue-600 hover:underline">View All →</a>
          </div>
          {todayTrips.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No trips scheduled for today</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {todayTrips.map(trip => (
                <div key={trip._id} className="p-4 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 text-sm">{trip.trip_number}</div>
                    <div className="text-xs text-gray-500 truncate">
                      {trip.origin_address || 'Origin'} → {trip.stops?.[trip.stops.length - 1]?.address || 'Destination'}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {trip.stops?.length || 0} stop(s) · {trip.total_distance_km ? `${trip.total_distance_km} km` : 'Distance TBD'}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TRIP_STATUS_COLOR[trip.status] || 'bg-gray-100 text-gray-600'}`}>
                      {trip.status?.replace('_', ' ').toUpperCase()}
                    </span>
                    {trip.status === 'approved' && (
                      <button
                        onClick={() => startTrip(trip._id)}
                        disabled={actionLoading}
                        className="text-xs px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        Start Trip
                      </button>
                    )}
                    {trip.status === 'in_progress' && (
                      <button
                        onClick={() => completeTrip(trip._id)}
                        disabled={actionLoading}
                        className="text-xs px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Insight Panel */}
        <div className="space-y-4">
          {aiInsight && (
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🤖</span>
                <span className="font-semibold text-indigo-800">AI Assistant</span>
                <span className="ml-auto text-xs text-indigo-400">{aiInsight.confidence}% confidence</span>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-xs font-semibold text-indigo-500 uppercase tracking-wide mb-1">Next Action</div>
                  <div className="text-gray-700">{aiInsight.next_action}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-green-500 uppercase tracking-wide mb-1">Safety</div>
                  <div className="text-gray-700">{aiInsight.safety_tip}</div>
                </div>
                {aiInsight.fuel_note && (
                  <div>
                    <div className="text-xs font-semibold text-orange-500 uppercase tracking-wide mb-1">Fuel</div>
                    <div className="text-gray-700">{aiInsight.fuel_note}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'My Trips',      icon: '🚛', href: '/driver/trips' },
                { label: 'Report Issue',  icon: '⚠️', href: '/driver/incidents' },
                { label: 'Submit POD',    icon: '📋', href: '/driver/pod' },
                { label: 'Performance',   icon: '📊', href: '/driver/performance' },
                { label: 'Documents',     icon: '📄', href: '/driver/documents' },
                { label: 'Voice Assist',  icon: '🎤', href: '/driver/voice' },
              ].map(a => (
                <a
                  key={a.label}
                  href={a.href}
                  className="flex flex-col items-center justify-center gap-1 p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-colors text-center"
                >
                  <span className="text-xl">{a.icon}</span>
                  <span className="text-xs text-gray-600 font-medium">{a.label}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Recent Incidents */}
          {recentIncidents.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-800 mb-3">Open Incidents</h3>
              <div className="space-y-2">
                {recentIncidents.slice(0, 3).map(inc => (
                  <div key={inc._id} className="text-sm flex items-start gap-2">
                    <span className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${inc.severity === 'critical' ? 'bg-red-500' : inc.severity === 'high' ? 'bg-orange-500' : 'bg-yellow-400'}`} />
                    <div>
                      <div className="text-gray-700 capitalize">{inc.type.replace(/_/g, ' ')}</div>
                      <div className="text-xs text-gray-400">{new Date(inc.createdAt).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
