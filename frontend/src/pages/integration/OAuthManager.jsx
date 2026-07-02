import { useState, useEffect } from 'react';

const _BASE = import.meta.env.VITE_API_URL || '/api';
const h = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}` });

export default function OAuthManager() {
  const [tokens, setTokens] = useState([]);
  const [apps, setApps] = useState([]);
  const [scopes, setScopes] = useState([]);
  const [tab, setTab] = useState('tokens');
  const [form, setForm] = useState({ application_id: '', scopes: [] });
  const [rawToken, setRawToken] = useState(null);
  const [issuing, setIssuing] = useState(false);

  const load = () => {
    fetch(`${_BASE}/oauth/tokens`, { headers: h() }).then(r => r.json()).then(r => { if (r.status) setTokens(r.data.tokens || []); });
    fetch(`${_BASE}/gateway`, { headers: h() }).then(r => r.json()).then(r => { if (r.status) setApps(r.data.applications || []); });
    fetch(`${_BASE}/oauth/scopes`, { headers: h() }).then(r => r.json()).then(r => { if (r.status) setScopes(r.data.scopes || []); });
  };
  useEffect(() => { load(); }, []);

  const toggleScope = (s) => {
    setForm(p => ({ ...p, scopes: p.scopes.includes(s) ? p.scopes.filter(x => x !== s) : [...p.scopes, s] }));
  };

  const issue = async () => {
    if (!form.application_id) return alert('Select an application');
    setIssuing(true);
    const r = await fetch(`${_BASE}/oauth/token`, { method: 'POST', headers: { ...h(), 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const d = await r.json();
    setIssuing(false);
    if (d.status) { setRawToken(d.data); load(); setTab('tokens'); setForm({ application_id: '', scopes: [] }); }
    else alert(d.message);
  };

  const revoke = async (id) => {
    if (!confirm('Revoke this token?')) return;
    await fetch(`${_BASE}/oauth/revoke`, { method: 'POST', headers: { ...h(), 'Content-Type': 'application/json' }, body: JSON.stringify({ token_id: id }) });
    load();
  };

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h2>OAuth 2.0 Manager</h2>
      <p style={{ color: '#6b7280', marginBottom: 20 }}>Manage OAuth tokens and application scopes for the Local Wheels API</p>

      {rawToken && (
        <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 8, padding: 16, marginBottom: 20 }}>
          <strong>⚠️ Save your access token — it won't be shown again:</strong>
          <div style={{ fontFamily: 'monospace', fontSize: 13, marginTop: 8, padding: 10, background: '#fff', borderRadius: 6, wordBreak: 'break-all' }}>
            {rawToken.access_token}
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: '#6b7280' }}>
            Token type: {rawToken.token_type} · Expires in: {rawToken.expires_in}s · Scopes: {rawToken.scopes?.join(', ')}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button onClick={() => navigator.clipboard.writeText(rawToken.access_token)} style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>Copy Token</button>
            <button onClick={() => setRawToken(null)} style={{ background: '#f59e0b', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>Dismiss</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[['tokens','Active Tokens'],['issue','Issue Token'],['scopes','Available Scopes']].map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
            background: tab === t ? '#6366f1' : '#f3f4f6', color: tab === t ? '#fff' : '#374151', fontWeight: 600 }}>{l}</button>
        ))}
      </div>

      {tab === 'tokens' && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              {['App','Type','Scopes','Expires','Issued At','Actions'].map(c => (
                <th key={c} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tokens.map(t => (
              <tr key={t._id}>
                <td style={{ padding: '10px 12px' }}>{t.application_id ? apps.find(a => a._id === t.application_id)?.name || 'App' : '—'}</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, background: '#eff6ff', color: '#1d4ed8' }}>{t.token_type}</span>
                </td>
                <td style={{ padding: '10px 12px', fontSize: 12 }}>{t.scopes?.slice(0,2).join(', ')}{t.scopes?.length > 2 ? ` +${t.scopes.length-2}` : ''}</td>
                <td style={{ padding: '10px 12px', fontSize: 12 }}>{t.expires_at ? new Date(t.expires_at).toLocaleString() : '—'}</td>
                <td style={{ padding: '10px 12px', fontSize: 12, color: '#6b7280' }}>{new Date(t.createdAt).toLocaleString()}</td>
                <td style={{ padding: '10px 12px' }}>
                  <button onClick={() => revoke(t._id)} style={{ background: '#fee2e2', color: '#991b1b', border: 'none', padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>Revoke</button>
                </td>
              </tr>
            ))}
            {tokens.length === 0 && <tr><td colSpan={6} style={{ padding: 20, textAlign: 'center', color: '#9ca3af' }}>No active tokens</td></tr>}
          </tbody>
        </table>
      )}

      {tab === 'issue' && (
        <div style={{ maxWidth: 520 }}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Application *</label>
            <select value={form.application_id} onChange={e => setForm(p => ({ ...p, application_id: e.target.value }))}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6 }}>
              <option value="">Select application…</option>
              {apps.map(a => <option key={a._id} value={a._id}>{a.name} ({a.app_type})</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Scopes</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {scopes.map(s => (
                <button key={s} onClick={() => toggleScope(s)} style={{
                  padding: '3px 10px', borderRadius: 12, border: '1px solid', cursor: 'pointer', fontSize: 11,
                  background: form.scopes.includes(s) ? '#6366f1' : '#f9fafb',
                  color: form.scopes.includes(s) ? '#fff' : '#374151',
                  borderColor: form.scopes.includes(s) ? '#6366f1' : '#d1d5db',
                }}>{s}</button>
              ))}
            </div>
          </div>
          <button onClick={issue} disabled={issuing} style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
            {issuing ? 'Issuing…' : 'Issue Access Token'}
          </button>
        </div>
      )}

      {tab === 'scopes' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
          {scopes.map(s => {
            const [resource, action] = s.split(':');
            return (
              <div key={s} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 14px' }}>
                <code style={{ fontSize: 13, fontWeight: 700, color: '#6366f1' }}>{s}</code>
                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{action === 'read' ? 'Read-only access' : action === 'write' ? 'Read & write access' : 'Full admin access'} to {resource}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
