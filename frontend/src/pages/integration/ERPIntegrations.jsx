import { useState, useEffect } from 'react';

const _BASE = import.meta.env.VITE_API_URL || '/api';
const h = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}` });

const ERP_SYSTEMS = [
  { provider: 'SAP', logo: '🏭', desc: 'SAP S/4HANA / ERP Central Component', entities: ['Purchase Orders','Sales Orders','Materials','Vendors','GL Accounts'] },
  { provider: 'Oracle ERP', logo: '🔶', desc: 'Oracle Fusion Cloud ERP', entities: ['Financials','Supply Chain','Procurement','Manufacturing'] },
  { provider: 'Microsoft Dynamics', logo: '🔵', desc: 'Dynamics 365 Finance & Supply Chain', entities: ['Inventory','Sales','Finance','HR'] },
  { provider: 'Odoo', logo: '🟣', desc: 'Odoo ERP — All-in-One Open Source', entities: ['Accounting','CRM','Sales','Purchase','Inventory','HR'] },
  { provider: 'ERPNext', logo: '🟢', desc: 'ERPNext / Frappe Framework', entities: ['GL','Purchase','Sales','Payroll','Manufacturing'] },
];

export default function ERPIntegrations() {
  const [connected, setConnected] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ name: '', base_url: '', auth_type: 'api_key', sync_direction: 'bidirectional', sync_frequency: 'daily' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch(`${_BASE}/connectors?connector_type=erp`, { headers: h() }).then(r => r.json()).then(r => { if (r.status) setConnected(r.data.connectors || []); });
  }, []);

  const deploy = async () => {
    setSaving(true); setMsg('');
    const r = await fetch(`${_BASE}/connectors`, { method: 'POST', headers: { ...h(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, connector_type: 'erp', provider: selected.provider }) });
    const d = await r.json();
    setSaving(false);
    if (d.status) { setMsg('ERP connector deployed!'); setSelected(null); fetch(`${_BASE}/connectors?connector_type=erp`, { headers: h() }).then(r => r.json()).then(r => { if (r.status) setConnected(r.data.connectors || []); }); }
    else setMsg(d.message);
  };

  const testConn = async (id) => {
    const r = await fetch(`${_BASE}/connectors/${id}/test`, { method: 'POST', headers: h() });
    const d = await r.json();
    alert(d.status ? `✅ Connected! Latency: ${d.data?.latency_ms}ms` : `❌ ${d.message}`);
  };

  const sync = async (id) => {
    await fetch(`${_BASE}/connectors/${id}/sync`, { method: 'POST', headers: h() });
    alert('Sync started!');
  };

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h2>ERP Integrations</h2>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>Connect and synchronize your ERP systems with Local Wheels</p>

      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 440 }}>
            <h3>{selected.logo} Connect {selected.provider}</h3>
            <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 16 }}>{selected.desc}</p>
            {msg && <div style={{ background: '#d1fae5', padding: 8, borderRadius: 6, marginBottom: 12 }}>{msg}</div>}
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 3 }}>Connection Name *</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} style={{ width: '100%', padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6 }} />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 3 }}>API Base URL</label>
              <input value={form.base_url} onChange={e => setForm(p => ({ ...p, base_url: e.target.value }))} placeholder="https://your-erp-instance.com/api" style={{ width: '100%', padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6 }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 3 }}>Auth Type</label>
                <select value={form.auth_type} onChange={e => setForm(p => ({ ...p, auth_type: e.target.value }))} style={{ width: '100%', padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6 }}>
                  {['api_key','oauth2','basic','bearer'].map(a => <option key={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 3 }}>Sync Frequency</label>
                <select value={form.sync_frequency} onChange={e => setForm(p => ({ ...p, sync_frequency: e.target.value }))} style={{ width: '100%', padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6 }}>
                  {['manual','hourly','daily','weekly'].map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
            </div>
            <div style={{ background: '#f9fafb', borderRadius: 6, padding: 10, marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Synced Entities:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {selected.entities.map(e => <span key={e} style={{ fontSize: 11, padding: '2px 8px', background: '#eff6ff', color: '#1d4ed8', borderRadius: 12 }}>{e}</span>)}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={deploy} disabled={saving} style={{ flex: 1, background: '#6366f1', color: '#fff', border: 'none', padding: 10, borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                {saving ? 'Connecting…' : 'Connect ERP'}
              </button>
              <button onClick={() => setSelected(null)} style={{ padding: '10px 16px', background: '#f3f4f6', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16, marginBottom: 32 }}>
        {ERP_SYSTEMS.map(s => {
          const isConnected = connected.some(c => c.provider === s.provider);
          return (
            <div key={s.provider} style={{ background: '#fff', border: `1px solid ${isConnected ? '#10b981' : '#e5e7eb'}`, borderRadius: 10, padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={{ fontSize: 28 }}>{s.logo}</span>
                  <div style={{ fontWeight: 700 }}>{s.provider}</div>
                </div>
                {isConnected && <span style={{ fontSize: 11, padding: '2px 8px', background: '#d1fae5', color: '#065f46', borderRadius: 12, fontWeight: 600 }}>✓ Connected</span>}
              </div>
              <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 10 }}>{s.desc}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
                {s.entities.slice(0,3).map(e => <span key={e} style={{ fontSize: 10, padding: '1px 6px', background: '#f3f4f6', borderRadius: 8, color: '#374151' }}>{e}</span>)}
                {s.entities.length > 3 && <span style={{ fontSize: 10, color: '#6b7280' }}>+{s.entities.length-3} more</span>}
              </div>
              {isConnected ? (
                <div style={{ display: 'flex', gap: 6 }}>
                  {(() => { const conn = connected.find(c => c.provider === s.provider); return conn ? (<>
                    <button onClick={() => testConn(conn._id)} style={{ flex: 1, background: '#eff6ff', color: '#1d4ed8', border: 'none', padding: 7, borderRadius: 5, cursor: 'pointer', fontSize: 12 }}>Test</button>
                    <button onClick={() => sync(conn._id)} style={{ flex: 1, background: '#f0fdf4', color: '#15803d', border: 'none', padding: 7, borderRadius: 5, cursor: 'pointer', fontSize: 12 }}>Sync Now</button>
                  </>) : null; })()}
                </div>
              ) : (
                <button onClick={() => { setSelected(s); setForm(p => ({ ...p, name: s.provider })); }} style={{ width: '100%', background: '#6366f1', color: '#fff', border: 'none', padding: 8, borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                  Connect
                </button>
              )}
            </div>
          );
        })}
      </div>

      {connected.length > 0 && (
        <>
          <h3>Connected ERP Systems</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                {['Name','Provider','Status','Direction','Last Sync','Health'].map(c => (
                  <th key={c} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {connected.map(c => (
                <tr key={c._id}>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>{c.name}</td>
                  <td style={{ padding: '10px 12px' }}>{c.provider}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, background: c.status === 'active' ? '#d1fae5' : '#fee2e2', color: c.status === 'active' ? '#065f46' : '#991b1b' }}>{c.status}</span>
                  </td>
                  <td style={{ padding: '10px 12px' }}>{c.sync_direction}</td>
                  <td style={{ padding: '10px 12px', fontSize: 12 }}>{c.last_sync_at ? new Date(c.last_sync_at).toLocaleString() : 'Never'}</td>
                  <td style={{ padding: '10px 12px' }}>{c.health_score ?? 100}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
