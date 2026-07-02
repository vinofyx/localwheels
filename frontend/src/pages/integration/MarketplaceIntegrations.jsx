import { useState, useEffect } from 'react';

const _BASE = import.meta.env.VITE_API_URL || '/api';
const h = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}` });

const MARKETPLACES = [
  { provider: 'Amazon Seller', logo: '📦', type: 'marketplace', desc: 'Amazon Marketplace — sync FBA inventory, orders, shipments', entities: ['Orders','Inventory','Shipments','Returns','Payments'] },
  { provider: 'Flipkart', logo: '🛍️', type: 'marketplace', desc: 'Flipkart Seller Hub — India\'s leading eCommerce', entities: ['Orders','Listings','Inventory','Payments','Returns'] },
  { provider: 'Meesho', logo: '🎀', type: 'marketplace', desc: 'Meesho — Social commerce platform', entities: ['Orders','Products','Payments','Shipments'] },
  { provider: 'Razorpay', logo: '💳', type: 'payment', desc: 'Razorpay Payment Gateway — India', entities: ['Payments','Refunds','Settlements','Invoices','Subscriptions'] },
  { provider: 'Stripe', logo: '🔷', type: 'payment', desc: 'Stripe — Global payment processing', entities: ['Charges','Customers','Invoices','Subscriptions','Payouts'] },
  { provider: 'WhatsApp Business', logo: '💬', type: 'communication', desc: 'WhatsApp Business API — Messages & Notifications', entities: ['Messages','Templates','Contacts','Broadcasts','Webhooks'] },
  { provider: 'Twilio SMS', logo: '📱', type: 'communication', desc: 'Twilio — SMS, Voice, and WhatsApp', entities: ['SMS','Calls','Alerts','OTP','Campaigns'] },
  { provider: 'SendGrid', logo: '📧', type: 'communication', desc: 'SendGrid — Transactional & Marketing Email', entities: ['Transactional','Marketing','Templates','Analytics','Bounces'] },
];

export default function MarketplaceIntegrations() {
  const [connected, setConnected] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ name: '', base_url: '', auth_type: 'api_key', sync_direction: 'inbound', sync_frequency: 'hourly' });
  const [saving, setSaving] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');

  const reload = () => {
    fetch(`${_BASE}/connectors`, { headers: h() }).then(r => r.json()).then(r => { if (r.status) setConnected(r.data.connectors || []); });
  };
  useEffect(() => { reload(); }, []);

  const deploy = async () => {
    setSaving(true);
    const r = await fetch(`${_BASE}/connectors`, { method: 'POST', headers: { ...h(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, connector_type: selected.type, provider: selected.provider }) });
    const d = await r.json();
    setSaving(false);
    if (d.status) { setSelected(null); reload(); } else alert(d.message);
  };

  const testConn = async (id) => {
    const r = await fetch(`${_BASE}/connectors/${id}/test`, { method: 'POST', headers: h() });
    const d = await r.json();
    alert(d.status ? `✅ Latency: ${d.data?.latency_ms}ms` : `❌ ${d.message}`);
  };

  const filtered = typeFilter === 'all' ? MARKETPLACES : MARKETPLACES.filter(s => s.type === typeFilter);
  const TYPE_BADGE = { marketplace: { bg: '#eff6ff', c: '#1d4ed8' }, payment: { bg: '#f0fdf4', c: '#15803d' }, communication: { bg: '#fdf4ff', c: '#7c3aed' } };

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h2>Marketplace & Platform Integrations</h2>
      <p style={{ color: '#6b7280', marginBottom: 20 }}>Marketplaces, Payment Gateways, and Communication Channels</p>

      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 420 }}>
            <h3>{selected.logo} {selected.provider}</h3>
            <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 16 }}>{selected.desc}</p>
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 3 }}>Name *</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} style={{ width: '100%', padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6 }} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {[['auth_type','Auth',['api_key','oauth2','bearer']],['sync_direction','Direction',['inbound','outbound','bidirectional']]].map(([k,l,opts]) => (
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

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['all','marketplace','payment','communication'].map(t => (
          <button key={t} onClick={() => setTypeFilter(t)} style={{ padding: '4px 14px', borderRadius: 20, border: '1px solid', cursor: 'pointer', fontSize: 13,
            background: typeFilter === t ? '#6366f1' : '#fff', color: typeFilter === t ? '#fff' : '#374151',
            borderColor: typeFilter === t ? '#6366f1' : '#d1d5db' }}>{t}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 16 }}>
        {filtered.map(s => {
          const conn = connected.find(c => c.provider === s.provider);
          const badge = TYPE_BADGE[s.type] || {};
          return (
            <div key={s.provider} style={{ background: '#fff', border: `1px solid ${conn ? '#10b981' : '#e5e7eb'}`, borderRadius: 10, padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 28 }}>{s.logo}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{s.provider}</div>
                  <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 8, background: badge.bg, color: badge.c }}>{s.type}</span>
                </div>
              </div>
              <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 10, minHeight: 36 }}>{s.desc}</p>
              {conn ? (
                <div>
                  <div style={{ fontSize: 11, color: '#10b981', fontWeight: 600, marginBottom: 6 }}>✓ Connected</div>
                  <button onClick={() => testConn(conn._id)} style={{ width: '100%', background: '#f0fdf4', color: '#15803d', border: 'none', padding: 7, borderRadius: 5, cursor: 'pointer', fontSize: 12 }}>Test Connection</button>
                </div>
              ) : (
                <button onClick={() => { setSelected(s); setForm(p => ({ ...p, name: s.provider })); }} style={{ width: '100%', background: '#6366f1', color: '#fff', border: 'none', padding: 8, borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
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
