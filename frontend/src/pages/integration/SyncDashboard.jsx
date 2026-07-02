import { useState, useEffect } from 'react';

const _BASE = import.meta.env.VITE_API_URL || '/api';
const h = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}` });

export default function SyncDashboard() {
  const [jobs, setJobs] = useState([]);
  const [history, setHistory] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [stats, setStats] = useState(null);
  const [tab, setTab] = useState('jobs');
  const [connectors, setConnectors] = useState([]);
  const [form, setForm] = useState({ connector_id: '', entity_type: 'all', direction: 'outbound', job_type: 'sync' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    fetch(`${_BASE}/sync/jobs?limit=20`, { headers: h() }).then(r => r.json()).then(r => { if (r.status) setJobs(r.data.jobs || []); });
    fetch(`${_BASE}/sync/history?limit=20`, { headers: h() }).then(r => r.json()).then(r => { if (r.status) setHistory(r.data.history || []); });
    fetch(`${_BASE}/sync/conflicts?resolution=pending`, { headers: h() }).then(r => r.json()).then(r => { if (r.status) setConflicts(r.data.conflicts || []); });
    fetch(`${_BASE}/sync/stats`, { headers: h() }).then(r => r.json()).then(r => { if (r.status) setStats(r.data); });
    fetch(`${_BASE}/connectors?status=active`, { headers: h() }).then(r => r.json()).then(r => { if (r.status) setConnectors(r.data.connectors || []); });
  };
  useEffect(() => { load(); }, []);

  const queueJob = async () => {
    setSaving(true);
    const r = await fetch(`${_BASE}/sync/jobs`, { method: 'POST', headers: { ...h(), 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const d = await r.json();
    setSaving(false);
    if (d.status) { load(); setTab('jobs'); } else alert(d.message);
  };

  const resolveConflict = async (id, resolution) => {
    await fetch(`${_BASE}/sync/conflicts/${id}`, { method: 'PUT', headers: { ...h(), 'Content-Type': 'application/json' }, body: JSON.stringify({ resolution }) });
    load();
  };

  const STATUS_BG = { completed: '#d1fae5', failed: '#fee2e2', running: '#dbeafe', queued: '#fef3c7', pending: '#f3f4f6' };
  const STATUS_CLR = { completed: '#065f46', failed: '#991b1b', running: '#1d4ed8', queued: '#92400e', pending: '#374151' };

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h2>Sync Dashboard</h2>

      {stats && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          {[['Total Jobs (30d)', stats.total],['Completed', stats.completed],['Failed', stats.failed],['Success Rate', `${stats.success_rate_pct}%`],['Pending Conflicts', stats.pending_conflicts]].map(([l, v]) => (
            <div key={l} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '12px 16px', flex: 1 }}>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{v}</div>
              <div style={{ color: '#6b7280', fontSize: 11 }}>{l}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[['jobs','Jobs'],['queue','+ Queue Job'],['history','History'],['conflicts',`Conflicts (${conflicts.length})`]].map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
            background: tab === t ? '#6366f1' : '#f3f4f6', color: tab === t ? '#fff' : '#374151', fontWeight: 600 }}>{l}</button>
        ))}
      </div>

      {tab === 'jobs' && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              {['Job Ref','Connector','Entity','Direction','Status','Records','Duration'].map(c => (
                <th key={c} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {jobs.map(j => (
              <tr key={j._id}>
                <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 12 }}>{j.job_ref}</td>
                <td style={{ padding: '10px 12px' }}>{j.connector_id?.name || '—'}</td>
                <td style={{ padding: '10px 12px' }}>{j.entity_type}</td>
                <td style={{ padding: '10px 12px' }}>{j.direction}</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, background: STATUS_BG[j.status] || '#f3f4f6', color: STATUS_CLR[j.status] || '#374151' }}>{j.status}</span>
                </td>
                <td style={{ padding: '10px 12px' }}>{j.records_synced ?? 0}/{j.records_total ?? 0}</td>
                <td style={{ padding: '10px 12px', fontSize: 12 }}>{j.duration_ms ? `${(j.duration_ms/1000).toFixed(1)}s` : '—'}</td>
              </tr>
            ))}
            {jobs.length === 0 && <tr><td colSpan={7} style={{ padding: 20, textAlign: 'center', color: '#9ca3af' }}>No jobs yet</td></tr>}
          </tbody>
        </table>
      )}

      {tab === 'queue' && (
        <div style={{ maxWidth: 440 }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Connector *</label>
            <select value={form.connector_id} onChange={e => setForm(p => ({ ...p, connector_id: e.target.value }))}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6 }}>
              <option value="">Select connector…</option>
              {connectors.map(c => <option key={c._id} value={c._id}>{c.name} ({c.provider})</option>)}
            </select>
          </div>
          {[['entity_type','Entity Type',['all','customers','invoices','orders','products','contacts']],['direction','Direction',['inbound','outbound','bidirectional']],['job_type','Job Type',['sync','full_sync','delta','validation']]].map(([k, l, opts]) => (
            <div key={k} style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{l}</label>
              <select value={form[k]} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6 }}>
                {opts.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
          <button onClick={queueJob} disabled={saving || !form.connector_id} style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
            {saving ? 'Queueing…' : 'Queue Sync Job'}
          </button>
        </div>
      )}

      {tab === 'history' && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              {['Connector','Entity','Status','Synced','Failed','Duration','Time'].map(c => (
                <th key={c} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {history.map(r => (
              <tr key={r._id}>
                <td style={{ padding: '10px 12px' }}>{r.connector_id?.name || '—'}</td>
                <td style={{ padding: '10px 12px' }}>{r.entity_type}</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, background: r.status === 'success' ? '#d1fae5' : '#fee2e2', color: r.status === 'success' ? '#065f46' : '#991b1b' }}>{r.status}</span>
                </td>
                <td style={{ padding: '10px 12px' }}>{r.records_synced}</td>
                <td style={{ padding: '10px 12px' }}>{r.records_failed ?? 0}</td>
                <td style={{ padding: '10px 12px', fontSize: 12 }}>{r.duration_ms ? `${(r.duration_ms/1000).toFixed(1)}s` : '—'}</td>
                <td style={{ padding: '10px 12px', fontSize: 12, color: '#6b7280' }}>{r.createdAt ? new Date(r.createdAt).toLocaleString() : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === 'conflicts' && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              {['Entity','Conflict Type','Status','Actions'].map(c => (
                <th key={c} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {conflicts.map(c => (
              <tr key={c._id}>
                <td style={{ padding: '10px 12px' }}>{c.entity_type}: {c.entity_id}</td>
                <td style={{ padding: '10px 12px' }}>{c.conflict_type}</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, background: '#fef3c7', color: '#92400e' }}>{c.resolution}</span>
                </td>
                <td style={{ padding: '10px 12px', display: 'flex', gap: 6 }}>
                  <button onClick={() => resolveConflict(c._id, 'local_wins')} style={{ background: '#eff6ff', color: '#1d4ed8', border: 'none', padding: '3px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>Local</button>
                  <button onClick={() => resolveConflict(c._id, 'remote_wins')} style={{ background: '#f0fdf4', color: '#15803d', border: 'none', padding: '3px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>Remote</button>
                </td>
              </tr>
            ))}
            {conflicts.length === 0 && <tr><td colSpan={4} style={{ padding: 20, textAlign: 'center', color: '#9ca3af' }}>No pending conflicts</td></tr>}
          </tbody>
        </table>
      )}
    </div>
  );
}
