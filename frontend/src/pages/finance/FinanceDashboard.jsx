import React, { useState, useEffect } from 'react';
const _BASE = import.meta.env.VITE_API_URL || '/api';
const h = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}`, 'Content-Type': 'application/json' });

const s = {
  page: { padding: '24px', background: '#0f172a', minHeight: '100vh', color: '#e2e8f0', fontFamily: 'sans-serif' },
  title: { fontSize: '22px', fontWeight: 700, marginBottom: '20px', color: '#f1f5f9' },
  card: { background: '#1e293b', borderRadius: '10px', padding: '20px', border: '1px solid #334155' },
  grid6: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', marginBottom: '24px' },
  kpiLabel: { fontSize: '12px', color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' },
  kpiValue: { fontSize: '26px', fontWeight: 700, color: '#f1f5f9' },
  row: { display: 'flex', gap: '16px' },
  half: { flex: 1 },
  sectionTitle: { fontSize: '14px', fontWeight: 600, color: '#94a3b8', marginBottom: '14px', textTransform: 'uppercase' },
  bar: { display: 'flex', alignItems: 'flex-end', gap: '8px', height: '120px' },
  barWrap: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' },
  barRect: { width: '100%', background: '#3b82f6', borderRadius: '4px 4px 0 0', minHeight: '4px' },
  barLabel: { fontSize: '10px', color: '#64748b' },
  customerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #1e293b' },
  error: { background: '#450a0a', color: '#fca5a5', padding: '12px', borderRadius: '8px', marginBottom: '16px' },
};

function KpiCard({ label, value, color }) {
  return (
    <div style={s.card}>
      <div style={s.kpiLabel}>{label}</div>
      <div style={{ ...s.kpiValue, color: color || '#f1f5f9' }}>{value}</div>
    </div>
  );
}

export default function FinanceDashboard() {
  const [dash, setDash] = useState(null);
  const [trends, setTrends] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [d, t, c] = await Promise.all([
          fetch(`${_BASE}/finance-analytics/dashboard`, { headers: h() }).then(r => r.json()),
          fetch(`${_BASE}/finance-analytics/trends`, { headers: h() }).then(r => r.json()),
          fetch(`${_BASE}/finance-analytics/top-customers`, { headers: h() }).then(r => r.json()),
        ]);
        setDash(d.data || d);
        setTrends(Array.isArray(t.data) ? t.data : (t.data?.months || []));
        setCustomers(Array.isArray(c.data) ? c.data : []);
      } catch (e) { setError(e.message); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const fmt = (n) => n != null ? `₹${Number(n).toLocaleString('en-IN')}` : '—';

  const maxRevenue = trends.length ? Math.max(...trends.map(t => t.revenue || 0), 1) : 1;

  return (
    <div style={s.page}>
      <div style={s.title}>Finance Dashboard</div>
      {error && <div style={s.error}>{error}</div>}
      {loading ? <div>Loading...</div> : (
        <>
          <div style={s.grid6}>
            <KpiCard label="Revenue MTD" value={fmt(dash?.revenue_mtd)} color="#34d399" />
            <KpiCard label="Revenue YTD" value={fmt(dash?.revenue_ytd)} color="#34d399" />
            <KpiCard label="Outstanding AR" value={fmt(dash?.outstanding_ar)} color="#f59e0b" />
            <KpiCard label="Expenses MTD" value={fmt(dash?.expenses_mtd)} color="#f87171" />
            <KpiCard label="Collection Rate" value={dash?.collection_rate != null ? `${dash.collection_rate}%` : '—'} color="#3b82f6" />
            <KpiCard label="Net Profit MTD" value={fmt(dash?.net_profit_mtd)} color="#a78bfa" />
          </div>

          <div style={s.row}>
            <div style={{ ...s.card, ...s.half }}>
              <div style={s.sectionTitle}>Revenue Trend — Last 6 Months</div>
              <div style={s.bar}>
                {trends.slice(-6).map((t, i) => (
                  <div key={i} style={s.barWrap}>
                    <div style={{ ...s.barRect, height: `${Math.round(((t.revenue || 0) / maxRevenue) * 100)}px` }} title={fmt(t.revenue)} />
                    <div style={s.barLabel}>{t.month || t.label || `M${i + 1}`}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ ...s.card, ...s.half }}>
              <div style={s.sectionTitle}>Top Customers</div>
              {customers.slice(0, 8).map((c, i) => (
                <div key={i} style={s.customerRow}>
                  <span style={{ fontSize: '13px' }}>{c.customer_name || c.name}</span>
                  <span style={{ fontSize: '13px', color: '#34d399', fontWeight: 600 }}>{fmt(c.total_revenue || c.amount)}</span>
                </div>
              ))}
              {customers.length === 0 && <div style={{ color: '#64748b', fontSize: '13px' }}>No data</div>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
