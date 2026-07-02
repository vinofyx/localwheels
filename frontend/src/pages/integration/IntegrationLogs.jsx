import { useState, useEffect } from 'react';

const _BASE = import.meta.env.VITE_API_URL || '/api';
const h = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}` });

export default function IntegrationLogs() {
  const [logs, setLogs] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState(null);
  const [tab, setTab] = useState('logs');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [methodFilter, setMethodFilter] = useState('');

  const loadLogs = (p = 1) => {
    const params = new URLSearchParams({ page: p, limit: 30 });
    if (methodFilter) params.set('method', methodFilter);
    fetch(`${_BASE}/api-monitoring/logs?${params}`, { headers: h() }).then(r => r.json()).then(r => {
      if (r.status) { setLogs(r.data.logs || []); setTotal(r.data.total || 0); }
    });
  };

  useEffect(() => {
    loadLogs(1);
    fetch(`${_BASE}/api-monitoring/stats`, { headers: h() }).then(r => r.json()).then(r => { if (r.status) setStats(r.data); });
    fetch(`${_BASE}/integrations/alerts?status=open`, { headers: h() }).then(r => r.json()).then(r => { if (r.status) setAlerts(r.data.alerts || []); });
  }, [methodFilter]);

  const ackAlert = async (id) => {
    await fetch(`${_BASE}/integrations/alerts/${id}/acknowledge`, { method: 'PUT', headers: h() });
    fetch(`${_BASE}/integrations/alerts?status=open`, { headers: h() }).then(r => r.json()).then(r => { if (r.status) setAlerts(r.data.alerts || []); });
  };

  const SEV_COLORS = { critical: '#ef4444', high: '#f59e0b', medium: '#6366f1', low: '#10b981' };

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h2>Integration Logs & Alerts</h2>

      {stats && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          {[['Requests (30d)', stats.total_requests],['Errors', stats.error_count],['Avg Latency', `${stats.avg_latency_ms}ms`],['Active Keys', stats.active_api_keys]].map(([l, v]) => (
            <div key={l} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '12px 18px', flex: 1 }}>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{v}</div>
              <div style={{ color: '#6b7280', fontSize: 12 }}>{l}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[['logs','API Logs'],['alerts',`Alerts (${alerts.length})`]].map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
            background: tab === t ? '#6366f1' : '#f3f4f6', color: tab === t ? '#fff' : '#374151', fontWeight: 600 }}>{l}</button>
        ))}
      </div>

      {tab === 'logs' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {['','GET','POST','PUT','DELETE'].map(m => (
              <button key={m} onClick={() => { setMethodFilter(m); setPage(1); }} style={{ padding: '4px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12,
                background: methodFilter === m ? '#6366f1' : '#f3f4f6', color: methodFilter === m ? '#fff' : '#374151' }}>{m || 'All'}</button>
            ))}
            <span style={{ fontSize: 12, color: '#9ca3af', lineHeight: '28px', marginLeft: 'auto' }}>Total: {total}</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                {['Method','Path','Status','Duration','IP','Time'].map(c => (
                  <th key={c} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map(l => (
                <tr key={l._id}>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 11, padding: '2px 6px', borderRadius: 4,
                      background: l.method === 'GET' ? '#eff6ff' : l.method === 'POST' ? '#f0fdf4' : l.method === 'DELETE' ? '#fee2e2' : '#fef3c7',
                      color: l.method === 'GET' ? '#1d4ed8' : l.method === 'POST' ? '#15803d' : l.method === 'DELETE' ? '#991b1b' : '#92400e' }}>{l.method}</span>
                  </td>
                  <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 12, maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.path}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: (l.status_code >= 400) ? '#ef4444' : '#10b981' }}>{l.status_code || '—'}</span>
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: 12 }}>{l.duration_ms ? `${l.duration_ms}ms` : '—'}</td>
                  <td style={{ padding: '10px 12px', fontSize: 12, color: '#6b7280' }}>{l.ip_address || '—'}</td>
                  <td style={{ padding: '10px 12px', fontSize: 12, color: '#6b7280' }}>{l.logged_at ? new Date(l.logged_at).toLocaleString() : '—'}</td>
                </tr>
              ))}
              {logs.length === 0 && <tr><td colSpan={6} style={{ padding: 20, textAlign: 'center', color: '#9ca3af' }}>No logs yet</td></tr>}
            </tbody>
          </table>
          {total > 30 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
              <button disabled={page === 1} onClick={() => { setPage(p => p-1); loadLogs(page-1); }} style={{ padding: '5px 14px', border: '1px solid #d1d5db', borderRadius: 5, cursor: 'pointer', background: '#fff' }}>← Prev</button>
              <span style={{ lineHeight: '30px', fontSize: 13 }}>Page {page} of {Math.ceil(total/30)}</span>
              <button disabled={page >= Math.ceil(total/30)} onClick={() => { setPage(p => p+1); loadLogs(page+1); }} style={{ padding: '5px 14px', border: '1px solid #d1d5db', borderRadius: 5, cursor: 'pointer', background: '#fff' }}>Next →</button>
            </div>
          )}
        </div>
      )}

      {tab === 'alerts' && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              {['Type','Severity','Title','Message','Time','Action'].map(c => (
                <th key={c} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {alerts.map(a => (
              <tr key={a._id}>
                <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 12 }}>{a.alert_type}</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: SEV_COLORS[a.severity] + '20', color: SEV_COLORS[a.severity] }}>{a.severity}</span>
                </td>
                <td style={{ padding: '10px 12px', fontWeight: 600 }}>{a.title}</td>
                <td style={{ padding: '10px 12px', fontSize: 12, color: '#6b7280', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.message}</td>
                <td style={{ padding: '10px 12px', fontSize: 12, color: '#6b7280' }}>{new Date(a.createdAt).toLocaleString()}</td>
                <td style={{ padding: '10px 12px' }}>
                  <button onClick={() => ackAlert(a._id)} style={{ background: '#eff6ff', color: '#1d4ed8', border: 'none', padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>Acknowledge</button>
                </td>
              </tr>
            ))}
            {alerts.length === 0 && <tr><td colSpan={6} style={{ padding: 20, textAlign: 'center', color: '#9ca3af' }}>No open alerts</td></tr>}
          </tbody>
        </table>
      )}
    </div>
  );
}
