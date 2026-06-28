import React, { useState, useEffect, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import api from '../../api/client';
import toast from 'react-hot-toast';

const ACCENT = '#0b8fd3';
const GREEN  = '#22c55e';
const ORANGE = '#f97316';
const RED    = '#ef4444';
const PURPLE = '#8b5cf6';

function StatCard({ title, value, sub, color = ACCENT, icon, badge }) {
  return (
    <div className="bg-white rounded shadow-sm p-3 border-l-4" style={{ borderColor: color }}>
      <div className="flex items-start justify-between gap-2">
        <div className="text-2xl flex-shrink-0">{icon}</div>
        <div className="text-right flex-1 min-w-0">
          <p className="text-xl font-bold text-gray-800 leading-tight">{value}</p>
          {badge && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: color + '20', color }}>{badge}</span>}
        </div>
      </div>
      <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mt-1.5">{title}</p>
      {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <div className="w-1 h-5 rounded-full" style={{ background: ACCENT }} />
      <h2 className="text-[13px] font-bold text-gray-700 uppercase tracking-wide">{children}</h2>
    </div>
  );
}

export default function AIDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api.get('/ai/dashboard')
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load AI dashboard'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!data) return null;

  const f = data.fleet;

  return (
    <div className="p-3 space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0b8fd3] to-[#0066aa] rounded shadow text-white px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold">AI Operations Dashboard</h1>
          <p className="text-blue-100 text-[12px]">Real-time intelligence — fleet, shipments, drivers, warehouse</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[12px] text-blue-100">Live</span>
          <button onClick={load} className="ml-3 bg-white/20 hover:bg-white/30 text-white text-[11px] font-semibold px-3 py-1 rounded transition-colors">
            Refresh
          </button>
        </div>
      </div>

      {/* Row 1 — Fleet & Revenue */}
      <div>
        <SectionTitle>Fleet & Revenue Overview</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
          <StatCard title="Active Vehicles" value={f.active} sub={`of ${f.total} total`} color={GREEN}  icon="🚛" badge="LIVE" />
          <StatCard title="Idle Vehicles"   value={f.idle}   sub="No assignment"         color={ORANGE} icon="⏸️" />
          <StatCard title="Breakdown"        value={f.breakdown} sub="Need assistance"   color={RED}    icon="🔴" badge="ALERT" />
          <StatCard title="In Maintenance"   value={f.maintenance} sub="Scheduled"       color={PURPLE} icon="🔧" />
          <StatCard title="Revenue Today"    value={`₹${(data.revenue_today/100000).toFixed(1)}L`} sub="Gross"  color={ACCENT} icon="💰" />
          <StatCard title="Fleet Health"     value={`${data.fleet_health}%`} sub="AI Score"     color={GREEN}  icon="❤️" badge={data.fleet_health > 85 ? 'GOOD' : 'WARN'} />
        </div>
      </div>

      {/* Row 2 — Operations */}
      <div>
        <SectionTitle>Operations Intelligence</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
          <StatCard title="On-Time Delivery" value={`${data.on_time_pct}%`}       sub="Last 30 days"       color={GREEN}  icon="⏱️" />
          <StatCard title="Drivers Present"  value={data.driver_present}           sub={`Absent: ${data.driver_absent}`} color={ACCENT} icon="👤" />
          <StatCard title="Fuel Today"       value={`${data.fuel_today_lt.toLocaleString('en-IN')} L`} sub="Consumed"  color={ORANGE} icon="⛽" />
          <StatCard title="Delayed Ships."   value={data.delayed}                  sub="Needs attention"    color={RED}    icon="⚠️" badge={data.delayed > 10 ? 'HIGH' : 'LOW'} />
          <StatCard title="Maintenance Due"  value={data.maintenance_due}          sub="Next 7 days"        color={ORANGE} icon="🔧" />
          <StatCard title="Cost / KM"        value={`₹${data.cost_per_km}`}        sub="Fleet average"      color={PURPLE} icon="📊" />
        </div>
      </div>

      {/* Row 3 — Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Revenue Trend */}
        <div className="bg-white rounded shadow-sm p-3 lg:col-span-2">
          <SectionTitle>7-Day Revenue vs Cost Trend</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data.revenue_trend}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={ACCENT} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={ACCENT} stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="cost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={ORANGE} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={ORANGE} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => `₹${v.toLocaleString('en-IN')}`} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="revenue" stroke={ACCENT}  fill="url(#rev)"  name="Revenue" strokeWidth={2} />
              <Area type="monotone" dataKey="cost"    stroke={ORANGE}  fill="url(#cost)" name="Cost"    strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Shipment Status Pie */}
        <div className="bg-white rounded shadow-sm p-3">
          <SectionTitle>Shipment Status</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={data.shipment_status} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false} style={{ fontSize: 10 }}>
                {data.shipment_status.map((s, i) => <Cell key={i} fill={s.fill} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 4 — Driver Performance + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Driver Performance */}
        <div className="bg-white rounded shadow-sm p-3">
          <SectionTitle>Top Driver Performance</SectionTitle>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data.top_drivers} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={90} />
              <Tooltip />
              <Bar dataKey="score" name="Score" fill={ACCENT} radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* AI Alerts */}
        <div className="bg-white rounded shadow-sm p-3">
          <SectionTitle>AI Risk Alerts & Insights</SectionTitle>
          <div className="space-y-2 mt-1">
            {[
              { icon: '⚠️', text: `${data.fuel_theft_alerts} fuel theft alert(s) detected today`, color: RED, level: 'High' },
              { icon: '🔧', text: `${data.maintenance_due} vehicles due for service this week`, color: ORANGE, level: 'Med' },
              { icon: '📦', text: `${data.delayed} shipments delayed — customer alerts sent`, color: ORANGE, level: 'Med' },
              { icon: '🏭', text: `Warehouse at ${data.warehouse_pct}% capacity — plan dispatch`, color: data.warehouse_pct > 80 ? RED : GREEN, level: data.warehouse_pct > 80 ? 'High' : 'Low' },
              { icon: '🚛', text: `${data.empty_returns} empty return load opportunities available`, color: GREEN, level: 'Opp' },
              { icon: '📍', text: `${data.vehicles_near_delivery} vehicles within 5km of delivery point`, color: ACCENT, level: 'Info' },
            ].map((a, i) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded text-[12px]" style={{ background: a.color + '10' }}>
                <span>{a.icon}</span>
                <p className="flex-1 text-gray-700">{a.text}</p>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0" style={{ background: a.color + '20', color: a.color }}>{a.level}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 5 — Quick Modules */}
      <div>
        <SectionTitle>Quick Access — AI Modules</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
          {[
            { label: 'Route Optimization', path: '/ai/route-optimization', icon: '🗺️', color: '#0b8fd3' },
            { label: 'GPS Tracking',       path: '/ai/gps-tracking',       icon: '📍', color: '#22c55e' },
            { label: 'Load Matching',      path: '/ai/load-matching',      icon: '🔄', color: '#f97316' },
            { label: 'Digital POD',        path: '/ai/digital-pod',        icon: '✅', color: '#8b5cf6' },
            { label: 'Fleet Maintenance',  path: '/ai/fleet-maintenance',  icon: '🔧', color: '#ef4444' },
            { label: 'Driver Mgmt',        path: '/ai/driver-management',  icon: '👤', color: '#0b8fd3' },
            { label: 'Warehouse',          path: '/ai/warehouse',          icon: '🏭', color: '#22c55e' },
            { label: 'Fuel Monitoring',    path: '/ai/fuel-monitoring',    icon: '⛽', color: '#f97316' },
            { label: 'Cust. Portal',       path: '/ai/customer-portal',    icon: '🌐', color: '#8b5cf6' },
            { label: 'AI Chatbot',         path: '/ai/chatbot',            icon: '🤖', color: '#ec4899' },
            { label: 'Auto Docs',          path: '/ai/auto-docs',          icon: '📄', color: '#14b8a6' },
            { label: 'Forecasting',        path: '/ai/demand-forecast',    icon: '📈', color: '#6366f1' },
          ].map(m => (
            <a key={m.label} href={m.path}
              className="bg-white rounded shadow-sm p-3 flex flex-col items-center gap-1.5 hover:shadow-md transition-shadow border border-transparent hover:border-blue-100 text-center">
              <span className="text-2xl">{m.icon}</span>
              <span className="text-[11px] font-semibold text-gray-600 leading-tight">{m.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
