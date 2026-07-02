import React, { useState, useEffect } from 'react';
const _BASE = import.meta.env.VITE_API_URL || '/api';
const h = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}`, 'Content-Type': 'application/json' });

export default function BalanceSheetPage() {
  const [data, setData] = useState(null);
  const [branchRevenue, setBranchRevenue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [bsr, brr] = await Promise.all([
        fetch(`${_BASE}/financial-reports/balance-sheet`, { headers: h() }),
        fetch(`${_BASE}/financial-reports/revenue-by-branch`, { headers: h() }),
      ]);
      const [bsd, brd] = await Promise.all([bsr.json(), brr.json()]);
      setData(bsd);
      setBranchRevenue(Array.isArray(brd) ? brd : brd.data || []);
    } catch (e) { setError('Failed to load balance sheet'); }
    finally { setLoading(false); }
  };

  const fmt = v => `₹${Number(v || 0).toLocaleString('en-IN')}`;

  const assets = data?.assets || [];
  const liabilities = data?.liabilities || [];
  const equity = data?.equity || [];
  const totalAssets = assets.reduce((s, a) => s + (a.balance || 0), 0);
  const totalLiabilities = liabilities.reduce((s, a) => s + (a.balance || 0), 0);
  const totalEquity = equity.reduce((s, a) => s + (a.balance || 0), 0);
  const totalLiabEquity = totalLiabilities + totalEquity;
  const isBalanced = Math.abs(totalAssets - totalLiabEquity) < 1;

  const maxRevenue = branchRevenue.length ? Math.max(...branchRevenue.map(b => b.revenue || 0)) : 1;

  const Section = ({ title, items, total, color }) => (
    <div style={{ background: '#1e293b', borderRadius: 12, padding: 20, border: '1px solid #334155', marginBottom: 16 }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color, margin: '0 0 14px' }}>{title}</h3>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid #0f172a' }}>
          <div>
            <span style={{ color: '#94a3b8', fontSize: 12, marginRight: 8 }}>{item.account_code}</span>
            <span style={{ color: '#e2e8f0', fontSize: 14 }}>{item.account_name}</span>
          </div>
          <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{fmt(item.balance)}</span>
        </div>
      ))}
      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, fontWeight: 700, fontSize: 15 }}>
        <span style={{ color }}>Total {title}</span>
        <span style={{ color }}>{fmt(total)}</span>
      </div>
      {items.length === 0 && <div style={{ color: '#64748b', textAlign: 'center', padding: 12, fontSize: 13 }}>No items</div>}
    </div>
  );

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh', padding: '24px', color: '#e2e8f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Balance Sheet</h1>
        <button onClick={fetchAll} disabled={loading} style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontWeight: 600 }}>
          {loading ? 'Refreshing...' : '↻ Refresh'}
        </button>
      </div>
      {error && <div style={{ background: '#7f1d1d', color: '#fca5a5', padding: 12, borderRadius: 8, marginBottom: 16 }}>{error}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>Loading balance sheet...</div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
            {/* Left: Assets */}
            <div>
              <Section title="Assets" items={assets} total={totalAssets} color="#22c55e" />
            </div>
            {/* Right: Liabilities + Equity */}
            <div>
              <Section title="Liabilities" items={liabilities} total={totalLiabilities} color="#ef4444" />
              <Section title="Equity" items={equity} total={totalEquity} color="#3b82f6" />
            </div>
          </div>

          {/* Balance Check Footer */}
          <div style={{ background: '#1e293b', borderRadius: 12, padding: 20, border: `2px solid ${isBalanced ? '#166534' : '#7f1d1d'}`, marginBottom: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 20, alignItems: 'center' }}>
              <div>
                <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 4 }}>TOTAL ASSETS</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#22c55e' }}>{fmt(totalAssets)}</div>
              </div>
              <div>
                <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 4 }}>TOTAL LIABILITIES</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#ef4444' }}>{fmt(totalLiabilities)}</div>
              </div>
              <div>
                <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 4 }}>TOTAL EQUITY</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#3b82f6' }}>{fmt(totalEquity)}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ background: isBalanced ? '#166534' : '#7f1d1d', color: isBalanced ? '#86efac' : '#fca5a5', padding: '8px 18px', borderRadius: 20, fontWeight: 700, fontSize: 14 }}>
                  {isBalanced ? '✓ BALANCED' : '⚠ UNBALANCED'}
                </div>
                <div style={{ color: '#64748b', fontSize: 12, marginTop: 6 }}>
                  L+E: {fmt(totalLiabEquity)}
                </div>
              </div>
            </div>
          </div>

          {/* Revenue by Branch Bar Chart */}
          <div style={{ background: '#1e293b', borderRadius: 12, padding: 24, border: '1px solid #334155' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 20px' }}>Revenue by Branch</h2>
            {branchRevenue.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 30, color: '#64748b' }}>No branch revenue data</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {branchRevenue.map((b, i) => {
                  const pct = maxRevenue ? ((b.revenue || 0) / maxRevenue) * 100 : 0;
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 130, color: '#94a3b8', fontSize: 13, textAlign: 'right', flexShrink: 0 }}>{b.branch_name || b.branch}</div>
                      <div style={{ flex: 1, background: '#0f172a', borderRadius: 6, height: 28, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: `hsl(${200 + i * 30},70%,55%)`, borderRadius: 6, transition: 'width 0.6s ease', display: 'flex', alignItems: 'center', paddingLeft: 10 }}>
                          {pct > 20 && <span style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>{fmt(b.revenue)}</span>}
                        </div>
                      </div>
                      {pct <= 20 && <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>{fmt(b.revenue)}</div>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
