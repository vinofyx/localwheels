import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/client';

const MILESTONES = [
  { key: 'booked',           label: 'Booked' },
  { key: 'picked_up',        label: 'Picked Up' },
  { key: 'in_transit',       label: 'In Transit' },
  { key: 'reached_hub',      label: 'At Hub' },
  { key: 'out_for_delivery', label: 'Out for Delivery' },
  { key: 'delivered',        label: 'Delivered' },
];

const STATUS_STEP = {
  booked: 1, booking_confirmed: 1,
  pickup_scheduled: 1, driver_assigned: 2, vehicle_arrived: 2,
  picked_up: 2,
  reached_warehouse: 3, warehouse_processing: 3, dispatched: 3, in_transit: 3,
  reached_hub: 4, at_hub: 4,
  out_for_delivery: 5, delivery_failed: 5,
  delivered: 6,
  hold: 3, lost: 0, returned: 6, cancelled: 0,
};

const COLOR = {
  blue: '#3b82f6', indigo: '#6366f1', violet: '#8b5cf6', purple: '#a855f7',
  orange: '#f97316', amber: '#f59e0b', yellow: '#eab308', lime: '#84cc16',
  green: '#22c55e', teal: '#14b8a6', cyan: '#06b6d4', red: '#ef4444',
  gray: '#6b7280',
};

const EVENT_ICONS = {
  booked: '📦', booking_confirmed: '📋', pickup_scheduled: '📅',
  driver_assigned: '👤', vehicle_arrived: '🚛', picked_up: '📤',
  reached_warehouse: '🏭', warehouse_processing: '⚙️', dispatched: '🚀',
  in_transit: '🛣️', reached_hub: '🏢', at_hub: '🏢',
  out_for_delivery: '🏍️', delivered: '✅', delivery_failed: '❌',
  hold: '⏸️', lost: '❓', returned: '↩️', cancelled: '🚫',
  exception: '⚠️', gps_update: '📍', delay: '⏰', status_update: '🔄',
};

function ProgressBar({ step }) {
  return (
    <div className="flex items-start gap-0">
      {MILESTONES.map((m, i) => {
        const done = i + 1 < step;
        const active = i + 1 === step;
        return (
          <React.Fragment key={m.key}>
            <div className="flex flex-col items-center flex-shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                done   ? 'bg-blue-600 border-blue-600 text-white'     :
                active ? 'bg-white border-blue-600 text-blue-600 ring-4 ring-blue-100' :
                         'bg-white border-gray-300 text-gray-400'
              }`}>
                {done ? '✓' : i + 1}
              </div>
              <span className={`text-[10px] text-center mt-1 leading-tight max-w-[52px] ${
                active ? 'text-blue-700 font-semibold' : done ? 'text-blue-500' : 'text-gray-400'
              }`}>{m.label}</span>
            </div>
            {i < MILESTONES.length - 1 && (
              <div className={`flex-1 h-0.5 mt-4 mx-0.5 transition-all ${i + 1 < step ? 'bg-blue-600' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function ETACard({ lr }) {
  const [eta, setEta] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!lr) return;
    api.get(`/tracking/${lr}/eta`)
      .then(r => setEta(r.data.data))
      .catch(() => setEta(null))
      .finally(() => setLoading(false));
  }, [lr]);

  if (loading) return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 animate-pulse h-28" />
  );
  if (!eta) return null;

  const riskColor = eta.delay_risk === 'Low' ? 'text-green-600' : eta.delay_risk === 'Medium' ? 'text-amber-600' : 'text-red-600';

  return (
    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-4 text-white shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-blue-200 text-xs font-semibold uppercase tracking-wider">AI Estimated Delivery</p>
          <p className="text-2xl font-bold mt-0.5">{eta.eta_text}</p>
          <p className="text-blue-100 text-xs mt-1">{eta.reasoning}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="bg-white/20 rounded-lg px-3 py-2 text-center">
            <p className="text-xs text-blue-200">Confidence</p>
            <p className="text-xl font-bold">{eta.confidence}%</p>
          </div>
          <p className={`text-xs mt-1 font-semibold bg-white rounded px-2 py-0.5 ${riskColor}`}>
            {eta.delay_risk} Risk
          </p>
        </div>
      </div>
      {eta.delay_reason && (
        <p className="text-blue-200 text-xs mt-2 border-t border-white/20 pt-2">⚠️ {eta.delay_reason}</p>
      )}
    </div>
  );
}

function MapCard({ lat, lng, locationName }) {
  if (!lat || !lng) {
    return (
      <div className="bg-gray-100 rounded-xl overflow-hidden h-40 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <div className="text-3xl mb-1">📍</div>
          <p className="text-xs">GPS location not available</p>
        </div>
      </div>
    );
  }
  const bbox = `${lng - 0.05},${lat - 0.05},${lng + 0.05},${lat + 0.05}`;
  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
      {locationName && (
        <div className="bg-white px-3 py-1.5 text-xs font-medium text-gray-700 border-b border-gray-200 flex items-center gap-1">
          <span>📍</span> {locationName}
        </div>
      )}
      <iframe
        title="Shipment Location"
        src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`}
        width="100%"
        height="180"
        style={{ border: 0, display: 'block' }}
        loading="lazy"
      />
      <a
        href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=12/${lat}/${lng}`}
        target="_blank"
        rel="noopener noreferrer"
        className="block text-center text-xs text-blue-600 py-1.5 bg-white hover:bg-blue-50 border-t border-gray-200"
      >
        View on full map →
      </a>
    </div>
  );
}

export default function Track() {
  const [searchParams] = useSearchParams();
  const [searchType, setSearchType] = useState('lr');
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [phoneResults, setPhoneResults] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const lr = searchParams.get('lr');
    if (lr) { setQuery(lr); setSearchType('lr'); doSearch('lr', lr); }
  }, []);

  async function doSearch(type, val) {
    const v = val || query;
    if (!v.trim()) return;
    setLoading(true); setError(''); setResult(null); setPhoneResults([]);
    try {
      if (type === 'lr') {
        const { data: { data: payload } } = await api.get(`/tracking/${v.trim().toUpperCase()}`);
        setResult(payload);
      } else {
        const { data: { data: payload } } = await api.get(`/tracking/search?type=${type}&value=${encodeURIComponent(v.trim())}`);
        if (type === 'phone') {
          if (Array.isArray(payload)) setPhoneResults(payload);
          else setResult(payload);
        } else {
          setResult(payload);
        }
      }
    } catch (e) {
      setError(e.response?.data?.message || 'No shipment found. Please check and try again.');
    } finally { setLoading(false); }
  }

  async function handleSearch(e) {
    e.preventDefault();
    await doSearch(searchType, query);
  }

  async function loadFromPhone(lr) {
    setPhoneResults([]);
    setLoading(true);
    try {
      const { data: { data: payload } } = await api.get(`/tracking/${lr}`);
      setResult(payload);
    } catch {
      setError('Unable to load shipment details.');
    } finally { setLoading(false); }
  }

  const step = result ? (STATUS_STEP[result.status] || 1) : 0;
  const isTerminal = result && ['delivered', 'returned', 'cancelled', 'lost'].includes(result.status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b2557] via-[#0b5fa8] to-[#0b8fd3] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4 sm:px-8">
        <div className="flex items-center gap-3">
          <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
            <rect width="48" height="48" rx="6" fill="#fff2e8"/>
            <text x="3" y="20" fontSize="9" fontWeight="bold" fill="#e65c00" fontFamily="Arial">LOCAL</text>
            <text x="3" y="30" fontSize="9" fontWeight="bold" fill="#e65c00" fontFamily="Arial">WHEELS</text>
            <path d="M32 16 L42 28 L22 28 Z" fill="#f97316" opacity="0.9"/>
            <circle cx="29" cy="33" r="3" fill="#374151"/>
            <circle cx="38" cy="33" r="3" fill="#374151"/>
          </svg>
          <div>
            <p className="text-white font-bold text-[15px] leading-tight">LocalWheels</p>
            <p className="text-blue-200 text-[11px]">Shipment Tracking</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/my-complaints" className="text-blue-200 hover:text-white text-sm underline">My Complaints</Link>
          <Link to="/login" className="text-blue-200 hover:text-white text-sm underline">Staff Login</Link>
        </div>
      </header>

      {/* Search */}
      <div className="px-4 sm:px-8 pb-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-white text-2xl sm:text-3xl font-bold text-center mb-1">Track Your Shipment</h1>
          <p className="text-blue-200 text-center text-sm mb-5">Real-time tracking · AI-powered ETA</p>

          <form onSubmit={handleSearch} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-5 shadow-xl border border-white/20">
            <div className="flex gap-2 mb-3">
              {[
                { val: 'lr',    label: 'LR Number' },
                { val: 'phone', label: 'Mobile No.' },
                { val: 'awb',   label: 'AWB Number' },
              ].map(t => (
                <button
                  key={t.val}
                  type="button"
                  onClick={() => { setSearchType(t.val); setResult(null); setPhoneResults([]); setError(''); }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    searchType === t.val
                      ? 'bg-white text-blue-700 shadow'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-xl px-4 py-3 text-gray-800 bg-white placeholder-gray-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white/50 shadow-inner"
                placeholder={
                  searchType === 'lr'    ? 'Enter LR Number (e.g. LW000001)' :
                  searchType === 'phone' ? 'Enter sender or receiver mobile' :
                                          'Enter AWB Number'
                }
                value={query}
                onChange={e => setQuery(searchType === 'lr' || searchType === 'awb' ? e.target.value.toUpperCase() : e.target.value)}
                autoFocus
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-white text-blue-700 font-bold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors shadow disabled:opacity-50 whitespace-nowrap"
              >
                {loading ? '…' : 'Track'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 px-4 sm:px-8 pb-8">
        <div className="max-w-2xl mx-auto space-y-4">

          {error && (
            <div className="bg-red-100 text-red-700 rounded-xl p-4 text-sm text-center font-medium">
              {error}
            </div>
          )}

          {/* Phone search: multiple results */}
          {phoneResults.length > 0 && (
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-blue-50 px-4 py-3 border-b border-blue-100">
                <p className="text-sm font-bold text-blue-800">{phoneResults.length} shipment{phoneResults.length > 1 ? 's' : ''} found</p>
              </div>
              {phoneResults.map(s => (
                <button
                  key={s.lr_number}
                  onClick={() => loadFromPhone(s.lr_number)}
                  className="w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors flex items-center justify-between"
                >
                  <div>
                    <p className="font-bold text-gray-800">{s.lr_number}</p>
                    <p className="text-xs text-gray-500">{s.receiver_name} · {s.destination}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    s.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {s.status_label}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Full result */}
          {result && (
            <>
              {/* Status banner */}
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className={`px-4 py-3 flex items-center justify-between ${
                  result.status === 'delivered' ? 'bg-green-600' :
                  ['delivery_failed','lost','cancelled'].includes(result.status) ? 'bg-red-600' :
                  'bg-blue-600'
                }`}>
                  <div>
                    <p className="text-white/80 text-xs">LR Number</p>
                    <p className="text-white font-bold text-lg">{result.lr_number}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/80 text-xs">Current Status</p>
                    <p className="text-white font-bold text-sm">{result.status_label}</p>
                  </div>
                </div>

                {/* Progress bar (hide for terminal failure states) */}
                {result.status !== 'cancelled' && result.status !== 'lost' && (
                  <div className="px-4 py-5">
                    <ProgressBar step={step} />
                  </div>
                )}
              </div>

              {/* AI ETA */}
              {!isTerminal && <ETACard lr={result.lr_number} />}

              {/* Delivered banner */}
              {result.status === 'delivered' && result.delivery_date && (
                <div className="bg-green-600 rounded-xl px-4 py-3 text-white flex items-center gap-3">
                  <span className="text-2xl">✅</span>
                  <div>
                    <p className="font-bold">Delivered Successfully</p>
                    <p className="text-green-100 text-xs">{new Date(result.delivery_date).toLocaleString('en-IN')}</p>
                  </div>
                </div>
              )}

              {/* Map + Driver info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <MapCard lat={result.current_lat} lng={result.current_lng} locationName={result.current_location_name} />

                {/* Driver / Vehicle info */}
                {(result.driver_name || result.vehicle_number) && (
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-3">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Assigned To</p>
                    {result.driver_name && (
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                          {result.driver_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">{result.driver_name}</p>
                          {result.driver_phone && <p className="text-gray-400 text-xs">{result.driver_phone}</p>}
                        </div>
                      </div>
                    )}
                    {result.vehicle_number && (
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-xl">🚛</div>
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">{result.vehicle_number}</p>
                          <p className="text-gray-400 text-xs">Vehicle Number</p>
                        </div>
                      </div>
                    )}
                    {result.current_hub && (
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center text-xl">🏢</div>
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">{result.current_hub}</p>
                          <p className="text-gray-400 text-xs">Current Hub</p>
                        </div>
                      </div>
                    )}
                    {result.last_gps_update && (
                      <p className="text-xs text-gray-400 border-t border-gray-100 pt-2">
                        GPS updated {new Date(result.last_gps_update).toLocaleString('en-IN')}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Shipment details */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-100">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Shipment Details</p>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 p-4">
                  {[
                    ['Sender',       result.sender_name],
                    ['Receiver',     result.receiver_name],
                    ['Origin',       result.origin_branch],
                    ['Destination',  result.destination],
                    ['Weight',       result.weight ? `${result.weight} kg` : '—'],
                    ['Packages',     result.packages],
                    ['Payment',      result.payment_type?.toUpperCase()],
                    ['Booked On',    result.booking_date ? new Date(result.booking_date).toLocaleDateString('en-IN') : '—'],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide">{label}</p>
                      <p className="text-sm font-medium text-gray-800 truncate">{val || '—'}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Event timeline */}
              {result.events && result.events.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-100">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tracking Timeline</p>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {[...result.events].reverse().map((e, i) => (
                      <div key={i} className="flex gap-3 px-4 py-3">
                        <div className="flex-shrink-0 text-xl">{EVENT_ICONS[e.event_type] || '📌'}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold text-gray-800">{e.label || e.event_type.replace(/_/g, ' ')}</p>
                            <p className="text-[11px] text-gray-400 whitespace-nowrap flex-shrink-0">
                              {new Date(e.event_time).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          {e.location && <p className="text-xs text-gray-500 mt-0.5">📍 {e.location}</p>}
                          {e.description && <p className="text-xs text-gray-400 mt-0.5">{e.description}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <footer className="text-center py-4 text-blue-200 text-xs">
        © {new Date().getFullYear()} LocalWheels Pvt Ltd
      </footer>
    </div>
  );
}
