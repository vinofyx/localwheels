import { useState, useEffect } from 'react';

const _BASE = import.meta.env.VITE_API_URL || '/api';
const h = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}` });

const TYPES = ['internal','partner','public','developer'];

export default function APIGateway() {
  const [apps, setApps] = useState([]);
  const [overview, setOverview] = useState(null);
  const [tab, setTab] = useState('list');
  const [form, setForm] = useState({ name: '', description: '', app_type: 'internal', contact_email: '', rate_limit: 1000 });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const load = () => {
    fetch(`${_BASE}/gateway`, { headers: h() }).then(r => r.json()).then(r => { if (r.status) setApps(r.data.applications || []); });
    fetch(`${_BASE}/gateway/stats/overview`, { headers: h() }).then(r => r.json()).then(r => { if (r.status) setOverview(r.data); });
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true); setMsg('');
    const r = await fetch(`${_BASE}/gateway`, { method: 'POST', headers: { ...h(), 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const d = await r.json();
    setSaving(false);
    if (d.status) { setMsg('Application created!'); setForm({ name: '', description: '', app_type: 'internal', contact_email: '', rate_limit: 1000 }); setTab('list'); load(); }
    else setMsg(d.message);
  };

  const del = async (id) => {
    if (!confirm('Delete this application?')) return;
    await fetch(`${_BASE}/gateway/${id}`, { method: 'DELETE', headers: h() });
    load();
  };

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h2>API Gateway — Applications</h2>
      {overview && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
          {[['Apps', overview.total_applications], ['Active Keys', overview.active_api_keys]].map(([l, v]) => (
            <div key={l} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '12px 20px' }}>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{v}</div>
              <div style={{ color: '#6b7280', fontSize: 12 }}>{l}</div>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['list','create'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
            background: tab === t ? '#6366f1' : '#f3f4f6', color: tab === t ? '#fff' : '#374151', fontWeight: 600 }}>
            {t === 'list' ? 'Applications' : '+ New App'}
          </button>
        ))}
      </div>

      {tab === 'list' && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              {['Name','Type','Status','Rate Limit','Actions'].map(c => (
                <th key={c} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {apps.map(a => (
              <tr key={a._id}>
                <td style={{ padding: '10px 12px', fontWeight: 600 }}>{a.name}</td>
                <td style={{ padding: '10px 12px' }}>{a.app_type}</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, background: a.status === 'active' ? '#d1fae5' : '#fee2e2', color: a.status === 'active' ? '#065f46' : '#991b1b' }}>
                    {a.status}
                  </span>
                </td>
                <td style={{ padding: '10px 12px' }}>{a.rate_limit?.toLocaleString()}/min</td>
                <td style={{ padding: '10px 12px' }}>
                  <button onClick={() => del(a._id)} style={{ background: '#fee2e2', color: '#991b1b', border: 'none', padding: '4px 10px', borderRadius: 4, cursor: 'pointer' }}>Delete</button>
                </td>
              </tr>
            ))}
            {apps.length === 0 && <tr><td colSpan={5} style={{ padding: 20, textAlign: 'center', color: '#9ca3af' }}>No applications yet</td></tr>}
          </tbody>
        </table>
      )}

      {tab === 'create' && (
        <div style={{ maxWidth: 500 }}>
          {msg && <div style={{ background: '#d1fae5', padding: 10, borderRadius: 6, marginBottom: 12 }}>{msg}</div>}
          {[['name','Name *'],['description','Description'],['contact_email','Contact Email']].map(([k, l]) => (
            <div key={k} style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 600 }}>{l}</label>
              <input value={form[k]} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6 }} />
            </div>
          ))}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 600 }}>App Type</label>
            <select value={form.app_type} onChange={e => setForm(p => ({ ...p, app_type: e.target.value }))}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6 }}>
              {TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Rate Limit (req/min)</label>
            <input type="number" value={form.rate_limit} onChange={e => setForm(p => ({ ...p, rate_limit: +e.target.value }))}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6 }} />
          </div>
          <button onClick={save} disabled={saving} style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
            {saving ? 'Creating…' : 'Create Application'}
          </button>
        </div>
      )}
    </div>
  );
}
