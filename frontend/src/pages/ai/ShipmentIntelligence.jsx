import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const STATUS_COLORS = { in_transit:'#3b82f6', delivered:'#10b981', booked:'#f59e0b', hold:'#ef4444', lost:'#dc2626', returned:'#8b5cf6' };

function StatCard({ icon, label, value, color, sub, onClick }) {
  return (
    <div onClick={onClick} style={{ background:'#111827', border:'1px solid #1e293b', borderRadius:10, padding:'14px 16px', flex:1, minWidth:130, cursor:onClick?'pointer':'default', transition:'border-color 0.2s' }}
      onMouseEnter={e => { if(onClick) e.currentTarget.style.borderColor=color; }}
      onMouseLeave={e => e.currentTarget.style.borderColor='#1e293b'}>
      <div style={{ fontSize:20, marginBottom:6 }}>{icon}</div>
      <div style={{ fontSize:26, fontWeight:700, color }}>{value}</div>
      <div style={{ fontSize:11, color:'#64748b', marginTop:2 }}>{label}</div>
      {sub && <div style={{ fontSize:10, color:'#475569', marginTop:2 }}>{sub}</div>}
    </div>
  );
}

export default function ShipmentIntelligence() {
  const navigate = useNavigate();
  const { branch } = useAuth();
  const [shipments, setShipments] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [nots, setNots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const load = useCallback(async () => {
    try {
      const branchId = branch?._id || branch?.id;
      const [sRes, aRes, nRes] = await Promise.all([
        api.get(`/shipments?branch_id=${branchId}&limit=200`),
        api.get('/ai/analytics'),
        api.get('/ai/notifications'),
      ]);
      setShipments(sRes.data?.data || []);
      setAnalytics(aRes.data);
      setNots(nRes.data?.recent || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [branch]);

  useEffect(() => { load(); }, [load]);

  const filtered = shipments.filter(s => {
    const q = search.toLowerCase();
    return (
      (statusFilter === 'all' || s.status === statusFilter) &&
      (!q || s.lr_number?.toLowerCase().includes(q) || s.destination?.toLowerCase().includes(q) ||
       s.sender_name?.toLowerCase().includes(q) || s.receiver_name?.toLowerCase().includes(q))
    );
  });
  const paged = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  function exportCSV() {
    const hdr = ['LR No','Sender','Receiver','Origin','Destination','Status','Amount','Payment','Packages','Weight','Date'];
    const rows = filtered.map(s => [
      s.lr_number, s.sender_name, s.receiver_name, s.sender_address||'—', s.destination,
      s.status, s.freight_amount, s.payment_type, s.packages, s.weight,
      new Date(s.booking_date).toLocaleDateString('en-IN'),
    ]);
    const csv = [hdr,...rows].map(r => r.map(v=>`"${v??''}"`).join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download='shipments.csv'; a.click();
  }

  const inTransit = shipments.filter(s => s.status === 'in_transit').length;
  const delivered  = shipments.filter(s => s.status === 'delivered').length;
  const booked     = shipments.filter(s => s.status === 'booked').length;
  const hold       = shipments.filter(s => s.status === 'hold' || s.status === 'lost').length;
  const delayed    = shipments.filter(s => s.status === 'in_transit' && new Date(s.booking_date) < new Date(Date.now() - 3*86400000)).length;
  const totalRev   = shipments.reduce((sum, s) => sum + (s.freight_amount || 0), 0);

  const statusDist = Object.entries(
    shipments.reduce((acc, s) => { acc[s.status] = (acc[s.status]||0)+1; return acc; }, {})
  ).map(([name, value]) => ({ name, value, fill: STATUS_COLORS[name]||'#64748b' }));

  const st = {
    page: { minHeight:'100vh', background:'#0a0e1a', color:'#f1f5f9', fontFamily:'Inter,system-ui,sans-serif', padding:20 },
    card: { background:'#111827', border:'1px solid #1e293b', borderRadius:12, padding:16 },
    btn: (bg='#3b82f6') => ({ background:bg, color:'#fff', border:'none', borderRadius:6, padding:'7px 14px', fontSize:12, fontWeight:600, cursor:'pointer' }),
    btnGhost: { background:'transparent', color:'#94a3b8', border:'1px solid #1e293b', borderRadius:6, padding:'7px 14px', fontSize:12, fontWeight:600, cursor:'pointer' },
    tag: (c) => ({ background:c+'22', color:c, fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:4, textTransform:'uppercase' }),
    pill: (active) => ({ padding:'5px 12px', borderRadius:20, fontSize:11, fontWeight:600, cursor:'pointer', border:'none', background: active ? '#3b82f6' : '#1e293b', color: active ? '#fff' : '#64748b' }),
    lbl: { fontSize:11, color:'#475569', textTransform:'uppercase', letterSpacing:'0.06em', fontWeight:600, marginBottom:8 },
  };

  if (loading) return (
    <div style={{ ...st.page, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:14 }}>
      <div style={{ width:36, height:36, border:'3px solid #1e293b', borderTop:'3px solid #3b82f6', borderRadius:'50%', animation:'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <span style={{ color:'#475569' }}>Loading Shipment Intelligence…</span>
    </div>
  );

  return (
    <div style={st.page}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20, flexWrap:'wrap', gap:10 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, margin:0 }}>📦 Shipment Intelligence Center</h1>
          <p style={{ color:'#475569', fontSize:12, margin:'4px 0 0' }}>End-to-end shipment analytics · {shipments.length} total LRs</p>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <button style={st.btnGhost} onClick={() => navigate('/shipments/new')}>+ New LR</button>
          <button style={st.btnGhost} onClick={() => navigate('/entries/pod-upload')}>📤 Upload POD</button>
          <button style={st.btnGhost} onClick={() => navigate('/tracking/lr-tracking')}>🔍 LR Tracking</button>
          <button style={st.btn()} onClick={load}>↻ Refresh</button>
          <button style={st.btn('#10b981')} onClick={exportCSV}>⬇ Export CSV</button>
        </div>
      </div>

      {/* KPI Strip */}
      <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap' }}>
        <StatCard icon="📋" label="Total LRs" value={shipments.length} color="#3b82f6" onClick={() => setStatusFilter('all')} />
        <StatCard icon="🚛" label="In Transit" value={inTransit} color="#3b82f6" onClick={() => setStatusFilter('in_transit')} />
        <StatCard icon="✅" label="Delivered" value={delivered} color="#10b981" onClick={() => setStatusFilter('delivered')} />
        <StatCard icon="📦" label="Booked" value={booked} color="#f59e0b" onClick={() => setStatusFilter('booked')} />
        <StatCard icon="⏰" label="Delayed" value={delayed} color="#ef4444" sub=">3 days in transit" onClick={() => navigate('/ai/notifications')} />
        <StatCard icon="🔴" label="Hold/Lost" value={hold} color="#ef4444" onClick={() => navigate('/entries/hold-lost-damage')} />
        <StatCard icon="💰" label="Total Revenue" value={`₹${(totalRev/100000).toFixed(1)}L`} color="#10b981" />
        <StatCard icon="🔔" label="AI Alerts" value={nots.length} color={nots.length > 0 ? '#ef4444' : '#10b981'} onClick={() => navigate('/ai/notifications')} />
      </div>

      {/* Priority Alerts */}
      {nots.filter(n => n.priority === 'High').length > 0 && (
        <div style={{ ...st.card, background:'#1a0f0f', borderColor:'#7f1d1d', marginBottom:16 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <h3 style={{ margin:0, fontSize:13, fontWeight:700, color:'#fca5a5' }}>🚨 Priority Alerts Requiring Action</h3>
            <button style={st.btn('#ef4444')} onClick={() => navigate('/ai/notifications')}>View All</button>
          </div>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            {nots.filter(n => n.priority === 'High').map((n, i) => (
              <div key={i} style={{ background:'#7f1d1d33', border:'1px solid #7f1d1d', borderRadius:8, padding:'8px 12px', fontSize:12, flex:'1 1 280px' }}>
                <div style={{ fontWeight:700, color:'#f87171' }}>{n.type}</div>
                <div style={{ color:'#fca5a5', marginTop:2 }}>{n.message}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16, marginBottom:20 }}>
        <div style={st.card}>
          <h3 style={{ margin:'0 0 12px', fontSize:13, fontWeight:600 }}>Status Distribution</h3>
          {statusDist.some(d => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={170}>
              <PieChart>
                <Pie data={statusDist} dataKey="value" cx="50%" cy="50%" outerRadius={60} label={({ name, value }) => value > 0 ? `${value}` : ''} labelLine={false} fontSize={10}>
                  {statusDist.map((e,i) => <Cell key={i} fill={e.fill} />)}
                </Pie>
                <Tooltip contentStyle={{ background:'#1e293b', border:'none', color:'#f1f5f9', fontSize:11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div style={{ textAlign:'center', color:'#334155', padding:'50px 0', fontSize:12 }}>No data</div>}
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:8 }}>
            {statusDist.map(d => (
              <span key={d.name} style={{ fontSize:10, color:d.fill }}>● {d.name}: {d.value}</span>
            ))}
          </div>
        </div>

        <div style={st.card}>
          <h3 style={{ margin:'0 0 12px', fontSize:13, fontWeight:600 }}>Daily Bookings (30 days)</h3>
          {analytics?.days?.length > 0 ? (
            <ResponsiveContainer width="100%" height={170}>
              <AreaChart data={analytics.days.slice(-14)}>
                <defs>
                  <linearGradient id="siGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" tick={{ fontSize:8, fill:'#475569' }} />
                <YAxis tick={{ fontSize:8, fill:'#475569' }} />
                <Tooltip contentStyle={{ background:'#1e293b', border:'none', color:'#f1f5f9', fontSize:11 }} />
                <Area type="monotone" dataKey="trips" stroke="#3b82f6" fill="url(#siGrad)" strokeWidth={2} name="Bookings" />
              </AreaChart>
            </ResponsiveContainer>
          ) : <div style={{ textAlign:'center', color:'#334155', padding:'50px 0', fontSize:12 }}>No analytics data</div>}
        </div>

        <div style={st.card}>
          <h3 style={{ margin:'0 0 12px', fontSize:13, fontWeight:600 }}>Branch Performance</h3>
          {analytics?.branch_performance?.length > 0 ? (
            <ResponsiveContainer width="100%" height={170}>
              <BarChart data={analytics.branch_performance.slice(0, 6)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="branch" tick={{ fontSize:8, fill:'#475569' }} />
                <YAxis tick={{ fontSize:8, fill:'#475569' }} />
                <Tooltip contentStyle={{ background:'#1e293b', border:'none', color:'#f1f5f9', fontSize:11 }} />
                <Bar dataKey="shipments" fill="#3b82f6" radius={[3,3,0,0]} name="LRs" />
              </BarChart>
            </ResponsiveContainer>
          ) : <div style={{ textAlign:'center', color:'#334155', padding:'50px 0', fontSize:12 }}>No branch data</div>}
        </div>
      </div>

      {/* Shipments Table */}
      <div style={st.card}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14, flexWrap:'wrap', gap:10 }}>
          <h3 style={{ margin:0, fontSize:14, fontWeight:600 }}>Shipment Register <span style={{ color:'#475569', fontWeight:400 }}>({filtered.length})</span></h3>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search LR / name / city…"
              style={{ background:'#1e293b', border:'1px solid #334155', borderRadius:6, padding:'6px 10px', color:'#f1f5f9', fontSize:12, width:220 }} />
            <button style={st.btnGhost} onClick={exportCSV}>⬇ CSV</button>
            <button style={st.btnGhost} onClick={() => window.print()}>🖨 Print</button>
          </div>
        </div>

        {/* Status Filter Pills */}
        <div style={{ display:'flex', gap:6, marginBottom:12, flexWrap:'wrap' }}>
          {['all','booked','in_transit','delivered','hold','lost'].map(sv => (
            <button key={sv} style={st.pill(statusFilter === sv)} onClick={() => { setStatusFilter(sv); setPage(1); }}>
              {sv === 'all' ? `All (${shipments.length})` : `${sv.replace('_',' ')} (${shipments.filter(x=>x.status===sv).length})`}
            </button>
          ))}
        </div>

        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead>
              <tr style={{ borderBottom:'1px solid #1e293b' }}>
                {['LR Number','Sender','Receiver','Destination','Status','Amount','Type','Date','Actions'].map(h => (
                  <th key={h} style={{ textAlign:'left', padding:'8px 10px', color:'#475569', fontWeight:600, fontSize:11, whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign:'center', padding:40, color:'#334155' }}>No shipments found</td></tr>
              ) : paged.map((sh, i) => {
                const sc = STATUS_COLORS[sh.status] || '#64748b';
                return (
                  <tr key={i} style={{ borderBottom:'1px solid #0f172a', transition:'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background='#1e293b30'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                    <td style={{ padding:'8px 10px', color:'#60a5fa', fontWeight:700 }}>{sh.lr_number}</td>
                    <td style={{ padding:'8px 10px', color:'#94a3b8' }}>{sh.sender_name||'—'}</td>
                    <td style={{ padding:'8px 10px', color:'#94a3b8' }}>{sh.receiver_name||'—'}</td>
                    <td style={{ padding:'8px 10px', color:'#e2e8f0' }}>{sh.destination||'—'}</td>
                    <td style={{ padding:'8px 10px' }}><span style={st.tag(sc)}>{sh.status}</span></td>
                    <td style={{ padding:'8px 10px', color:'#10b981', fontWeight:600 }}>₹{(sh.freight_amount||0).toLocaleString('en-IN')}</td>
                    <td style={{ padding:'8px 10px', color:'#64748b' }}>{sh.payment_type||'—'}</td>
                    <td style={{ padding:'8px 10px', color:'#475569' }}>{new Date(sh.booking_date).toLocaleDateString('en-IN')}</td>
                    <td style={{ padding:'8px 10px' }}>
                      <div style={{ display:'flex', gap:4 }}>
                        <button style={{ ...st.btn(), padding:'3px 8px', fontSize:10 }} onClick={() => navigate(`/shipments/${sh._id}`)}>View</button>
                        <button style={{ ...st.btnGhost, padding:'3px 8px', fontSize:10 }} onClick={() => navigate('/tracking/lr-tracking')}>Track</button>
                        {sh.status === 'delivered' && (
                          <button style={{ ...st.btn('#8b5cf6'), padding:'3px 8px', fontSize:10 }} onClick={() => navigate('/entries/pod-upload')}>POD</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:8, marginTop:14 }}>
            <button style={{ ...st.btnGhost, padding:'5px 12px', fontSize:12 }} onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}>‹ Prev</button>
            <span style={{ color:'#64748b', fontSize:12 }}>Page {page} of {totalPages}</span>
            <button style={{ ...st.btnGhost, padding:'5px 12px', fontSize:12 }} onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages}>Next ›</button>
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginTop:16 }}>
        {[
          { icon:'📋', label:'Booking Register', desc:'HO consolidated view', path:'/reports/lr/booking-ho' },
          { icon:'🔍', label:'LR Enquiry', desc:'Search any LR', path:'/tracking/lr-enquiry' },
          { icon:'📦', label:'Non-Submit POD', desc:'Pending POD list', path:'/reports/pod/non-submit' },
          { icon:'💰', label:'Outstanding Bills', desc:'Party-wise OS', path:'/mis/party-outstanding/bill-os' },
        ].map(a => (
          <button key={a.label} onClick={() => navigate(a.path)} style={{ ...st.card, border:'1px solid #1e293b', textAlign:'left', cursor:'pointer', transition:'border-color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor='#3b82f6'}
            onMouseLeave={e => e.currentTarget.style.borderColor='#1e293b'}>
            <div style={{ fontSize:22, marginBottom:6 }}>{a.icon}</div>
            <div style={{ fontSize:13, fontWeight:600 }}>{a.label}</div>
            <div style={{ fontSize:11, color:'#475569', marginTop:2 }}>{a.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
