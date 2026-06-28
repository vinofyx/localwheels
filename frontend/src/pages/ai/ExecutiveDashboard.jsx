import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

function MetricCard({ icon, label, value, color, change, onClick, sub }) {
  return (
    <div onClick={onClick} style={{ background:'#111827', border:'1px solid #1e293b', borderRadius:12, padding:'18px 16px', flex:1, minWidth:150, cursor:onClick?'pointer':'default', transition:'border-color 0.2s' }}
      onMouseEnter={e => { if(onClick) e.currentTarget.style.borderColor=color; }}
      onMouseLeave={e => e.currentTarget.style.borderColor='#1e293b'}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <span style={{ fontSize:24 }}>{icon}</span>
        {change !== undefined && (
          <span style={{ fontSize:11, fontWeight:700, color: change >= 0 ? '#10b981' : '#ef4444' }}>
            {change >= 0 ? '▲' : '▼'} {Math.abs(change)}%
          </span>
        )}
      </div>
      <div style={{ fontSize:28, fontWeight:700, color, marginTop:8 }}>{value}</div>
      <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>{label}</div>
      {sub && <div style={{ fontSize:10, color:'#475569', marginTop:2 }}>{sub}</div>}
    </div>
  );
}

export default function ExecutiveDashboard() {
  const navigate = useNavigate();
  const { branch } = useAuth();
  const [dash, setDash] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [nots, setNots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');

  const load = useCallback(async () => {
    try {
      const [dRes, aRes, fRes, nRes] = await Promise.all([
        api.get('/ai/dashboard'),
        api.get('/ai/analytics'),
        api.get('/ai/forecast'),
        api.get('/ai/notifications'),
      ]);
      setDash(dRes.data);
      setAnalytics(aRes.data);
      setForecast(fRes.data);
      setNots(nRes.data?.recent || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [branch]);

  useEffect(() => { load(); }, [load]);

  function exportReport() {
    const lines = [
      'EXECUTIVE DASHBOARD REPORT',
      `Generated: ${new Date().toLocaleString('en-IN')}`,
      '',
      `Revenue Today: ₹${(dash?.revenue_today||0).toLocaleString('en-IN')}`,
      `Deliveries Today: ${dash?.deliveries_today||0}`,
      `Delayed Shipments: ${dash?.delayed||0}`,
      `Pending POD: ${dash?.pending_pod_count||0}`,
      `E-Way Expiring: ${dash?.eway_expiry||0}`,
      `Hold/Lost: ${dash?.hold_lost||0}`,
      '',
      'BRANCH PERFORMANCE:',
      ...(analytics?.branch_performance?.map(b => `  ${b.branch}: ${b.shipments} shipments, ₹${b.revenue?.toLocaleString('en-IN')} revenue`) || []),
    ];
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([lines.join('\n')], { type:'text/plain' }));
    a.download='executive-report.txt'; a.click();
  }

  const totalRevenue30d = analytics?.days?.reduce((s, d) => s + (d.revenue||0), 0) || 0;
  const totalTrips30d   = analytics?.days?.reduce((s, d) => s + (d.trips||0), 0) || 0;
  const avgRevPerTrip   = totalTrips30d > 0 ? Math.round(totalRevenue30d / totalTrips30d) : 0;
  const topBranch       = analytics?.branch_performance?.sort((a,b) => b.revenue - a.revenue)[0];

  const s = {
    page: { minHeight:'100vh', background:'#0a0e1a', color:'#f1f5f9', fontFamily:'Inter,system-ui,sans-serif', padding:20 },
    card: { background:'#111827', border:'1px solid #1e293b', borderRadius:12, padding:16 },
    btn: (bg='#3b82f6') => ({ background:bg, color:'#fff', border:'none', borderRadius:6, padding:'7px 14px', fontSize:12, fontWeight:600, cursor:'pointer' }),
    btnGhost: { background:'transparent', color:'#94a3b8', border:'1px solid #1e293b', borderRadius:6, padding:'7px 14px', fontSize:12, fontWeight:600, cursor:'pointer' },
    lbl: { fontSize:11, color:'#475569', textTransform:'uppercase', letterSpacing:'0.06em', fontWeight:600, marginBottom:8 },
    tag: (c) => ({ background:c+'22', color:c, fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:4 }),
  };

  if (loading) return (
    <div style={{ ...s.page, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:14 }}>
      <div style={{ width:36, height:36, border:'3px solid #1e293b', borderTop:'3px solid #3b82f6', borderRadius:'50%', animation:'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <span style={{ color:'#475569' }}>Loading Executive Dashboard…</span>
    </div>
  );

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20, flexWrap:'wrap', gap:10 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, margin:0 }}>👔 Executive Dashboard</h1>
          <p style={{ color:'#475569', fontSize:12, margin:'4px 0 0' }}>Company-wide performance · {new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}</p>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <select value={dateRange} onChange={e => setDateRange(e.target.value)}
            style={{ background:'#1e293b', border:'1px solid #334155', borderRadius:6, padding:'7px 10px', color:'#f1f5f9', fontSize:12 }}>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <button style={s.btnGhost} onClick={exportReport}>⬇ Export Report</button>
          <button style={s.btnGhost} onClick={() => navigate('/mis/dashboard/mis-dashboard')}>MIS Dashboard</button>
          <button style={s.btn()} onClick={load}>↻ Refresh</button>
        </div>
      </div>

      {/* KPI Row */}
      <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap' }}>
        <MetricCard icon="💰" label="Revenue Today" value={`₹${(dash?.revenue_today||0).toLocaleString('en-IN')}`} color="#10b981" onClick={() => navigate('/reports/lr/booking-ho')} />
        <MetricCard icon="📦" label="Deliveries Today" value={dash?.deliveries_today||0} color="#3b82f6" onClick={() => navigate('/shipments')} />
        <MetricCard icon="📈" label="Revenue (30 Days)" value={`₹${(totalRevenue30d/100000).toFixed(1)}L`} color="#10b981" sub="Last 30 days" onClick={() => navigate('/reports/lr/booking-ho')} />
        <MetricCard icon="🚛" label="Total Trips (30d)" value={totalTrips30d} color="#3b82f6" onClick={() => navigate('/mis/profitability/trip-wise-profit')} />
        <MetricCard icon="💵" label="Avg Rev/Trip" value={`₹${avgRevPerTrip.toLocaleString('en-IN')}`} color="#f59e0b" />
        <MetricCard icon="⏰" label="Delayed" value={dash?.delayed||0} color="#ef4444" sub="In transit >3 days" onClick={() => navigate('/ai/notifications')} />
        <MetricCard icon="📄" label="Pending POD" value={dash?.pending_pod_count||0} color="#8b5cf6" onClick={() => navigate('/entries/pod-upload')} />
        <MetricCard icon="⚠️" label="Risk Alerts" value={dash?.risk_alerts||0} color="#ef4444" onClick={() => navigate('/ai/notifications')} />
      </div>

      {/* Top Row: Revenue + Branch Comparison */}
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16, marginBottom:16 }}>
        <div style={s.card}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <h3 style={{ margin:0, fontSize:14, fontWeight:600 }}>Revenue & Booking Trend (30 Days)</h3>
            <button style={s.btnGhost} onClick={() => navigate('/reports/lr/booking-ho')}>Full Report →</button>
          </div>
          {analytics?.days?.some(d => d.revenue > 0) ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={analytics.days}>
                <defs>
                  <linearGradient id="exRevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" tick={{ fontSize:9, fill:'#475569' }} />
                <YAxis yAxisId="rev" tick={{ fontSize:9, fill:'#475569' }} />
                <YAxis yAxisId="trips" orientation="right" tick={{ fontSize:9, fill:'#475569' }} />
                <Tooltip contentStyle={{ background:'#1e293b', border:'none', color:'#f1f5f9', fontSize:11 }} formatter={(v,name) => name==='Revenue' ? `₹${v.toLocaleString('en-IN')}` : v} />
                <Legend wrapperStyle={{ fontSize:11, color:'#94a3b8' }} />
                <Area yAxisId="rev" type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#exRevGrad)" strokeWidth={2} name="Revenue" />
                <Line yAxisId="trips" type="monotone" dataKey="trips" stroke="#3b82f6" strokeWidth={2} dot={false} name="Trips" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign:'center', color:'#334155', padding:'70px 0', fontSize:12 }}>
              <div style={{ fontSize:36, marginBottom:8 }}>📊</div>
              No booking data yet — revenue trends appear as you create LRs
            </div>
          )}
        </div>

        <div style={s.card}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <h3 style={{ margin:0, fontSize:14, fontWeight:600 }}>Shipment Status</h3>
            <button style={s.btnGhost} onClick={() => navigate('/shipments')}>View All →</button>
          </div>
          {dash?.shipment_status?.some(x => x.value > 0) ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={dash.shipment_status} dataKey="value" cx="50%" cy="50%" outerRadius={60} label={({ name, value }) => value > 0 ? `${value}` : ''} labelLine={false} fontSize={11}>
                    {dash.shipment_status.map((e,i) => <Cell key={i} fill={e.fill} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background:'#1e293b', border:'none', color:'#f1f5f9', fontSize:11 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:8 }}>
                {dash.shipment_status.map(d => (
                  <span key={d.name} style={{ fontSize:11, color:d.fill }}>● {d.name}: {d.value}</span>
                ))}
              </div>
            </>
          ) : (
            <div style={{ textAlign:'center', color:'#334155', padding:'50px 0', fontSize:12 }}>No shipment data</div>
          )}
        </div>
      </div>

      {/* Branch Performance Table */}
      <div style={{ ...s.card, marginBottom:16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <h3 style={{ margin:0, fontSize:14, fontWeight:600 }}>Branch Performance Overview</h3>
          <button style={s.btnGhost} onClick={() => navigate('/mis/branch-performance')}>Detailed Report →</button>
        </div>
        {analytics?.branch_performance?.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={analytics.branch_performance.slice(0,10)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="branch" tick={{ fontSize:9, fill:'#475569' }} />
                <YAxis tick={{ fontSize:9, fill:'#475569' }} />
                <Tooltip contentStyle={{ background:'#1e293b', border:'none', color:'#f1f5f9', fontSize:11 }} />
                <Legend wrapperStyle={{ fontSize:11, color:'#94a3b8' }} />
                <Bar dataKey="shipments" fill="#3b82f6" radius={[3,3,0,0]} name="Shipments" />
                <Bar dataKey="delivered" fill="#10b981" radius={[3,3,0,0]} name="Delivered" />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ overflowX:'auto', marginTop:12 }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                <thead>
                  <tr style={{ borderBottom:'1px solid #1e293b' }}>
                    {['Branch','Shipments','Delivered','Revenue','On-Time %','Status'].map(h => (
                      <th key={h} style={{ textAlign:'left', padding:'8px 10px', color:'#475569', fontWeight:600, fontSize:11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {analytics.branch_performance.map((b, i) => (
                    <tr key={i} style={{ borderBottom:'1px solid #0f172a' }}>
                      <td style={{ padding:'8px 10px', color:'#f1f5f9', fontWeight:600 }}>{b.branch}</td>
                      <td style={{ padding:'8px 10px', color:'#94a3b8' }}>{b.shipments}</td>
                      <td style={{ padding:'8px 10px', color:'#10b981' }}>{b.delivered}</td>
                      <td style={{ padding:'8px 10px', color:'#10b981', fontWeight:600 }}>₹{(b.revenue||0).toLocaleString('en-IN')}</td>
                      <td style={{ padding:'8px 10px', color: b.on_time_pct >= 80 ? '#10b981' : b.on_time_pct >= 60 ? '#f59e0b' : '#ef4444' }}>{b.on_time_pct}%</td>
                      <td style={{ padding:'8px 10px' }}>
                        <span style={{ background: b.on_time_pct >= 80 ? '#10b98122' : '#f59e0b22', color: b.on_time_pct >= 80 ? '#10b981' : '#f59e0b', fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:4 }}>
                          {b.on_time_pct >= 80 ? 'Good' : b.on_time_pct >= 60 ? 'Average' : 'Needs Attention'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div style={{ textAlign:'center', color:'#334155', padding:'40px 0', fontSize:12 }}>
            <div style={{ fontSize:36, marginBottom:8 }}>🏢</div>No branch data available yet
          </div>
        )}
      </div>

      {/* Monthly Forecast + Action Items */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
        <div style={s.card}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <h3 style={{ margin:0, fontSize:14, fontWeight:600 }}>Monthly Revenue Trend</h3>
            <button style={s.btnGhost} onClick={() => navigate('/ai/demand-forecast')}>Forecast →</button>
          </div>
          {forecast?.monthly_trend?.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={forecast.monthly_trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" tick={{ fontSize:9, fill:'#475569' }} />
                <YAxis tick={{ fontSize:9, fill:'#475569' }} />
                <Tooltip contentStyle={{ background:'#1e293b', border:'none', color:'#f1f5f9', fontSize:11 }} formatter={v=>`₹${v.toLocaleString('en-IN')}`} />
                <Bar dataKey="revenue" fill="#10b981" radius={[4,4,0,0]} name="Revenue" />
                <Bar dataKey="actual" fill="#3b82f6" radius={[4,4,0,0]} name="Bookings" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign:'center', color:'#334155', padding:'50px 0', fontSize:12 }}>No monthly data yet</div>
          )}
        </div>

        <div style={s.card}>
          <h3 style={{ margin:'0 0 14px', fontSize:14, fontWeight:600 }}>Action Items</h3>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {[
              { priority: dash?.pending_pod_count > 0 ? 'urgent' : 'ok', text: `${dash?.pending_pod_count||0} PODs pending submission`, icon:'📦', path:'/entries/pod-upload' },
              { priority: dash?.eway_expiry > 0 ? 'urgent' : 'ok', text: `${dash?.eway_expiry||0} E-Way Bills expiring`, icon:'⚡', path:'/entries/eway-extend-import' },
              { priority: dash?.hold_lost > 0 ? 'urgent' : 'ok', text: `${dash?.hold_lost||0} shipments hold/lost`, icon:'🔴', path:'/entries/hold-lost-damage' },
              { priority: (dash?.overdue_payments||0) > 0 ? 'high' : 'ok', text: `${dash?.overdue_payments||0} overdue payments`, icon:'💰', path:'/mis/party-outstanding/overdue-bills' },
              { priority: 'info', text: 'Review branch performance reports', icon:'📊', path:'/mis/branch-performance' },
              { priority: 'info', text: 'Check LR transit summary', icon:'🚛', path:'/mis/lr-transit-summary' },
            ].map((item, i) => {
              const color = item.priority === 'urgent' ? '#ef4444' : item.priority === 'high' ? '#f59e0b' : item.priority === 'ok' ? '#10b981' : '#3b82f6';
              return (
                <button key={i} onClick={() => navigate(item.path)}
                  style={{ display:'flex', alignItems:'center', gap:10, background:'#1e293b', border:'none', borderRadius:8, padding:'10px 12px', color:'#f1f5f9', cursor:'pointer', textAlign:'left', transition:'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background='#273548'}
                  onMouseLeave={e => e.currentTarget.style.background='#1e293b'}>
                  <span style={{ fontSize:16 }}>{item.icon}</span>
                  <span style={{ fontSize:12, flex:1 }}>{item.text}</span>
                  <span style={{ width:8, height:8, borderRadius:'50%', background:color, flexShrink:0 }} />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10 }}>
        {[
          { icon:'📋', label:'Booking Register', path:'/reports/lr/booking-ho' },
          { icon:'💰', label:'Bill Collection', path:'/account-reports/mr/bill-collection' },
          { icon:'📊', label:'MIS Dashboard', path:'/mis/dashboard/mis-dashboard' },
          { icon:'🏢', label:'Branch Sale Monthly', path:'/mis/branch-sale-monthly' },
          { icon:'📈', label:'Profitability', path:'/mis/profitability/lr-profitability' },
        ].map(a => (
          <button key={a.label} onClick={() => navigate(a.path)}
            style={{ ...s.card, border:'1px solid #1e293b', cursor:'pointer', textAlign:'center', padding:'12px 10px', transition:'border-color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor='#3b82f6'}
            onMouseLeave={e => e.currentTarget.style.borderColor='#1e293b'}>
            <div style={{ fontSize:22, marginBottom:6 }}>{a.icon}</div>
            <div style={{ fontSize:11, fontWeight:600, color:'#f1f5f9' }}>{a.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
