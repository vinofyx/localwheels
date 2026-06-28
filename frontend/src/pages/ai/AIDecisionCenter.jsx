import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

function buildDecisions(dash, nots, analytics, forecast) {
  const decisions = [];
  // POD urgency
  const podCount = dash?.pending_pod_count || 0;
  if (podCount > 0) {
    decisions.push({
      id: 1, priority: 'Critical', category: 'Operations', icon: '📦',
      title: `${podCount} PODs Awaiting Submission`,
      insight: 'Delayed POD submission blocks billing and customer payment. Each day delayed costs revenue.',
      recommendation: 'Submit pending PODs immediately to unlock billing cycle.',
      impact: 'High', effort: 'Low', confidence: 92,
      actions: [{ label: 'Upload PODs Now', path: '/entries/pod-upload', style: 'primary' }, { label: 'View Non-Submit', path: '/reports/pod/non-submit', style: 'ghost' }],
    });
  }
  // E-way expiry
  const ewayCount = dash?.eway_expiry || 0;
  if (ewayCount > 0) {
    decisions.push({
      id: 2, priority: 'High', category: 'Compliance', icon: '⚡',
      title: `${ewayCount} E-Way Bills Expiring Soon`,
      insight: 'E-Way Bill expiry causes shipment detention and GST penalties.',
      recommendation: 'Extend or cancel expiring E-Way Bills before they lapse.',
      impact: 'High', effort: 'Low', confidence: 95,
      actions: [{ label: 'Extend E-Way Bills', path: '/entries/eway-extend-import', style: 'primary' }, { label: 'E-Way Report', path: '/entries/eway-report', style: 'ghost' }],
    });
  }
  // Hold/Lost
  const holdLost = dash?.hold_lost || 0;
  if (holdLost > 0) {
    decisions.push({
      id: 3, priority: 'Critical', category: 'Risk', icon: '🔴',
      title: `${holdLost} Shipments on Hold or Lost`,
      insight: 'Shipments in Hold/Lost status represent pending liabilities and customer escalations.',
      recommendation: 'Review each hold/lost shipment and initiate resolution process.',
      impact: 'High', effort: 'Medium', confidence: 88,
      actions: [{ label: 'View Hold/Lost', path: '/entries/hold-lost-damage', style: 'primary' }, { label: 'CN Settlement', path: '/entries/settlement', style: 'ghost' }],
    });
  }
  // Overdue payments
  const overdue = dash?.overdue_payments || 0;
  if (overdue > 0) {
    decisions.push({
      id: 4, priority: 'High', category: 'Finance', icon: '💰',
      title: `${overdue} Overdue Payment${overdue > 1 ? 's' : ''}`,
      insight: 'Outstanding payments affect cash flow and working capital.',
      recommendation: 'Follow up with customers on overdue bills.',
      impact: 'Medium', effort: 'Medium', confidence: 85,
      actions: [{ label: 'View Outstanding', path: '/mis/party-outstanding/overdue-bills', style: 'primary' }, { label: 'Bill Collection', path: '/account-reports/mr/bill-collection', style: 'ghost' }],
    });
  }
  // Delayed shipments
  const delayed = nots.filter(n => n.type === 'Late Delivery').length;
  if (delayed > 0) {
    decisions.push({
      id: 5, priority: 'Medium', category: 'Logistics', icon: '⏰',
      title: 'Shipments Delayed in Transit',
      insight: 'In-transit shipments older than 3 days need status verification.',
      recommendation: 'Contact transporter and update LR status for delayed shipments.',
      impact: 'Medium', effort: 'Low', confidence: 78,
      actions: [{ label: 'LR Tracking', path: '/tracking/lr-tracking', style: 'primary' }, { label: 'Tracking MIS', path: '/mis/tracking-mis', style: 'ghost' }],
    });
  }
  // GPS recommendation (always show if no GPS)
  decisions.push({
    id: 6, priority: 'Low', category: 'Technology', icon: '📡',
    title: 'Enable GPS Tracking for AI Insights',
    insight: 'GPS integration unlocks real-time fleet visibility, route optimization, fuel monitoring, and driver analytics.',
    recommendation: 'Connect GPS hardware to vehicles to activate 12+ AI features.',
    impact: 'Very High', effort: 'High', confidence: 99,
    actions: [{ label: 'GPS Configuration', path: '/ai/gps-tracking', style: 'primary' }, { label: 'Fleet Maintenance', path: '/ai/fleet-maintenance', style: 'ghost' }],
  });
  // Load matching
  if ((analytics?.days?.length || 0) > 5) {
    decisions.push({
      id: 7, priority: 'Low', category: 'Optimization', icon: '🔄',
      title: 'Optimize Empty Return Trips',
      insight: 'Every empty return trip wastes fuel and driver time. AI can match loads to reduce empty km.',
      recommendation: 'Use Load Matching to fill empty return trips with cargo.',
      impact: 'Medium', effort: 'Low', confidence: 72,
      actions: [{ label: 'Load Matching', path: '/ai/load-matching', style: 'primary' }],
    });
  }
  return decisions;
}

const PRIORITY_COLOR = { Critical:'#ef4444', High:'#f59e0b', Medium:'#3b82f6', Low:'#10b981' };

function DecisionCard({ d, navigate }) {
  const pc = PRIORITY_COLOR[d.priority] || '#64748b';
  const st = {
    btn: (style) => style === 'primary'
      ? { background:pc, color:'#fff', border:'none', borderRadius:6, padding:'6px 14px', fontSize:12, fontWeight:600, cursor:'pointer' }
      : { background:'transparent', color:'#94a3b8', border:'1px solid #334155', borderRadius:6, padding:'6px 14px', fontSize:12, fontWeight:600, cursor:'pointer' },
  };
  return (
    <div style={{ background:'#111827', border:`1px solid ${pc}44`, borderLeft:`3px solid ${pc}`, borderRadius:10, padding:16 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <span style={{ fontSize:20 }}>{d.icon}</span>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:'#f1f5f9' }}>{d.title}</div>
            <span style={{ background:pc+'22', color:pc, fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:4 }}>{d.priority}</span>
            <span style={{ background:'#1e293b', color:'#64748b', fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:4, marginLeft:4 }}>{d.category}</span>
          </div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:18, fontWeight:700, color:'#10b981' }}>{d.confidence}%</div>
          <div style={{ fontSize:9, color:'#475569' }}>Confidence</div>
        </div>
      </div>
      <p style={{ fontSize:12, color:'#94a3b8', margin:'0 0 6px', lineHeight:1.5 }}>{d.insight}</p>
      <div style={{ background:'#0a0e1a', borderRadius:6, padding:'8px 10px', marginBottom:10 }}>
        <span style={{ fontSize:10, color:'#64748b', fontWeight:700 }}>RECOMMENDATION: </span>
        <span style={{ fontSize:12, color:'#e2e8f0' }}>{d.recommendation}</span>
      </div>
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:8 }}>
        <span style={{ fontSize:10, color:'#94a3b8' }}>Impact: <strong style={{ color:'#f1f5f9' }}>{d.impact}</strong></span>
        <span style={{ fontSize:10, color:'#475569' }}>·</span>
        <span style={{ fontSize:10, color:'#94a3b8' }}>Effort: <strong style={{ color:'#f1f5f9' }}>{d.effort}</strong></span>
      </div>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {d.actions.map((a, i) => (
          <button key={i} style={st.btn(a.style)} onClick={() => navigate(a.path)}>{a.label}</button>
        ))}
      </div>
    </div>
  );
}

export default function AIDecisionCenter() {
  const navigate = useNavigate();
  const { branch } = useAuth();
  const [dash, setDash] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [nots, setNots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterPriority, setFilterPriority] = useState('all');

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

  const decisions = dash ? buildDecisions(dash, nots, analytics, forecast) : [];
  const filtered  = filterPriority === 'all' ? decisions : decisions.filter(d => d.priority === filterPriority);
  const criticalCount = decisions.filter(d => d.priority === 'Critical').length;
  const highCount     = decisions.filter(d => d.priority === 'High').length;

  const s = {
    page: { minHeight:'100vh', background:'#0a0e1a', color:'#f1f5f9', fontFamily:'Inter,system-ui,sans-serif', padding:20 },
    card: { background:'#111827', border:'1px solid #1e293b', borderRadius:12, padding:16 },
    btn: (bg='#3b82f6') => ({ background:bg, color:'#fff', border:'none', borderRadius:6, padding:'7px 14px', fontSize:12, fontWeight:600, cursor:'pointer' }),
    btnGhost: { background:'transparent', color:'#94a3b8', border:'1px solid #1e293b', borderRadius:6, padding:'7px 14px', fontSize:12, fontWeight:600, cursor:'pointer' },
    pill: (active, color='#3b82f6') => ({ padding:'5px 14px', borderRadius:20, fontSize:12, fontWeight:600, cursor:'pointer', border:`1px solid ${active ? color : '#1e293b'}`, background: active ? color+'22' : 'transparent', color: active ? color : '#64748b' }),
    lbl: { fontSize:11, color:'#475569', textTransform:'uppercase', letterSpacing:'0.06em', fontWeight:600, marginBottom:8 },
  };

  if (loading) return (
    <div style={{ ...s.page, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:14 }}>
      <div style={{ width:36, height:36, border:'3px solid #1e293b', borderTop:'3px solid #3b82f6', borderRadius:'50%', animation:'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <span style={{ color:'#475569' }}>Loading AI Decision Engine…</span>
    </div>
  );

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20, flexWrap:'wrap', gap:10 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, margin:0 }}>🧠 AI Decision Center</h1>
          <p style={{ color:'#475569', fontSize:12, margin:'4px 0 0' }}>Data-driven recommendations from your live operations · {decisions.length} active insights</p>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <button style={s.btnGhost} onClick={() => navigate('/ai/notifications')}>🔔 All Alerts</button>
          <button style={s.btnGhost} onClick={() => navigate('/ai/analytics')}>📊 Analytics</button>
          <button style={s.btn()} onClick={load}>↻ Refresh</button>
        </div>
      </div>

      {/* Summary Bar */}
      <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap' }}>
        {[
          { label:'Critical', value:criticalCount, color:'#ef4444', icon:'🚨' },
          { label:'High Priority', value:highCount, color:'#f59e0b', icon:'⚠️' },
          { label:'All Decisions', value:decisions.length, color:'#3b82f6', icon:'🧠' },
          { label:'Confidence Avg', value:`${decisions.length ? Math.round(decisions.reduce((s,d)=>s+d.confidence,0)/decisions.length) : 0}%`, color:'#10b981', icon:'🎯' },
        ].map(m => (
          <div key={m.label} style={{ background:'#111827', border:`1px solid ${m.color}44`, borderRadius:10, padding:'14px 20px', flex:1, minWidth:130 }}>
            <div style={{ fontSize:20, marginBottom:4 }}>{m.icon}</div>
            <div style={{ fontSize:26, fontWeight:700, color:m.color }}>{m.value}</div>
            <div style={{ fontSize:11, color:'#64748b' }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Filter Pills */}
      <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
        <span style={{ fontSize:12, color:'#475569', alignSelf:'center' }}>Filter:</span>
        {['all','Critical','High','Medium','Low'].map(p => (
          <button key={p} style={s.pill(filterPriority === p, PRIORITY_COLOR[p] || '#3b82f6')} onClick={() => setFilterPriority(p)}>
            {p === 'all' ? 'All' : p} {p !== 'all' && `(${decisions.filter(d=>d.priority===p).length})`}
          </button>
        ))}
      </div>

      {/* Decision Cards Grid */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
        {filtered.map(d => <DecisionCard key={d.id} d={d} navigate={navigate} />)}
      </div>

      {/* Charts Row */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
        {/* Revenue Forecast */}
        <div style={s.card}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <h3 style={{ margin:0, fontSize:13, fontWeight:600 }}>Revenue Forecast (Monthly)</h3>
            <button style={s.btnGhost} onClick={() => navigate('/ai/demand-forecast')}>View Forecast →</button>
          </div>
          {forecast?.monthly_trend?.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={forecast.monthly_trend}>
                <defs>
                  <linearGradient id="decGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" tick={{ fontSize:10, fill:'#475569' }} />
                <YAxis tick={{ fontSize:10, fill:'#475569' }} />
                <Tooltip contentStyle={{ background:'#1e293b', border:'none', color:'#f1f5f9', fontSize:11 }} formatter={v => `₹${v.toLocaleString('en-IN')}`} />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#decGrad)" strokeWidth={2} name="Revenue" />
                <Area type="monotone" dataKey="actual" stroke="#3b82f6" fill="none" strokeWidth={1.5} strokeDasharray="4 4" name="Bookings" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign:'center', color:'#334155', padding:'60px 0', fontSize:12 }}>
              <div style={{ fontSize:32, marginBottom:8 }}>📈</div>
              No historical data yet — forecast activates with booking history
            </div>
          )}
          {forecast?.revenue_forecast_rs > 0 && (
            <div style={{ display:'flex', gap:16, marginTop:10 }}>
              <div style={{ background:'#1e293b', borderRadius:8, padding:'8px 12px', flex:1 }}>
                <div style={{ fontSize:10, color:'#475569' }}>Avg Monthly Revenue</div>
                <div style={{ fontSize:16, fontWeight:700, color:'#10b981' }}>₹{(forecast.revenue_forecast_rs/100000).toFixed(1)}L</div>
              </div>
              <div style={{ background:'#1e293b', borderRadius:8, padding:'8px 12px', flex:1 }}>
                <div style={{ fontSize:10, color:'#475569' }}>Months of Data</div>
                <div style={{ fontSize:16, fontWeight:700, color:'#3b82f6' }}>{forecast.monthly_trend?.length || 0}</div>
              </div>
            </div>
          )}
        </div>

        {/* Branch Performance */}
        <div style={s.card}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <h3 style={{ margin:0, fontSize:13, fontWeight:600 }}>Branch Shipment Performance</h3>
            <button style={s.btnGhost} onClick={() => navigate('/mis/branch-performance')}>Details →</button>
          </div>
          {analytics?.branch_performance?.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={analytics.branch_performance.slice(0,8)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" tick={{ fontSize:9, fill:'#475569' }} />
                <YAxis type="category" dataKey="branch" tick={{ fontSize:9, fill:'#475569' }} width={80} />
                <Tooltip contentStyle={{ background:'#1e293b', border:'none', color:'#f1f5f9', fontSize:11 }} />
                <Bar dataKey="shipments" fill="#3b82f6" radius={[0,3,3,0]} name="Shipments" />
                <Bar dataKey="delivered" fill="#10b981" radius={[0,3,3,0]} name="Delivered" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign:'center', color:'#334155', padding:'60px 0', fontSize:12 }}>
              <div style={{ fontSize:32, marginBottom:8 }}>🏢</div>No branch data yet
            </div>
          )}
        </div>
      </div>

      {/* AI Insights Panel */}
      <div style={s.card}>
        <h3 style={{ margin:'0 0 14px', fontSize:14, fontWeight:600 }}>🤖 AI Capability Roadmap</h3>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
          {[
            { icon:'🗺️', title:'Route Optimization', desc:'Reduce fuel costs 15-20% with AI-planned routes', active:false, path:'/ai/route-optimization' },
            { icon:'📡', title:'GPS Fleet Tracking', desc:'Real-time vehicle positions and geofencing', active:false, path:'/ai/gps-tracking' },
            { icon:'⛽', title:'Fuel Intelligence', desc:'Detect theft, monitor mileage, optimize fill-ups', active:false, path:'/ai/fuel-monitoring' },
            { icon:'🔧', title:'Predictive Maintenance', desc:'Predict breakdowns before they happen', active:false, path:'/ai/fleet-maintenance' },
            { icon:'🔄', title:'Load Matching', desc:'Fill empty trips with matching return cargo', active:true, path:'/ai/load-matching' },
            { icon:'📦', title:'Digital POD', desc:'Paperless delivery confirmation and tracking', active:true, path:'/ai/digital-pod' },
          ].map(f => (
            <button key={f.title} onClick={() => navigate(f.path)}
              style={{ background: f.active ? '#0f2a1a' : '#1e293b', border:`1px solid ${f.active ? '#10b98144' : '#1e293b'}`, borderRadius:8, padding:'12px 14px', textAlign:'left', cursor:'pointer', transition:'border-color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor='#3b82f6'}
              onMouseLeave={e => e.currentTarget.style.borderColor=f.active?'#10b98144':'#1e293b'}>
              <div style={{ fontSize:20, marginBottom:6 }}>{f.icon}</div>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                <span style={{ fontSize:12, fontWeight:700, color:'#f1f5f9' }}>{f.title}</span>
                {f.active && <span style={{ background:'#10b98122', color:'#10b981', fontSize:9, fontWeight:700, padding:'1px 6px', borderRadius:3 }}>ACTIVE</span>}
              </div>
              <div style={{ fontSize:11, color:'#475569' }}>{f.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
