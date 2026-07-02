import { useState, useEffect } from 'react';

const _BASE = import.meta.env.VITE_API_URL || '/api';
const h = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}` });

export default function DeveloperPortal() {
  const [overview, setOverview] = useState(null);
  const [quickstart, setQuickstart] = useState(null);
  const [sdks, setSdks] = useState([]);
  const [changelog, setChangelog] = useState([]);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    fetch(`${_BASE}/developer-portal/overview`, { headers: h() }).then(r => r.json()).then(r => { if (r.status) setOverview(r.data); });
    fetch(`${_BASE}/developer-portal/quickstart`, { headers: h() }).then(r => r.json()).then(r => { if (r.status) setQuickstart(r.data); });
    fetch(`${_BASE}/developer-portal/sdk`, { headers: h() }).then(r => r.json()).then(r => { if (r.status) setSdks(r.data.sdks || []); });
    fetch(`${_BASE}/developer-portal/changelog`, { headers: h() }).then(r => r.json()).then(r => { if (r.status) setChangelog(r.data.versions || []); });
  }, []);

  const SDK_STATUS_COLORS = { available: '#10b981', beta: '#f59e0b', coming_soon: '#9ca3af' };

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0 }}>Developer Portal</h2>
          <p style={{ color: '#6b7280', margin: '4px 0 0' }}>Build integrations with the Local Wheels Enterprise API</p>
        </div>
        <span style={{ marginLeft: 'auto', fontSize: 12, padding: '4px 12px', background: '#eff6ff', color: '#1d4ed8', borderRadius: 20, fontWeight: 600 }}>v{overview?.platform_version || '17.0.0'}</span>
      </div>

      {overview && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
          {[['Applications', overview.applications, '#6366f1'],['API Keys', overview.active_api_keys, '#10b981'],['Webhooks', overview.active_webhooks, '#3b82f6'],['OAuth Tokens', overview.active_tokens, '#8b5cf6']].map(([l, v, c]) => (
            <div key={l} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '14px 20px', flex: 1 }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: c }}>{v}</div>
              <div style={{ color: '#6b7280', fontSize: 12 }}>{l}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[['overview','Overview'],['quickstart','Quick Start'],['sdks','SDKs'],['changelog','Changelog']].map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
            background: tab === t ? '#6366f1' : '#f3f4f6', color: tab === t ? '#fff' : '#374151', fontWeight: 600 }}>{l}</button>
        ))}
      </div>

      {tab === 'overview' && overview && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: 20 }}>
              <h4 style={{ marginBottom: 12 }}>API Information</h4>
              {[['Base URL', overview.api_base_url],['Documentation', overview.docs_url],['Auth Method', 'Bearer JWT Token']].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e5e7eb' }}>
                  <span style={{ fontSize: 13, color: '#6b7280' }}>{l}</span>
                  <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ background: '#1e1e2e', borderRadius: 10, padding: 20 }}>
              <div style={{ color: '#6b7280', fontSize: 11, marginBottom: 8 }}>Example Request</div>
              <pre style={{ color: '#a6e3a1', fontSize: 12, margin: 0, whiteSpace: 'pre-wrap' }}>
{`curl -X GET /api/gateway \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json"`}
              </pre>
            </div>
          </div>
          {overview.recent_activity?.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <h4 style={{ marginBottom: 12 }}>Recent API Activity</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    {['Method','Path','Status','Duration','Time'].map(c => (
                      <th key={c} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 12, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {overview.recent_activity.map(l => (
                    <tr key={l._id}>
                      <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: l.method === 'GET' ? '#1d4ed8' : '#15803d' }}>{l.method}</td>
                      <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: 12 }}>{l.path}</td>
                      <td style={{ padding: '8px 12px', fontFamily: 'monospace', color: l.status_code >= 400 ? '#ef4444' : '#10b981' }}>{l.status_code || '—'}</td>
                      <td style={{ padding: '8px 12px', fontSize: 12 }}>{l.duration_ms ? `${l.duration_ms}ms` : '—'}</td>
                      <td style={{ padding: '8px 12px', fontSize: 11, color: '#9ca3af' }}>{l.logged_at ? new Date(l.logged_at).toLocaleString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'quickstart' && quickstart && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div>
              <h3 style={{ marginBottom: 16 }}>Getting Started</h3>
              {quickstart.steps?.map(s => (
                <div key={s.step} style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#6366f1', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{s.step}</div>
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: 2 }}>{s.title}</div>
                    <div style={{ fontSize: 13, color: '#6b7280' }}>{s.description}</div>
                    <code style={{ fontSize: 11, color: '#8b5cf6' }}>{s.endpoint}</code>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <h3 style={{ marginBottom: 16 }}>Code Samples</h3>
              {quickstart.code_samples && Object.entries(quickstart.code_samples).map(([lang, code]) => (
                <div key={lang} style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 4, textTransform: 'capitalize' }}>{lang}</div>
                  <pre style={{ background: '#1e1e2e', color: '#a6e3a1', padding: 12, borderRadius: 8, fontSize: 12, margin: 0, overflowX: 'auto' }}>{code}</pre>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'sdks' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
          {sdks.map(sdk => (
            <div key={sdk.language} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontWeight: 700 }}>{sdk.language}</div>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12, background: SDK_STATUS_COLORS[sdk.status] + '20', color: SDK_STATUS_COLORS[sdk.status] }}>{sdk.status}</span>
              </div>
              <pre style={{ background: '#f9fafb', padding: 10, borderRadius: 6, fontSize: 12, margin: '0 0 10px' }}>{sdk.install}</pre>
              <div style={{ fontSize: 12, color: '#6b7280' }}>{sdk.repo}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'changelog' && (
        <div>
          {changelog.map(v => (
            <div key={v.version} style={{ marginBottom: 24, borderLeft: '3px solid #6366f1', paddingLeft: 20 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 16 }}>v{v.version}</span>
                <span style={{ fontSize: 12, color: '#9ca3af' }}>{v.date}</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {v.changes.map(c => <li key={c} style={{ color: '#374151', fontSize: 13, marginBottom: 4 }}>{c}</li>)}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
