import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/client';

const STATUS_FILTERS = [
  { key: 'all',               label: 'All Active' },
  { key: 'in_transit',        label: 'In Transit' },
  { key: 'out_for_delivery',  label: 'Out for Delivery' },
  { key: 'reached_hub',       label: 'At Hub' },
  { key: 'delivery_failed',   label: 'Failed' },
  { key: 'hold',              label: 'On Hold' },
];

const ALL_STATUSES = [
  'booked', 'booking_confirmed', 'pickup_scheduled', 'driver_assigned',
  'vehicle_arrived', 'picked_up', 'reached_warehouse', 'warehouse_processing',
  'dispatched', 'in_transit', 'reached_hub', 'out_for_delivery', 'delivered',
  'delivery_failed', 'hold', 'returned', 'cancelled',
];

const COLOR_MAP = {
  blue:   { bg: '#eff6ff', text: '#1d4ed8', dot: '#3b82f6' },
  indigo: { bg: '#eef2ff', text: '#4338ca', dot: '#6366f1' },
  orange: { bg: '#fff7ed', text: '#c2410c', dot: '#f97316' },
  amber:  { bg: '#fffbeb', text: '#b45309', dot: '#f59e0b' },
  green:  { bg: '#f0fdf4', text: '#15803d', dot: '#22c55e' },
  teal:   { bg: '#f0fdfa', text: '#0f766e', dot: '#14b8a6' },
  cyan:   { bg: '#ecfeff', text: '#0e7490', dot: '#06b6d4' },
  red:    { bg: '#fef2f2', text: '#b91c1c', dot: '#ef4444' },
  gray:   { bg: '#f9fafb', text: '#374151', dot: '#6b7280' },
};

function StatusBadge({ color, label }) {
  const c = COLOR_MAP[color] || COLOR_MAP.gray;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: c.bg, color: c.text }}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: c.dot }} />
      {label}
    </span>
  );
}

function ShipmentCard({ s, onUpdateStatus }) {
  const hasGPS = s.current_lat && s.current_lng;
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between gap-2">
        <span className="font-bold text-gray-800 text-sm tracking-wide">{s.lr_number}</span>
        <StatusBadge color={s.status_color} label={s.status_label} />
      </div>

      <div className="px-4 py-3 space-y-2">
        <div className="flex items-center gap-1.5 text-xs text-gray-600">
          <span>📦</span>
          <span className="font-medium truncate">{s.receiver_name}</span>
          <span className="text-gray-300 flex-shrink-0">→</span>
          <span className="truncate text-gray-500">{s.destination}</span>
        </div>

        {(s.driver_name || s.vehicle_number) && (
          <div className="flex items-center gap-3 text-xs text-gray-500">
            {s.driver_name && (
              <span className="flex items-center gap-1"><span>👤</span>{s.driver_name}</span>
            )}
            {s.vehicle_number && (
              <span className="flex items-center gap-1"><span>🚛</span>{s.vehicle_number}</span>
            )}
          </div>
        )}

        {s.current_hub && (
          <p className="text-xs text-gray-500 flex items-center gap-1"><span>🏢</span>{s.current_hub}</p>
        )}

        {s.last_event && (
          <p className="text-xs text-gray-400 truncate">
            ↳ {s.last_event.type.replace(/_/g, ' ')}{s.last_event.location ? ` · ${s.last_event.location}` : ''}
          </p>
        )}

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${hasGPS ? 'bg-green-500' : 'bg-gray-300'}`} />
            <span className="text-[10px] text-gray-400">{hasGPS ? 'GPS Live' : 'No GPS'}</span>
            {s.eta_date && (
              <span className="text-[10px] text-blue-500 ml-2">
                ETA {new Date(s.eta_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </span>
            )}
          </div>
          <button
            onClick={() => onUpdateStatus(s)}
            className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline"
          >
            Update →
          </button>
        </div>
      </div>
    </div>
  );
}

function UpdateModal({ shipment, onClose, onSaved }) {
  const [status, setStatus] = useState(shipment.status);
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [driver, setDriver] = useState(shipment.driver_name || '');
  const [vehicle, setVehicle] = useState(shipment.vehicle_number || '');
  const [hub, setHub] = useState(shipment.current_hub || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function save() {
    setSaving(true); setError('');
    try {
      await api.patch(`/tracking/${shipment._id}/status`, {
        status, location, description,
        driver_name: driver, vehicle_number: vehicle, current_hub: hub,
      });
      onSaved();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to update');
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-blue-600 px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-white font-bold">{shipment.lr_number}</p>
            <p className="text-blue-200 text-xs">{shipment.receiver_name} → {shipment.destination}</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white text-xl leading-none">✕</button>
        </div>

        <div className="p-5 space-y-4">
          {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg p-2">{error}</p>}

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">New Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ALL_STATUSES.map(s => (
                <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Location</label>
            <input
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Mumbai Hub, NH-48 near Pune"
              value={location}
              onChange={e => setLocation(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Driver Name</label>
              <input
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Driver name"
                value={driver}
                onChange={e => setDriver(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Vehicle No.</label>
              <input
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="MH01AB1234"
                value={vehicle}
                onChange={e => setVehicle(e.target.value.toUpperCase())}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Hub / Checkpoint</label>
            <input
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Pune Hub, Delhi Sorting Center"
              value={hub}
              onChange={e => setHub(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Remarks</label>
            <textarea
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={2}
              placeholder="Any additional notes..."
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Update'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DispatcherView() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [countdown, setCountdown] = useState(30);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [error, setError] = useState('');

  const fetchShipments = useCallback(async () => {
    setError('');
    try {
      const params = new URLSearchParams({ status: filter });
      if (search.trim()) params.append('search', search.trim());
      const { data: { data } } = await api.get(`/tracking/dispatcher?${params}`);
      setShipments(data.shipments || []);
      setLastRefresh(new Date());
      setCountdown(30);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load shipments');
    } finally { setLoading(false); }
  }, [filter, search]);

  useEffect(() => { setLoading(true); fetchShipments(); }, [filter]);

  useEffect(() => {
    const interval = setInterval(() => fetchShipments(), 30000);
    return () => clearInterval(interval);
  }, [fetchShipments]);

  useEffect(() => {
    const tick = setInterval(() => setCountdown(c => c > 0 ? c - 1 : 30), 1000);
    return () => clearInterval(tick);
  }, [lastRefresh]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    setLoading(true);
    fetchShipments();
  }

  const statusCounts = shipments.reduce((acc, s) => {
    acc[s.status] = (acc[s.status] || 0) + 1;
    return acc;
  }, {});

  const gpsCount  = shipments.filter(s => s.current_lat).length;
  const inTransit = shipments.filter(s => ['in_transit', 'dispatched', 'out_for_delivery'].includes(s.status)).length;

  return (
    <div className="p-4 sm:p-6 max-w-screen-xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Dispatcher Live View</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {shipments.length} active shipment{shipments.length !== 1 ? 's' : ''} ·
            {' '}{gpsCount} with GPS · {inTransit} in motion
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">Refreshes in {countdown}s</span>
          <button
            onClick={() => { setLoading(true); fetchShipments(); }}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-100"
          >
            <span className={loading ? 'animate-spin' : ''}>↻</span> Refresh
          </button>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <input
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-xs"
          placeholder="Search LR, driver, vehicle, destination…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">
          Search
        </button>
        {search && (
          <button type="button" onClick={() => { setSearch(''); setLoading(true); fetchShipments(); }} className="px-3 py-2 text-gray-500 hover:text-gray-700 text-sm">
            Clear
          </button>
        )}
      </form>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map(f => {
          const count = f.key === 'all' ? shipments.length : (statusCounts[f.key] || 0);
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                filter === f.key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:text-blue-700'
              }`}
            >
              {f.label}{count > 0 && <span className="ml-1.5 opacity-75">({count})</span>}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 rounded-xl p-3 text-sm">{error}</div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl h-40 animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : shipments.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-3">🚛</div>
          <p className="font-semibold text-gray-500">No active shipments</p>
          <p className="text-sm mt-1">All deliveries are complete or the queue is empty.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {shipments.map(s => (
            <ShipmentCard key={s._id} s={s} onUpdateStatus={setSelectedShipment} />
          ))}
        </div>
      )}

      {/* Update modal */}
      {selectedShipment && (
        <UpdateModal
          shipment={selectedShipment}
          onClose={() => setSelectedShipment(null)}
          onSaved={() => {
            setSelectedShipment(null);
            fetchShipments();
          }}
        />
      )}
    </div>
  );
}
