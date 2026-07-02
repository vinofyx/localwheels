import { useState, useEffect } from 'react';

const _BASE = import.meta.env.VITE_API_URL || '/api';
const h = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}` });

const ACC_SYSTEMS = [
  { provider: 'Tally', logo: '📒', desc: 'Tally ERP 9 & Tally Prime — India\'s leading accounting', entities: ['Vouchers','Ledgers','GST Returns','Payroll','Stock'] },
  { provider: 'QuickBooks', logo: '🟦', desc: 'QuickBooks Online & Desktop', entities: ['Invoices','Payments','Expenses','Payroll','Reports'] },
  { provider: 'Xero', logo: '💚', desc: 'Xero — Beautiful cloud accounting', entities: ['Invoices','Bills','Bank Feeds','Payroll','Tax Returns'] },
  { provider: 'Zoho Books', logo: '📗', desc: 'Zoho Books — Smart Accounting', entities: ['Invoices','POs','Expenses','Banking','GST/VAT'] },
];

export default function AccountingIntegrations() {
  const [connected, setConnected] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ name: '', base_url: '', auth_type: 'oauth2', sync_direction: 'bidirectional', sync_frequency: 'daily' });
  const [saving, setSaving] = useState(false);

  const reload = () => {
    fetch(`${_BASE}/connectors?connector_type=accounting`, { headers: h() }).then(r => r.json()).then(r => { if (r.status) setConnected(r.data.connectors || []); });
  };
  useEffect(() => { reload(); }, []);

  const deploy = async () => {
    setSaving(true);
    const r = await fetch(`${_BASE}/connectors`, { method: 'POST', headers: { ...h(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, connector_type: 'accounting', provider: selected.provider }) });
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
      <h2>Accounting Integrations</h2>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>Sync invoices, payments, and financial data from your accounting system</p>

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
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 3 }}>API URL / Server</label>
              <input value={form.base_url} onChange={e => setForm(p => ({ ...p, base_url: e.target.value }))} style={{ width: '100%', padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6 }} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {[['auth_type','Auth',['oauth2','api_key','basic']],['sync_frequency','Frequency',['hourly','daily','weekly','manual']]].map(([k,l,opts]) => (
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 20 }}>
        {ACC_SYSTEMS.map(s => {
          const conn = connected.find(c => c.provider === s.provider);
          return (
            <div key={s.provider} style={{ background: '#fff', border: `1px solid ${conn ? '#10b981' : '#e5e7eb'}`, borderRadius: 12, padding: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <span style={{ fontSize: 36 }}>{s.logo}</span>
                <div>
                  <div style={{ fontWeight: 700 }}>{s.provider}</div>
                  {conn && <span style={{ fontSize: 11, padding: '1px 7px', background: '#d1fae5', color: '#065f46', borderRadius: 12 }}>✓ Connected</span>}
                </div>
              </div>
              <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 10 }}>{s.desc}</p>
              <div style={{ marginBottom: 14 }}>
                {s.entities.map(e => <span key={e} style={{ display: 'inline-block', marginRight: 4, marginBottom: 4, fontSize: 10, padding: '2px 7px', background: '#f3f4f6', borderRadius: 8 }}>{e}</span>)}
              </div>
              {conn ? (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => testConn(conn._id)} style={{ flex: 1, background: '#eff6ff', color: '#1d4ed8', border: 'none', padding: 7, borderRadius: 5, cursor: 'pointer', fontSize: 12 }}>Test</button>
                  <button onClick={() => sync(conn._id)} style={{ flex: 1, background: '#f0fdf4', color: '#15803d', border: 'none', padding: 7, borderRadius: 5, cursor: 'pointer', fontSize: 12 }}>Sync</button>
                </div>
              ) : (
                <button onClick={() => { setSelected(s); setForm(p => ({ ...p, name: s.provider })); }} style={{ width: '100%', background: '#6366f1', color: '#fff', border: 'none', padding: 9, borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                  Connect
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
