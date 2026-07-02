import { useState, useEffect } from 'react';

const _BASE = import.meta.env.VITE_API_URL || '/api';
const h = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}` });

const TYPE_COLORS = { erp: '#6366f1', crm: '#10b981', accounting: '#f59e0b', payment: '#3b82f6', logistics: '#8b5cf6', government: '#ef4444', communication: '#ec4899', marketplace: '#14b8a6', custom: '#6b7280' };

export default function ConnectorMarketplace() {
  const [catalog, setCatalog] = useState([]);
  const [connected, setConnected] = useState([]);
  const [tab, setTab] = useState('catalog');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ name: '', base_url: '', auth_type: 'api_key', sync_direction: 'outbound', sync_frequency: 'manual' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch(`${_BASE}/connectors/catalog`, { headers: h() }).then(r => r.json()).then(r => { if (r.status) setCatalog(r.data.catalog || []); });
    fetch(`${_BASE}/connectors`, { headers: h() }).then(r => r.json()).then(r => { if (r.status) setConnected(r.data.connectors || []); });
  }, []);

  const types = ['all', ...new Set(catalog.map(c => c.type))];
  const filtered = filter === 'all' ? catalog : catalog.filter(c => c.type === filter);

  const deploy = async () => {
    setSaving(true); setMsg('');
    const body = { ...form, connector_type: selected.type, provider: selected.provider };
    const r = await fetch(`${_BASE}/connectors`, { method: 'POST', headers: { ...h(), 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const d = await r.json();
    setSaving(false);
    if (d.status) {
      setMsg('Connector deployed!'); setSelected(null);
      fetch(`${_BASE}/connectors`, { headers: h() }).then(r => r.json()).then(r => { if (r.status) setConnected(r.data.connectors || []); });
    } else setMsg(d.message);
  };

  const testConn = async (id) => {
    const r = await fetch(`${_BASE}/connectors/${id}/test`, { method: 'POST', headers: h() });
    const d = await r.json();
    alert(d.status ? `Connected! Latency: ${d.data.latency_ms}ms` : `Failed: ${d.message}`);
  };

  const triggerSync = async (id) => {
    await fetch(`${_BASE}/connectors/${id}/sync`, { method: 'POST', headers: h() });
    alert('Sync job started!');
  };

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h2>Connector Marketplace</h2>

      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 440 }}>
            <h3 style={{ marginBottom: 4 }}>{selected.logo} Deploy {selected.provider}</h3>
            <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 16 }}>{selected.description}</p>
            {msg && <div style={{ background: '#d1fae5', padding: 8, borderRadius: 6, marginBottom: 12 }}>{msg}</div>}
            {[['name','Connector Name *'],['base_url','Base URL (optional)']].map(([k, l]) => (
              <div key={k} style={{ marginBottom: 10 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 3 }}>{l}</label>
                <input value={form[k]} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))}
                  style={{ width: '100%', padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6 }} />
              </div>
            ))}
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 3 }}>Auth Type</label>
              <select value={form.auth_type} onChange={e => setForm(p => ({ ...p, auth_type: e.target.value }))}
                style={{ width: '100%', padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6 }}>
                {['api_key','oauth2','basic','bearer','none'].map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 3 }}>Sync Direction</label>
              <select value={form.sync_direction} onChange={e => setForm(p => ({ ...p, sync_direction: e.target.value }))}
                style={{ width: '100%', padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6 }}>
                {['inbound','outbound','bidirectional'].map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={deploy} disabled={saving} style={{ flex: 1, background: '#6366f1', color: '#fff', border: 'none', padding: '10px', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                {saving ? 'Deploying…' : 'Deploy Connector'}
              </button>
              <button onClick={() => setSelected(null)} style={{ padding: '10px 16px', background: '#f3f4f6', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[['catalog','Marketplace'],['connected','My Connectors']].map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
            background: tab === t ? '#6366f1' : '#f3f4f6', color: tab === t ? '#fff' : '#374151', fontWeight: 600 }}>{l} {t === 'connected' && `(${connected.length})`}</button>
        ))}
      </div>

      {tab === 'catalog' && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {types.map(t => (
              <button key={t} onClick={() => setFilter(t)} style={{ padding: '4px 14px', borderRadius: 20, border: '1px solid', cursor: 'pointer', fontSize: 13,
                background: filter === t ? '#6366f1' : '#fff', color: filter === t ? '#fff' : '#374151',
                borderColor: filter === t ? '#6366f1' : '#d1d5db' }}>{t}</button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 16 }}>
            {filtered.map(c => (
              <div key={c.provider} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 28 }}>{c.logo}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{c.provider}</div>
                    <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 12, background: TYPE_COLORS[c.type] + '20', color: TYPE_COLORS[c.type], fontWeight: 600 }}>{c.type}</span>
                  </div>
                </div>
                <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 12, minHeight: 40 }}>{c.description}</p>
                <button onClick={() => { setSelected(c); setForm(p => ({ ...p, name: c.provider })); }} style={{ width: '100%', background: '#6366f1', color: '#fff', border: 'none', padding: '7px', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  Deploy
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'connected' && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              {['Connector','Provider','Type','Status','Last Sync','Actions'].map(c => (
                <th key={c} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {connected.map(c => (
              <tr key={c._id}>
                <td style={{ padding: '10px 12px', fontWeight: 600 }}>{c.name}</td>
                <td style={{ padding: '10px 12px' }}>{c.provider}</td>
                <td style={{ padding: '10px 12px' }}>{c.connector_type}</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, background: c.status === 'active' ? '#d1fae5' : '#fee2e2', color: c.status === 'active' ? '#065f46' : '#991b1b' }}>{c.status}</span>
                </td>
                <td style={{ padding: '10px 12px', fontSize: 12, color: '#6b7280' }}>{c.last_sync_at ? new Date(c.last_sync_at).toLocaleString() : 'Never'}</td>
                <td style={{ padding: '10px 12px', display: 'flex', gap: 6 }}>
                  <button onClick={() => testConn(c._id)} style={{ background: '#eff6ff', color: '#1d4ed8', border: 'none', padding: '3px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>Test</button>
                  <button onClick={() => triggerSync(c._id)} style={{ background: '#f0fdf4', color: '#15803d', border: 'none', padding: '3px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>Sync</button>
                </td>
              </tr>
            ))}
            {connected.length === 0 && <tr><td colSpan={6} style={{ padding: 20, textAlign: 'center', color: '#9ca3af' }}>No connectors deployed yet</td></tr>}
          </tbody>
        </table>
      )}
    </div>
  );
}
