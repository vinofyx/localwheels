import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

function KpiCard({ icon, label, value, color, sub, onClick, badge }) {
  return (
    <div onClick={onClick} style={{ background:'#111827', border:'1px solid #1e293b', borderRadius:12, padding:'16px', flex:1, minWidth:150, cursor:onClick?'pointer':'default', transition:'border-color 0.2s', position:'relative' }}
      onMouseEnter={e => { if(onClick) e.currentTarget.style.borderColor=color; }}
      onMouseLeave={e => e.currentTarget.style.borderColor='#1e293b'}>
      {badge && <div style={{ position:'absolute', top:10, right:10, background:'#ef444422', color:'#ef4444', fontSize:9, fontWeight:700, padding:'2px 6px', borderRadius:3 }}>{badge}</div>}
      <div style={{ fontSize:24, marginBottom:8 }}>{icon}</div>
      <div style={{ fontSize:26, fontWeight:700, color }}>{value}</div>
      <div style={{ fontSize:11, color:'#64748b', marginTop:2 }}>{label}</div>
      {sub && <div style={{ fontSize:10, color:'#475569', marginTop:2 }}>{sub}</div>}
    </div>
  );
}

export default function FinanceAnalytics() {
  const navigate = useNavigate();
  const { branch } = useAuth();
  const [dash, setDash] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('30d');

  const load = useCallback(async () => {
    try {
      const [dRes, aRes, fRes] = await Promise.all([
        api.get('/ai/dashboard'),
        api.get('/ai/analytics'),
        api.get('/ai/forecast'),
      ]);
      setDash(dRes.data);
      setAnalytics(aRes.data);
      setForecast(fRes.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [branch]);

  useEffect(() => { load(); }, [load]);

  const totalRevenue = analytics?.days?.reduce((s, d) => s + (d.revenue||0), 0) || 0;
  const totalTrips   = analytics?.days?.reduce((s, d) => s + (d.trips||0), 0) || 0;
  const avgDaily     = analytics?.days?.length > 0 ? Math.round(totalRevenue / analytics.days.length) : 0;
  const avgPerTrip   = totalTrips > 0 ? Math.round(totalRevenue / totalTrips) : 0;
  const maxDay       = analytics?.days?.reduce((max, d) => d.revenue > max.revenue ? d : max, { revenue:0 }) || {};
  const branchRevTotal = analytics?.branch_performance?.reduce((s, b) => s + (b.revenue||0), 0) || 0;

  function exportCSV() {
    const lines = [
      ['Date','Revenue','Trips','On-Time %'],
      ...(analytics?.days?.map(d => [d.date, d.revenue, d.trips, d.on_time_pct]) || []),
    ];
    const csv = lines.map(r => r.map(v=>`"${v??''}"`).join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download='finance-analytics.csv'; a.click();
  }

  const s = {
    page: { minHeight:'100vh', background:'#0a0e1a', color:'#f1f5f9', fontFamily:'Inter,system-ui,sans-serif', padding:20 },
    card: { background:'#111827', border:'1px solid #1e293b', borderRadius:12, padding:16 },
    btn: (bg='#3b82f6') => ({ background:bg, color:'#fff', border:'none', borderRadius:6, padding:'7px 14px', fontSize:12, fontWeight:600, cursor:'pointer' }),
    btnGhost: { background:'transparent', color:'#94a3b8', border:'1px solid #1e293b', borderRadius:6, padding:'7px 14px', fontSize:12, fontWeight:600, cursor:'pointer' },
    tab: (active) => ({ padding:'8px 16px', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer', border:'none', background: active ? '#1d4ed8' : 'transparent', color: active ? '#fff' : '#64748b' }),
    lbl: { fontSize:11, color:'#475569', textTransform:'uppercase', letterSpacing:'0.06em', fontWeight:600, marginBottom:10 },
    tag: (c) => ({ background:c+'22', color:c, fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:4 }),
  };

  if (loading) return (
    <div style={{ ...s.page, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:14 }}>
      <div style={{ width:36, height:36, border:'3px solid #1e293b', borderTop:'3px solid #10b981', borderRadius:'50%', animation:'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <span style={{ color:'#475569' }}>Loading Finance Analytics…</span>
    </div>
  );

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20, flexWrap:'wrap', gap:10 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, margin:0 }}>💹 Finance Analytics</h1>
          <p style={{ color:'#475569', fontSize:12, margin:'4px 0 0' }}>Revenue, collections, outstanding & cost analysis</p>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <select value={dateRange} onChange={e => setDateRange(e.target.value)}
            style={{ background:'#1e293b', border:'1px solid #334155', borderRadius:6, padding:'7px 10px', color:'#f1f5f9', fontSize:12 }}>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <button style={s.btnGhost} onClick={() => navigate('/account-reports/daybook')}>📅 Daybook</button>
          <button style={s.btnGhost} onClick={() => navigate('/mis/party-outstanding/bill-os')}>💰 Outstanding</button>
          <button style={s.btn()} onClick={load}>↻ Refresh</button>
          <button style={s.btn('#10b981')} onClick={exportCSV}>⬇ Export</button>
        </div>
      </div>

      {/* KPI Strip */}
      <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap' }}>
        <KpiCard icon="💰" label="Revenue Today" value={`₹${(dash?.revenue_today||0).toLocaleString('en-IN')}`} color="#10b981" onClick={() => navigate('/reports/lr/booking-ho')} />
        <KpiCard icon="📈" label="Revenue (30d)" value={`₹${(totalRevenue/100000).toFixed(1)}L`} color="#10b981" onClick={() => navigate('/reports/lr/booking-ho')} />
        <KpiCard icon="💵" label="Avg/Day" value={`₹${(avgDaily/1000).toFixed(1)}K`} color="#3b82f6" />
        <KpiCard icon="🚛" label="Avg/Trip" value={`₹${(avgPerTrip/1000).toFixed(1)}K`} color="#3b82f6" />
        <KpiCard icon="🏆" label="Best Day Rev" value={`₹${(maxDay.revenue/1000||0).toFixed(1)}K`} color="#f59e0b" sub={maxDay.date} />
        <KpiCard icon="⚠️" label="Overdue Payments" value={dash?.overdue_payments||0} color="#ef4444" badge={dash?.overdue_payments > 0 ? 'ACTION' : undefined} onClick={() => navigate('/mis/party-outstanding/overdue-bills')} />
        <KpiCard icon="📦" label="Pending POD" value={dash?.pending_pod_count||0} color="#8b5cf6" sub="Unbilled deliveries" onClick={() => navigate('/entries/pod-upload')} />
        <KpiCard icon="🔴" label="Hold/Lost Value" value={dash?.hold_lost||0} color="#ef4444" onClick={() => navigate('/entries/hold-lost-damage')} />
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:16, background:'#111827', borderRadius:8, padding:4, border:'1px solid #1e293b', width:'fit-content' }}>
        {[['overview','Overview'],['revenue','Revenue'],['outstanding','Outstanding'],['reports','Reports']].map(([tab, label]) => (
          <button key={tab} style={s.tab(activeTab === tab)} onClick={() => setActiveTab(tab)}>{label}</button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16, marginBottom:16 }}>
            <div style={s.card}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <h3 style={{ margin:0, fontSize:14, fontWeight:600 }}>Revenue Trend (30 Days)</h3>
                <button style={s.btnGhost} onClick={() => navigate('/reports/lr/booking-ho')}>Full Report →</button>
              </div>
              {analytics?.days?.some(d => d.revenue > 0) ? (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={analytics.days}>
                    <defs>
                      <linearGradient id="finGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="date" tick={{ fontSize:9, fill:'#475569' }} />
                    <YAxis tick={{ fontSize:9, fill:'#475569' }} />
                    <Tooltip contentStyle={{ background:'#1e293b', border:'none', color:'#f1f5f9', fontSize:11 }} formatter={v=>`₹${v.toLocaleString('en-IN')}`} />
                    <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#finGrad)" strokeWidth={2} name="Revenue" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ textAlign:'center', color:'#334155', padding:'60px 0', fontSize:12 }}>
                  <div style={{ fontSize:36, marginBottom:8 }}>💰</div>
                  No revenue data yet. Start booking LRs to see the trend.
                </div>
              )}
            </div>

            <div style={s.card}>
              <h3 style={{ margin:'0 0 14px', fontSize:14, fontWeight:600 }}>Finance Quick Actions</h3>
              <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                {[
                  { icon:'💳', label:'Money Receipt (MR)', path:'/account-entries/money-receipt-mr' },
                  { icon:'📋', label:'Bill Collection', path:'/account-reports/mr/bill-collection' },
                  { icon:'⚠️', label:'Overdue Bills', path:'/mis/party-outstanding/overdue-bills' },
                  { icon:'📊', label:'Bill Outstanding', path:'/mis/party-outstanding/bill-os' },
                  { icon:'🏦', label:'Bank Reconciliation', path:'/account-entries/bank-reconciliation' },
                  { icon:'📈', label:'Profit & Loss', path:'/account-reports/final-books/profit-and-loss' },
                  { icon:'⚖️', label:'Balance Sheet', path:'/account-reports/final-books/balance-sheet' },
                  { icon:'📄', label:'GST Reports', path:'/account-reports/taxation/gstr-1' },
                ].map(a => (
                  <button key={a.label} onClick={() => navigate(a.path)}
                    style={{ display:'flex', alignItems:'center', gap:10, background:'#1e293b', border:'none', borderRadius:7, padding:'8px 12px', color:'#f1f5f9', cursor:'pointer', transition:'background 0.15s', textAlign:'left' }}
                    onMouseEnter={e => e.currentTarget.style.background='#273548'}
                    onMouseLeave={e => e.currentTarget.style.background='#1e293b'}>
                    <span style={{ fontSize:14 }}>{a.icon}</span>
                    <span style={{ fontSize:12, fontWeight:600 }}>{a.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Branch Revenue */}
          {analytics?.branch_performance?.length > 0 && (
            <div style={s.card}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                <h3 style={{ margin:0, fontSize:14, fontWeight:600 }}>Branch Revenue Breakdown</h3>
                <button style={s.btnGhost} onClick={() => navigate('/mis/branch-sale-monthly')}>Monthly →</button>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={analytics.branch_performance.slice(0,8)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis type="number" tick={{ fontSize:9, fill:'#475569' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
                    <YAxis type="category" dataKey="branch" tick={{ fontSize:9, fill:'#475569' }} width={80} />
                    <Tooltip contentStyle={{ background:'#1e293b', border:'none', color:'#f1f5f9', fontSize:11 }} formatter={v=>`₹${v.toLocaleString('en-IN')}`} />
                    <Bar dataKey="revenue" fill="#10b981" radius={[0,3,3,0]} name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ overflowY:'auto', maxHeight:200 }}>
                  {analytics.branch_performance.sort((a,b)=>b.revenue-a.revenue).map((b, i) => {
                    const pct = branchRevTotal > 0 ? Math.round((b.revenue/branchRevTotal)*100) : 0;
                    return (
                      <div key={i} style={{ marginBottom:10 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                          <span style={{ fontSize:12, color:'#94a3b8' }}>{b.branch}</span>
                          <span style={{ fontSize:12, fontWeight:700, color:'#10b981' }}>₹{(b.revenue||0).toLocaleString('en-IN')}</span>
                        </div>
                        <div style={{ height:4, background:'#1e293b', borderRadius:2 }}>
                          <div style={{ height:'100%', width:`${pct}%`, background:'#10b981', borderRadius:2 }} />
                        </div>
                        <div style={{ fontSize:10, color:'#334155', marginTop:2 }}>{pct}% of total</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'revenue' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <div style={s.card}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <h3 style={{ margin:0, fontSize:14, fontWeight:600 }}>Monthly Revenue (12 Months)</h3>
              <button style={s.btnGhost} onClick={() => navigate('/ai/demand-forecast')}>Forecast →</button>
            </div>
            {forecast?.monthly_trend?.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={forecast.monthly_trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="month" tick={{ fontSize:9, fill:'#475569' }} />
                  <YAxis tick={{ fontSize:9, fill:'#475569' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
                  <Tooltip contentStyle={{ background:'#1e293b', border:'none', color:'#f1f5f9', fontSize:11 }} formatter={v=>`₹${v.toLocaleString('en-IN')}`} />
                  <Bar dataKey="revenue" fill="#10b981" radius={[4,4,0,0]} name="Revenue" />
                  <Bar dataKey="actual" fill="#3b82f6" radius={[4,4,0,0]} name="Bookings" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign:'center', color:'#334155', padding:'60px 0', fontSize:12 }}>No monthly data</div>
            )}
          </div>

          <div style={s.card}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <h3 style={{ margin:0, fontSize:14, fontWeight:600 }}>Booking Volume (30d)</h3>
            </div>
            {analytics?.days?.some(d => d.trips > 0) ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={analytics.days}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" tick={{ fontSize:8, fill:'#475569' }} />
                  <YAxis tick={{ fontSize:8, fill:'#475569' }} />
                  <Tooltip contentStyle={{ background:'#1e293b', border:'none', color:'#f1f5f9', fontSize:11 }} />
                  <Line type="monotone" dataKey="trips" stroke="#3b82f6" strokeWidth={2} dot={false} name="Bookings" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign:'center', color:'#334155', padding:'60px 0', fontSize:12 }}>No booking data</div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'outstanding' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <div style={s.card}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <h3 style={{ margin:0, fontSize:14, fontWeight:600 }}>Party Outstanding</h3>
              <button style={s.btn()} onClick={() => navigate('/mis/party-outstanding/bill-os')}>View Report</button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {[
                { label:'Bill O/S', icon:'📋', color:'#3b82f6', path:'/mis/party-outstanding/bill-os' },
                { label:'Bill/Unbill', icon:'📄', color:'#f59e0b', path:'/mis/party-outstanding/bill-unbill' },
                { label:'Overdue Bills', icon:'⚠️', color:'#ef4444', path:'/mis/party-outstanding/overdue-bills' },
                { label:'ToPay O/S', icon:'💰', color:'#8b5cf6', path:'/mis/party-outstanding/to-pay-os-grid' },
              ].map(a => (
                <button key={a.label} onClick={() => navigate(a.path)}
                  style={{ background:'#1e293b', border:`1px solid ${a.color}33`, borderRadius:8, padding:'14px 12px', cursor:'pointer', textAlign:'left', transition:'border-color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor=a.color}
                  onMouseLeave={e => e.currentTarget.style.borderColor=a.color+'33'}>
                  <div style={{ fontSize:20, marginBottom:6 }}>{a.icon}</div>
                  <div style={{ fontSize:12, fontWeight:600, color:a.color }}>{a.label}</div>
                </button>
              ))}
            </div>
            <div style={{ marginTop:14, padding:'12px', background:'#0a0e1a', borderRadius:8 }}>
              <div style={{ fontSize:11, color:'#475569', marginBottom:4 }}>Overdue Payments</div>
              <div style={{ fontSize:24, fontWeight:700, color:'#ef4444' }}>{dash?.overdue_payments||0}</div>
              {dash?.overdue_payments > 0 && (
                <button style={{ ...s.btn('#ef4444'), marginTop:8 }} onClick={() => navigate('/mis/party-outstanding/overdue-bills')}>
                  Take Action Now →
                </button>
              )}
            </div>
          </div>

          <div style={s.card}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <h3 style={{ margin:0, fontSize:14, fontWeight:600 }}>Collection Reports</h3>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {[
                { icon:'💰', label:'MR Summary', desc:'Money receipt summary', path:'/account-reports/mr/summary' },
                { icon:'🏦', label:'Bill Collection', desc:'Collected bills analysis', path:'/account-reports/mr/bill-collection' },
                { icon:'✅', label:'Paid Collection', desc:'Paid collections report', path:'/account-reports/mr/paid-collection' },
                { icon:'📋', label:'Topay Collection', desc:'To-pay collections', path:'/account-reports/mr/topay-collection' },
                { icon:'⚠️', label:'Bill Pending MR', desc:'Bills awaiting receipt', path:'/account-reports/mr/bill-pending-mr' },
                { icon:'📊', label:'O/S Report', desc:'Outstanding balance report', path:'/account-reports/os-report' },
              ].map(a => (
                <button key={a.label} onClick={() => navigate(a.path)}
                  style={{ display:'flex', alignItems:'center', gap:10, background:'#1e293b', border:'none', borderRadius:7, padding:'8px 12px', color:'#f1f5f9', cursor:'pointer', textAlign:'left', transition:'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background='#273548'}
                  onMouseLeave={e => e.currentTarget.style.background='#1e293b'}>
                  <span style={{ fontSize:16 }}>{a.icon}</span>
                  <div><div style={{ fontSize:12, fontWeight:600 }}>{a.label}</div><div style={{ fontSize:10, color:'#475569' }}>{a.desc}</div></div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
          {[
            { icon:'📊', label:'Profit & Loss', path:'/account-reports/final-books/profit-and-loss' },
            { icon:'⚖️', label:'Balance Sheet', path:'/account-reports/final-books/balance-sheet' },
            { icon:'📈', label:'Trial Balance', path:'/account-reports/final-books/trail-balance' },
            { icon:'📅', label:'Daybook', path:'/account-reports/daybook' },
            { icon:'💰', label:'LR Profitability', path:'/mis/profitability/lr-profitability' },
            { icon:'🚛', label:'Trip Wise Profit', path:'/mis/profitability/trip-wise-profit' },
            { icon:'📄', label:'GSTR-1', path:'/account-reports/taxation/gstr-1' },
            { icon:'📋', label:'GSTR-2', path:'/account-reports/taxation/gstr-2' },
            { icon:'🏢', label:'Branch Sale Monthly', path:'/mis/branch-sale-monthly' },
            { icon:'👥', label:'Party Sale Monthly', path:'/mis/party-sale-monthly' },
            { icon:'💳', label:'Account Statement', path:'/account-reports/account-statement' },
            { icon:'🔍', label:'Account Analysis', path:'/mis/account-analysis' },
          ].map(a => (
            <button key={a.label} onClick={() => navigate(a.path)}
              style={{ background:'#111827', border:'1px solid #1e293b', borderRadius:10, padding:'16px 12px', cursor:'pointer', textAlign:'center', transition:'border-color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor='#10b981'}
              onMouseLeave={e => e.currentTarget.style.borderColor='#1e293b'}>
              <div style={{ fontSize:26, marginBottom:8 }}>{a.icon}</div>
              <div style={{ fontSize:11, fontWeight:600, color:'#f1f5f9' }}>{a.label}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
