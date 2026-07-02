import React, { useState, useEffect } from 'react';
const _BASE = import.meta.env.VITE_API_URL || '/api';
const h = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}`, 'Content-Type': 'application/json' });

export default function FinanceAnalytics() {
  const [dashboard, setDashboard] = useState({});
  const [trends, setTrends] = useState([]);
  const [paymentModes, setPaymentModes] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [dr, tr, pr, cr] = await Promise.all([
        fetch(`${_BASE}/finance-analytics/dashboard`, { headers: h() }),
        fetch(`${_BASE}/finance-analytics/trends`, { headers: h() }),
        fetch(`${_BASE}/finance-analytics/payment-modes`, { headers: h() }),
        fetch(`${_BASE}/finance-analytics/top-customers`, { headers: h() }),
      ]);
      const [dd, td, pd, cd] = await Promise.all([dr.json(), tr.json(), pr.json(), cr.json()]);
      setDashboard(dd);
      setTrends(Array.isArray(td) ? td : td.data || []);
      setPaymentModes(Array.isArray(pd) ? pd : pd.data || []);
      setTopCustomers(Array.isArray(cd) ? cd : cd.data || []);
    } catch (e) { setError('Failed to load analytics'); }
    finally { setLoading(false); }
  };

  const fmt = v => `₹${Number(v || 0).toLocaleString('en-IN')}`;
  const pct = v => `${Number(v || 0).toFixed(1)}%`;

  const kpis = [
    { label: 'Revenue MTD', value: fmt(dashboard.revenue_mtd), color: '#22c55e', sub: 'Month to Date' },
    { label: 'Expenses MTD', value: fmt(dashboard.expenses_mtd), color: '#ef4444', sub: 'Month to Date' },
    { label: 'Outstanding', value: fmt(dashboard.outstanding), color: '#f59e0b', sub: 'Receivables' },
    { label: 'Collection Rate', value: pct(dashboard.collection_rate), color: '#3b82f6', sub: 'This Month' },
    { label: 'Net Profit', value: fmt(dashboard.net_profit), color: dashboard.net_profit >= 0 ? '#22c55e' : '#ef4444', sub: 'Current Period' },
    { label: 'Revenue YTD', value: fmt(dashboard.revenue_ytd), color: '#8b5cf6', sub: 'Year to Date' },
  ];

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh', padding: '24px', color: '#e2e8f0' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 24px' }}>Finance Analytics</h1>
      {error && <div style={{ background: '#7f1d1d', color: '#fca5a5', padding: 12, borderRadius: 8, marginBottom: 16 }}>{error}</div>}

      {loading ? <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>Loading analytics...</div> : (
        <>
          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 28 }}>
            {kpis.map((k, i) => (
              <div key={i} style={{ background: '#1e293b', borderRadius: 12, padding: 22, border: '1px solid #334155' }}>
                <div style={{ color: '#64748b', fontSize: 12, marginBottom: 4 }}>{k.sub}</div>
                <div style={{ color: '#94a3b8', fontSize: 14, marginBottom: 8 }}>{k.label}</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: k.color }}>{k.value}</div>
              </div>
            ))}
          </div>

          {/* 6-Month Trends */}
          <div style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #334155', overflow: 'hidden', marginBottom: 24 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #334155' }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>6-Month Trend</h2>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#0f172a' }}>
                  {['Month', 'Revenue', 'Expenses', 'Profit', 'Margin'].map(c => (
                    <th key={c} style={{ padding: '12px 16px', textAlign: c === 'Month' ? 'left' : 'right', color: '#94a3b8', fontSize: 13, borderBottom: '1px solid #334155' }}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trends.map((t, i) => {
                  const profit = (t.revenue || 0) - (t.expenses || 0);
                  const margin = t.revenue ? ((profit / t.revenue) * 100).toFixed(1) : 0;
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #1e293b' }}>
                      <td style={{ padding: '12px 16px', color: '#e2e8f0', fontWeight: 600 }}>{t.month}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', color: '#22c55e', fontWeight: 600 }}>{fmt(t.revenue)}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', color: '#ef4444', fontWeight: 600 }}>{fmt(t.expenses)}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', color: profit >= 0 ? '#22c55e' : '#ef4444', fontWeight: 700 }}>{fmt(profit)}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <span style={{ background: profit >= 0 ? '#166534' : '#7f1d1d', color: profit >= 0 ? '#86efac' : '#fca5a5', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                          {margin}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {trends.length === 0 && <tr><td colSpan={5} style={{ padding: 30, textAlign: 'center', color: '#64748b' }}>No trend data</td></tr>}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Payment Modes */}
            <div style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #334155', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #334155' }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Payment Modes Breakdown</h2>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#0f172a' }}>
                    {['Mode', 'Count', 'Amount', 'Share'].map(c => (
                      <th key={c} style={{ padding: '10px 16px', textAlign: c === 'Mode' ? 'left' : 'right', color: '#94a3b8', fontSize: 12, borderBottom: '1px solid #334155' }}>{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paymentModes.map((p, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #1e293b' }}>
                      <td style={{ padding: '11px 16px', color: '#e2e8f0', fontWeight: 600 }}>{p.mode || p.payment_mode}</td>
                      <td style={{ padding: '11px 16px', textAlign: 'right', color: '#94a3b8' }}>{p.count}</td>
                      <td style={{ padding: '11px 16px', textAlign: 'right', color: '#3b82f6', fontWeight: 600 }}>{fmt(p.amount || p.total)}</td>
                      <td style={{ padding: '11px 16px', textAlign: 'right' }}>
                        <span style={{ color: '#f59e0b', fontSize: 13 }}>{pct(p.share || p.percentage)}</span>
                      </td>
                    </tr>
                  ))}
                  {paymentModes.length === 0 && <tr><td colSpan={4} style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>No data</td></tr>}
                </tbody>
              </table>
            </div>

            {/* Top Customers */}
            <div style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #334155', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #334155' }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Top Customers</h2>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#0f172a' }}>
                    {['#', 'Customer', 'Revenue', 'Invoices'].map(c => (
                      <th key={c} style={{ padding: '10px 16px', textAlign: c === 'Customer' ? 'left' : 'right', color: '#94a3b8', fontSize: 12, borderBottom: '1px solid #334155' }}>{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {topCustomers.map((c, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #1e293b' }}>
                      <td style={{ padding: '11px 16px', textAlign: 'right', color: '#64748b', fontSize: 13 }}>{i + 1}</td>
                      <td style={{ padding: '11px 16px', color: '#e2e8f0', fontWeight: 600 }}>{c.customer_name || c.name}</td>
                      <td style={{ padding: '11px 16px', textAlign: 'right', color: '#22c55e', fontWeight: 700 }}>{fmt(c.revenue || c.total_revenue)}</td>
                      <td style={{ padding: '11px 16px', textAlign: 'right', color: '#94a3b8' }}>{c.invoice_count || c.invoices || '—'}</td>
                    </tr>
                  ))}
                  {topCustomers.length === 0 && <tr><td colSpan={4} style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>No data</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
