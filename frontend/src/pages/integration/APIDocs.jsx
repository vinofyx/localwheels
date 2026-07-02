import { useState, useEffect } from 'react';

const _BASE = import.meta.env.VITE_API_URL || '/api';
const h = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}` });

const METHOD_COLORS = { GET: '#eff6ff', POST: '#f0fdf4', PUT: '#fef3c7', DELETE: '#fee2e2', PATCH: '#fdf4ff' };
const METHOD_TEXT   = { GET: '#1d4ed8', POST: '#15803d', PUT: '#92400e', DELETE: '#991b1b', PATCH: '#7c3aed' };

export default function APIDocs() {
  const [docs, setDocs] = useState(null);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    fetch(`${_BASE}/api-docs`, { headers: h() }).then(r => r.json()).then(r => { if (r.status) setDocs(r.data); });
  }, []);

  const filtered = docs?.modules?.filter(m => m.module.toLowerCase().includes(search.toLowerCase()) || m.base.toLowerCase().includes(search.toLowerCase())) || [];

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ marginBottom: 4 }}>API Documentation</h2>
        {docs && <p style={{ color: '#6b7280', margin: 0 }}>{docs.title} — {docs.total_modules} modules — Auth: {docs.authentication}</p>}
      </div>

      {docs && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '12px 20px' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#6366f1' }}>{docs.total_modules}</div>
            <div style={{ color: '#6b7280', fontSize: 12 }}>API Modules</div>
          </div>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '12px 20px' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#10b981' }}>{docs.modules?.reduce((a, m) => a + (m.endpoints?.length || 0), 0)}</div>
            <div style={{ color: '#6b7280', fontSize: 12 }}>Total Endpoints</div>
          </div>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '12px 20px' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#3b82f6' }}>{docs.version}</div>
            <div style={{ color: '#6b7280', fontSize: 12 }}>Version</div>
          </div>
        </div>
      )}

      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search modules or endpoints…"
        style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, marginBottom: 20 }} />

      <div style={{ display: 'grid', gap: 8 }}>
        {filtered.map(m => (
          <div key={m.module} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
            <button onClick={() => setExpanded(expanded === m.module ? null : m.module)}
              style={{ width: '100%', padding: '14px 18px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontWeight: 700 }}>{m.module}</span>
                <code style={{ fontSize: 12, color: '#6b7280', background: '#f3f4f6', padding: '2px 8px', borderRadius: 4 }}>{m.base}</code>
                <span style={{ fontSize: 11, color: '#9ca3af' }}>{m.endpoints?.length} endpoints</span>
              </div>
              <span style={{ color: '#9ca3af' }}>{expanded === m.module ? '▲' : '▼'}</span>
            </button>

            {expanded === m.module && (
              <div style={{ borderTop: '1px solid #e5e7eb', padding: '8px 18px 14px' }}>
                {m.endpoints?.map((ep, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < m.endpoints.length-1 ? '1px solid #f3f4f6' : 'none' }}>
                    <span style={{ padding: '3px 8px', borderRadius: 5, fontSize: 11, fontWeight: 700, background: METHOD_COLORS[ep.m] || '#f3f4f6', color: METHOD_TEXT[ep.m] || '#374151', minWidth: 52, textAlign: 'center' }}>{ep.m}</span>
                    <code style={{ fontSize: 13, color: '#1e293b' }}>{m.base}{ep.p}</code>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
