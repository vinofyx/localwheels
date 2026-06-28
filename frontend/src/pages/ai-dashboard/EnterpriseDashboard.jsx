import React, { useState, useEffect, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  RadialBarChart, RadialBar, ComposedChart, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import api from '../../api/client';
import toast from 'react-hot-toast';

// ─── Navigation sections ──────────────────────────────────────────────────────
const SECTIONS = [
  { id: 'overview',     icon: '🏠', label: 'AI Overview' },
  { id: 'kpis',         icon: '🎯', label: "Today's KPIs" },
  { id: 'fleet-health', icon: '❤️',  label: 'Fleet Health Score' },
  { id: 'vehicles',     icon: '🚛', label: 'Live Vehicle Status' },
  { id: 'gps-map',      icon: '🗺️', label: 'Live GPS Map' },
  { id: 'route-opt',    icon: '⚡', label: 'Route Optimization',    ai: true },
  { id: 'fuel',         icon: '⛽', label: 'Fuel Analytics' },
  { id: 'driver',       icon: '👤', label: 'Driver Analytics' },
  { id: 'empty-load',   icon: '🔄', label: 'Empty Load Matching',   ai: true },
  { id: 'maintenance',  icon: '🔧', label: 'Maintenance Prediction', ai: true },
  { id: 'delay',        icon: '⏰', label: 'Delay Prediction',      ai: true },
  { id: 'revenue',      icon: '💰', label: 'Revenue Prediction',    ai: true },
  { id: 'forecast',     icon: '📈', label: 'Demand Forecast',       ai: true },
  { id: 'alerts',       icon: '🔔', label: 'AI Alerts' },
  { id: 'recommendations', icon: '🤖', label: 'AI Recommendations', ai: true },
  { id: 'branch',       icon: '🏢', label: 'Branch Performance' },
  { id: 'customer',     icon: '⭐', label: 'Customer Satisfaction' },
  { id: 'cost-km',      icon: '📊', label: 'Cost Per KM' },
  { id: 'utilization',  icon: '📉', label: 'Fleet Utilization' },
];

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  blue:   { bg: '#eff6ff', border: '#3b82f6', text: '#1d4ed8', accent: '#3b82f6' },
  green:  { bg: '#f0fdf4', border: '#22c55e', text: '#15803d', accent: '#22c55e' },
  red:    { bg: '#fef2f2', border: '#ef4444', text: '#dc2626', accent: '#ef4444' },
  amber:  { bg: '#fffbeb', border: '#f59e0b', text: '#d97706', accent: '#f59e0b' },
  purple: { bg: '#f5f3ff', border: '#8b5cf6', text: '#7c3aed', accent: '#8b5cf6' },
  indigo: { bg: '#eef2ff', border: '#6366f1', text: '#4338ca', accent: '#6366f1' },
  cyan:   { bg: '#ecfeff', border: '#06b6d4', text: '#0e7490', accent: '#06b6d4' },
  pink:   { bg: '#fdf2f8', border: '#ec4899', text: '#be185d', accent: '#ec4899' },
  teal:   { bg: '#f0fdfa', border: '#14b8a6', text: '#0f766e', accent: '#14b8a6' },
};

function fmt(n, currency = false) {
  const v = Number(n) || 0;
  if (currency) {
    if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)} Cr`;
    if (v >= 100000)   return `₹${(v / 100000).toFixed(1)} L`;
    return `₹${v.toLocaleString('en-IN')}`;
  }
  return v.toLocaleString('en-IN');
}
function fmtDate(iso) {
  return new Date(iso).toISOString().split('T')[0];
}
function timeAgo(iso) {
  const m = Math.floor((Date.now() - new Date(iso)) / 60000);
  return m < 60 ? `${m}m ago` : `${Math.floor(m / 60)}h ago`;
}

// ─── Shared UI primitives ─────────────────────────────────────────────────────
function KPI({ title, value, sub, color = 'blue', icon, trend }) {
  const c = C[color];
  return (
    <div className="bg-white rounded-xl shadow-sm border p-4" style={{ borderColor: c.border }}>
      <div className="flex items-start justify-between mb-1">
        <span className="text-2xl">{icon}</span>
        {trend != null && (
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${trend >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-[22px] font-black leading-tight mt-1" style={{ color: c.text }}>{value}</p>
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-1">{title}</p>
      {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function SectionHeader({ icon, title, sub, gradient = 'from-[#4f46e5] to-[#7c3aed]', badge }) {
  return (
    <div className={`bg-gradient-to-r ${gradient} rounded-xl text-white px-5 py-4 flex items-center justify-between shadow`}>
      <div>
        <h2 className="text-[16px] font-black">{icon} {title}</h2>
        {sub && <p className="text-white/70 text-[11px] mt-0.5">{sub}</p>}
      </div>
      {badge && <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-1 rounded border border-white/30">{badge}</span>}
    </div>
  );
}

function AIInsight({ text, color = 'amber' }) {
  return (
    <div className={`flex items-start gap-2 p-2.5 rounded-lg border text-[11px]`}
         style={{ backgroundColor: C[color].bg, borderColor: C[color].border }}>
      <span className="text-base flex-shrink-0">🤖</span>
      <p style={{ color: C[color].text }}>{text}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    Active: 'bg-green-100 text-green-700', Moving: 'bg-green-100 text-green-700',
    Idle: 'bg-yellow-100 text-yellow-700', Stopped: 'bg-red-100 text-red-700',
    Breakdown: 'bg-red-200 text-red-800', Maintenance: 'bg-blue-100 text-blue-700',
    Good: 'bg-green-100 text-green-700', Warning: 'bg-yellow-100 text-yellow-700',
    Critical: 'bg-red-100 text-red-700', 'In Service': 'bg-blue-100 text-blue-700',
    Optimized: 'bg-green-100 text-green-700', Pending: 'bg-gray-100 text-gray-600',
    Confirmed: 'bg-blue-100 text-blue-700', Approved: 'bg-green-100 text-green-700',
    Rejected: 'bg-red-100 text-red-700', High: 'bg-red-100 text-red-700',
    Medium: 'bg-yellow-100 text-yellow-700', Low: 'bg-gray-100 text-gray-600',
    Normal: 'bg-green-100 text-green-700', 'Theft Suspected': 'bg-red-100 text-red-700',
    'Under Average': 'bg-yellow-100 text-yellow-700',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${map[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}

function Card({ children, className = '' }) {
  return <div className={`bg-white rounded-xl shadow-sm border border-gray-100 ${className}`}>{children}</div>;
}

function HealthBar({ pct, color }) {
  const col = pct >= 80 ? '#22c55e' : pct >= 60 ? '#f59e0b' : '#ef4444';
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5">
      <div className="h-1.5 rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: col }}/>
    </div>
  );
}

// ─── GPS map placeholder ──────────────────────────────────────────────────────
function MapView({ vehicles = [] }) {
  const [hover, setHover] = useState(null);
  const positions = [
    [18, 30], [22, 45], [28, 55], [35, 25], [13, 65],
    [20, 72], [25, 38], [31, 60], [17, 48], [23, 20],
    [12, 35], [28, 78], [33, 42], [15, 58], [26, 65],
    [19, 82], [30, 18], [24, 52], [16, 42], [29, 70],
  ];
  const statusColor = { Moving: '#22c55e', Stopped: '#ef4444', Idle: '#f59e0b' };
  return (
    <div className="relative bg-[#1a2a4a] rounded-xl overflow-hidden select-none" style={{ height: 400 }}>
      {/* Grid */}
      <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 800 400" preserveAspectRatio="none">
        {[0,1,2,3,4].map(i => <line key={`h${i}`} x1="0" y1={i * 100} x2="800" y2={i * 100} stroke="#4f7ab3" strokeWidth="0.5"/>)}
        {[0,1,2,3,4,5,6,7].map(i => <line key={`v${i}`} x1={i * 114} y1="0" x2={i * 114} y2="400" stroke="#4f7ab3" strokeWidth="0.5"/>)}
        {/* Roads */}
        <path d="M80,200 Q200,120 380,180 Q560,240 720,160" stroke="#5b8dd9" strokeWidth="2.5" fill="none" opacity="0.7"/>
        <path d="M0,280 Q200,200 400,260 Q600,320 800,240" stroke="#5b8dd9" strokeWidth="1.5" fill="none" opacity="0.5"/>
        <path d="M160,0 Q200,200 180,400" stroke="#5b8dd9" strokeWidth="1.5" fill="none" opacity="0.4"/>
        <path d="M480,0 Q520,200 500,400" stroke="#5b8dd9" strokeWidth="1.5" fill="none" opacity="0.4"/>
        <path d="M640,0 Q680,200 660,400" stroke="#5b8dd9" strokeWidth="1" fill="none" opacity="0.3"/>
        {/* Water bodies */}
        <ellipse cx="700" cy="320" rx="60" ry="30" fill="#1e4a8a" opacity="0.4"/>
        <ellipse cx="100" cy="80" rx="40" ry="20" fill="#1e4a8a" opacity="0.3"/>
      </svg>
      {/* City labels */}
      {[['Mumbai','15%','38%'],['Delhi','55%','18%'],['Hyderabad','48%','52%'],['Bangalore','40%','68%'],['Chennai','62%','65%'],['Pune','22%','48%'],['Kolkata','78%','28%']].map(([c, l, t]) => (
        <div key={c} className="absolute" style={{ left: l, top: t }}>
          <span className="text-[9px] text-blue-300/80 font-semibold">{c}</span>
        </div>
      ))}
      {/* Vehicle dots */}
      {vehicles.slice(0, 20).map((v, i) => {
        const [top, left] = positions[i] || [50, 50];
        const col = statusColor[v.status] || '#3b82f6';
        return (
          <div key={v.vehicle_no}
            className="absolute cursor-pointer"
            style={{ top: `${top}%`, left: `${left}%`, transform: 'translate(-50%, -50%)' }}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}>
            <div className="relative">
              <div className="w-3 h-3 rounded-full border-2 border-white shadow-lg"
                   style={{ backgroundColor: col, boxShadow: `0 0 8px ${col}80` }}>
                {v.status === 'Moving' && <div className="absolute inset-0 rounded-full animate-ping opacity-40" style={{ backgroundColor: col }}/>}
              </div>
              {hover === i && (
                <div className="absolute z-50 bottom-5 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-2xl p-2.5 text-[11px] w-36 border">
                  <p className="font-black text-gray-800">{v.vehicle_no}</p>
                  <p className="text-gray-500 text-[10px]">{v.driver}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: col }}/>
                    <span className="font-semibold" style={{ color: col }}>{v.status}</span>
                    <span className="text-gray-400">· {v.speed} km/h</span>
                  </div>
                  <p className="text-gray-400 mt-0.5">Fuel: {v.fuel_pct}%</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
      {/* Legend */}
      <div className="absolute bottom-3 left-3 bg-black/60 rounded-lg px-3 py-2 flex gap-3 backdrop-blur-sm">
        {[['Moving','#22c55e'],['Stopped','#ef4444'],['Idle','#f59e0b']].map(([s, c]) => (
          <div key={s} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full border border-white" style={{ backgroundColor: c }}/>
            <span className="text-[9px] text-white font-medium">{s}</span>
          </div>
        ))}
      </div>
      <div className="absolute top-3 right-3 bg-black/60 rounded-lg px-2.5 py-1.5 backdrop-blur-sm">
        <span className="text-[9px] text-white/80 font-medium">🛰️ Live Tracking · {vehicles.length} Vehicles</span>
      </div>
      <div className="absolute bottom-3 right-3 bg-black/60 rounded-lg px-2.5 py-1.5 backdrop-blur-sm">
        <span className="text-[9px] text-white/50">Connect Google Maps API for satellite view</span>
      </div>
    </div>
  );
}

// ─── 19 Section renderers ─────────────────────────────────────────────────────

function OverviewSection({ d }) {
  if (!d.dashboard) return null;
  const dash = d.dashboard;
  const FLEET_COLORS = ['#22c55e','#3b82f6','#f59e0b','#ef4444'];
  const fleetData = [
    { name: 'Active', value: dash.fleet.active },
    { name: 'Idle', value: dash.fleet.idle },
    { name: 'Maintenance', value: dash.fleet.maintenance },
    { name: 'Breakdown', value: dash.fleet.breakdown },
  ];
  return (
    <div className="space-y-4">
      <SectionHeader icon="🏠" title="AI Overview" sub="Real-time fleet & operations intelligence" gradient="from-[#0f172a] to-[#1e3a5f]" badge="LIVE" />
      {/* KPI grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPI icon="💰" title="Revenue Today" value={fmt(dash.revenue_today, true)} color="green" trend={8} />
        <KPI icon="🚛" title="Active Fleet" value={`${dash.fleet.active}/${dash.fleet.total}`} sub="vehicles" color="blue" />
        <KPI icon="✅" title="On-Time Delivery" value={`${dash.on_time_pct}%`} color="teal" trend={2} />
        <KPI icon="❤️" title="Fleet Health" value={`${dash.fleet_health}%`} color={dash.fleet_health >= 80 ? 'green' : 'amber'} />
        <KPI icon="⛽" title="Fuel Today" value={`${dash.fuel_today_lt.toLocaleString()} L`} color="amber" />
        <KPI icon="🔔" title="AI Alerts" value={dash.risk_alerts} color="red" sub="active alerts" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue trend */}
        <Card className="col-span-2 p-4">
          <p className="text-[12px] font-bold text-gray-700 mb-3">Revenue vs Cost — 7-Day Trend</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={dash.revenue_trend}>
              <defs>
                <linearGradient id="ovRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/><stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="ovCost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
              <XAxis dataKey="day" tick={{ fontSize: 10 }}/>
              <YAxis tick={{ fontSize: 9 }} tickFormatter={v => `₹${(v/100000).toFixed(1)}L`}/>
              <Tooltip formatter={v => fmt(v, true)}/>
              <Legend wrapperStyle={{ fontSize: 11 }}/>
              <Area type="monotone" dataKey="revenue" stroke="#22c55e" fill="url(#ovRev)" name="Revenue" strokeWidth={2}/>
              <Area type="monotone" dataKey="cost" stroke="#ef4444" fill="url(#ovCost)" name="Cost" strokeWidth={2}/>
            </AreaChart>
          </ResponsiveContainer>
        </Card>
        {/* Fleet status donut */}
        <Card className="p-4">
          <p className="text-[12px] font-bold text-gray-700 mb-2">Fleet Status</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={fleetData} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={2}>
                {fleetData.map((_, i) => <Cell key={i} fill={FLEET_COLORS[i]}/>)}
              </Pie>
              <Tooltip/>
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {fleetData.map((f, i) => (
              <div key={f.name} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: FLEET_COLORS[i] }}/>
                  <span className="text-gray-600">{f.name}</span>
                </div>
                <span className="font-bold text-gray-800">{f.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
      {/* AI insights row — only shown when there's real data */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <AIInsight text={dash.delayed > 0 ? `${dash.delayed} shipment${dash.delayed > 1 ? 's' : ''} in-transit for more than 3 days — review and follow up` : 'No delayed shipments detected today'} color={dash.delayed > 0 ? 'red' : 'green'} />
        <AIInsight text={dash.pending_pod_count > 0 ? `${dash.pending_pod_count} delivered shipment${dash.pending_pod_count > 1 ? 's' : ''} awaiting POD submission` : 'All POD submissions are up to date'} color={dash.pending_pod_count > 0 ? 'amber' : 'green'} />
        <AIInsight text={dash.risk_alerts > 0 ? `${dash.risk_alerts} active alert${dash.risk_alerts > 1 ? 's' : ''} — hold/lost shipments, eway expiry or overdue payments` : 'No active risk alerts'} color={dash.risk_alerts > 0 ? 'amber' : 'green'} />
      </div>
    </div>
  );
}

function TodayKPIsSection({ d }) {
  if (!d.dashboard) return null;
  const dash = d.dashboard;
  const kpis = [
    { label: 'Total Revenue', actual: fmt(dash.revenue_today, true), target: '₹3.5 L', ok: dash.revenue_today >= 280000 },
    { label: 'Active Vehicles', actual: `${dash.fleet.active}`, target: '35+', ok: dash.fleet.active >= 35 },
    { label: 'Idle Vehicles', actual: `${dash.fleet.idle}`, target: '< 8', ok: dash.fleet.idle < 8 },
    { label: 'Vehicles in Breakdown', actual: `${dash.fleet.breakdown}`, target: '< 3', ok: dash.fleet.breakdown < 3 },
    { label: 'Drivers Present', actual: `${dash.driver_present}`, target: '38+', ok: dash.driver_present >= 38 },
    { label: 'Fuel Consumed (L)', actual: `${dash.fuel_today_lt.toLocaleString()}`, target: '< 3000', ok: dash.fuel_today_lt < 3000 },
    { label: 'Deliveries Today', actual: `${dash.deliveries_today}`, target: '80+', ok: dash.deliveries_today >= 80 },
    { label: 'Delayed Shipments', actual: `${dash.delayed}`, target: '< 10', ok: dash.delayed < 10 },
    { label: 'On-Time Delivery %', actual: `${dash.on_time_pct}%`, target: '90%+', ok: dash.on_time_pct >= 90 },
    { label: 'Fleet Health Score', actual: `${dash.fleet_health}%`, target: '85%+', ok: dash.fleet_health >= 85 },
    { label: 'Fleet Utilization', actual: `${dash.fleet_utilization_pct?.toFixed(1) ?? 0}%`, target: '75%+', ok: (dash.fleet_utilization_pct || 0) >= 75 },
    { label: 'Pending POD', actual: `${dash.pending_pod_count}`, target: '< 25', ok: dash.pending_pod_count < 25 },
    { label: 'Maintenance Due', actual: `${dash.maintenance_due}`, target: '< 5', ok: dash.maintenance_due < 5 },
    { label: 'Fuel Theft Alerts', actual: `${dash.fuel_theft_alerts}`, target: '0', ok: dash.fuel_theft_alerts === 0 },
    { label: 'Warehouse Capacity', actual: `${dash.warehouse_pct?.toFixed(1) ?? 0}%`, target: '< 85%', ok: (dash.warehouse_pct || 0) < 85 },
    { label: 'Revenue Today', actual: fmt(dash.revenue_today, true), target: '₹3L+', ok: dash.revenue_today >= 300000 },
    { label: 'Expenses Today', actual: fmt(dash.expenses_today_rs, true), target: '< ₹2L', ok: dash.expenses_today_rs < 200000 },
    { label: 'Profit Today', actual: fmt(dash.profit_today_rs, true), target: '> ₹1L', ok: dash.profit_today_rs > 100000 },
    { label: 'Empty Return Trips', actual: `${dash.empty_returns}`, target: '< 8', ok: dash.empty_returns < 8 },
    { label: 'AI Suggestions', actual: `${dash.risk_alerts}`, target: 'Review All', ok: true },
  ];
  const goodCount = kpis.filter(k => k.ok).length;
  return (
    <div className="space-y-4">
      <SectionHeader icon="🎯" title="Today's KPIs" sub="Target vs Actual · Live performance scorecard" gradient="from-[#0891b2] to-[#0e7490]"
        badge={`${goodCount}/${kpis.length} On Track`}/>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        <KPI icon="✅" title="On Track" value={goodCount} color="green"/>
        <KPI icon="⚠️" title="Needs Attention" value={kpis.length - goodCount} color="red"/>
        <KPI icon="🎯" title="Targets Met" value={`${Math.round(goodCount / kpis.length * 100)}%`} color="blue"/>
        <KPI icon="💰" title="Revenue" value={fmt(dash.revenue_today, true)} color="green"/>
        <KPI icon="📈" title="Profit" value={fmt(dash.profit_today_rs, true)} color={dash.profit_today_rs > 0 ? 'green' : 'red'}/>
        <KPI icon="🚛" title="Fleet Active" value={dash.fleet.active} color="indigo"/>
      </div>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead className="bg-cyan-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-bold text-cyan-800">#</th>
                <th className="text-left px-4 py-3 font-bold text-cyan-800">KPI Metric</th>
                <th className="text-left px-4 py-3 font-bold text-cyan-800">Today's Value</th>
                <th className="text-left px-4 py-3 font-bold text-cyan-800">Target</th>
                <th className="text-left px-4 py-3 font-bold text-cyan-800">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {kpis.map((k, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-gray-400 font-medium">{i + 1}</td>
                  <td className="px-4 py-2.5 font-semibold text-gray-700">{k.label}</td>
                  <td className="px-4 py-2.5 font-bold text-gray-900">{k.actual}</td>
                  <td className="px-4 py-2.5 text-gray-500">{k.target}</td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${k.ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {k.ok ? '✓ On Track' : '✗ Below Target'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function FleetHealthSection({ d }) {
  if (!d.maintenance?.length) return null;
  const sorted = [...d.maintenance].sort((a, b) => a.health_score - b.health_score);
  const avg = Math.round(sorted.reduce((s, v) => s + v.health_score, 0) / sorted.length);
  const excellent = sorted.filter(v => v.health_score >= 85).length;
  const good      = sorted.filter(v => v.health_score >= 70 && v.health_score < 85).length;
  const warning   = sorted.filter(v => v.health_score >= 50 && v.health_score < 70).length;
  const critical  = sorted.filter(v => v.health_score < 50).length;
  const gaugeData = [{ name: 'Health', value: avg, fill: avg >= 80 ? '#22c55e' : avg >= 60 ? '#f59e0b' : '#ef4444' }];
  return (
    <div className="space-y-4">
      <SectionHeader icon="❤️" title="Fleet Health Score" sub="AI-powered predictive health monitoring for all vehicles" gradient="from-[#dc2626] to-[#b91c1c]" badge={`${avg}% AVG`}/>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Card className="col-span-1 p-4 flex flex-col items-center justify-center">
          <ResponsiveContainer width="100%" height={130}>
            <RadialBarChart cx="50%" cy="50%" innerRadius="55%" outerRadius="85%" data={gaugeData} startAngle={180} endAngle={0}>
              <RadialBar dataKey="value" cornerRadius={8} background={{ fill: '#f0f0f0' }}/>
              <Tooltip formatter={v => `${v}%`}/>
            </RadialBarChart>
          </ResponsiveContainer>
          <p className="text-[22px] font-black" style={{ color: avg >= 80 ? '#16a34a' : avg >= 60 ? '#d97706' : '#dc2626' }}>{avg}%</p>
          <p className="text-[10px] font-bold text-gray-500 uppercase">Overall Health</p>
        </Card>
        <KPI icon="💚" title="Excellent (85%+)" value={excellent} color="green" sub={`${Math.round(excellent/sorted.length*100)}% of fleet`}/>
        <KPI icon="💛" title="Good (70–84%)" value={good} color="amber"/>
        <KPI icon="🟠" title="Warning (50–69%)" value={warning} color="amber"/>
        <KPI icon="🔴" title="Critical (<50%)" value={critical} color="red"/>
      </div>
      <Card>
        <div className="p-3 border-b bg-gray-50 flex items-center justify-between">
          <p className="text-[12px] font-bold text-gray-700">Vehicle Health Breakdown — AI Predictions</p>
          <span className="text-[10px] bg-indigo-50 text-indigo-600 font-bold px-2 py-0.5 rounded">AI Powered</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[11.5px]">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Vehicle','Driver','Health %','Health Bar','Tyre %','Oil Left','Battery','Status','AI Prediction','Risk'].map(h => (
                  <th key={h} className="text-left px-3 py-2 font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sorted.map(v => (
                <tr key={v.vehicle_no} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-bold text-indigo-700">{v.vehicle_no}</td>
                  <td className="px-3 py-2 text-gray-700">{v.driver || '—'}</td>
                  <td className="px-3 py-2 font-black" style={{ color: v.health_score >= 80 ? '#16a34a' : v.health_score >= 60 ? '#d97706' : '#dc2626' }}>{v.health_score}%</td>
                  <td className="px-3 py-2 w-24"><HealthBar pct={v.health_score}/></td>
                  <td className="px-3 py-2">{v.tyre_pct}%</td>
                  <td className="px-3 py-2">{v.oil_km_left.toLocaleString()} km</td>
                  <td className="px-3 py-2">{v.battery_v}V</td>
                  <td className="px-3 py-2"><StatusBadge status={v.status}/></td>
                  <td className="px-3 py-2 text-gray-600 max-w-[160px]">{v.ai_prediction}</td>
                  <td className="px-3 py-2">
                    <span className={`font-bold text-[10px] ${v.downtime_risk_pct > 30 ? 'text-red-600' : v.downtime_risk_pct > 15 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {v.downtime_risk_pct}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function VehiclesSection({ d }) {
  const [filter, setFilter] = useState('All');
  if (!d.gps?.length) return null;
  const filtered = filter === 'All' ? d.gps : d.gps.filter(v => v.status === filter);
  const counts = { Moving: d.gps.filter(v => v.status === 'Moving').length, Stopped: d.gps.filter(v => v.status === 'Stopped').length, Idle: d.gps.filter(v => v.status === 'Idle').length };
  return (
    <div className="space-y-4">
      <SectionHeader icon="🚛" title="Live Vehicle Status" sub="Real-time position, speed, fuel and driver data" gradient="from-[#0f766e] to-[#0d9488]" badge="LIVE"/>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPI icon="🚛" title="Total Fleet" value={d.gps.length} color="blue"/>
        <KPI icon="✅" title="Moving" value={counts.Moving} color="green"/>
        <KPI icon="⏸️" title="Idle" value={counts.Idle} color="amber"/>
        <KPI icon="🛑" title="Stopped" value={counts.Stopped} color="red"/>
      </div>
      <div className="flex gap-2 flex-wrap">
        {['All','Moving','Idle','Stopped'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-[11px] font-bold border transition-colors ${filter === s ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-600 border-gray-300 hover:border-teal-400'}`}>
            {s} {s !== 'All' && `(${counts[s] || 0})`}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {filtered.map(v => {
          const col = v.status === 'Moving' ? '#22c55e' : v.status === 'Idle' ? '#f59e0b' : '#ef4444';
          return (
            <Card key={v.vehicle_no} className="p-3.5">
              <div className="flex items-center justify-between mb-2">
                <p className="font-black text-gray-800 text-[13px]">{v.vehicle_no}</p>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: col }}/>
                  <span className="text-[10px] font-bold" style={{ color: col }}>{v.status}</span>
                </div>
              </div>
              <p className="text-[11px] text-gray-600 font-medium">{v.driver}</p>
              <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
                <span className="text-gray-500">Speed: <b className="text-gray-800">{v.speed} km/h</b></span>
                <span className="text-gray-500">Fuel: <b className={v.fuel_pct < 20 ? 'text-red-600' : 'text-gray-800'}>{v.fuel_pct}%</b></span>
                <span className="text-gray-500">KM Today: <b className="text-gray-800">{v.today_km}</b></span>
                <span className="text-gray-500">Alerts: <b className={v.alerts > 0 ? 'text-red-600' : 'text-gray-800'}>{v.alerts}</b></span>
              </div>
              <div className="mt-2"><HealthBar pct={v.fuel_pct}/></div>
              <p className="text-[9px] text-gray-400 mt-1">{v.geofence} · {timeAgo(v.last_seen)}</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function GPSMapSection({ d }) {
  return (
    <div className="space-y-4">
      <SectionHeader icon="🗺️" title="Live GPS Map" sub="Real-time vehicle positions · Click dots for vehicle details" gradient="from-[#1e3a5f] to-[#1d4ed8]" badge="LIVE"/>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPI icon="📍" title="GPS Online" value={d.gps?.filter(v => v.status === 'Moving').length || 0} color="green"/>
        <KPI icon="🛣️" title="KM Today (Avg)" value={`${Math.round(d.gps?.reduce((s, v) => s + parseFloat(v.today_km || 0), 0) / (d.gps?.length || 1))} km`} color="blue"/>
        <KPI icon="🚨" title="Geofence Alerts" value={d.gps?.filter(v => v.geofence === 'Outside').length || 0} color="red"/>
        <KPI icon="⚡" title="Avg Speed" value={`${Math.round(d.gps?.reduce((s, v) => s + v.speed, 0) / (d.gps?.length || 1))} km/h`} color="cyan"/>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="col-span-2 p-3">
          {d.gps && <MapView vehicles={d.gps}/>}
        </Card>
        <Card className="overflow-y-auto" style={{ maxHeight: 460 }}>
          <div className="px-3 py-2.5 border-b bg-gray-50">
            <p className="text-[11px] font-bold text-gray-700">All Vehicles</p>
          </div>
          {d.gps?.map(v => (
            <div key={v.vehicle_no} className="px-3 py-2 border-b hover:bg-gray-50 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: v.status === 'Moving' ? '#22c55e' : v.status === 'Idle' ? '#f59e0b' : '#ef4444' }}/>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-gray-800 truncate">{v.vehicle_no}</p>
                <p className="text-[9.5px] text-gray-500 truncate">{v.driver} · {v.speed} km/h</p>
              </div>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${v.fuel_pct < 20 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>{v.fuel_pct}%</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

function RouteOptSection({ d }) {
  if (!d.routes?.length) return null;
  return (
    <div className="space-y-4">
      <SectionHeader icon="⚡" title="AI Route Optimization" sub="Machine learning route efficiency with traffic, weather and fuel optimization" gradient="from-[#7c3aed] to-[#6d28d9]" badge="ML Powered"/>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPI icon="⚡" title="Optimized Routes" value={d.routes.filter(r => r.status === 'Optimized').length} color="green"/>
        <KPI icon="⛽" title="Avg Fuel Saving" value={`${(d.routes.reduce((s, r) => s + r.fuel_savings_pct, 0) / d.routes.length).toFixed(1)}%`} color="amber"/>
        <KPI icon="💰" title="Toll Savings (Avg)" value={fmt(d.routes.reduce((s, r) => s + r.toll_savings, 0), true)} color="blue"/>
        <KPI icon="🎯" title="ETA Accuracy" value={`${(d.routes.reduce((s, r) => s + r.eta_accuracy, 0) / d.routes.length).toFixed(1)}%`} color="indigo"/>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {d.routes.map(r => (
          <Card key={r.id} className="p-4">
            <div className="flex items-start justify-between mb-2">
              <p className="font-black text-gray-800 text-[13px]">{r.route}</p>
              <StatusBadge status={r.status}/>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2 text-[11px]">
              <div className="bg-gray-50 rounded p-2">
                <p className="text-gray-500">Distance</p><p className="font-bold">{r.distance_km} km</p>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <p className="text-gray-500">Avg Time</p><p className="font-bold">{r.avg_time_hrs} hrs</p>
              </div>
              <div className="bg-green-50 rounded p-2">
                <p className="text-green-600">Fuel Saving</p><p className="font-bold text-green-700">{r.fuel_savings_pct}%</p>
              </div>
              <div className="bg-blue-50 rounded p-2">
                <p className="text-blue-600">Toll Saving</p><p className="font-bold text-blue-700">₹{r.toll_savings.toLocaleString()}</p>
              </div>
            </div>
            <div className="mt-2.5 p-2 bg-indigo-50 rounded text-[11px] border border-indigo-100">
              <span className="text-indigo-500 font-bold">🤖 AI: </span>
              <span className="text-indigo-700">{r.ai_suggestion}</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-[10px] text-gray-500">ETA Accuracy:</span>
              <div className="flex-1"><HealthBar pct={r.eta_accuracy}/></div>
              <span className="text-[10px] font-bold text-gray-700">{r.eta_accuracy}%</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function FuelSection({ d }) {
  if (!d.fuel?.length || !d.fuelAnalytics) return null;
  const theftAlerts = d.fuel.filter(v => v.theft_alert);
  return (
    <div className="space-y-4">
      <SectionHeader icon="⛽" title="Fuel Analytics" sub="Consumption trends, mileage analysis and theft detection" gradient="from-[#d97706] to-[#b45309]" badge="AI Detection"/>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPI icon="⛽" title="Total Today (L)" value={d.dashboard?.fuel_today_lt?.toLocaleString() || '—'} color="amber"/>
        <KPI icon="📉" title="Avg Mileage" value={`${(d.fuel.reduce((s, v) => s + v.mileage_kmpl, 0) / d.fuel.length).toFixed(1)} km/l`} color="blue"/>
        <KPI icon="⚠️" title="Theft Alerts" value={theftAlerts.length} color={theftAlerts.length > 0 ? 'red' : 'green'}/>
        <KPI icon="💰" title="Fuel Cost Today" value={fmt(d.fuel.reduce((s, v) => s + v.total_cost_today, 0), true)} color="pink"/>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <p className="text-[12px] font-bold text-gray-700 mb-3">30-Day Fuel Consumption (Litres)</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={d.fuelAnalytics.trend}>
              <defs>
                <linearGradient id="fuelGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.4}/><stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
              <XAxis dataKey="date" tick={{ fontSize: 8 }} tickFormatter={d => d.slice(5)} interval={5}/>
              <YAxis tick={{ fontSize: 9 }}/>
              <Tooltip/>
              <Area type="monotone" dataKey="lt" stroke="#f97316" fill="url(#fuelGrad)" name="Litres" strokeWidth={2}/>
            </AreaChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-4">
          <p className="text-[12px] font-bold text-gray-700 mb-3">Vehicle Mileage (km/l)</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={d.fuel}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
              <XAxis dataKey="vehicle_no" tick={{ fontSize: 7 }} angle={-20} textAnchor="end" height={36}/>
              <YAxis domain={[0, 12]} tick={{ fontSize: 9 }}/>
              <Tooltip/>
              <Bar dataKey="mileage_kmpl" name="km/l" fill="#f97316" radius={[3,3,0,0]}/>
              <Bar dataKey="expected_kmpl" name="Expected" fill="#fde68a" radius={[3,3,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
      {theftAlerts.length > 0 && (
        <Card className="border-red-200">
          <div className="px-4 py-2.5 bg-red-50 border-b border-red-200 flex items-center gap-2">
            <span className="text-red-600 font-bold text-[12px]">🚨 Fuel Theft Alerts ({theftAlerts.length})</span>
          </div>
          <div className="divide-y">
            {theftAlerts.map(v => (
              <div key={v.vehicle_no} className="px-4 py-2.5 flex items-center gap-4 text-[12px]">
                <span className="font-bold text-red-700">{v.vehicle_no}</span>
                <span className="text-gray-600">{v.driver}</span>
                <span className="text-red-600 font-semibold">Variance: {v.variance_pct}%</span>
                <StatusBadge status="Theft Suspected"/>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function DriverSection({ d }) {
  if (!d.drivers?.length) return null;
  const sorted = [...d.drivers].sort((a, b) => b.driving_score - a.driving_score);
  return (
    <div className="space-y-4">
      <SectionHeader icon="👤" title="Driver Analytics" sub="Performance scores, violations, attendance and AI coaching insights" gradient="from-[#0891b2] to-[#0e7490]"/>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPI icon="✅" title="Present Today" value={d.drivers.filter(dr => dr.attendance === 'Present').length} color="green"/>
        <KPI icon="🏆" title="Avg Score" value={`${(d.drivers.reduce((s, dr) => s + dr.driving_score, 0) / d.drivers.length).toFixed(1)}`} color="blue"/>
        <KPI icon="⚠️" title="Total Violations" value={d.drivers.reduce((s, dr) => s + dr.violations, 0)} color="red"/>
        <KPI icon="⭐" title="Avg Rating" value={(d.drivers.reduce((s, dr) => s + dr.rating, 0) / d.drivers.length).toFixed(1)} color="amber"/>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <p className="text-[12px] font-bold text-gray-700 mb-3">Driver Performance Score</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={sorted} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false}/>
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 9 }}/>
              <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={90}/>
              <Tooltip/>
              <Bar dataKey="driving_score" name="Score" radius={[0,4,4,0]}
                fill="#06b6d4"/>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <div className="px-3 py-2.5 border-b bg-gray-50">
            <p className="text-[11px] font-bold text-gray-700">Driver Ranking & Metrics</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead className="bg-cyan-50 border-b">
                <tr>{['#','Driver','Trips','Score','Speed','Violations','Rating','Status'].map(h => <th key={h} className="px-2.5 py-2 text-left font-bold text-cyan-700 whitespace-nowrap">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sorted.map((dr, i) => (
                  <tr key={dr.name} className="hover:bg-gray-50">
                    <td className="px-2.5 py-2 text-gray-400 font-bold">{i + 1}</td>
                    <td className="px-2.5 py-2 font-semibold text-gray-800">{dr.name}</td>
                    <td className="px-2.5 py-2">{dr.trips_month}</td>
                    <td className="px-2.5 py-2 font-black" style={{ color: dr.driving_score >= 85 ? '#16a34a' : dr.driving_score >= 70 ? '#d97706' : '#dc2626' }}>{dr.driving_score}</td>
                    <td className="px-2.5 py-2">{dr.avg_speed} km/h</td>
                    <td className="px-2.5 py-2"><span className={`font-bold ${dr.violations > 3 ? 'text-red-600' : 'text-gray-700'}`}>{dr.violations}</span></td>
                    <td className="px-2.5 py-2 text-yellow-500 font-bold">{dr.rating} ⭐</td>
                    <td className="px-2.5 py-2"><StatusBadge status={dr.attendance}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

function EmptyLoadSection({ d }) {
  if (!d.loads?.length) return null;
  const available = d.loads.filter(l => l.status === 'Available' || l.status === 'Matched');
  return (
    <div className="space-y-4">
      <SectionHeader icon="🔄" title="Empty Return Load Matching" sub="AI-powered backhaul suggestions to eliminate empty return trips" gradient="from-[#059669] to-[#047857]" badge="AI Matching"/>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPI icon="🔄" title="Available Loads" value={available.length} color="green"/>
        <KPI icon="💰" title="Revenue Opportunity" value={fmt(available.reduce((s, l) => s + l.freight_rs, 0), true)} color="blue"/>
        <KPI icon="⚡" title="High Match (>90%)" value={available.filter(l => l.match_score >= 90).length} color="indigo"/>
        <KPI icon="📦" title="Avg Weight (T)" value={(available.reduce((s, l) => s + l.weight_ton, 0) / (available.length || 1)).toFixed(1)} color="amber"/>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {available.map(l => (
          <Card key={l.id} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] font-black text-gray-800">{l.origin} → {l.destination}</span>
              <span className={`text-[11px] font-black px-2 py-0.5 rounded-full ${l.match_score >= 90 ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{l.match_score}% match</span>
            </div>
            <div className="space-y-1 text-[11px] text-gray-600">
              <div className="flex justify-between"><span>Freight</span><span className="font-bold text-green-700">₹{l.freight_rs.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Weight</span><span className="font-bold">{l.weight_ton} T</span></div>
              <div className="flex justify-between"><span>Pickup</span><span className="font-bold">{l.pickup_date}</span></div>
              <div className="flex justify-between"><span>Truck</span><span className="font-bold text-indigo-700">{l.available_truck}</span></div>
              <div className="flex justify-between"><span>Utilization</span><span className="font-bold">{l.utilization_pct}%</span></div>
            </div>
            <div className="mt-3 pt-2 border-t flex gap-2">
              <button className="flex-1 bg-green-600 text-white text-[10px] font-bold py-1.5 rounded hover:bg-green-700 transition-colors">Accept Load</button>
              <button className="flex-1 border border-gray-300 text-gray-600 text-[10px] font-bold py-1.5 rounded hover:bg-gray-50 transition-colors">View Route</button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function MaintenanceSection({ d }) {
  if (!d.maintenance?.length) return null;
  const sorted = [...d.maintenance].sort((a, b) => a.health_score - b.health_score);
  const critical = sorted.filter(v => v.status === 'Critical' || v.status === 'In Service');
  return (
    <div className="space-y-4">
      <SectionHeader icon="🔧" title="Predictive Maintenance" sub="AI-predicted failure detection — prevent breakdowns before they happen" gradient="from-[#f97316] to-[#ea580c]" badge="Predictive AI"/>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPI icon="🔧" title="Service Due" value={d.dashboard?.maintenance_due || sorted.filter(v => v.next_service <= new Date(Date.now() + 7*86400000).toISOString().split('T')[0]).length} color="red"/>
        <KPI icon="🔴" title="Critical" value={critical.length} color="red"/>
        <KPI icon="⚠️" title="Warning" value={sorted.filter(v => v.status === 'Warning').length} color="amber"/>
        <KPI icon="✅" title="Good Condition" value={sorted.filter(v => v.status === 'Good').length} color="green"/>
      </div>
      {critical.length > 0 && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-[12px] font-bold text-red-700 mb-1">⚠️ Critical Vehicles Require Immediate Attention</p>
          <div className="flex flex-wrap gap-2">
            {critical.map(v => <span key={v.vehicle_no} className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[11px] font-bold">{v.vehicle_no}</span>)}
          </div>
        </div>
      )}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-[11.5px]">
            <thead className="bg-orange-50 border-b">
              <tr>{['Vehicle','Health %','Next Service','Tyre %','Oil Left (km)','Battery (V)','Temp (°C)','Status','AI Prediction','Downtime Risk'].map(h => (
                <th key={h} className="px-3 py-2.5 text-left font-bold text-orange-800 whitespace-nowrap">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sorted.map(v => (
                <tr key={v.vehicle_no} className={`hover:bg-gray-50 ${v.status === 'Critical' ? 'bg-red-50/50' : ''}`}>
                  <td className="px-3 py-2 font-black text-indigo-700">{v.vehicle_no}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold" style={{ color: v.health_score >= 80 ? '#16a34a' : v.health_score >= 60 ? '#d97706' : '#dc2626' }}>{v.health_score}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-2">{v.next_service}</td>
                  <td className="px-3 py-2"><span className={v.tyre_pct < 30 ? 'text-red-600 font-bold' : 'text-gray-700'}>{v.tyre_pct}%</span></td>
                  <td className="px-3 py-2">{v.oil_km_left.toLocaleString()}</td>
                  <td className="px-3 py-2"><span className={v.battery_v < 12.0 ? 'text-red-600 font-bold' : 'text-gray-700'}>{v.battery_v}V</span></td>
                  <td className="px-3 py-2"><span className={v.engine_temp > 100 ? 'text-red-600 font-bold' : 'text-gray-700'}>{v.engine_temp}°C</span></td>
                  <td className="px-3 py-2"><StatusBadge status={v.status}/></td>
                  <td className="px-3 py-2 text-gray-600 max-w-[160px]">{v.ai_prediction}</td>
                  <td className="px-3 py-2"><span className={`font-black ${v.downtime_risk_pct > 30 ? 'text-red-600' : v.downtime_risk_pct > 15 ? 'text-yellow-600' : 'text-green-600'}`}>{v.downtime_risk_pct}%</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function DelaySection({ d }) {
  if (!d.analytics || !d.dashboard) return null;
  const delayData = d.analytics.delay_analysis || [];
  const COLORS = ['#ef4444','#f97316','#f59e0b','#6366f1','#14b8a6','#8b5cf6'];
  return (
    <div className="space-y-4">
      <SectionHeader icon="⏰" title="Shipment Delay Prediction" sub="Delay analysis based on in-transit shipment data" gradient="from-[#dc2626] to-[#b91c1c]" badge="Live Data"/>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPI icon="📦" title="Currently Delayed" value={d.dashboard.delayed} color="red"/>
        <KPI icon="🎯" title="On-Time %" value={`${d.dashboard.on_time_pct}%`} color={d.dashboard.on_time_pct >= 90 ? 'green' : 'amber'}/>
        <KPI icon="⏰" title="High Risk LRs" value={0} color="red"/>
        <KPI icon="⚠️" title="Medium Risk" value={0} color="amber"/>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <p className="text-[12px] font-bold text-gray-700 mb-3">Delay Root Cause Analysis</p>
          {delayData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={delayData} dataKey="count" nameKey="reason" cx="50%" cy="50%" outerRadius={75} label={({ reason, percent }) => `${reason}: ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={9}>
                  {delayData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
                </Pie>
                <Tooltip/>
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex flex-col items-center justify-center text-gray-400">
              <p className="text-2xl mb-2">✅</p>
              <p className="text-xs font-medium">No delayed shipments</p>
            </div>
          )}
        </Card>
        <Card>
          <div className="px-3 py-2 border-b bg-gray-50"><p className="text-[11px] font-bold text-gray-700">AI Delay Risk Assessment</p></div>
          <div className="p-6 flex flex-col items-center justify-center text-gray-400 text-center">
            <p className="text-2xl mb-2">📡</p>
            <p className="text-xs font-semibold text-gray-600">Requires GPS & Telematics</p>
            <p className="text-[10px] mt-1">Connect vehicle IoT sensors to enable predictive delay scoring per LR</p>
          </div>
        </Card>
      </div>
    </div>
  );
}

function RevenueSection({ d }) {
  if (!d.analytics || !d.forecast) return null;
  const days = d.analytics.days.slice(-14);
  // 7-day rolling average as simple forecast baseline (only when enough history exists)
  const avgRevenue = days.length >= 3
    ? Math.round(days.reduce((s, d) => s + d.revenue, 0) / days.length)
    : 0;
  const forecastDays = Array.from({ length: 7 }, (_, i) => ({
    date: new Date(Date.now() + (i + 1) * 86400000).toISOString().split('T')[0],
    forecast: avgRevenue,
  }));
  const combined = [...days.map(d => ({ date: d.date.slice(5), actual: d.revenue, forecast: null })), ...forecastDays.map(f => ({ date: f.date.slice(5), actual: null, forecast: f.forecast }))];
  return (
    <div className="space-y-4">
      <SectionHeader icon="💰" title="Revenue Prediction" sub="AI forecasting based on historical patterns, seasonality and demand signals" gradient="from-[#16a34a] to-[#15803d]" badge="Forecast AI"/>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPI icon="💰" title="Revenue Today" value={fmt(d.dashboard?.revenue_today, true)} color="green" trend={5}/>
        <KPI icon="📈" title="7-Day Forecast" value={fmt(forecastDays.reduce((s, f) => s + f.forecast, 0), true)} color="blue"/>
        <KPI icon="🎯" title="Revenue Forecast (Month)" value={fmt(d.forecast.revenue_forecast_rs, true)} color="indigo"/>
        <KPI icon="📊" title="Avg Daily Revenue" value={fmt(Math.round(days.reduce((s, d) => s + d.revenue, 0) / days.length), true)} color="cyan"/>
      </div>
      <Card className="p-4">
        <p className="text-[12px] font-bold text-gray-700 mb-3">Actual Revenue vs AI Forecast (₹)</p>
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={combined}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/><stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
            <XAxis dataKey="date" tick={{ fontSize: 8 }} interval={2}/>
            <YAxis tick={{ fontSize: 9 }} tickFormatter={v => `₹${(v/100000).toFixed(1)}L`}/>
            <Tooltip formatter={v => v ? fmt(v, true) : '—'}/>
            <Legend wrapperStyle={{ fontSize: 11 }}/>
            <Area type="monotone" dataKey="actual" stroke="#22c55e" fill="url(#revGrad)" name="Actual" strokeWidth={2}/>
            <Line type="monotone" dataKey="forecast" stroke="#6366f1" strokeWidth={2} strokeDasharray="5 3" name="AI Forecast" dot={false}/>
          </ComposedChart>
        </ResponsiveContainer>
      </Card>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {d.forecast.ai_insights.map((insight, i) => <AIInsight key={i} text={insight} color={i % 2 === 0 ? 'green' : 'indigo'}/>)}
      </div>
    </div>
  );
}

function ForecastSection({ d }) {
  if (!d.forecast) return null;
  return (
    <div className="space-y-4">
      <SectionHeader icon="📈" title="Demand Forecast" sub="ML-based shipment volume and vehicle requirement predictions" gradient="from-[#4f46e5] to-[#4338ca]" badge="ML Model"/>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPI icon="🚛" title="Vehicles Needed" value={d.forecast.vehicles_needed_next_month} color="indigo" sub="next month"/>
        <KPI icon="💰" title="Revenue Forecast" value={fmt(d.forecast.revenue_forecast_rs, true)} color="green" sub="next month"/>
        <KPI icon="📅" title="Seasonal Peaks" value={d.forecast.seasonal_peaks.length} color="amber"/>
        <KPI icon="🤖" title="AI Insights" value={d.forecast.ai_insights.length} color="purple"/>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <p className="text-[12px] font-bold text-gray-700 mb-3">Monthly Shipments — Actual vs Forecast</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={d.forecast.monthly_trend}>
              <defs>
                <linearGradient id="fAct" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient>
                <linearGradient id="fFor" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/><stop offset="95%" stopColor="#f97316" stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
              <XAxis dataKey="month" tick={{ fontSize: 9 }}/>
              <YAxis tick={{ fontSize: 9 }}/>
              <Tooltip/><Legend wrapperStyle={{ fontSize: 11 }}/>
              <Area type="monotone" dataKey="actual" stroke="#6366f1" fill="url(#fAct)" name="Actual" strokeWidth={2}/>
              <Area type="monotone" dataKey="forecast" stroke="#f97316" fill="url(#fFor)" name="Forecast" strokeWidth={2} strokeDasharray="5 3"/>
            </AreaChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-4">
          <p className="text-[12px] font-bold text-gray-700 mb-3">Branch Demand Forecast</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={d.forecast.branch_demand}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
              <XAxis dataKey="branch" tick={{ fontSize: 8 }} angle={-15} textAnchor="end" height={36}/>
              <YAxis tick={{ fontSize: 9 }}/><Tooltip/>
              <Legend wrapperStyle={{ fontSize: 11 }}/>
              <Bar dataKey="current" name="Current" fill="#6366f1" radius={[3,3,0,0]}/>
              <Bar dataKey="forecast" name="Forecast" fill="#f97316" radius={[3,3,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}

function AlertsSection({ d }) {
  if (!d.notifications) return null;
  const [filter, setFilter] = useState('All');
  const items = d.notifications.recent || [];
  const visible = filter === 'All' ? items : items.filter(n => n.priority === filter);
  const P = { High: '#ef4444', Medium: '#f59e0b', Low: '#6b7280' };
  return (
    <div className="space-y-4">
      <SectionHeader icon="🔔" title="AI Alerts" sub="Real-time intelligent alerts across fleet, deliveries and compliance" gradient="from-[#dc2626] to-[#991b1b]" badge={`${items.filter(n => !n.read).length} Unread`}/>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {d.notifications.summary.slice(0, 4).map(s => (
          <KPI key={s.type} icon={s.icon} title={s.type} value={s.count} color={s.count > 3 ? 'red' : s.count > 0 ? 'amber' : 'green'}/>
        ))}
      </div>
      <div className="flex gap-2 flex-wrap">
        {['All','High','Medium','Low'].map(p => (
          <button key={p} onClick={() => setFilter(p)}
            className={`px-4 py-1.5 rounded-full text-[11px] font-bold border transition-colors ${filter === p ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-600 border-gray-300 hover:border-red-400'}`}>
            {p}
          </button>
        ))}
      </div>
      <Card>
        <div className="divide-y max-h-[500px] overflow-y-auto">
          {visible.map(n => (
            <div key={n.id} className={`px-4 py-3 flex items-start gap-3 ${n.read ? '' : 'bg-red-50/30'}`}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-base flex-shrink-0" style={{ backgroundColor: P[n.priority] + '20' }}>
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: P[n.priority] }}/>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: P[n.priority] + '20', color: P[n.priority] }}>{n.priority}</span>
                  <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">{n.type}</span>
                </div>
                <p className={`text-[12px] leading-snug ${n.read ? 'text-gray-600' : 'text-gray-800 font-medium'}`}>{n.message}</p>
              </div>
              <span className="text-[10px] text-gray-400 flex-shrink-0">{timeAgo(n.time)}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function RecommendationsSection({ d }) {
  const dash = d.dashboard || {};
  const notifs = d.notifications?.recent || [];

  // Build recommendations only from real DB data
  const recs = [];
  if (dash.delayed > 0)
    recs.push({ priority: 'Critical', icon: '🕐', title: 'Delayed Shipments', desc: `${dash.delayed} shipment${dash.delayed > 1 ? 's' : ''} in transit for more than 3 days — follow up with drivers for status update`, color: 'red' });
  if (dash.pending_pod_count > 0)
    recs.push({ priority: 'High', icon: '📦', title: 'POD Submission Pending', desc: `${dash.pending_pod_count} delivered shipment${dash.pending_pod_count > 1 ? 's' : ''} awaiting POD upload — collect and upload proof of delivery`, color: 'amber' });
  if (dash.risk_alerts > 0)
    recs.push({ priority: 'High', icon: '⚠️', title: 'Risk Alerts', desc: `${dash.risk_alerts} alert${dash.risk_alerts > 1 ? 's' : ''} require attention — includes hold/lost shipments, e-way bill expiry and overdue payments`, color: 'amber' });
  if (dash.high_risk_count > 0)
    recs.push({ priority: 'Critical', icon: '🔴', title: 'Hold / Lost Shipments', desc: `${dash.high_risk_count} shipment${dash.high_risk_count > 1 ? 's' : ''} are on hold or lost — contact the consignee and update status immediately`, color: 'red' });
  notifs.filter(n => !n.read && n.type === 'Late Delivery').forEach(n =>
    recs.push({ priority: 'High', icon: '🚚', title: 'Late Delivery Alert', desc: n.message, color: 'amber' })
  );

  const criticalCount = recs.filter(r => r.priority === 'Critical').length;
  const highCount     = recs.filter(r => r.priority === 'High').length;
  const mediumCount   = recs.filter(r => r.priority === 'Medium').length;

  return (
    <div className="space-y-4">
      <SectionHeader icon="🤖" title="AI Recommendations" sub="Actionable alerts based on live shipment data" gradient="from-[#7c3aed] to-[#6d28d9]" badge={recs.length > 0 ? `${recs.length} Actions` : 'All Clear'}/>
      <div className="grid grid-cols-3 sm:grid-cols-3 gap-3">
        <KPI icon="🔴" title="Critical Actions" value={criticalCount} color="red"/>
        <KPI icon="🟡" title="High Priority" value={highCount} color="amber"/>
        <KPI icon="🔵" title="Medium Priority" value={mediumCount} color="blue"/>
      </div>
      {recs.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-3xl mb-2">✅</p>
          <p className="text-sm font-bold text-gray-700">No critical actions required</p>
          <p className="text-xs text-gray-400 mt-1">All shipments are on track. Check back after new bookings are created.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {recs.map((r, i) => (
            <Card key={i} className="p-4">
              <div className="flex items-start gap-2 mb-2">
                <span className="text-2xl">{r.icon}</span>
                <div>
                  <p className="text-[13px] font-black text-gray-800">{r.title}</p>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${r.priority === 'Critical' ? 'bg-red-100 text-red-700' : r.priority === 'High' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{r.priority}</span>
                </div>
              </div>
              <p className="text-[11px] text-gray-600 leading-relaxed">{r.desc}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function BranchSection({ d }) {
  if (!d.analytics) return null;
  const branches = d.analytics.branch_performance;
  return (
    <div className="space-y-4">
      <SectionHeader icon="🏢" title="Branch Performance" sub="Revenue, profitability and on-time delivery comparison across all branches" gradient="from-[#0f766e] to-[#0d9488]"/>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <p className="text-[12px] font-bold text-gray-700 mb-3">Branch Revenue & Profit %</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={branches}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
              <XAxis dataKey="branch" tick={{ fontSize: 8 }} angle={-10} textAnchor="end" height={36}/>
              <YAxis yAxisId="left" tick={{ fontSize: 9 }} tickFormatter={v => `${(v/10000000).toFixed(1)}Cr`}/>
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9 }} tickFormatter={v => `${v}%`}/>
              <Tooltip/><Legend wrapperStyle={{ fontSize: 11 }}/>
              <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill="#14b8a6" radius={[3,3,0,0]}/>
              <Bar yAxisId="right" dataKey="profit_pct" name="Profit %" fill="#f97316" radius={[3,3,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <div className="px-3 py-2.5 border-b bg-gray-50"><p className="text-[11px] font-bold text-gray-700">Branch Scorecard</p></div>
          <div className="overflow-x-auto">
            <table className="w-full text-[11.5px]">
              <thead className="bg-teal-50 border-b">
                <tr>{['Branch','Shipments','Revenue','Profit %','On-Time %','Score'].map(h => <th key={h} className="px-3 py-2 text-left font-bold text-teal-700">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[...branches].sort((a, b) => b.profit_pct - a.profit_pct).map((b, i) => {
                  const score = Math.round((b.profit_pct / 35) * 40 + (b.on_time_pct / 100) * 40 + (b.shipments / 900) * 20);
                  return (
                    <tr key={b.branch} className="hover:bg-gray-50">
                      <td className="px-3 py-2.5 font-bold text-gray-800">
                        <span className="text-gray-400 mr-1.5">{i+1}.</span>{b.branch}
                      </td>
                      <td className="px-3 py-2.5">{b.shipments.toLocaleString()}</td>
                      <td className="px-3 py-2.5 font-semibold text-green-700">{fmt(b.revenue, true)}</td>
                      <td className="px-3 py-2.5 font-bold" style={{ color: b.profit_pct >= 20 ? '#16a34a' : b.profit_pct >= 15 ? '#d97706' : '#dc2626' }}>{b.profit_pct}%</td>
                      <td className="px-3 py-2.5"><span className={`font-bold ${b.on_time_pct >= 90 ? 'text-green-600' : 'text-yellow-600'}`}>{b.on_time_pct}%</span></td>
                      <td className="px-3 py-2.5"><div className="flex items-center gap-2"><HealthBar pct={score}/><span className="font-bold text-[10px]">{score}</span></div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

function CustomerSection({ d }) {
  const avgRating = d.drivers?.length ? (d.drivers.reduce((s, dr) => s + dr.rating, 0) / d.drivers.length) : 0;
  const onTimePct = d.analytics?.days?.length
    ? (d.analytics.days.reduce((s, day) => s + (day.on_time_pct || 0), 0) / d.analytics.days.length).toFixed(1)
    : null;
  return (
    <div className="space-y-4">
      <SectionHeader icon="⭐" title="Customer Satisfaction" sub="Delivery satisfaction scores, NPS and complaint analytics" gradient="from-[#db2777] to-[#be185d]"/>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPI icon="⭐" title="Avg Rating" value={avgRating > 0 ? `${avgRating.toFixed(1)}/5` : '—'} color="amber"/>
        <KPI icon="📊" title="NPS Score" value="—" color="blue" sub="Awaiting CRM data"/>
        <KPI icon="✅" title="Avg On-Time" value={onTimePct ? `${onTimePct}%` : '—'} color="green"/>
        <KPI icon="💬" title="Complaints" value="—" color="red"/>
      </div>
      <Card className="p-10 text-center">
        <p className="text-3xl mb-3">📊</p>
        <p className="text-sm font-semibold text-gray-600">Customer Analytics — Awaiting CRM Integration</p>
        <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">Connect your CRM or ERP to view per-customer satisfaction scores, complaint history, NPS breakdown and delivery scorecards</p>
      </Card>
    </div>
  );
}

function CostKmSection({ d }) {
  if (!d.fuel?.length) return null;
  const vehicles = d.fuel.map(v => ({
    vehicle: v.vehicle_no,
    cost_km: (v.total_cost_today / Math.max(v.mileage_kmpl * v.fuel_today_lt, 1)).toFixed(2),
    fuel_cost: v.total_cost_today,
  }));
  return (
    <div className="space-y-4">
      <SectionHeader icon="📊" title="Cost Per KM Analysis" sub="Vehicle-wise operational cost breakdown and benchmarking" gradient="from-[#0284c7] to-[#0369a1]"/>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPI icon="📊" title="Avg Cost/KM" value={d.dashboard?.cost_per_km ? `₹${d.dashboard.cost_per_km}` : '—'} color="blue"/>
        <KPI icon="🏆" title="Best Vehicle" value={vehicles.sort((a, b) => a.cost_km - b.cost_km)[0]?.vehicle || '—'} color="green" sub="lowest cost/km"/>
        <KPI icon="⚠️" title="Worst Vehicle" value={vehicles.sort((a, b) => b.cost_km - a.cost_km)[0]?.vehicle || '—'} color="red" sub="highest cost/km"/>
        <KPI icon="💰" title="Total Fuel Cost" value={fmt(d.fuel.reduce((s, v) => s + v.total_cost_today, 0), true)} color="amber"/>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <p className="text-[12px] font-bold text-gray-700 mb-3">Cost Breakdown (%)</p>
          <div className="h-[220px] flex flex-col items-center justify-center text-gray-400 text-center">
            <p className="text-2xl mb-2">📡</p>
            <p className="text-xs font-semibold text-gray-600">Requires Telematics Integration</p>
            <p className="text-[10px] mt-1">Connect fuel sensors and expense modules to calculate real cost breakdown</p>
          </div>
        </Card>
        <Card className="p-4">
          <p className="text-[12px] font-bold text-gray-700 mb-3">Vehicle-wise Fuel Cost Today (₹)</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={d.fuel} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false}/>
              <XAxis type="number" tick={{ fontSize: 9 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`}/>
              <YAxis type="category" dataKey="vehicle_no" tick={{ fontSize: 8 }} width={90}/>
              <Tooltip formatter={v => `₹${v.toLocaleString()}`}/>
              <Bar dataKey="total_cost_today" name="Cost" fill="#0284c7" radius={[0,3,3,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}

function UtilizationSection({ d }) {
  if (!d.analytics || !d.analytics.fleet_utilization?.length) return null;
  const fleet = d.analytics.fleet_utilization;
  const avg = (fleet.reduce((s, v) => s + v.utilization_pct, 0) / fleet.length).toFixed(1);
  return (
    <div className="space-y-4">
      <SectionHeader icon="📉" title="Fleet Utilization" sub="Revenue-generating time vs idle time analysis per vehicle" gradient="from-[#6366f1] to-[#4f46e5]"/>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPI icon="📉" title="Avg Utilization" value={`${avg}%`} color={parseFloat(avg) >= 75 ? 'green' : 'amber'}/>
        <KPI icon="🏆" title="Best Utilized" value={fleet.sort((a, b) => b.utilization_pct - a.utilization_pct)[0]?.vehicle || '—'} color="green"/>
        <KPI icon="⚠️" title="Under-utilized (<60%)" value={fleet.filter(v => v.utilization_pct < 60).length} color="red"/>
        <KPI icon="💰" title="Total Revenue" value={fmt(fleet.reduce((s, v) => s + v.revenue, 0), true)} color="indigo"/>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <p className="text-[12px] font-bold text-gray-700 mb-3">Utilization % — By Vehicle</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={[...fleet].sort((a, b) => b.utilization_pct - a.utilization_pct)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false}/>
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 9 }} tickFormatter={v => `${v}%`}/>
              <YAxis type="category" dataKey="vehicle" tick={{ fontSize: 8 }} width={90}/>
              <Tooltip formatter={v => `${v}%`}/>
              <Bar dataKey="utilization_pct" name="Utilization %" radius={[0,4,4,0]}
                fill="#6366f1"/>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <div className="px-3 py-2.5 border-b bg-gray-50"><p className="text-[11px] font-bold text-gray-700">Vehicle Utilization Detail</p></div>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead className="bg-indigo-50 border-b">
                <tr>{['Vehicle','Utilization %','Trips','KM','Revenue','Grade'].map(h => <th key={h} className="px-3 py-2 text-left font-bold text-indigo-700">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[...fleet].sort((a, b) => b.utilization_pct - a.utilization_pct).map(v => {
                  const grade = v.utilization_pct >= 85 ? 'A' : v.utilization_pct >= 70 ? 'B' : v.utilization_pct >= 55 ? 'C' : 'D';
                  const gColor = grade === 'A' ? '#16a34a' : grade === 'B' ? '#0891b2' : grade === 'C' ? '#d97706' : '#dc2626';
                  return (
                    <tr key={v.vehicle} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-bold text-indigo-700">{v.vehicle}</td>
                      <td className="px-3 py-2"><div className="flex items-center gap-2"><HealthBar pct={v.utilization_pct}/><span className="font-bold text-[10px]">{v.utilization_pct}%</span></div></td>
                      <td className="px-3 py-2">{v.trips}</td>
                      <td className="px-3 py-2">{v.km.toLocaleString()}</td>
                      <td className="px-3 py-2 text-green-700 font-semibold">{fmt(v.revenue, true)}</td>
                      <td className="px-3 py-2"><span className="text-lg font-black" style={{ color: gColor }}>{grade}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── Section dispatcher ───────────────────────────────────────────────────────
function renderSection(id, d) {
  switch (id) {
    case 'overview':        return <OverviewSection d={d}/>;
    case 'kpis':            return <TodayKPIsSection d={d}/>;
    case 'fleet-health':    return <FleetHealthSection d={d}/>;
    case 'vehicles':        return <VehiclesSection d={d}/>;
    case 'gps-map':         return <GPSMapSection d={d}/>;
    case 'route-opt':       return <RouteOptSection d={d}/>;
    case 'fuel':            return <FuelSection d={d}/>;
    case 'driver':          return <DriverSection d={d}/>;
    case 'empty-load':      return <EmptyLoadSection d={d}/>;
    case 'maintenance':     return <MaintenanceSection d={d}/>;
    case 'delay':           return <DelaySection d={d}/>;
    case 'revenue':         return <RevenueSection d={d}/>;
    case 'forecast':        return <ForecastSection d={d}/>;
    case 'alerts':          return <AlertsSection d={d}/>;
    case 'recommendations': return <RecommendationsSection d={d}/>;
    case 'branch':          return <BranchSection d={d}/>;
    case 'customer':        return <CustomerSection d={d}/>;
    case 'cost-km':         return <CostKmSection d={d}/>;
    case 'utilization':     return <UtilizationSection d={d}/>;
    default:                return null;
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function EnterpriseDashboard() {
  const [active, setActive]   = useState('overview');
  const [data, setData]       = useState({});
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const loadData = useCallback(() => {
    const get = url => api.get(url).then(r => r.data).catch(() => null);
    Promise.all([
      get('/ai/dashboard'),
      get('/ai/gps/vehicles'),
      get('/ai/routes'),
      get('/ai/maintenance'),
      get('/ai/drivers'),
      get('/ai/fuel'),
      get('/ai/fuel/analytics'),
      get('/ai/forecast'),
      get('/ai/notifications'),
      get('/ai/analytics'),
      get('/ai/loads'),
    ]).then(([dashboard, gps, routes, maintenance, drivers, fuel, fuelAnalytics, forecast, notifications, analytics, loads]) => {
      if (!dashboard) {
        toast.error('Failed to load dashboard data');
      }
      setData({ dashboard, gps, routes, maintenance, drivers, fuel, fuelAnalytics, forecast, notifications, analytics, loads });
      setLastUpdate(new Date());
      setLoading(false);
    });
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const id = setInterval(loadData, 60000);
    return () => clearInterval(id);
  }, [loadData]);

  const activeSection = SECTIONS.find(s => s.id === active);
  const alertCount = data.notifications?.recent?.filter(n => !n.read).length || 0;

  return (
    <div className="flex h-full overflow-hidden bg-[#f1f5f9]" style={{ minHeight: 'calc(100vh - 90px)' }}>

      {/* ── LEFT SIDEBAR ─────────────────────────────────────────────── */}
      <div className={`bg-[#0f172a] flex-shrink-0 flex flex-col transition-all duration-200 ${sidebarOpen ? 'w-52' : 'w-12'} overflow-hidden`}>
        {/* Sidebar header */}
        <div className="px-3 py-3 border-b border-white/10 flex items-center justify-between flex-shrink-0">
          {sidebarOpen && (
            <div>
              <p className="text-white text-[12px] font-black tracking-wide">🤖 AI ENTERPRISE</p>
              <p className="text-white/40 text-[9px] font-semibold uppercase tracking-widest">Dashboard</p>
            </div>
          )}
          <button onClick={() => setSidebarOpen(o => !o)}
            className="text-white/60 hover:text-white p-1 rounded transition-colors flex-shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d={sidebarOpen ? 'M11 19l-7-7 7-7m8 14l-7-7 7-7' : 'M13 5l7 7-7 7M5 5l7 7-7 7'}/>
            </svg>
          </button>
        </div>

        {/* Nav items */}
        <div className="flex-1 overflow-y-auto py-1">
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setActive(s.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-all duration-150 group relative
                ${active === s.id ? 'bg-indigo-600 text-white' : 'text-white/55 hover:bg-white/10 hover:text-white'}`}>
              <span className="text-[16px] flex-shrink-0">{s.icon}</span>
              {sidebarOpen && (
                <span className="text-[11px] font-semibold leading-tight flex-1 truncate">{s.label}</span>
              )}
              {sidebarOpen && s.ai && (
                <span className="text-[8px] bg-indigo-400/30 text-indigo-300 px-1 rounded font-bold flex-shrink-0">AI</span>
              )}
              {s.id === 'alerts' && alertCount > 0 && sidebarOpen && (
                <span className="text-[9px] bg-red-500 text-white px-1.5 rounded-full font-bold flex-shrink-0">{alertCount}</span>
              )}
              {!sidebarOpen && (
                <div className="absolute left-full ml-2 bg-gray-900 text-white text-[11px] font-semibold px-2 py-1 rounded whitespace-nowrap hidden group-hover:block z-50 border border-white/10">
                  {s.label}
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Last updated */}
        {sidebarOpen && lastUpdate && (
          <div className="px-3 py-2.5 border-t border-white/10 flex-shrink-0">
            <p className="text-[9px] text-white/30 font-medium">Last updated: {lastUpdate.toLocaleTimeString()}</p>
            <p className="text-[9px] text-white/20 mt-0.5">Auto-refresh: 60s</p>
          </div>
        )}
      </div>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <div className="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-lg">{activeSection?.icon}</span>
            <div>
              <h1 className="text-[14px] font-black text-gray-800">{activeSection?.label}</h1>
              <p className="text-[10px] text-gray-400">LocalWheels AI Enterprise Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {lastUpdate && <span className="text-[10px] text-gray-400 hidden sm:block">Updated {lastUpdate.toLocaleTimeString()}</span>}
            <button onClick={loadData} disabled={loading}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors">
              {loading
                ? <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"/>
                : <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              }
              Refresh
            </button>
          </div>
        </div>

        {/* Section content */}
        <div className="p-4">
          {loading ? (
            <div className="flex items-center justify-center h-64 gap-3">
              <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" style={{ borderWidth: 3 }}/>
              <div>
                <p className="text-gray-700 font-bold text-sm">Loading AI Dashboard…</p>
                <p className="text-gray-400 text-xs">Fetching real-time fleet data</p>
              </div>
            </div>
          ) : renderSection(active, data)}
        </div>
      </div>
    </div>
  );
}
