import { useState, useEffect } from 'react';

const _BASE = import.meta.env.VITE_API_URL || '/api';
const h = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}` });

const EVENT_OPTS = [
  'shipment.created','shipment.delivered','shipment.delayed',
  'complaint.created','complaint.resolved','invoice.generated','invoice.paid',
  'lead.created','lead.converted','job.completed','job.failed',
  'approval.approved','approval.rejected','inventory.low',
];

export default function WebhookManager() {
  const [webhooks, setWebhooks] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [tab, setTab] = useState('list');
  const [form, setForm] = useState({ name: '', url: '', events: [], retry_count: 3 });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [showSecret, setShowSecret] = useState(null);

  const load = () => {
    fetch(`${_BASE}/webhooks`, { headers: h() }).then(r => r.json()).then(r => { if (r.status) setWebhooks(r.data.webhooks || []); });
    fetch(`${_BASE}/webhooks/deliveries/recent`, { headers: h() }).then(r => r.json()).then(r => { if (r.status) setDeliveries(r.data.deliveries || []); });
  };
  useEffect(() => { load(); }, []);

  const toggleEvent = (ev) => {
    setForm(p => ({ ...p, events: p.events.includes(ev) ? p.events.filter(e => e !== ev) : [...p.events, ev] }));
  };

  const save = async () => {
    setSaving(true); setMsg('');
    const r = await fetch(`${_BASE}/webhooks`, { method: 'POST', headers: { ...h(), 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const d = await r.json();
    setSaving(false);
    if (d.status) {
      setShowSecret(d.data);
      setForm({ name: '', url: '', events: [], retry_count: 3 });
      setTab('list'); load();
    } else setMsg(d.message);
  };

  const testWh = async (id) => {
    const r = await fetch(`${_BASE}/webhooks/${id}/test`, { method: 'POST', headers: h() });
    const d = await r.json();
    alert(d.status ? 'Test delivery sent!' : d.message);
    load();
  };

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h2>Webhook Manager</h2>

      {showSecret && (
        <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 8, padding: 16, marginBottom: 20 }}>
          <strong>⚠️ Save your signing secret — it won't be shown again:</strong>
          <div style={{ fontFamily: 'monospace', fontSize: 13, marginTop: 8, padding: 8, background: '#fff', borderRadius: 4, wordBreak: 'break-all' }}>
            {showSecret.signing_secret}
          </div>
          <button onClick={() => setShowSecret(null)} style={{ marginTop: 8, background: '#f59e0b', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: 4, cursor: 'pointer' }}>Dismiss</button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[['list','Webhooks'],['create','+ Register'],['deliveries','Deliveries']].map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
            background: tab === t ? '#6366f1' : '#f3f4f6', color: tab === t ? '#fff' : '#374151', fontWeight: 600 }}>{l}</button>
        ))}
      </div>

      {tab === 'list' && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              {['Name','URL','Events','Status','Deliveries','Actions'].map(c => (
                <th key={c} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {webhooks.map(w => (
              <tr key={w._id}>
                <td style={{ padding: '10px 12px', fontWeight: 600 }}>{w.name}</td>
                <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 12, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{w.url}</td>
                <td style={{ padding: '10px 12px' }}>{w.events?.length} events</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, background: w.status === 'active' ? '#d1fae5' : '#f3f4f6', color: w.status === 'active' ? '#065f46' : '#374151' }}>{w.status}</span>
                </td>
                <td style={{ padding: '10px 12px' }}>{w.total_deliveries ?? 0}</td>
                <td style={{ padding: '10px 12px' }}>
                  <button onClick={() => testWh(w._id)} style={{ background: '#eff6ff', color: '#1d4ed8', border: 'none', padding: '4px 10px', borderRadius: 4, cursor: 'pointer' }}>Test</button>
                </td>
              </tr>
            ))}
            {webhooks.length === 0 && <tr><td colSpan={6} style={{ padding: 20, textAlign: 'center', color: '#9ca3af' }}>No webhooks registered</td></tr>}
          </tbody>
        </table>
      )}

      {tab === 'create' && (
        <div style={{ maxWidth: 520 }}>
          {msg && <div style={{ background: '#fee2e2', padding: 10, borderRadius: 6, marginBottom: 12 }}>{msg}</div>}
          {[['name','Webhook Name *'],['url','Endpoint URL *']].map(([k, l]) => (
            <div key={k} style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 600 }}>{l}</label>
              <input value={form[k]} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6 }} />
            </div>
          ))}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600 }}>Events to Subscribe</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {EVENT_OPTS.map(ev => (
                <button key={ev} onClick={() => toggleEvent(ev)} style={{
                  padding: '4px 10px', borderRadius: 12, border: '1px solid', cursor: 'pointer', fontSize: 12,
                  background: form.events.includes(ev) ? '#6366f1' : '#f9fafb',
                  color: form.events.includes(ev) ? '#fff' : '#374151',
                  borderColor: form.events.includes(ev) ? '#6366f1' : '#d1d5db',
                }}>{ev}</button>
              ))}
            </div>
          </div>
          <button onClick={save} disabled={saving} style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
            {saving ? 'Registering…' : 'Register Webhook'}
          </button>
        </div>
      )}

      {tab === 'deliveries' && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              {['Event','Status','Response','Duration','Time'].map(c => (
                <th key={c} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {deliveries.map(d => (
              <tr key={d._id}>
                <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 12 }}>{d.event_type}</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, background: d.status === 'delivered' ? '#d1fae5' : '#fee2e2', color: d.status === 'delivered' ? '#065f46' : '#991b1b' }}>{d.status}</span>
                </td>
                <td style={{ padding: '10px 12px' }}>{d.response_code ?? '—'}</td>
                <td style={{ padding: '10px 12px' }}>{d.duration_ms ? `${d.duration_ms}ms` : '—'}</td>
                <td style={{ padding: '10px 12px', fontSize: 12, color: '#6b7280' }}>{d.createdAt ? new Date(d.createdAt).toLocaleString() : '—'}</td>
              </tr>
            ))}
            {deliveries.length === 0 && <tr><td colSpan={5} style={{ padding: 20, textAlign: 'center', color: '#9ca3af' }}>No deliveries yet</td></tr>}
          </tbody>
        </table>
      )}
    </div>
  );
}
