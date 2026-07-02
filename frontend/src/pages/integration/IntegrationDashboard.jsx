import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const _BASE = import.meta.env.VITE_API_URL || '/api';
const h = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}` });

export default function IntegrationDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${_BASE}/integrations/dashboard`, { headers: h() })
      .then(r => r.json()).then(r => { if (r.status) setData(r.data); })
      .finally(() => setLoading(false));
  }, []);

  const cards = data ? [
    { label: 'Active Connectors',    value: data.connectors?.active ?? 0,                      color: '#10b981' },
    { label: 'Sync Jobs (30d)',       value: data.sync_jobs?.last_30_days?.total ?? 0,           color: '#6366f1' },
    { label: 'Success Rate',          value: `${data.sync_jobs?.last_30_days?.success_rate_pct ?? 0}%`, color: '#3b82f6' },
    { label: 'Webhook Deliveries',    value: data.webhooks?.deliveries_30d ?? 0,                color: '#f59e0b' },
    { label: 'Events Published',      value: data.events?.published_30d ?? 0,                   color: '#8b5cf6' },
    { label: 'Open Alerts',           value: data.alerts_open ?? 0,                             color: '#ef4444' },
  ] : [];

  const shortcuts = [
    { label: 'API Gateway',      to: '/integration/gateway',    icon: '🔗' },
    { label: 'Connectors',       to: '/integration/connectors', icon: '🔌' },
    { label: 'Webhooks',         to: '/integration/webhooks',   icon: '📡' },
    { label: 'API Keys',         to: '/integration/api-keys',   icon: '🔑' },
    { label: 'Event Bus',        to: '/integration/events',     icon: '⚡' },
    { label: 'Developer Portal', to: '/integration/developer',  icon: '👨‍💻' },
  ];

  if (loading) return <div style={{ padding: 32 }}>Loading Integration Dashboard…</div>;

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h2 style={{ marginBottom: 4 }}>Integration Platform — Dashboard</h2>
      <p style={{ color: '#666', marginBottom: 24 }}>Enterprise API Gateway, Connectors & Event Bus</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 32 }}>
        {cards.map(c => (
          <div key={c.label} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: c.color }}>{c.value}</div>
            <div style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>{c.label}</div>
          </div>
        ))}
      </div>

      <h3 style={{ marginBottom: 16 }}>Quick Actions</h3>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 32 }}>
        {shortcuts.map(s => (
          <Link key={s.to} to={s.to} style={{ textDecoration: 'none' }}>
            <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '12px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>{s.icon}</span>
              <span style={{ fontWeight: 600, color: '#111' }}>{s.label}</span>
            </div>
          </Link>
        ))}
      </div>

      {data?.recent_jobs?.length > 0 && (
        <>
          <h3 style={{ marginBottom: 12 }}>Recent Sync Jobs</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                {['Job Ref','Connector','Type','Status','Records'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.recent_jobs.map(j => (
                <tr key={j._id}>
                  <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 13 }}>{j.job_ref}</td>
                  <td style={{ padding: '10px 12px' }}>{j.connector_id?.name || '—'}</td>
                  <td style={{ padding: '10px 12px' }}>{j.job_type}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                      background: j.status === 'completed' ? '#d1fae5' : j.status === 'failed' ? '#fee2e2' : '#fef3c7',
                      color: j.status === 'completed' ? '#065f46' : j.status === 'failed' ? '#991b1b' : '#92400e' }}>
                      {j.status}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px' }}>{j.records_synced ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
