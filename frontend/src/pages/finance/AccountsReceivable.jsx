import React, { useState, useEffect } from 'react';
const _BASE = import.meta.env.VITE_API_URL || '/api';
const h = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}`, 'Content-Type': 'application/json' });

const s = {
  page: { padding: '24px', background: '#0f172a', minHeight: '100vh', color: '#e2e8f0', fontFamily: 'sans-serif' },
  title: { fontSize: '22px', fontWeight: 700, marginBottom: '20px', color: '#f1f5f9' },
  card: { background: '#1e293b', borderRadius: '10px', padding: '20px', border: '1px solid #334155', marginBottom: '16px' },
  grid4: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '20px' },
  kpiLabel: { fontSize: '11px', color: '#94a3b8', marginBottom: '5px', textTransform: 'uppercase' },
  kpiValue: { fontSize: '22px', fontWeight: 700 },
  sectionTitle: { fontSize: '13px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '12px' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
  th: { textAlign: 'left', padding: '9px 12px', color: '#64748b', borderBottom: '1px solid #334155', fontSize: '11px', textTransform: 'uppercase' },
  td: { padding: '10px 12px', borderBottom: '1px solid #1e293b' },
  input: { background: '#0f172a', border: '1px solid #334155', color: '#e2e8f0', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', marginRight: '8px', width: '260px' },
  btn: { background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer', fontSize: '13px' },
  error: { background: '#450a0a', color: '#fca5a5', padding: '12px', borderRadius: '8px', marginBottom: '16px' },
};

export default function AccountsReceivable() {
  const [dash, setDash] = useState({});
  const [aging, setAging] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerData, setCustomerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [d, a] = await Promise.all([
          fetch(`${_BASE}/accounts-receivable/dashboard`, { headers: h() }).then(r => r.json()),
          fetch(`${_BASE}/accounts-receivable/aging`, { headers: h() }).then(r => r.json()),
        ]);
        setDash(d.data || d);
        setAging(Array.isArray(a.data) ? a.data : []);
      } catch (e) { setError(e.message); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const searchCustomer = async () => {
    if (!customerName.trim()) return;
    try {
      setCustomerLoading(true);
      const res = await fetch(`${_BASE}/accounts-receivable/customer/${encodeURIComponent(customerName)}`, { headers: h() });
      const data = await res.json();
      setCustomerData(data.data || data);
    } catch (e) { setError(e.message); }
    finally { setCustomerLoading(false); }
  };

  const fmt = (n) => n != null ? `₹${Number(n).toLocaleString('en-IN')}` : '—';

  return (
    <div style={s.page}>
      <div style={s.title}>Accounts Receivable</div>
      {error && <div style={s.error}>{error}</div>}

      {loading ? <div>Loading...</div> : (
        <>
          <div style={s.grid4}>
            {[
              { label: 'Total Outstanding', value: fmt(dash.total_outstanding), color: '#f59e0b' },
              { label: 'Overdue Amount', value: fmt(dash.overdue_amount), color: '#f87171' },
              { label: 'Collection Rate', value: dash.collection_rate != null ? `${dash.collection_rate}%` : '—', color: '#34d399' },
              { label: 'Top Debtor', value: dash.top_debtor || '—', color: '#a78bfa' },
            ].map(k => (
              <div key={k.label} style={s.card}>
                <div style={s.kpiLabel}>{k.label}</div>
                <div style={{ ...s.kpiValue, color: k.color }}>{k.value}</div>
              </div>
            ))}
          </div>

          <div style={s.card}>
            <div style={s.sectionTitle}>Aging Analysis</div>
            <table style={s.table}>
              <thead>
                <tr>
                  {['Bucket', 'Count', 'Amount', '% of Total'].map(c => <th key={c} style={s.th}>{c}</th>)}
                </tr>
              </thead>
              <tbody>
                {aging.length > 0 ? aging.map((row, i) => (
                  <tr key={i}>
                    <td style={s.td}><span style={{ fontWeight: 600, color: '#60a5fa' }}>{row.bucket || row.label}</span></td>
                    <td style={s.td}>{row.count ?? '—'}</td>
                    <td style={s.td}>{fmt(row.amount)}</td>
                    <td style={s.td}>{row.percentage != null ? `${row.percentage}%` : '—'}</td>
                  </tr>
                )) : (
                  [['Current (0-30)', 0], ['31-60 Days', 0], ['61-90 Days', 0], ['91-120 Days', 0], ['120+ Days', 0]].map(([b]) => (
                    <tr key={b}><td style={s.td}>{b}</td><td style={s.td}>—</td><td style={s.td}>—</td><td style={s.td}>—</td></tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div style={s.card}>
            <div style={s.sectionTitle}>Customer Ledger</div>
            <div style={{ marginBottom: '16px' }}>
              <input style={s.input} value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Enter customer name" onKeyDown={e => e.key === 'Enter' && searchCustomer()} />
              <button style={s.btn} onClick={searchCustomer} disabled={customerLoading}>
                {customerLoading ? 'Searching...' : 'Search'}
              </button>
            </div>
            {customerData && (
              <>
                <div style={{ marginBottom: '12px', fontSize: '13px', color: '#94a3b8' }}>
                  Total Outstanding: <strong style={{ color: '#f59e0b' }}>{fmt(customerData.total_outstanding)}</strong>
                  {' | '}Overdue: <strong style={{ color: '#f87171' }}>{fmt(customerData.overdue)}</strong>
                </div>
                <table style={s.table}>
                  <thead>
                    <tr>
                      {['Invoice #', 'Amount', 'Status', 'Due Date', 'Paid Amount'].map(c => <th key={c} style={s.th}>{c}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {(customerData.invoices || []).map((inv, i) => (
                      <tr key={i}>
                        <td style={s.td}>{inv.invoice_number}</td>
                        <td style={s.td}>{fmt(inv.total)}</td>
                        <td style={s.td}>{inv.status}</td>
                        <td style={s.td}>{inv.due_date ? new Date(inv.due_date).toLocaleDateString('en-IN') : '—'}</td>
                        <td style={s.td}>{fmt(inv.paid_amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
