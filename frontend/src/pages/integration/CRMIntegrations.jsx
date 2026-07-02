import { useState, useEffect } from 'react';

const _BASE = import.meta.env.VITE_API_URL || '/api';
const h = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}` });

const CRM_SYSTEMS = [
  { provider: 'Salesforce', logo: '☁️', desc: 'Salesforce CRM — World\'s #1 CRM', entities: ['Leads','Contacts','Accounts','Opportunities','Cases'] },
  { provider: 'HubSpot', logo: '🟠', desc: 'HubSpot CRM & Marketing Hub', entities: ['Contacts','Companies','Deals','Tickets','Tasks'] },
  { provider: 'Zoho CRM', logo: '🔴', desc: 'Zoho CRM & Zoho One Suite', entities: ['Leads','Contacts','Accounts','Campaigns','Reports'] },
];

export default function CRMIntegrations() {
  const [connected, setConnected] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ name: '', base_url: '', auth_type: 'oauth2', sync_direction: 'bidirectional', sync_frequency: 'hourly' });
  const [saving, setSaving] = useState(false);

  const reload = () => {
    fetch(`${_BASE}/connectors?connector_type=crm`, { headers: h() }).then(r => r.json()).then(r => { if (r.status) setConnected(r.data.connectors || []); });
  };
  useEffect(() => { reload(); }, []);

  const deploy = async () => {
    setSaving(true);
    const r = await fetch(`${_BASE}/connectors`, { method: 'POST', headers: { ...h(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, connector_type: 'crm', provider: selected.provider }) });
    const d = await r.json();
    setSaving(false);
    if (d.status) { setSelected(null); reload(); } else alert(d.message);
  };

  const testConn = async (id) => {
    const r = await fetch(`${_BASE}/connectors/${id}/test`, { method: 'POST', headers: h() });
    const d = await r.json();
    alert(d.status ? `✅ Latency: ${d.data?.latency_ms}ms` : `❌ ${d.message}`);
  };

  const sync = async (id) => {
    await fetch(`${_BASE}/connectors/${id}/sync`, { method: 'POST', headers: h() });
    alert('Sync started!');
  };

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h2>CRM Integrations</h2>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>Sync leads, contacts, and opportunities from your CRM</p>

      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 420 }}>
            <h3>{selected.logo} Connect {selected.provider}</h3>
            <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 16 }}>{selected.desc}</p>
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 3 }}>Name *</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} style={{ width: '100%', padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6 }} />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 3 }}>Instance URL</label>
              <input value={form.base_url} onChange={e => setForm(p => ({ ...p, base_url: e.target.value }))} placeholder={`https://${selected.provider.toLowerCase().replace(' ','')} .com`} style={{ width: '100%', padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6 }} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {[['auth_type','Auth',['oauth2','api_key','bearer']],['sync_frequency','Sync Freq',['realtime','hourly','daily','manual']]].map(([k,l,opts]) => (
                <div key={k} style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 3 }}>{l}</label>
                  <select value={form[k]} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))} style={{ width: '100%', padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6 }}>
                    {opts.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={deploy} disabled={saving} style={{ flex: 1, background: '#6366f1', color: '#fff', border: 'none', padding: 10, borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                {saving ? 'Connecting…' : 'Connect'}
              </button>
              <button onClick={() => setSelected(null)} style={{ padding: '10px 16px', background: '#f3f4f6', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20, marginBottom: 32 }}>
        {CRM_SYSTEMS.map(s => {
          const conn = connected.find(c => c.provider === s.provider);
          return (
            <div key={s.provider} style={{ background: '#fff', border: `1px solid ${conn ? '#10b981' : '#e5e7eb'}`, borderRadius: 12, padding: 24 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>{s.logo}</div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{s.provider}</div>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>{s.desc}</p>
              <div style={{ marginBottom: 16 }}>
                {s.entities.map(e => <span key={e} style={{ display: 'inline-block', marginRight: 4, marginBottom: 4, fontSize: 11, padding: '2px 8px', background: '#eff6ff', color: '#1d4ed8', borderRadius: 12 }}>{e}</span>)}
              </div>
              {conn ? (
                <div>
                  <div style={{ fontSize: 12, color: '#10b981', fontWeight: 600, marginBottom: 8 }}>✓ Connected: {conn.name}</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => testConn(conn._id)} style={{ flex: 1, background: '#eff6ff', color: '#1d4ed8', border: 'none', padding: 7, borderRadius: 5, cursor: 'pointer', fontSize: 12 }}>Test</button>
                    <button onClick={() => sync(conn._id)} style={{ flex: 1, background: '#f0fdf4', color: '#15803d', border: 'none', padding: 7, borderRadius: 5, cursor: 'pointer', fontSize: 12 }}>Sync</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => { setSelected(s); setForm(p => ({ ...p, name: s.provider })); }} style={{ width: '100%', background: '#6366f1', color: '#fff', border: 'none', padding: 10, borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                  Connect {s.provider}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
