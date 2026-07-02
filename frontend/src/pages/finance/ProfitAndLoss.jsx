import React, { useState, useEffect } from 'react';
const _BASE = import.meta.env.VITE_API_URL || '/api';
const h = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}`, 'Content-Type': 'application/json' });

export default function ProfitAndLoss() {
  const [period, setPeriod] = useState('monthly');
  const [periodDate, setPeriodDate] = useState('');
  const [financialYear, setFinancialYear] = useState('');
  const [report, setReport] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [histLoading, setHistLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { fetchHistory(); }, []);

  const fetchHistory = async () => {
    try {
      setHistLoading(true);
      const r = await fetch(`${_BASE}/financial-reports/profit-loss`, { headers: h() });
      const d = await r.json();
      setHistory(Array.isArray(d) ? d : d.data || []);
    } catch (e) { setError('Failed to load P&L history'); }
    finally { setHistLoading(false); }
  };

  const generate = async () => {
    try {
      setLoading(true);
      setReport(null);
      const r = await fetch(`${_BASE}/financial-reports/profit-loss/generate`, {
        method: 'POST', headers: h(),
        body: JSON.stringify({ period, period_date: periodDate, financial_year: financialYear })
      });
      const d = await r.json();
      setReport(d);
      fetchHistory();
    } catch (e) { setError('Failed to generate P&L'); }
    finally { setLoading(false); }
  };

  const fmt = v => `₹${Number(v || 0).toLocaleString('en-IN')}`;
  const pct = (val, base) => base ? ((val / base) * 100).toFixed(1) : '0.0';

  const revenue = report?.revenue || {};
  const expenses = report?.expenses || {};
  const totalRevenue = revenue.total || 0;
  const totalExpenses = expenses.total || 0;
  const grossProfit = (revenue.logistics_income || 0) + (revenue.freight_income || 0) - (expenses.vehicle_fuel || 0) - (expenses.vehicle_maint || 0) - (expenses.driver_salary || 0);
  const netProfit = totalRevenue - totalExpenses;

  const revenueRows = [
    ['Logistics Income', 'logistics_income'],
    ['Freight Income', 'freight_income'],
    ['Other Income', 'other_income'],
  ];
  const expenseRows = [
    ['Vehicle Fuel', 'vehicle_fuel'],
    ['Vehicle Maintenance', 'vehicle_maint'],
    ['Driver Salary', 'driver_salary'],
    ['Office Rent', 'rent_office'],
    ['Utilities', 'utilities'],
    ['Staff Salary', 'staff_salary'],
    ['Insurance', 'insurance'],
    ['Other Expenses', 'other_expense'],
  ];

  const ProfitBadge = ({ label, value, base }) => {
    const positive = value >= 0;
    return (
      <div style={{ background: '#1e293b', borderRadius: 12, padding: 20, border: `1px solid ${positive ? '#166534' : '#7f1d1d'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 4 }}>{label}</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: positive ? '#22c55e' : '#ef4444' }}>{fmt(value)}</div>
        </div>
        <div style={{ background: positive ? '#166534' : '#7f1d1d', color: positive ? '#86efac' : '#fca5a5', padding: '6px 14px', borderRadius: 20, fontWeight: 700, fontSize: 15 }}>
          {positive ? '+' : ''}{pct(value, base)}%
        </div>
      </div>
    );
  };

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh', padding: '24px', color: '#e2e8f0' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 24px' }}>Profit & Loss Statement</h1>
      {error && <div style={{ background: '#7f1d1d', color: '#fca5a5', padding: 12, borderRadius: 8, marginBottom: 16 }}>{error}</div>}

      {/* Controls */}
      <div style={{ background: '#1e293b', borderRadius: 12, padding: 20, marginBottom: 24, border: '1px solid #334155' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr auto', gap: 14, alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, color: '#94a3b8', fontSize: 13 }}>PERIOD TYPE</label>
            <div style={{ display: 'flex', gap: 0 }}>
              {['monthly', 'quarterly', 'annual'].map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  style={{ background: period === p ? '#3b82f6' : '#0f172a', color: period === p ? '#fff' : '#94a3b8', border: '1px solid #334155', padding: '10px 16px', cursor: 'pointer', textTransform: 'capitalize', fontSize: 13,
                    borderRadius: p === 'monthly' ? '8px 0 0 8px' : p === 'annual' ? '0 8px 8px 0' : '0' }}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, color: '#94a3b8', fontSize: 13 }}>PERIOD DATE</label>
            <input type="date" value={periodDate} onChange={e => setPeriodDate(e.target.value)}
              style={{ width: '100%', background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 8, padding: '10px 12px', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, color: '#94a3b8', fontSize: 13 }}>FINANCIAL YEAR</label>
            <input value={financialYear} onChange={e => setFinancialYear(e.target.value)} placeholder="e.g. 2024-25"
              style={{ width: '100%', background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 8, padding: '10px 12px', boxSizing: 'border-box' }} />
          </div>
          <button onClick={generate} disabled={loading}
            style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}>
            {loading ? 'Generating...' : 'Generate P&L'}
          </button>
        </div>
      </div>

      {/* P&L Report */}
      {report && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
            {/* Revenue */}
            <div style={{ background: '#1e293b', borderRadius: 12, padding: 24, border: '1px solid #334155' }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: '#22c55e', margin: '0 0 16px' }}>Revenue</h2>
              {revenueRows.map(([label, key]) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #0f172a' }}>
                  <span style={{ color: '#94a3b8' }}>{label}</span>
                  <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{fmt(revenue[key])}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0 0', fontWeight: 700, fontSize: 16 }}>
                <span style={{ color: '#22c55e' }}>Total Revenue</span>
                <span style={{ color: '#22c55e' }}>{fmt(totalRevenue)}</span>
              </div>
            </div>

            {/* Expenses */}
            <div style={{ background: '#1e293b', borderRadius: 12, padding: 24, border: '1px solid #334155' }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: '#ef4444', margin: '0 0 16px' }}>Expenses</h2>
              {expenseRows.map(([label, key]) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #0f172a' }}>
                  <span style={{ color: '#94a3b8' }}>{label}</span>
                  <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{fmt(expenses[key])}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0 0', fontWeight: 700, fontSize: 16 }}>
                <span style={{ color: '#ef4444' }}>Total Expenses</span>
                <span style={{ color: '#ef4444' }}>{fmt(totalExpenses)}</span>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
            <ProfitBadge label="Gross Profit" value={grossProfit} base={totalRevenue} />
            <ProfitBadge label="Net Profit" value={netProfit} base={totalRevenue} />
          </div>
        </>
      )}

      {/* History */}
      <div style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #334155', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #334155', fontWeight: 700 }}>P&L History</div>
        {histLoading ? <div style={{ padding: 30, textAlign: 'center', color: '#64748b' }}>Loading...</div> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#0f172a' }}>
                {['Period', 'Financial Year', 'Revenue', 'Expenses', 'Net Profit'].map(c => (
                  <th key={c} style={{ padding: '12px 16px', textAlign: 'left', color: '#94a3b8', fontSize: 13, borderBottom: '1px solid #334155' }}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.map((r, i) => {
                const np = (r.revenue?.total || 0) - (r.expenses?.total || 0);
                return (
                  <tr key={i} style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: 13 }}>{r.period} — {r.period_date ? new Date(r.period_date).toLocaleDateString('en-IN') : '—'}</td>
                    <td style={{ padding: '12px 16px', color: '#e2e8f0' }}>{r.financial_year}</td>
                    <td style={{ padding: '12px 16px', color: '#22c55e', fontWeight: 600 }}>{fmt(r.revenue?.total)}</td>
                    <td style={{ padding: '12px 16px', color: '#ef4444', fontWeight: 600 }}>{fmt(r.expenses?.total)}</td>
                    <td style={{ padding: '12px 16px', color: np >= 0 ? '#22c55e' : '#ef4444', fontWeight: 700 }}>{fmt(np)}</td>
                  </tr>
                );
              })}
              {history.length === 0 && <tr><td colSpan={5} style={{ padding: 30, textAlign: 'center', color: '#64748b' }}>No history found</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
