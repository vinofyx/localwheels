import React, { useState, useEffect } from 'react';
const _BASE = import.meta.env.VITE_API_URL || '/api';
const h = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}`, 'Content-Type': 'application/json' });

const s = {
  page: { padding: '24px', background: '#0f172a', minHeight: '100vh', color: '#e2e8f0', fontFamily: 'sans-serif' },
  title: { fontSize: '22px', fontWeight: 700, marginBottom: '20px', color: '#f1f5f9' },
  card: { background: '#1e293b', borderRadius: '10px', padding: '20px', border: '1px solid #334155', marginBottom: '16px' },
  statsRow: { display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' },
  stat: { background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '14px 20px', flex: 1, minWidth: '120px' },
  statLabel: { fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' },
  statVal: { fontSize: '22px', fontWeight: 700 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
  th: { textAlign: 'left', padding: '10px 12px', color: '#64748b', borderBottom: '1px solid #334155', fontSize: '11px', textTransform: 'uppercase' },
  td: { padding: '10px 12px', borderBottom: '1px solid #1e293b', verticalAlign: 'middle' },
  badge: (c) => ({ display: 'inline-block', padding: '2px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600, background: c[0], color: c[1] }),
  btn: (c) => ({ background: c, color: '#fff', border: 'none', borderRadius: '6px', padding: '5px 12px', cursor: 'pointer', fontSize: '12px', marginRight: '6px' }),
  filterRow: { display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center' },
  select: { background: '#0f172a', border: '1px solid #334155', color: '#e2e8f0', borderRadius: '6px', padding: '6px 10px', fontSize: '13px' },
  error: { background: '#450a0a', color: '#fca5a5', padding: '12px', borderRadius: '8px', marginBottom: '16px' },
  success: { background: '#052e16', color: '#86efac', padding: '12px', borderRadius: '8px', marginBottom: '16px' },
};

const STATUS_COLORS = {
  draft: ['#334155', '#94a3b8'],
  issued: ['#1e3a8a', '#93c5fd'],
  paid: ['#14532d', '#86efac'],
  cancelled: ['#450a0a', '#fca5a5'],
};

export default function InvoiceCenter() {
  const [stats, setStats] = useState({});
  const [invoices, setInvoices] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const [st, inv] = await Promise.all([
        fetch(`${_BASE}/fin-invoices/stats`, { headers: h() }).then(r => r.json()),
        fetch(`${_BASE}/fin-invoices?limit=50`, { headers: h() }).then(r => r.json()),
      ]);
      setStats(st.data || st);
      setInvoices(Array.isArray(inv.data) ? inv.data : []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const markPaid = async (id) => {
    try {
      await fetch(`${_BASE}/fin-invoices/${id}/mark-paid`, { method: 'PUT', headers: h() });
      setMsg('Invoice marked as paid');
      load();
    } catch (e) { setError(e.message); }
  };

  const cancel = async (id) => {
    if (!confirm('Cancel this invoice?')) return;
    try {
      await fetch(`${_BASE}/fin-invoices/${id}/cancel`, { method: 'PUT', headers: h() });
      setMsg('Invoice cancelled');
      load();
    } catch (e) { setError(e.message); }
  };

  const fmt = (n) => n != null ? `₹${Number(n).toLocaleString('en-IN')}` : '—';
  const filtered = filter ? invoices.filter(i => i.status === filter) : invoices;

  return (
    <div style={s.page}>
      <div style={s.title}>Invoice Center</div>
      {error && <div style={s.error}>{error}</div>}
      {msg && <div style={s.success}>{msg}</div>}

      <div style={s.statsRow}>
        <div style={s.stat}><div style={s.statLabel}>Total</div><div style={s.statVal}>{stats.total ?? '—'}</div></div>
        <div style={s.stat}><div style={s.statLabel}>Paid</div><div style={{ ...s.statVal, color: '#34d399' }}>{stats.paid ?? '—'}</div></div>
        <div style={s.stat}><div style={s.statLabel}>Outstanding</div><div style={{ ...s.statVal, color: '#f59e0b' }}>{stats.outstanding ?? '—'}</div></div>
        <div style={s.stat}><div style={s.statLabel}>Overdue</div><div style={{ ...s.statVal, color: '#f87171' }}>{stats.overdue ?? '—'}</div></div>
      </div>

      {loading ? <div>Loading...</div> : (
        <div style={s.card}>
          <div style={s.filterRow}>
            <span style={{ fontSize: '13px', color: '#94a3b8' }}>Filter by status:</span>
            <select style={s.select} value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="">All</option>
              <option value="draft">Draft</option>
              <option value="issued">Issued</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <span style={{ fontSize: '12px', color: '#64748b' }}>{filtered.length} records</span>
          </div>

          <table style={s.table}>
            <thead>
              <tr>
                {['Invoice #', 'Customer', 'Amount', 'Status', 'Invoice Date', 'Due Date', 'Actions'].map(col => (
                  <th key={col} style={s.th}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(inv => (
                <tr key={inv._id}>
                  <td style={s.td}><span style={{ color: '#60a5fa', fontWeight: 600 }}>{inv.invoice_number}</span></td>
                  <td style={s.td}>{inv.customer_name}</td>
                  <td style={s.td}>{fmt(inv.total)}</td>
                  <td style={s.td}>
                    <span style={s.badge(STATUS_COLORS[inv.status] || ['#334155', '#94a3b8'])}>
                      {inv.status}
                    </span>
                  </td>
                  <td style={s.td}>{inv.invoice_date ? new Date(inv.invoice_date).toLocaleDateString('en-IN') : '—'}</td>
                  <td style={s.td}>{inv.due_date ? new Date(inv.due_date).toLocaleDateString('en-IN') : '—'}</td>
                  <td style={s.td}>
                    {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                      <button style={s.btn('#16a34a')} onClick={() => markPaid(inv._id)}>Mark Paid</button>
                    )}
                    {inv.status !== 'cancelled' && inv.status !== 'paid' && (
                      <button style={s.btn('#dc2626')} onClick={() => cancel(inv._id)}>Cancel</button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} style={{ ...s.td, textAlign: 'center', color: '#64748b' }}>No invoices found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
