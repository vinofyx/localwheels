import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

// ── Constants ──────────────────────────────────────────────────────────────────
const REFRESH_SECS = 10;

function fmt(n, short = false) {
  if (!n && n !== 0) return '—';
  if (n === 0) return short ? '₹0' : '₹0';
  if (short && n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (short && n >= 100000)   return `₹${(n / 100000).toFixed(1)}L`;
  if (short && n >= 1000)     return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${Number(n).toLocaleString('en-IN')}`;
}

function fmtDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt)) return String(d);
  return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
}

const STATUS_CFG = {
  booked:           { label: 'Booked',          cls: 'bg-blue-50 text-blue-700 border border-blue-200' },
  in_transit:       { label: 'In Transit',       cls: 'bg-violet-50 text-violet-700 border border-violet-200' },
  out_for_delivery: { label: 'Out for Delivery', cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
  delivered:        { label: 'Delivered',        cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  hold:             { label: 'On Hold',          cls: 'bg-red-50 text-red-700 border border-red-200' },
  lost:             { label: 'Lost',             cls: 'bg-red-100 text-red-900 border border-red-300' },
  returned:         { label: 'Returned',         cls: 'bg-gray-50 text-gray-600 border border-gray-200' },
};

const PRIORITY_CFG = {
  Critical: { dot: 'bg-red-500',    text: 'text-red-600',    bar: 'border-l-red-500',    badge: 'bg-red-50 text-red-700' },
  High:     { dot: 'bg-orange-500', text: 'text-orange-600', bar: 'border-l-orange-500', badge: 'bg-orange-50 text-orange-700' },
  Medium:   { dot: 'bg-amber-400',  text: 'text-amber-600',  bar: 'border-l-amber-400',  badge: 'bg-amber-50 text-amber-700' },
  Low:      { dot: 'bg-blue-400',   text: 'text-blue-600',   bar: 'border-l-blue-400',   badge: 'bg-blue-50 text-blue-700' },
};

const FLEET_STATUSES = [
  { key: 'running',     label: 'Running',      icon: '🟢', color: '#10B981' },
  { key: 'idle',        label: 'Idle',         icon: '🟡', color: '#F59E0B' },
  { key: 'loading',     label: 'Loading',      icon: '🔵', color: '#3B82F6' },
  { key: 'unloading',   label: 'Unloading',    icon: '🟣', color: '#8B5CF6' },
  { key: 'at_warehouse',label: 'At Warehouse', icon: '⚪', color: '#6B7280' },
  { key: 'maintenance', label: 'Maintenance',  icon: '🔶', color: '#F97316' },
  { key: 'breakdown',   label: 'Breakdown',    icon: '🔴', color: '#EF4444' },
  { key: 'offline',     label: 'Offline',      icon: '⚫', color: '#374151' },
];

// ── India map city data ────────────────────────────────────────────────────────
const MAP_CITIES = [
  { name: 'Delhi',     x: 183, y: 88,  hub: true  },
  { name: 'Mumbai',    x: 112, y: 248, hub: true  },
  { name: 'Chennai',   x: 228, y: 358, hub: true  },
  { name: 'Kolkata',   x: 308, y: 188, hub: true  },
  { name: 'Bangalore', x: 198, y: 345, hub: false },
  { name: 'Hyderabad', x: 213, y: 292, hub: false },
  { name: 'Ahmedabad', x: 108, y: 188, hub: false },
  { name: 'Pune',      x: 136, y: 265, hub: false },
  { name: 'Jaipur',    x: 160, y: 112, hub: false },
  { name: 'Nagpur',    x: 212, y: 233, hub: false },
  { name: 'Lucknow',   x: 218, y: 108, hub: false },
  { name: 'Surat',     x: 114, y: 218, hub: false },
];

const MAP_ROUTES = [
  [0, 1], [0, 3], [0, 6], [0, 8], [0, 10],
  [1, 4], [1, 5], [1, 7], [1, 6],
  [2, 4], [2, 3], [2, 5],
  [3, 9], [5, 9], [9, 0],
];

// ── UI Primitives ──────────────────────────────────────────────────────────────
function KPICard({ icon, title, value, sub, color = '#2563EB', loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex-shrink-0 min-w-[140px] animate-pulse">
        <div className="w-9 h-9 bg-gray-100 rounded-xl mb-2" />
        <div className="h-7 w-16 bg-gray-100 rounded mb-1" />
        <div className="h-3 w-20 bg-gray-100 rounded" />
      </div>
    );
  }
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 flex-shrink-0 min-w-[150px] cursor-default">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base mb-2" style={{ backgroundColor: color + '18' }}>
        {icon}
      </div>
      <p className="text-[22px] font-extrabold leading-tight tracking-tight" style={{ color }}>{value}</p>
      <p className="text-[10.5px] font-semibold text-gray-500 mt-0.5 uppercase tracking-wide leading-tight">{title}</p>
      {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function Card({ children, className = '', noPad }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm ${noPad ? '' : 'p-4'} ${className}`}>
      {children}
    </div>
  );
}

function SecHead({ icon, title, sub, right }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <span className="text-[17px]">{icon}</span>
        <div>
          <p className="font-bold text-[13.5px] text-gray-900 leading-tight">{title}</p>
          {sub && <p className="text-[11px] text-gray-400 leading-tight">{sub}</p>}
        </div>
      </div>
      {right && <div>{right}</div>}
    </div>
  );
}

function StatusPill({ status }) {
  const cfg = STATUS_CFG[status] || { label: status, cls: 'bg-gray-50 text-gray-600 border border-gray-200' };
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${cfg.cls}`}>{cfg.label}</span>;
}

function LiveBadge() {
  return (
    <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
      LIVE
    </span>
  );
}

// ── Fleet Map (India SVG) ─────────────────────────────────────────────────────
const INDIA_PATH = [
  'M185,22 L218,18 L288,30 L335,42 L362,52 L358,72 L340,83',
  'L325,110 L328,143 L323,155 L312,172 L308,192 L298,228',
  'L292,262 L272,305 L258,328 L248,342 L238,358 L220,392',
  'L198,432 L185,442 L172,432 L160,415 L148,398 L135,378',
  'L122,352 L112,325 L108,298 L107,270 L107,248 L103,218',
  'L99,198 L97,178 L93,155 L90,130 L97,102 L116,72 L130,50',
  'L148,33 L168,22 Z',
].join(' ');

const VEH_COLORS = { Moving:'#22c55e', Idle:'#f59e0b', Maintenance:'#ef4444' };

function FleetMap({ gpsConnected = false }) {
  const navigate = useNavigate();

  if (!gpsConnected) {
    return (
      <div className="relative w-full bg-[#0c1a36] rounded-xl overflow-hidden flex flex-col items-center justify-center gap-4"
        style={{ minHeight: 280 }}>
        <svg viewBox="0 0 420 480" className="absolute inset-0 w-full h-full opacity-20" preserveAspectRatio="xMidYMid meet">
          {Array.from({length:12}).map((_,i)=>( <line key={`h${i}`} x1="0" y1={i*40} x2="420" y2={i*40} stroke="#1e3a5f" strokeWidth="0.5"/> ))}
          {Array.from({length:11}).map((_,i)=>( <line key={`v${i}`} x1={i*42} y1="0" x2={i*42} y2="480" stroke="#1e3a5f" strokeWidth="0.5"/> ))}
          <path d={INDIA_PATH} fill="#132a4a" stroke="#2563EB" strokeWidth="1.2" strokeOpacity="0.6"/>
          {MAP_ROUTES.map(([a,b],i)=>{ const ca=MAP_CITIES[a],cb=MAP_CITIES[b]; return (
            <line key={i} x1={ca.x} y1={ca.y} x2={cb.x} y2={cb.y} stroke="#3B82F6" strokeWidth="1" strokeOpacity="0.3" strokeDasharray="4 3"/>
          );})}
          {MAP_CITIES.map((city,i)=>(
            <g key={i}>
              <circle cx={city.x} cy={city.y} r={city.hub?4:2.5} fill={city.hub?'#3B82F6':'#64748B'}/>
              <text x={city.x+6} y={city.y+3} fontSize="7" fill="#94a3b8" fontFamily="sans-serif">{city.name}</text>
            </g>
          ))}
        </svg>
        <div className="relative z-10 flex flex-col items-center gap-3 text-center px-6">
          <div className="text-4xl">📡</div>
          <p className="text-white font-bold text-sm">No Active Shipments</p>
          <p className="text-blue-300 text-xs max-w-xs">
            The map will show live vehicle positions once shipments are dispatched and GPS tracking is configured.
          </p>
          <button onClick={() => navigate('/ai/gps-tracking')}
            className="mt-1 text-xs font-bold text-white px-4 py-2 rounded-lg"
            style={{ background: '#1d4ed8', border: 'none', cursor: 'pointer' }}>
            ⚙️ Configure GPS Tracking
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full bg-[#0c1a36] rounded-xl overflow-hidden" style={{ minHeight: 280 }}>
      <svg viewBox="0 0 420 480" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        {Array.from({length:12}).map((_,i)=>( <line key={`h${i}`} x1="0" y1={i*40} x2="420" y2={i*40} stroke="#1e3a5f" strokeWidth="0.5"/> ))}
        {Array.from({length:11}).map((_,i)=>( <line key={`v${i}`} x1={i*42} y1="0" x2={i*42} y2="480" stroke="#1e3a5f" strokeWidth="0.5"/> ))}
        <path d={INDIA_PATH} fill="#132a4a" stroke="#2563EB" strokeWidth="1.2" strokeOpacity="0.6"/>
        {MAP_ROUTES.map(([a,b],i)=>{ const ca=MAP_CITIES[a],cb=MAP_CITIES[b]; return (
          <line key={i} x1={ca.x} y1={ca.y} x2={cb.x} y2={cb.y} stroke="#3B82F6" strokeWidth="1" strokeOpacity="0.3" strokeDasharray="4 3"/>
        );})}
        {MAP_CITIES.map((city,i)=>(
          <g key={i}>
            {city.hub && <circle cx={city.x} cy={city.y} r={9} fill="none" stroke="#3B82F6" strokeWidth="0.7" strokeOpacity={0.38}/>}
            <circle cx={city.x} cy={city.y} r={city.hub?4:2.5} fill={city.hub?'#3B82F6':'#64748B'}/>
            <circle cx={city.x} cy={city.y} r={city.hub?1.8:1.2} fill="#fff"/>
            <text x={city.x+6} y={city.y+3} fontSize="7" fill="#94a3b8" fontFamily="sans-serif">{city.name}</text>
          </g>
        ))}
      </svg>
      <div className="absolute left-3 top-2 text-[9px] font-bold text-blue-400 uppercase tracking-widest" style={{ opacity: 0.65 }}>
        Fleet Operations Map
      </div>
    </div>
  );
}

// ── Fleet Status Panel ─────────────────────────────────────────────────────────
function FleetStatusPanel({ fleet }) {
  const counts = fleet || {};
  const connected = Object.values(counts).some(v => v > 0);
  return (
    <div className="h-full flex flex-col">
      <SecHead icon="🚛" title="Fleet Status" sub={connected ? 'Live telematics' : 'Connect telematics'} />
      <div className="grid grid-cols-2 gap-2 flex-1 content-start">
        {FLEET_STATUSES.map(s => (
          <div key={s.key}
            className="flex items-center gap-2 p-2.5 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors"
            style={{ borderLeftColor: s.color, borderLeftWidth: 3 }}
          >
            <span className="text-base">{s.icon}</span>
            <div className="min-w-0">
              <p className="font-extrabold text-[15px] leading-tight" style={{ color: s.color }}>
                {counts[s.key] ?? 0}
              </p>
              <p className="text-[9.5px] text-gray-500 font-semibold uppercase tracking-wide leading-tight truncate">
                {s.label}
              </p>
            </div>
          </div>
        ))}
      </div>
      {!connected && (
        <p className="text-[10px] text-gray-400 text-center mt-2 italic">
          All zeros — no telematics hardware
        </p>
      )}
    </div>
  );
}

// ── Alerts Panel ──────────────────────────────────────────────────────────────
function AlertsPanel({ notifications }) {
  const safeNots = Array.isArray(notifications) ? notifications : [];
  const alerts = safeNots.slice(0, 12);
  return (
    <div className="h-full flex flex-col">
      <SecHead
        icon="🔔"
        title="Critical Alerts"
        sub={`${safeNots.length} active`}
        right={<LiveBadge />}
      />
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5">
        {alerts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <span className="text-3xl mb-2">✅</span>
            <p className="text-sm font-semibold text-gray-600">All Clear</p>
            <p className="text-xs text-gray-400 mt-0.5">No active alerts</p>
          </div>
        )}
        {alerts.map((n, i) => {
          const pc = PRIORITY_CFG[n.priority] || PRIORITY_CFG.Low;
          return (
            <div key={i} className={`border-l-4 ${pc.bar} bg-gray-50 rounded-r-xl p-2.5 hover:bg-gray-100 transition-colors`}>
              <div className="flex items-start justify-between gap-1">
                <p className="text-[11px] font-semibold text-gray-800 leading-snug flex-1">{n.message}</p>
                <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${pc.badge}`}>
                  {n.priority}
                </span>
              </div>
              {n.type && <p className="text-[9.5px] text-gray-400 mt-0.5 uppercase tracking-wide">{n.type}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Live Shipments Table ───────────────────────────────────────────────────────
function LiveShipmentsTable({ shipments, loading, onRefresh }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filtered = shipments.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (s.lr_number || '').toLowerCase().includes(q) ||
      (s.sender_name || '').toLowerCase().includes(q) ||
      (s.receiver_name || '').toLowerCase().includes(q) ||
      (s.destination || '').toLowerCase().includes(q);
    const matchStatus = !statusFilter || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  function exportCSV() {
    const header = 'LR Number,Sender,Receiver,Destination,Status,Freight,Booking Date,POD';
    const rows = filtered.map(s =>
      [s.lr_number, s.sender_name, s.receiver_name, s.destination, s.status, s.freight_amount, fmtDate(s.booking_date), s.pod_status || 'Pending'].join(',')
    );
    const blob = new Blob([header + '\n' + rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `live_shipments_${new Date().toISOString().split('T')[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Card noPad className="overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-[17px]">📦</span>
          <div>
            <p className="font-bold text-[13.5px] text-gray-900 leading-tight">Live Shipments</p>
            <p className="text-[11px] text-gray-400">Recent {filtered.length} of {shipments.length} shipments</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LiveBadge />
          <button onClick={onRefresh}
            className="text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors">
            ↻ Refresh
          </button>
          <button onClick={exportCSV}
            className="text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors">
            ↓ CSV
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b border-gray-100">
        <input
          type="text"
          placeholder="Search LR, sender, receiver, destination..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-0 border border-gray-200 rounded-lg px-3 py-1.5 text-[12px] bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-2 py-1.5 text-[12px] bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
        >
          <option value="">All Status</option>
          {Object.entries(STATUS_CFG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-400">Loading shipments…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-3xl mb-2">📭</p>
            <p className="text-sm font-semibold text-gray-600">No shipments found</p>
          </div>
        ) : (
          <table className="w-full text-[11.5px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['LR Number', 'Sender', 'Receiver', 'Destination', 'Status', 'Freight', 'Booking Date', 'POD', 'Action'].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left font-bold text-gray-600 whitespace-nowrap uppercase tracking-wide text-[10px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(s => (
                <tr key={s.id || s._id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-3 py-2.5">
                    <span className="font-extrabold text-blue-700 cursor-pointer hover:underline"
                      onClick={() => navigate(`/shipments/${s.id || s._id}`)}>
                      {s.lr_number}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-gray-700 max-w-[120px] truncate" title={s.sender_name}>{s.sender_name}</td>
                  <td className="px-3 py-2.5 text-gray-700 max-w-[120px] truncate" title={s.receiver_name}>{s.receiver_name}</td>
                  <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{s.destination || '—'}</td>
                  <td className="px-3 py-2.5"><StatusPill status={s.status} /></td>
                  <td className="px-3 py-2.5 font-semibold text-gray-800 whitespace-nowrap">{fmt(s.freight_amount, true)}</td>
                  <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">{fmtDate(s.booking_date)}</td>
                  <td className="px-3 py-2.5">
                    {s.pod_status
                      ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">{s.pod_status}</span>
                      : <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Pending</span>
                    }
                  </td>
                  <td className="px-3 py-2.5">
                    <button
                      onClick={() => navigate(`/shipments/${s.id || s._id}`)}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200 transition-colors whitespace-nowrap">
                      View →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Card>
  );
}

// ── AI Recommendation Cards ────────────────────────────────────────────────────
function buildRecommendations(dash, notifications) {
  const recs = [];

  if (dash?.delayed > 0) {
    recs.push({
      icon: '⏰', color: '#EF4444', bg: 'from-red-500 to-red-600',
      title: 'Shipment Delay Alert',
      body: `${dash.delayed} shipment${dash.delayed > 1 ? 's' : ''} in transit for over 3 days. Contact consignees and update delivery ETAs immediately.`,
      priority: 'High',
      action: 'View Delayed',
      path: '/shipments?status=in_transit',
    });
  }

  if (dash?.pending_pod_count > 0) {
    recs.push({
      icon: '📋', color: '#F59E0B', bg: 'from-amber-500 to-amber-600',
      title: 'POD Follow-up Required',
      body: `${dash.pending_pod_count} delivered shipment${dash.pending_pod_count > 1 ? 's' : ''} pending POD upload. Follow up with delivery agents to close billing cycle.`,
      priority: 'Medium',
      action: 'Upload PODs',
      path: '/entries/pod-upload',
    });
  }

  if (dash?.eway_expiry > 0) {
    recs.push({
      icon: '📄', color: '#8B5CF6', bg: 'from-violet-500 to-violet-600',
      title: 'E-Way Bill Expiring',
      body: `${dash.eway_expiry} e-way bill${dash.eway_expiry > 1 ? 's' : ''} expiring today. Extend immediately to avoid detention and penalties.`,
      priority: 'Critical',
      action: 'Extend E-Way',
      path: '/entries/eway-extend-import',
    });
  }

  if (dash?.hold_lost > 0) {
    recs.push({
      icon: '🚨', color: '#DC2626', bg: 'from-red-600 to-rose-600',
      title: 'Shipment Recovery Needed',
      body: `${dash.hold_lost} shipment${dash.hold_lost > 1 ? 's' : ''} on hold or lost. Initiate recovery process and notify customers.`,
      priority: 'Critical',
      action: 'View Hold/Lost',
      path: '/entries/hold-lost-damage',
    });
  }

  if (dash?.overdue_payments > 0) {
    recs.push({
      icon: '💰', color: '#059669', bg: 'from-emerald-600 to-teal-600',
      title: 'Outstanding Collections',
      body: `${dash.overdue_payments} overdue payment${dash.overdue_payments > 1 ? 's' : ''}. Assign collection team and send reminders to improve cash flow.`,
      priority: 'High',
      action: 'View Payments',
      path: '/payments',
    });
  }

  // Fill to minimum 4 with informational cards
  const fillers = [
    {
      icon: '🛰️', color: '#2563EB', bg: 'from-blue-600 to-indigo-600',
      title: 'GPS Fleet Tracking',
      body: 'Connect GPS telematics hardware to enable live vehicle tracking, route monitoring, and automated ETA updates.',
      priority: 'Info',
      action: 'Configure GPS',
      path: '/ai/gps-tracking',
    },
    {
      icon: '🔧', color: '#0891B2', bg: 'from-cyan-600 to-blue-600',
      title: 'Predictive Maintenance',
      body: 'Connect vehicle telematics to enable AI-powered engine health monitoring and maintenance scheduling.',
      priority: 'Info',
      action: 'Fleet Maintenance',
      path: '/ai/fleet-maintenance',
    },
    {
      icon: '🗺️', color: '#7C3AED', bg: 'from-violet-600 to-purple-600',
      title: 'AI Route Optimization',
      body: 'Enable GPS integration to unlock AI-powered route optimization, saving fuel and reducing delivery times.',
      priority: 'Info',
      action: 'Route Optimization',
      path: '/ai/route-optimization',
    },
    {
      icon: '⛽', color: '#D97706', bg: 'from-amber-600 to-orange-600',
      title: 'Fuel Intelligence',
      body: 'Connect fuel management sensors to track consumption, detect theft anomalies, and optimize fuel costs.',
      priority: 'Info',
      action: 'Fuel Monitoring',
      path: '/ai/fuel-monitoring',
    },
  ];

  for (const f of fillers) {
    if (recs.length >= 4) break;
    recs.push(f);
  }

  return recs.slice(0, 4);
}

function AIRecommendationCards({ dash, notifications }) {
  const navigate = useNavigate();
  const recs = buildRecommendations(dash, notifications);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {recs.map((r, i) => (
        <div key={i}
          className="relative overflow-hidden rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow bg-white group">
          <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${r.bg}`} />
          <div className="p-4">
            <div className="flex items-start justify-between mb-2">
              <span className="text-2xl">{r.icon}</span>
              <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full ${
                r.priority === 'Critical' ? 'bg-red-50 text-red-700' :
                r.priority === 'High'     ? 'bg-orange-50 text-orange-700' :
                r.priority === 'Medium'   ? 'bg-amber-50 text-amber-700' :
                'bg-blue-50 text-blue-700'
              }`}>{r.priority}</span>
            </div>
            <p className="font-bold text-[12.5px] text-gray-900 leading-snug mb-1">{r.title}</p>
            <p className="text-[11px] text-gray-500 leading-relaxed mb-3">{r.body}</p>
            <button
              onClick={() => navigate(r.path)}
              className="text-[10.5px] font-bold px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 transition-colors group-hover:border-gray-300">
              {r.action} →
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Analytics Charts ───────────────────────────────────────────────────────────
function AnalyticsSection({ analytics }) {
  const days = analytics?.days?.slice(-14) || [];
  const branches = analytics?.branch_performance || [];

  const revenueData = days.map(d => ({
    date: d.date ? d.date.slice(5) : '',
    Revenue: d.revenue || 0,
    Trips: d.trips || 0,
  }));

  const branchData = branches.slice(0, 8).map(b => ({
    name: (b.branch_name || b._id || 'Branch').slice(0, 12),
    Revenue: b.revenue || 0,
    Shipments: b.shipments || 0,
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-3 py-2">
        <p className="text-[11px] font-bold text-gray-700 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-[11px]" style={{ color: p.color }}>
            {p.name}: {p.name === 'Revenue' ? fmt(p.value, true) : p.value}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Revenue Trend */}
      <Card>
        <SecHead icon="📈" title="Revenue Trend" sub="Last 14 days" />
        {revenueData.length === 0 ? (
          <div className="h-44 flex items-center justify-center text-gray-400 text-sm">No revenue data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={190}>
            <AreaChart data={revenueData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="Revenue" stroke="#2563EB" strokeWidth={2} fill="url(#revGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Branch Performance */}
      <Card>
        <SecHead icon="🏢" title="Branch Performance" sub="Revenue by branch" />
        {branchData.length === 0 ? (
          <div className="h-44 flex items-center justify-center text-gray-400 text-sm">No branch data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={branchData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 8, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Revenue" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={32} />
              <Bar dataKey="Shipments" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  );
}

// ── Driver & Vehicle Intelligence ──────────────────────────────────────────────
function IntelligenceSection() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <SecHead icon="👤" title="Driver Intelligence" sub="Performance & safety scores" />
        <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-gray-200 rounded-xl">
          <span className="text-3xl mb-2">🛰️</span>
          <p className="font-semibold text-gray-600 text-sm">Telematics Not Connected</p>
          <p className="text-xs text-gray-400 mt-1 max-w-xs">Connect driver telematics hardware to track driving scores, safety events, and fuel efficiency in real time</p>
          <a href="/ai/driver-management" className="mt-3 text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors">
            Configure Telematics →
          </a>
        </div>
      </Card>

      <Card>
        <SecHead icon="🚛" title="Vehicle Intelligence" sub="Health & maintenance status" />
        <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-gray-200 rounded-xl">
          <span className="text-3xl mb-2">🔧</span>
          <p className="font-semibold text-gray-600 text-sm">Fleet Telematics Required</p>
          <p className="text-xs text-gray-400 mt-1 max-w-xs">Connect OBD-II or fleet management devices to enable vehicle health monitoring, predictive maintenance and fuel tracking</p>
          <a href="/ai/fleet-maintenance" className="mt-3 text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors">
            Fleet Maintenance →
          </a>
        </div>
      </Card>
    </div>
  );
}

// ── Floating AI Chat ───────────────────────────────────────────────────────────
const QUICK_ASKS = [
  'Show delayed shipments',
  'Today\'s revenue',
  'Any critical alerts?',
  'Pending POD shipments',
  'Branch performance',
  'Overdue payments',
];

function FloatingAIChat({ dash, notifications = [] }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Hi! I\'m your Fleet AI Assistant. Ask me anything about your logistics operations.' },
  ]);
  const [input, setInput] = useState('');
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  function handleAsk(q) {
    const question = q || input.trim();
    if (!question) return;
    setInput('');
    setMessages(m => [...m, { role: 'user', text: question }]);

    let answer = '';
    const ql = question.toLowerCase();
    if (ql.includes('delay') || ql.includes('delayed')) {
      answer = dash?.delayed > 0
        ? `There are ${dash.delayed} shipment${dash.delayed > 1 ? 's' : ''} that have been in transit for over 3 days. I recommend contacting the consignees and updating ETAs.`
        : 'Great news — no delayed shipments detected today!';
    } else if (ql.includes('revenue') || ql.includes('today')) {
      answer = `Today's revenue is ${fmt(dash?.revenue_today)} with ${dash?.deliveries_today || 0} deliveries completed.`;
    } else if (ql.includes('alert') || ql.includes('critical')) {
      const crit = (Array.isArray(notifications) ? notifications : []).filter(n => n.priority === 'Critical' || n.priority === 'High');
      answer = crit.length > 0
        ? `There are ${crit.length} high-priority alert${crit.length > 1 ? 's' : ''}: ${crit.slice(0, 2).map(n => n.message).join('; ')}`
        : 'No critical alerts right now. Operations look normal.';
    } else if (ql.includes('pod')) {
      answer = dash?.pending_pod_count > 0
        ? `${dash.pending_pod_count} delivered shipment${dash.pending_pod_count > 1 ? 's' : ''} are awaiting POD upload. Please follow up with delivery agents.`
        : 'All delivered shipments have POD submissions up to date.';
    } else if (ql.includes('branch') || ql.includes('performance')) {
      answer = 'Branch performance data is available in the analytics section below. Revenue and shipment counts are broken down per branch.';
    } else if (ql.includes('payment') || ql.includes('overdue')) {
      answer = dash?.overdue_payments > 0
        ? `There are ${dash.overdue_payments} overdue payment${dash.overdue_payments > 1 ? 's' : ''}. Assign collection agents and send payment reminders.`
        : 'No overdue payments at this time.';
    } else if (ql.includes('gps') || ql.includes('truck') || ql.includes('vehicle') || ql.includes('where')) {
      answer = 'GPS fleet tracking is not yet connected. Connect fleet telematics hardware to track vehicle locations in real time.';
    } else {
      answer = 'I can answer questions about delayed shipments, revenue, alerts, POD status, payments, and branch performance. GPS and fleet data will be available once telematics hardware is connected.';
    }

    setTimeout(() => setMessages(m => [...m, { role: 'ai', text: answer }]), 500);
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {open && (
        <div className="w-80 bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden flex flex-col"
          style={{ height: 420 }}>
          {/* Chat header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-sm">🤖</div>
              <div>
                <p className="text-white font-bold text-[12px]">Fleet AI Assistant</p>
                <p className="text-blue-200 text-[10px]">Always online</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white text-lg leading-none">×</button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-xl text-[11.5px] leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-white text-gray-700 border border-gray-200 rounded-bl-sm shadow-sm'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          {/* Quick actions */}
          <div className="px-3 py-1.5 bg-white border-t border-gray-100 flex gap-1 overflow-x-auto">
            {QUICK_ASKS.slice(0, 3).map(q => (
              <button key={q} onClick={() => handleAsk(q)}
                className="text-[9.5px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-1 rounded-full whitespace-nowrap hover:bg-blue-100 transition-colors flex-shrink-0">
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 p-3 border-t border-gray-100 bg-white">
            <input
              type="text"
              placeholder="Ask AI about logistics..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAsk()}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-[12px] focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
            <button onClick={() => handleAsk()}
              className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 flex items-center justify-center text-white flex-shrink-0 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Chat toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-2xl transition-all duration-200 ${
          open ? 'bg-gray-700 hover:bg-gray-800 rotate-0' : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {open ? '✕' : '🤖'}
      </button>
    </div>
  );
}

// ── Main ControlRoom ───────────────────────────────────────────────────────────
export default function ControlRoom() {
  const { branch } = useAuth();
  const navigate = useNavigate();

  const [dash, setDash]          = useState(null);
  const [notifications, setNots] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading]    = useState(true);
  const [shipLoading, setShipLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [countdown, setCountdown] = useState(REFRESH_SECS);
  const timerRef = useRef(null);

  const loadData = useCallback(async () => {
    try {
      const [dashRes, notRes, analyticsRes] = await Promise.all([
        api.get('/ai/dashboard'),
        api.get('/ai/notifications'),
        api.get('/ai/analytics'),
      ]);
      setDash(dashRes.data);
      setNots(notRes.data?.recent || notRes.data?.notifications || []);
      setAnalytics(analyticsRes.data);
      setLastUpdated(new Date());
    } catch {
      // silently fail — keep stale data
    } finally {
      setLoading(false);
    }
  }, []);

  const loadShipments = useCallback(async () => {
    if (!branch) return;
    setShipLoading(true);
    try {
      const params = new URLSearchParams({ branch_id: branch._id || branch.id, limit: 20, page: 1 });
      const res = await api.get(`/shipments?${params}`);
      setShipments(res.data.data || []);
    } catch {
      // keep stale
    } finally {
      setShipLoading(false);
    }
  }, [branch]);

  // Initial load
  useEffect(() => {
    loadData();
    loadShipments();
  }, [loadData, loadShipments]);

  // Auto-refresh
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          loadData();
          loadShipments();
          return REFRESH_SECS;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [loadData, loadShipments]);

  const kpis = [
    { icon: '💰', title: 'Revenue Today',     value: fmt(dash?.revenue_today, true),   color: '#2563EB' },
    { icon: '📦', title: 'Deliveries Today',  value: dash?.deliveries_today ?? 0,       color: '#10B981' },
    { icon: '⏰', title: 'Delayed Shipments', value: dash?.delayed ?? 0,                color: dash?.delayed > 0 ? '#EF4444' : '#10B981' },
    { icon: '📋', title: 'Pending POD',       value: dash?.pending_pod_count ?? 0,      color: dash?.pending_pod_count > 0 ? '#F59E0B' : '#10B981' },
    { icon: '🔔', title: 'AI Alerts',         value: (Array.isArray(notifications) ? notifications : []).length, color: (Array.isArray(notifications) ? notifications.length : 0) > 0 ? '#EF4444' : '#10B981' },
    { icon: '✅', title: 'On-Time %',         value: `${dash?.on_time_pct ?? 0}%`,      color: (dash?.on_time_pct ?? 0) >= 90 ? '#10B981' : '#F59E0B' },
    { icon: '📄', title: 'E-Way Expiring',    value: dash?.eway_expiry ?? 0,            color: dash?.eway_expiry > 0 ? '#F59E0B' : '#10B981' },
    { icon: '⚠️', title: 'Hold / Lost',       value: dash?.hold_lost ?? 0,             color: dash?.hold_lost > 0 ? '#EF4444' : '#10B981' },
  ];

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* ── Page Header ───────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-xl shadow-sm">
            🖥️
          </div>
          <div>
            <h1 className="font-extrabold text-[16px] text-gray-900 leading-tight">Operations Control Room</h1>
            <p className="text-[11px] text-gray-400">Real-time Fleet & Logistics Mission Control · {branch?.branch_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <LiveBadge />
          <div className="text-right">
            <p className="text-[10px] font-semibold text-gray-500">Auto-refresh in</p>
            <p className="text-[13px] font-extrabold text-blue-600">{countdown}s</p>
          </div>
          {lastUpdated && (
            <p className="text-[10px] text-gray-400 hidden sm:block">
              Updated {lastUpdated.toLocaleTimeString()}
            </p>
          )}
          <button
            onClick={() => { loadData(); loadShipments(); setCountdown(REFRESH_SECS); }}
            className="text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors">
            ↻ Refresh Now
          </button>
        </div>
      </div>

      <div className="px-4 md:px-6 py-4 space-y-4">

        {/* ── KPI Strip ─────────────────────────────────────────────── */}
        <div className="flex gap-3 overflow-x-auto pb-1">
          {kpis.map((k, i) => (
            <KPICard key={i} {...k} loading={loading} />
          ))}
        </div>

        {/* ── Mission Control Row (Map | Fleet Status | Alerts) ──────── */}
        <div className="grid grid-cols-1 xl:grid-cols-[55%_22%_23%] gap-4" style={{ minHeight: 460 }}>
          {/* Map */}
          <Card noPad className="overflow-hidden" style={{ minHeight: 420 }}>
            <FleetMap gpsConnected={false} />
          </Card>

          {/* Fleet Status */}
          <Card>
            <FleetStatusPanel fleet={dash?.fleet_by_status} />
          </Card>

          {/* Alerts */}
          <Card style={{ maxHeight: 460, display: 'flex', flexDirection: 'column' }}>
            <AlertsPanel notifications={notifications} />
          </Card>
        </div>

        {/* ── Live Shipments Table ───────────────────────────────────── */}
        <LiveShipmentsTable
          shipments={shipments}
          loading={shipLoading}
          onRefresh={() => { loadShipments(); }}
        />

        {/* ── AI Recommendation Center ───────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[17px]">🤖</span>
            <div>
              <p className="font-bold text-[14px] text-gray-900 leading-tight">AI Recommendation Center</p>
              <p className="text-[11px] text-gray-400">Actionable intelligence based on live operations data</p>
            </div>
          </div>
          <AIRecommendationCards dash={dash} notifications={notifications} />
        </div>

        {/* ── Operational Analytics ─────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[17px]">📊</span>
            <div>
              <p className="font-bold text-[14px] text-gray-900 leading-tight">Operational Analytics</p>
              <p className="text-[11px] text-gray-400">Revenue trends and branch performance from real data</p>
            </div>
          </div>
          <AnalyticsSection analytics={analytics} />
        </div>

        {/* ── Driver & Vehicle Intelligence ─────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[17px]">🧠</span>
            <div>
              <p className="font-bold text-[14px] text-gray-900 leading-tight">Fleet Intelligence</p>
              <p className="text-[11px] text-gray-400">Driver performance and vehicle health monitoring</p>
            </div>
          </div>
          <IntelligenceSection />
        </div>

        {/* Bottom spacer for floating chat */}
        <div className="h-16" />
      </div>

      {/* ── Floating AI Chat ──────────────────────────────────────────── */}
      <FloatingAIChat dash={dash} notifications={notifications} />
    </div>
  );
}
