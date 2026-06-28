import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function KpiCard({ icon, label, value, color, sub, onClick }) {
  return (
    <div onClick={onClick} style={{ background:'#111827', border:'1px solid #1e293b', borderRadius:10, padding:'14px 16px', flex:1, minWidth:130, cursor:onClick?'pointer':'default', transition:'border-color 0.2s' }}
      onMouseEnter={e => { if(onClick) e.currentTarget.style.borderColor=color; }}
      onMouseLeave={e => e.currentTarget.style.borderColor='#1e293b'}>
      <div style={{ fontSize:22, marginBottom:6 }}>{icon}</div>
      <div style={{ fontSize:26, fontWeight:700, color }}>{value}</div>
      <div style={{ fontSize:11, color:'#64748b', marginTop:2 }}>{label}</div>
      {sub && <div style={{ fontSize:10, color:'#475569', marginTop:2 }}>{sub}</div>}
    </div>
  );
}

function TelemticsPlaceholder({ title, icon, description, path, navigate }) {
  return (
    <div style={{ background:'#111827', border:'1px dashed #1e293b', borderRadius:12, padding:'30px 20px', textAlign:'center' }}>
      <div style={{ fontSize:36, marginBottom:10 }}>{icon}</div>
      <div style={{ fontSize:14, fontWeight:700, color:'#94a3b8', marginBottom:6 }}>{title}</div>
      <div style={{ fontSize:12, color:'#475569', marginBottom:16, maxWidth:240, margin:'0 auto 16px' }}>{description}</div>
      <button onClick={() => navigate(path)} style={{ background:'#1d4ed8', color:'#fff', border:'none', borderRadius:6, padding:'7px 16px', fontSize:12, fontWeight:600, cursor:'pointer' }}>
        Connect Hardware
      </button>
    </div>
  );
}

export default function DriverCommand() {
  const navigate = useNavigate();
  const { branch } = useAuth();
  const [nots, setNots] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [dash, setDash] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const load = useCallback(async () => {
    try {
      const [nRes, aRes, dRes] = await Promise.all([
        api.get('/ai/notifications'),
        api.get('/ai/analytics'),
        api.get('/ai/dashboard'),
      ]);
      setNots(nRes.data?.recent || []);
      setAnalytics(aRes.data);
      setDash(dRes.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [branch]);

  useEffect(() => { load(); }, [load]);

  const driverAlerts = nots.filter(n => n.type?.toLowerCase().includes('driver') || n.type?.toLowerCase().includes('delivery'));

  const s = {
    page: { minHeight:'100vh', background:'#0a0e1a', color:'#f1f5f9', fontFamily:'Inter,system-ui,sans-serif', padding:20 },
    card: { background:'#111827', border:'1px solid #1e293b', borderRadius:12, padding:16 },
    btn: (bg='#3b82f6') => ({ background:bg, color:'#fff', border:'none', borderRadius:6, padding:'7px 14px', fontSize:12, fontWeight:600, cursor:'pointer' }),
    btnGhost: { background:'transparent', color:'#94a3b8', border:'1px solid #1e293b', borderRadius:6, padding:'7px 14px', fontSize:12, fontWeight:600, cursor:'pointer' },
    tab: (active) => ({ padding:'8px 16px', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer', border:'none', background: active ? '#1d4ed8' : 'transparent', color: active ? '#fff' : '#64748b', transition:'all 0.2s' }),
    lbl: { fontSize:11, color:'#475569', textTransform:'uppercase', letterSpacing:'0.06em', fontWeight:600, marginBottom:10 },
  };

  if (loading) return (
    <div style={{ ...s.page, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:14 }}>
      <div style={{ width:36, height:36, border:'3px solid #1e293b', borderTop:'3px solid #3b82f6', borderRadius:'50%', animation:'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <span style={{ color:'#475569' }}>Loading Driver Command…</span>
    </div>
  );

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20, flexWrap:'wrap', gap:10 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, margin:0 }}>👤 Driver Command Center</h1>
          <p style={{ color:'#475569', fontSize:12, margin:'4px 0 0' }}>Driver management, performance & assignments</p>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <button style={s.btnGhost} onClick={() => navigate('/master/driver/master')}>+ Add Driver</button>
          <button style={s.btnGhost} onClick={() => navigate('/entries/vehicle-assign')}>📋 Assign Trip</button>
          <button style={s.btnGhost} onClick={() => navigate('/ai/driver-management')}>AI Driver Mgmt</button>
          <button style={s.btn()} onClick={load}>↻ Refresh</button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap' }}>
        <KpiCard icon="👤" label="Total Drivers" value="—" color="#3b82f6" sub="Connect telematics" onClick={() => navigate('/master/driver/master')} />
        <KpiCard icon="🚛" label="On Trip" value="—" color="#10b981" sub="GPS required" />
        <KpiCard icon="✅" label="Available" value="—" color="#f59e0b" sub="Telematics required" />
        <KpiCard icon="🔔" label="Driver Alerts" value={driverAlerts.length} color={driverAlerts.length > 0 ? '#ef4444' : '#10b981'} onClick={() => navigate('/ai/notifications')} />
        <KpiCard icon="⭐" label="Avg Safety Score" value="—" color="#8b5cf6" sub="IoT sensor required" />
        <KpiCard icon="📊" label="Deliveries (30d)" value={analytics?.days?.reduce((s,d)=>s+(d.trips||0),0)||0} color="#10b981" onClick={() => navigate('/mis/tracking-mis')} />
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:16, background:'#111827', borderRadius:8, padding:4, border:'1px solid #1e293b', width:'fit-content' }}>
        {['overview','assignments','performance','alerts'].map(tab => (
          <button key={tab} style={s.tab(activeTab === tab)} onClick={() => setActiveTab(tab)}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          {/* Driver Master Quick Actions */}
          <div style={s.card}>
            <div style={s.lbl}>Driver Management</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {[
                { icon:'👤', label:'Driver Master', desc:'Add and manage driver profiles', path:'/master/driver/master' },
                { icon:'🔗', label:'Driver Mapping', desc:'Map drivers to vehicles/branches', path:'/master/driver/mapping' },
                { icon:'📄', label:'Driver Report', desc:'Driver-wise report', path:'/reports/master/driver' },
                { icon:'📋', label:'Vehicle Assign', desc:'Assign drivers to trips', path:'/entries/vehicle-assign' },
                { icon:'🚛', label:'Trip Settlement', desc:'Settle completed driver trips', path:'/entries/trip-settlement' },
                { icon:'💵', label:'Extra Advance/Diesel', desc:'Driver advance payments', path:'/entries/extra-advance-diesel' },
              ].map(a => (
                <button key={a.label} onClick={() => navigate(a.path)}
                  style={{ display:'flex', alignItems:'center', gap:12, background:'#1e293b', border:'none', borderRadius:8, padding:'10px 14px', color:'#f1f5f9', cursor:'pointer', textAlign:'left', transition:'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background='#273548'}
                  onMouseLeave={e => e.currentTarget.style.background='#1e293b'}>
                  <span style={{ fontSize:18 }}>{a.icon}</span>
                  <div><div style={{ fontSize:12, fontWeight:600 }}>{a.label}</div><div style={{ fontSize:10, color:'#475569' }}>{a.desc}</div></div>
                  <span style={{ marginLeft:'auto', color:'#334155', fontSize:14 }}>›</span>
                </button>
              ))}
            </div>
          </div>

          {/* Telematics Status */}
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <TelemticsPlaceholder
              title="Driver Telematics Not Connected"
              icon="📱"
              description="Connect driver mobile app or RFID cards to track attendance, behavior, and safety scores in real-time."
              path="/ai/driver-management"
              navigate={navigate}
            />
            <div style={s.card}>
              <div style={s.lbl}>AI Driver Features (Requires Telematics)</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {[
                  { icon:'🛡️', label:'Safety Score', locked:true },
                  { icon:'⚡', label:'Harsh Braking', locked:true },
                  { icon:'🏎️', label:'Over Speeding', locked:true },
                  { icon:'😴', label:'Fatigue Alert', locked:true },
                  { icon:'📍', label:'Live Location', locked:true },
                  { icon:'⭐', label:'Driver Ranking', locked:false, path:'/ai/driver-management' },
                ].map(f => (
                  <button key={f.label} onClick={() => !f.locked && navigate(f.path || '/ai/driver-management')}
                    style={{ background: f.locked ? '#0f172a' : '#1e293b', border:`1px solid ${f.locked ? '#1e293b' : '#334155'}`, borderRadius:8, padding:'10px 12px', cursor: f.locked ? 'not-allowed' : 'pointer', opacity: f.locked ? 0.6 : 1 }}>
                    <div style={{ fontSize:16, marginBottom:4 }}>{f.icon}</div>
                    <div style={{ fontSize:11, fontWeight:600, color: f.locked ? '#475569' : '#f1f5f9' }}>{f.label}</div>
                    <div style={{ fontSize:9, color:'#334155', marginTop:2 }}>{f.locked ? '🔒 Hardware required' : '✅ Available'}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'assignments' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <div style={s.card}>
            <div style={s.lbl}>Trip Assignment</div>
            <div style={{ textAlign:'center', padding:'30px 0' }}>
              <div style={{ fontSize:40, marginBottom:10 }}>📋</div>
              <div style={{ fontSize:14, fontWeight:600, color:'#94a3b8', marginBottom:6 }}>Manage Trip Assignments</div>
              <div style={{ fontSize:12, color:'#475569', marginBottom:16 }}>Assign drivers to routes, vehicles, and shipments</div>
              <div style={{ display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap' }}>
                <button style={s.btn()} onClick={() => navigate('/entries/vehicle-assign')}>Assign Vehicle</button>
                <button style={s.btnGhost} onClick={() => navigate('/entries/route-planning')}>Route Planning</button>
              </div>
            </div>
          </div>
          <div style={s.card}>
            <div style={s.lbl}>Order & Pickup</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {[
                { icon:'📦', label:'Pickup Request', path:'/entries/pickup' },
                { icon:'✅', label:'Verify Order', path:'/entries/verify-order' },
                { icon:'🛣️', label:'Route Planning', path:'/entries/route-planning' },
                { icon:'📋', label:'Order Register', path:'/entries/order-register' },
                { icon:'🚚', label:'Delivery', path:'/entries/delivery' },
              ].map(a => (
                <button key={a.label} onClick={() => navigate(a.path)}
                  style={{ display:'flex', alignItems:'center', gap:10, background:'#1e293b', border:'none', borderRadius:8, padding:'9px 12px', color:'#f1f5f9', cursor:'pointer', transition:'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background='#273548'}
                  onMouseLeave={e => e.currentTarget.style.background='#1e293b'}>
                  <span style={{ fontSize:16 }}>{a.icon}</span>
                  <span style={{ fontSize:12, fontWeight:600 }}>{a.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'performance' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <div style={s.card}>
            <div style={s.lbl}>Daily Trip Volume (30d)</div>
            {analytics?.days?.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={analytics.days.slice(-14)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" tick={{ fontSize:8, fill:'#475569' }} />
                  <YAxis tick={{ fontSize:8, fill:'#475569' }} />
                  <Tooltip contentStyle={{ background:'#1e293b', border:'none', color:'#f1f5f9', fontSize:11 }} />
                  <Bar dataKey="trips" fill="#3b82f6" radius={[3,3,0,0]} name="Trips" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign:'center', color:'#334155', padding:'60px 0', fontSize:12 }}>No trip data yet</div>
            )}
          </div>
          <TelemticsPlaceholder
            title="Driver Performance Analytics"
            icon="📊"
            description="Safety scores, harsh braking, over-speeding, and fatigue alerts require driver telematics or mobile app."
            path="/ai/driver-management"
            navigate={navigate}
          />
        </div>
      )}

      {activeTab === 'alerts' && (
        <div style={s.card}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <h3 style={{ margin:0, fontSize:14, fontWeight:600 }}>Operational Alerts</h3>
            <button style={s.btnGhost} onClick={() => navigate('/ai/notifications')}>View All Notifications →</button>
          </div>
          {nots.length === 0 ? (
            <div style={{ textAlign:'center', padding:'50px 0', color:'#334155' }}>
              <div style={{ fontSize:40, marginBottom:8 }}>✅</div>
              <div style={{ fontSize:14, fontWeight:600, color:'#475569' }}>No Active Alerts</div>
              <div style={{ fontSize:12, color:'#334155', marginTop:4 }}>All operations running smoothly</div>
            </div>
          ) : nots.map((n, i) => {
            const color = n.priority === 'High' ? '#ef4444' : '#f59e0b';
            return (
              <div key={i} style={{ padding:'12px 0', borderBottom:'1px solid #0f172a' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div>
                    <div style={{ fontSize:12, fontWeight:700, color }}>{n.type}</div>
                    <div style={{ fontSize:12, color:'#94a3b8', marginTop:3 }}>{n.message}</div>
                  </div>
                  <span style={{ background:color+'22', color, fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:4, flexShrink:0 }}>{n.priority}</span>
                </div>
                <div style={{ fontSize:10, color:'#334155', marginTop:4 }}>{new Date(n.time).toLocaleString('en-IN')}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
