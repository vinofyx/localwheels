import React, { useState, useEffect } from 'react';
const _BASE = import.meta.env.VITE_API_URL || '/api';
const h = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}`, 'Content-Type': 'application/json' });

export default function TrialBalancePage() {
  const [latest, setLatest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showGenerate, setShowGenerate] = useState(false);
  const [genForm, setGenForm] = useState({ period_date: '', financial_year: '' });
  const [generating, setGenerating] = useState(false);

  useEffect(() => { fetchLatest(); }, []);

  const fetchLatest = async () => {
    try {
      setLoading(true);
      const r = await fetch(`${_BASE}/financial-reports/trial-balance/latest`, { headers: h() });
      const d = await r.json();
      setLatest(d);
    } catch (e) { setError('Failed to load trial balance'); }
    finally { setLoading(false); }
  };

  const generate = async () => {
    try {
      setGenerating(true);
      await fetch(`${_BASE}/financial-reports/trial-balance/generate`, {
        method: 'POST', headers: h(), body: JSON.stringify(genForm)
      });
      setShowGenerate(false);
      fetchLatest();
    } catch (e) { setError('Failed to generate trial balance'); }
    finally { setGenerating(false); }
  };

  const fmt = v => `₹${Number(v || 0).toLocaleString('en-IN')}`;
  const accounts = latest?.accounts || [];
  const totals = accounts.reduce((acc, a) => ({
    od: acc.od + (a.opening_debit || 0),
    oc: acc.oc + (a.opening_credit || 0),
    pd: acc.pd + (a.period_debit || 0),
    pc: acc.pc + (a.period_credit || 0),
    cd: acc.cd + (a.closing_debit || 0),
    cc: acc.cc + (a.closing_credit || 0),
  }), { od: 0, oc: 0, pd: 0, pc: 0, cd: 0, cc: 0 });

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh', padding: '24px', color: '#e2e8f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Trial Balance</h1>
        <button onClick={() => setShowGenerate(true)} style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontWeight: 600 }}>Generate New</button>
      </div>
      {error && <div style={{ background: '#7f1d1d', color: '#fca5a5', padding: 12, borderRadius: 8, marginBottom: 16 }}>{error}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>Loading trial balance...</div>
      ) : latest ? (
        <>
          {/* Header info */}
          <div style={{ background: '#1e293b', borderRadius: 12, padding: 20, marginBottom: 24, border: '1px solid #334155', display: 'flex', gap: 32, alignItems: 'center' }}>
            <div>
              <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 4 }}>PERIOD DATE</div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{latest.period_date ? new Date(latest.period_date).toLocaleDateString('en-IN') : '—'}</div>
            </div>
            <div>
              <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 4 }}>FINANCIAL YEAR</div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{latest.financial_year || '—'}</div>
            </div>
            <div>
              <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 4 }}>STATUS</div>
              <span style={{
                background: latest.is_balanced ? '#166534' : '#7f1d1d',
                color: latest.is_balanced ? '#86efac' : '#fca5a5',
                padding: '4px 14px', borderRadius: 20, fontWeight: 700, fontSize: 14
              }}>
                {latest.is_balanced ? '✓ BALANCED' : '⚠ UNBALANCED'}
              </span>
            </div>
          </div>

          {/* Table */}
          <div style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #334155', overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
              <thead>
                <tr style={{ background: '#0f172a' }}>
                  <th style={thStyle('left')}>Code</th>
                  <th style={thStyle('left')}>Account Name</th>
                  <th style={thStyle('left')}>Type</th>
                  <th style={thStyle('right')}>Opening Dr</th>
                  <th style={thStyle('right')}>Opening Cr</th>
                  <th style={thStyle('right')}>Period Dr</th>
                  <th style={thStyle('right')}>Period Cr</th>
                  <th style={thStyle('right')}>Closing Dr</th>
                  <th style={thStyle('right')}>Closing Cr</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((a, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #1e293b', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                    <td style={tdStyle()}>{a.account_code}</td>
                    <td style={tdStyle()}>{a.account_name}</td>
                    <td style={tdStyle()}><span style={{ background: '#1e3a5f', color: '#60a5fa', padding: '2px 8px', borderRadius: 10, fontSize: 12 }}>{a.account_type}</span></td>
                    <td style={tdStyle('right')}>{fmt(a.opening_debit)}</td>
                    <td style={tdStyle('right')}>{fmt(a.opening_credit)}</td>
                    <td style={tdStyle('right')}>{fmt(a.period_debit)}</td>
                    <td style={tdStyle('right')}>{fmt(a.period_credit)}</td>
                    <td style={{ ...tdStyle('right'), color: '#22c55e', fontWeight: 700 }}>{fmt(a.closing_debit)}</td>
                    <td style={{ ...tdStyle('right'), color: '#ef4444', fontWeight: 700 }}>{fmt(a.closing_credit)}</td>
                  </tr>
                ))}
                {/* Totals row */}
                <tr style={{ background: '#0f172a', fontWeight: 700, borderTop: '2px solid #3b82f6' }}>
                  <td colSpan={3} style={{ padding: '14px 16px', color: '#e2e8f0' }}>TOTAL</td>
                  <td style={tdStyle('right', true)}>{fmt(totals.od)}</td>
                  <td style={tdStyle('right', true)}>{fmt(totals.oc)}</td>
                  <td style={tdStyle('right', true)}>{fmt(totals.pd)}</td>
                  <td style={tdStyle('right', true)}>{fmt(totals.pc)}</td>
                  <td style={{ ...tdStyle('right', true), color: '#22c55e' }}>{fmt(totals.cd)}</td>
                  <td style={{ ...tdStyle('right', true), color: '#ef4444' }}>{fmt(totals.cc)}</td>
                </tr>
              </tbody>
            </table>
            {accounts.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>No accounts in trial balance</div>}
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>No trial balance found. Generate one to get started.</div>
      )}

      {/* Generate Modal */}
      {showGenerate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#1e293b', borderRadius: 12, padding: 32, width: 420, border: '1px solid #334155' }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700 }}>Generate Trial Balance</h2>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', marginBottom: 6, color: '#94a3b8', fontSize: 13 }}>PERIOD DATE</label>
              <input type="date" value={genForm.period_date} onChange={e => setGenForm(p => ({ ...p, period_date: e.target.value }))}
                style={{ width: '100%', background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 8, padding: '10px 12px', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 6, color: '#94a3b8', fontSize: 13 }}>FINANCIAL YEAR</label>
              <input value={genForm.financial_year} onChange={e => setGenForm(p => ({ ...p, financial_year: e.target.value }))} placeholder="e.g. 2024-25"
                style={{ width: '100%', background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 8, padding: '10px 12px', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowGenerate(false)} style={{ background: '#334155', color: '#e2e8f0', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={generate} disabled={generating} style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontWeight: 600 }}>
                {generating ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const thStyle = (align = 'left') => ({ padding: '12px 16px', textAlign: align, color: '#94a3b8', fontSize: 12, fontWeight: 600, borderBottom: '1px solid #334155', whiteSpace: 'nowrap' });
const tdStyle = (align = 'left', bold = false) => ({ padding: '11px 16px', textAlign: align, color: '#e2e8f0', fontSize: 13, fontWeight: bold ? 700 : 400 });
