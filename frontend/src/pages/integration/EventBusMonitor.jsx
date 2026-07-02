import { useState, useEffect, useRef } from 'react';

const _BASE = import.meta.env.VITE_API_URL || '/api';
const h = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}` });

const STATUS_COLORS = { delivered: '#10b981', pending: '#f59e0b', failed: '#ef4444', dead_letter: '#6b7280' };

export default function EventBusMonitor() {
  const [events, setEvents] = useState([]);
  const [subs, setSubs] = useState([]);
  const [stats, setStats] = useState(null);
  const [tab, setTab] = useState('events');
  const [form, setForm] = useState({ event_type: 'shipment.created', source: 'manual', payload: '{}' });
  const [subForm, setSubForm] = useState({ name: '', event_types: '', subscriber_type: 'webhook' });
  const [publishing, setPublishing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const timerRef = useRef(null);

  const load = () => {
    fetch(`${_BASE}/events?limit=30`, { headers: h() }).then(r => r.json()).then(r => { if (r.status) setEvents(r.data.events || []); });
    fetch(`${_BASE}/events/stats`, { headers: h() }).then(r => r.json()).then(r => { if (r.status) setStats(r.data); });
    fetch(`${_BASE}/events/subscriptions`, { headers: h() }).then(r => r.json()).then(r => { if (r.status) setSubs(r.data.subscriptions || []); });
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (autoRefresh) { timerRef.current = setInterval(load, 10000); }
    else { clearInterval(timerRef.current); }
    return () => clearInterval(timerRef.current);
  }, [autoRefresh]);

  const publish = async () => {
    setPublishing(true);
    let payload;
    try { payload = JSON.parse(form.payload); } catch { payload = { raw: form.payload }; }
    const r = await fetch(`${_BASE}/events`, { method: 'POST', headers: { ...h(), 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, payload }) });
    const d = await r.json();
    setPublishing(false);
    if (d.status) { load(); setTab('events'); } else alert(d.message);
  };

  const deleteSub = async (id) => {
    if (!confirm('Delete subscription?')) return;
    await fetch(`${_BASE}/events/subscriptions/${id}`, { method: 'DELETE', headers: h() });
    load();
  };

  const addSub = async () => {
    const body = { ...subForm, event_types: subForm.event_types.split(',').map(s => s.trim()).filter(Boolean) };
    const r = await fetch(`${_BASE}/events/subscriptions`, { method: 'POST', headers: { ...h(), 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const d = await r.json();
    if (d.status) { setSubForm({ name: '', event_types: '', subscriber_type: 'webhook' }); load(); }
    else alert(d.message);
  };

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>Event Bus Monitor</h2>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
          <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} />
          <span style={{ fontSize: 13 }}>Auto-refresh (10s)</span>
        </label>
      </div>

      {stats && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          {[['Total', stats.total, '#6366f1'],['Delivered', stats.delivered, '#10b981'],['Failed', stats.failed, '#ef4444'],['Dead Letter', stats.dead_letter, '#6b7280'],['Subscriptions', stats.active_subscriptions, '#3b82f6']].map(([l, v, c]) => (
            <div key={l} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '12px 18px', flex: 1 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: c }}>{v}</div>
              <div style={{ color: '#6b7280', fontSize: 12 }}>{l}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[['events','Events'],['publish','Publish'],['subscriptions','Subscriptions']].map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
            background: tab === t ? '#6366f1' : '#f3f4f6', color: tab === t ? '#fff' : '#374151', fontWeight: 600 }}>{l}</button>
        ))}
      </div>

      {tab === 'events' && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              {['Event ID','Type','Source','Status','Subscribers','Published At'].map(c => (
                <th key={c} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {events.map(e => (
              <tr key={e._id}>
                <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 11, color: '#6b7280' }}>{e.event_id}</td>
                <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 13, fontWeight: 600 }}>{e.event_type}</td>
                <td style={{ padding: '10px 12px' }}>{e.source}</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, background: STATUS_COLORS[e.status] + '20', color: STATUS_COLORS[e.status], fontWeight: 600 }}>{e.status}</span>
                </td>
                <td style={{ padding: '10px 12px' }}>{e.subscribers?.length ?? 0}</td>
                <td style={{ padding: '10px 12px', fontSize: 12, color: '#6b7280' }}>{e.published_at ? new Date(e.published_at).toLocaleString() : '—'}</td>
              </tr>
            ))}
            {events.length === 0 && <tr><td colSpan={6} style={{ padding: 20, textAlign: 'center', color: '#9ca3af' }}>No events yet</td></tr>}
          </tbody>
        </table>
      )}

      {tab === 'publish' && (
        <div style={{ maxWidth: 480 }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Event Type</label>
            <input value={form.event_type} onChange={e => setForm(p => ({ ...p, event_type: e.target.value }))}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6 }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Source</label>
            <input value={form.source} onChange={e => setForm(p => ({ ...p, source: e.target.value }))}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6 }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Payload (JSON)</label>
            <textarea value={form.payload} onChange={e => setForm(p => ({ ...p, payload: e.target.value }))} rows={5}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontFamily: 'monospace' }} />
          </div>
          <button onClick={publish} disabled={publishing} style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
            {publishing ? 'Publishing…' : '⚡ Publish Event'}
          </button>
        </div>
      )}

      {tab === 'subscriptions' && (
        <div>
          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, marginBottom: 20 }}>
            <h4 style={{ marginBottom: 12 }}>Add Subscription</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 8, alignItems: 'end' }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 3 }}>Name</label>
                <input value={subForm.name} onChange={e => setSubForm(p => ({ ...p, name: e.target.value }))} style={{ width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: 5 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 3 }}>Event Types (comma)</label>
                <input value={subForm.event_types} onChange={e => setSubForm(p => ({ ...p, event_types: e.target.value }))} style={{ width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: 5 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 3 }}>Type</label>
                <select value={subForm.subscriber_type} onChange={e => setSubForm(p => ({ ...p, subscriber_type: e.target.value }))} style={{ width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: 5 }}>
                  {['webhook','automation','internal','email'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <button onClick={addSub} style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '7px 14px', borderRadius: 5, cursor: 'pointer', fontWeight: 600 }}>Add</button>
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                {['Name','Type','Events','Deliveries','Actions'].map(c => (
                  <th key={c} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {subs.map(s => (
                <tr key={s._id}>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>{s.name}</td>
                  <td style={{ padding: '10px 12px' }}>{s.subscriber_type}</td>
                  <td style={{ padding: '10px 12px', fontSize: 12 }}>{s.event_types?.join(', ')}</td>
                  <td style={{ padding: '10px 12px' }}>{s.delivery_count ?? 0}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <button onClick={() => deleteSub(s._id)} style={{ background: '#fee2e2', color: '#991b1b', border: 'none', padding: '3px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>Delete</button>
                  </td>
                </tr>
              ))}
              {subs.length === 0 && <tr><td colSpan={5} style={{ padding: 20, textAlign: 'center', color: '#9ca3af' }}>No subscriptions</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
