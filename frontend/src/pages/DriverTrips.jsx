import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

const STATUS_COLOR = {
  planned:     'bg-gray-100 text-gray-600',
  approved:    'bg-blue-100 text-blue-700',
  loading:     'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-green-100 text-green-700',
  completed:   'bg-emerald-100 text-emerald-700',
  cancelled:   'bg-red-100 text-red-700',
  exception:   'bg-orange-100 text-orange-700',
  replanning:  'bg-purple-100 text-purple-700',
};

export default function DriverTrips() {
  const navigate = useNavigate();
  const [trips, setTrips]     = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg]         = useState(null);

  const [filters, setFilters] = useState({ driver_id: '', status: '', date_from: '', date_to: '' });
  const [page, setPage] = useState(1);
  const PER_PAGE = 15;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: PER_PAGE });
      if (filters.driver_id) params.set('driver_id', filters.driver_id);
      if (filters.status)    params.set('status', filters.status);
      if (filters.date_from) params.set('date_from', filters.date_from);
      if (filters.date_to)   params.set('date_to', filters.date_to);
      const r = await api.get(`/driver/trips?${params}`);
      setTrips(r.data.trips || []);
      setTotal(r.data.total || 0);
    } catch (e) {
      setMsg({ type: 'error', text: e.response?.data?.error || 'Load failed' });
    } finally { setLoading(false); }
  }, [filters, page]);

  useEffect(() => {
    api.get('/drivers').then(r => setDrivers(r.data?.data?.drivers || r.data?.drivers || [])).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  const startTrip = async (tripId) => {
    try {
      await api.post('/driver/trips/start', { trip_id: tripId });
      setMsg({ type: 'success', text: 'Trip started!' });
      load();
    } catch (e) { setMsg({ type: 'error', text: e.response?.data?.error || 'Error' }); }
  };

  const completeTrip = async (tripId) => {
    try {
      await api.post('/driver/trips/complete', { trip_id: tripId });
      setMsg({ type: 'success', text: 'Trip completed!' });
      load();
    } catch (e) { setMsg({ type: 'error', text: e.response?.data?.error || 'Error' }); }
  };

  const pauseTrip = async (tripId) => {
    const reason = window.prompt('Reason for pausing?');
    if (!reason) return;
    try {
      await api.post('/driver/trips/pause', { trip_id: tripId, reason });
      setMsg({ type: 'success', text: 'Trip paused.' });
      load();
    } catch (e) { setMsg({ type: 'error', text: e.response?.data?.error || 'Error' }); }
  };

  const resumeTrip = async (tripId) => {
    try {
      await api.post('/driver/trips/resume', { trip_id: tripId });
      setMsg({ type: 'success', text: 'Trip resumed!' });
      load();
    } catch (e) { setMsg({ type: 'error', text: e.response?.data?.error || 'Error' }); }
  };

  const pages = Math.ceil(total / PER_PAGE);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Driver Trips</h1>
          <p className="text-sm text-gray-500 mt-1">{total} total trips</p>
        </div>
      </div>

      {msg && (
        <div className={`rounded-lg px-4 py-3 text-sm font-medium ${msg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {msg.text}
          <button onClick={() => setMsg(null)} className="ml-4 opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <select
            value={filters.driver_id}
            onChange={e => { setFilters(f => ({ ...f, driver_id: e.target.value })); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Drivers</option>
            {drivers.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
          </select>
          <select
            value={filters.status}
            onChange={e => { setFilters(f => ({ ...f, status: e.target.value })); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            {['planned','approved','loading','in_progress','completed','cancelled','exception'].map(s => (
              <option key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</option>
            ))}
          </select>
          <input type="date" value={filters.date_from}
            onChange={e => { setFilters(f => ({ ...f, date_from: e.target.value })); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            placeholder="From Date"
          />
          <input type="date" value={filters.date_to}
            onChange={e => { setFilters(f => ({ ...f, date_to: e.target.value })); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            placeholder="To Date"
          />
        </div>
      </div>

      {/* Trip List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : trips.length === 0 ? (
          <div className="p-10 text-center text-gray-400">No trips found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Trip #', 'Driver', 'Vehicle', 'Route', 'Stops', 'Planned', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {trips.map(trip => (
                  <tr key={trip._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigate(`/driver/trips/${trip._id}`)}
                        className="font-mono text-blue-600 hover:underline font-medium"
                      >
                        {trip.trip_number}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{trip.driver_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {trip.vehicle_id?.registration_number || trip.vehicle_number || '—'}
                    </td>
                    <td className="px-4 py-3 max-w-[160px]">
                      <div className="text-gray-700 truncate text-xs">{trip.origin_address || 'Origin'}</div>
                      <div className="text-gray-400 text-xs">→ {trip.stops?.[trip.stops.length - 1]?.address || 'Dest'}</div>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700">{trip.stops?.length || 0}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {trip.planned_start ? new Date(trip.planned_start).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLOR[trip.status] || 'bg-gray-100 text-gray-600'}`}>
                        {trip.status?.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        <button
                          onClick={() => navigate(`/driver/trips/${trip._id}`)}
                          className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
                        >
                          View
                        </button>
                        {trip.status === 'approved' && (
                          <button onClick={() => startTrip(trip._id)}
                            className="text-xs px-2 py-1 rounded bg-green-600 text-white hover:bg-green-700">
                            Start
                          </button>
                        )}
                        {trip.status === 'in_progress' && (
                          <>
                            <button onClick={() => pauseTrip(trip._id)}
                              className="text-xs px-2 py-1 rounded bg-yellow-500 text-white hover:bg-yellow-600">
                              Pause
                            </button>
                            <button onClick={() => completeTrip(trip._id)}
                              className="text-xs px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700">
                              Complete
                            </button>
                          </>
                        )}
                        {trip.status === 'exception' && (
                          <button onClick={() => resumeTrip(trip._id)}
                            className="text-xs px-2 py-1 rounded bg-orange-500 text-white hover:bg-orange-600">
                            Resume
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">Page {page} of {pages}</div>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50">
              Previous
            </button>
            <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50">
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
