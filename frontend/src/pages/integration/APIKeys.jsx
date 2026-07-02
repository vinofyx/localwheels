import { useState, useEffect } from 'react';

const _BASE = import.meta.env.VITE_API_URL || '/api';
const h = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}` });

export default function APIKeys() {
  const [keys, setKeys] = useState([]);
  const [tab, setTab] = useState('list');
  const [form, setForm] = useState({ name: '', environment: 'production', rate_limit: 1000, expires_in_days: '' });
  const [rawKey, setRawKey] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const load = () => {
    fetch(`${_BASE}/api-keys`, { headers: h() }).then(r => r.json()).then(r => { if (r.status) setKeys(r.data.keys || []); });
  };
  useEffect(() => { load(); }, []);

  const generate = async () => {
    setSaving(true); setMsg('');
    const body = { ...form };
    if (body.expires_in_days) body.expires_at = new Date(Date.now() + body.expires_in_days * 86400000).toISOString();
    delete body.expires_in_days;

    const r = await fetch(`${_BASE}/api-keys`, { method: 'POST', headers: { ...h(), 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const d = await r.json();
    setSaving(false);
    if (d.status) { setRawKey(d.data.raw_key); setForm({ name: '', environment: 'production', rate_limit: 1000, expires_in_days: '' }); setTab('list'); load(); }
    else setMsg(d.message);
  };

  const revoke = async (id) => {
    if (!confirm('Revoke this API key?')) return;
    await fetch(`${_BASE}/api-keys/${id}/revoke`, { method: 'PUT', headers: h() });
    load();
  };

  const rotate = async (id) => {
    if (!confirm('Rotate this key? The current key will be revoked and a new one generated.')) return;
    const r = await fetch(`${_BASE}/api-keys/${id}/rotate`, { method: 'POST', headers: h() });
    const d = await r.json();
    if (d.status) { setRawKey(d.data.new_key.raw_key); load(); }
  };

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h2>API Keys</h2>

      {rawKey && (
        <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 8, padding: 16, marginBottom: 20 }}>
          <strong>⚠️ Copy your API key — it won't be shown again:</strong>
          <div style={{ fontFamily: 'monospace', fontSize: 13, marginTop: 8, padding: 8, background: '#fff', borderRadius: 4, wordBreak: 'break-all' }}>
            {rawKey}
          </div>
          <button onClick={() => { navigator.clipboard.writeText(rawKey); }} style={{ marginTop: 8, marginRight: 8, background: '#6366f1', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: 4, cursor: 'pointer' }}>Copy</button>
          <button onClick={() => setRawKey(null)} style={{ marginTop: 8, background: '#f59e0b', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: 4, cursor: 'pointer' }}>Dismiss</button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[['list','API Keys'],['create','+ Generate Key']].map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
            background: tab === t ? '#6366f1' : '#f3f4f6', color: tab === t ? '#fff' : '#374151', fontWeight: 600 }}>{l}</button>
        ))}
      </div>

      {tab === 'list' && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              {['Name','Prefix','Environment','Status','Expires','Actions'].map(c => (
                <th key={c} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {keys.map(k => (
              <tr key={k._id}>
                <td style={{ padding: '10px 12px', fontWeight: 600 }}>{k.name}</td>
                <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 13 }}>{k.key_prefix}…</td>
                <td style={{ padding: '10px 12px' }}>{k.environment}</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, background: k.status === 'active' ? '#d1fae5' : '#fee2e2', color: k.status === 'active' ? '#065f46' : '#991b1b' }}>{k.status}</span>
                </td>
                <td style={{ padding: '10px 12px', fontSize: 12, color: '#6b7280' }}>{k.expires_at ? new Date(k.expires_at).toLocaleDateString() : 'Never'}</td>
                <td style={{ padding: '10px 12px', display: 'flex', gap: 6 }}>
                  {k.status === 'active' && <>
                    <button onClick={() => rotate(k._id)} style={{ background: '#eff6ff', color: '#1d4ed8', border: 'none', padding: '3px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>Rotate</button>
                    <button onClick={() => revoke(k._id)} style={{ background: '#fee2e2', color: '#991b1b', border: 'none', padding: '3px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>Revoke</button>
                  </>}
                </td>
              </tr>
            ))}
            {keys.length === 0 && <tr><td colSpan={6} style={{ padding: 20, textAlign: 'center', color: '#9ca3af' }}>No API keys yet</td></tr>}
          </tbody>
        </table>
      )}

      {tab === 'create' && (
        <div style={{ maxWidth: 460 }}>
          {msg && <div style={{ background: '#fee2e2', padding: 10, borderRadius: 6, marginBottom: 12 }}>{msg}</div>}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Key Name *</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6 }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Environment</label>
            <select value={form.environment} onChange={e => setForm(p => ({ ...p, environment: e.target.value }))}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6 }}>
              {['production','staging','development'].map(e => <option key={e}>{e}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Rate Limit (req/min)</label>
            <input type="number" value={form.rate_limit} onChange={e => setForm(p => ({ ...p, rate_limit: +e.target.value }))}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6 }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Expires In (days, blank = never)</label>
            <input type="number" value={form.expires_in_days} onChange={e => setForm(p => ({ ...p, expires_in_days: e.target.value }))}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6 }} />
          </div>
          <button onClick={generate} disabled={saving} style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
            {saving ? 'Generating…' : 'Generate API Key'}
          </button>
        </div>
      )}
    </div>
  );
}
