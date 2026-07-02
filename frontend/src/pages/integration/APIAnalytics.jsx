import { useState, useEffect } from 'react';

const _BASE = import.meta.env.VITE_API_URL || '/api';
const h = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}` });

export default function APIAnalytics() {
  const [dashboard, setDashboard] = useState(null);
  const [history, setHistory] = useState([]);
  const [insights, setInsights] = useState([]);
  const [tab, setTab] = useState('overview');
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [snapping, setSnapping] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch(`${_BASE}/integration-analytics/dashboard`, { headers: h() }).then(r => r.json()).then(r => { if (r.status) setDashboard(r.data); });
    fetch(`${_BASE}/integration-analytics/history?limit=14`, { headers: h() }).then(r => r.json()).then(r => { if (r.status) setHistory(r.data.history || []); });
  }, []);

  const getInsights = async () => {
    setLoadingInsights(true);
    const r = await fetch(`${_BASE}/integration-analytics/ai-insights`, { method: 'POST', headers: { ...h(), 'Content-Type': 'application/json' }, body: '{}' });
    const d = await r.json();
    setLoadingInsights(false);
    if (d.status) setInsights(d.data.insights || []);
  };

  const snap = async () => {
    setSnapping(true);
    const r = await fetch(`${_BASE}/integration-analytics/snapshot`, { method: 'POST', headers: { ...h(), 'Content-Type': 'application/json' }, body: '{}' });
    const d = await r.json();
    setSnapping(false);
    setMsg(d.status ? '✅ Snapshot saved' : `❌ ${d.message}`);
  };

  const PRIORITY_COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' };

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>Integration Analytics</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          {msg && <span style={{ fontSize: 13, color: '#10b981', lineHeight: '36px' }}>{msg}</span>}
          <button onClick={snap} disabled={snapping} style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #d1fae5', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
            {snapping ? 'Saving…' : '📸 Snapshot'}
          </button>
          <button onClick={getInsights} disabled={loadingInsights} style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
            {loadingInsights ? '🤖 Analyzing…' : '🤖 AI Insights'}
          </button>
        </div>
      </div>

      {insights.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h4 style={{ marginBottom: 10 }}>AI Integration Insights</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            {insights.map((ins, i) => (
              <div key={i} style={{ background: '#fff', border: `1px solid ${PRIORITY_COLORS[ins.priority]}40`, borderLeft: `4px solid ${PRIORITY_COLORS[ins.priority]}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: PRIORITY_COLORS[ins.priority], marginBottom: 6, textTransform: 'uppercase' }}>{ins.priority}</div>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>{ins.insight}</div>
                <div style={{ fontSize: 13, color: '#6b7280' }}>{ins.recommendation}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[['overview','Overview'],['connectors','Connectors'],['webhooks','Webhooks'],['events','Events'],['history','History (14d)']].map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
            background: tab === t ? '#6366f1' : '#f3f4f6', color: tab === t ? '#fff' : '#374151', fontWeight: 600 }}>{l}</button>
        ))}
      </div>

      {tab === 'overview' && dashboard && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          {[
            ['Active Connectors', dashboard.connectors?.active, '#10b981'],
            ['Sync Jobs (30d)',    dashboard.sync_jobs?.last_30_days?.total, '#6366f1'],
            ['Sync Success Rate', `${dashboard.sync_jobs?.last_30_days?.success_rate_pct ?? 0}%`, '#3b82f6'],
            ['Webhook Deliveries (30d)', dashboard.webhooks?.deliveries_30d, '#f59e0b'],
            ['Webhook Success Rate', `${dashboard.webhooks?.delivery_success_rate ?? 0}%`, '#8b5cf6'],
            ['Events Published (30d)', dashboard.events?.published_30d, '#ec4899'],
          ].map(([l, v, c]) => (
            <div key={l} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 20 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: c }}>{v ?? 0}</div>
              <div style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>{l}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'history' && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              {['Date','Sync Jobs','Completed','Webhook Deliveries','Events Published','Connectors Active'].map(c => (
                <th key={c} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {history.map(h => (
              <tr key={h._id}>
                <td style={{ padding: '10px 12px', fontWeight: 600 }}>{h.period_date ? new Date(h.period_date).toLocaleDateString() : '—'}</td>
                <td style={{ padding: '10px 12px' }}>{h.sync_jobs_total ?? 0}</td>
                <td style={{ padding: '10px 12px' }}>{h.sync_jobs_success ?? 0}</td>
                <td style={{ padding: '10px 12px' }}>{h.webhook_deliveries ?? 0}</td>
                <td style={{ padding: '10px 12px' }}>{h.events_published ?? 0}</td>
                <td style={{ padding: '10px 12px' }}>{h.connectors_active ?? 0}</td>
              </tr>
            ))}
            {history.length === 0 && <tr><td colSpan={6} style={{ padding: 20, textAlign: 'center', color: '#9ca3af' }}>No history yet — save a snapshot first</td></tr>}
          </tbody>
        </table>
      )}

      {(tab === 'connectors' || tab === 'webhooks' || tab === 'events') && dashboard && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          {tab === 'connectors' && [
            ['Active', dashboard.connectors?.active, '#10b981'],
          ].map(([l, v, c]) => (
            <div key={l} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 20 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: c }}>{v ?? 0}</div>
              <div style={{ color: '#6b7280', fontSize: 13 }}>{l}</div>
            </div>
          ))}
          {tab === 'webhooks' && [
            ['Total', dashboard.webhooks?.total, '#6366f1'],
            ['Active', dashboard.webhooks?.active, '#10b981'],
            ['Deliveries (30d)', dashboard.webhooks?.deliveries_30d, '#3b82f6'],
            ['Success Rate', `${dashboard.webhooks?.delivery_success_rate ?? 0}%`, '#f59e0b'],
          ].map(([l, v, c]) => (
            <div key={l} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 20 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: c }}>{v ?? 0}</div>
              <div style={{ color: '#6b7280', fontSize: 13 }}>{l}</div>
            </div>
          ))}
          {tab === 'events' && [
            ['Published (30d)', dashboard.events?.published_30d, '#8b5cf6'],
            ['Delivered (30d)', dashboard.events?.delivered_30d, '#10b981'],
            ['Delivery Rate', `${dashboard.events?.delivery_rate ?? 0}%`, '#3b82f6'],
          ].map(([l, v, c]) => (
            <div key={l} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 20 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: c }}>{v ?? 0}</div>
              <div style={{ color: '#6b7280', fontSize: 13 }}>{l}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
