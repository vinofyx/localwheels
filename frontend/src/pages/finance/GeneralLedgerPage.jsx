import React, { useState, useEffect } from 'react';
const _BASE = import.meta.env.VITE_API_URL || '/api';
const h = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}`, 'Content-Type': 'application/json' });

export default function GeneralLedgerPage() {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [error, setError] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showTrialBalance, setShowTrialBalance] = useState(false);
  const [trialBalance, setTrialBalance] = useState(null);
  const [tbLoading, setTbLoading] = useState(false);

  useEffect(() => { fetchAccounts(); }, []);

  const fetchAccounts = async () => {
    try {
      setLoadingAccounts(true);
      const r = await fetch(`${_BASE}/chart-of-accounts`, { headers: h() });
      const d = await r.json();
      setAccounts(Array.isArray(d) ? d : d.data || []);
    } catch (e) { setError('Failed to load accounts'); }
    finally { setLoadingAccounts(false); }
  };

  const fetchEntries = async (accountId) => {
    if (!accountId) return;
    try {
      setLoading(true);
      const params = new URLSearchParams({ account_id: accountId });
      if (dateFrom) params.set('date_from', dateFrom);
      if (dateTo) params.set('date_to', dateTo);
      const r = await fetch(`${_BASE}/general-ledger/account/${accountId}?${params}`, { headers: h() });
      const d = await r.json();
      setEntries(Array.isArray(d) ? d : d.data || []);
    } catch (e) { setError('Failed to load ledger entries'); }
    finally { setLoading(false); }
  };

  const fetchTrialBalance = async () => {
    try {
      setTbLoading(true);
      const r = await fetch(`${_BASE}/general-ledger/trial-balance`, { headers: h() });
      const d = await r.json();
      setTrialBalance(d);
      setShowTrialBalance(true);
    } catch (e) { setError('Failed to load trial balance'); }
    finally { setTbLoading(false); }
  };

  const handleAccountChange = (e) => {
    setSelectedAccount(e.target.value);
    fetchEntries(e.target.value);
  };

  const applyFilter = () => fetchEntries(selectedAccount);
  const fmt = v => `₹${Number(v || 0).toLocaleString('en-IN')}`;
  const selectedAcc = accounts.find(a => a._id === selectedAccount || a.id === selectedAccount);

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh', padding: '24px', color: '#e2e8f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>General Ledger</h1>
        <button onClick={fetchTrialBalance} disabled={tbLoading} style={{ background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontWeight: 600 }}>
          {tbLoading ? 'Loading...' : 'Trial Balance'}
        </button>
      </div>
      {error && <div style={{ background: '#7f1d1d', color: '#fca5a5', padding: 12, borderRadius: 8, marginBottom: 16 }}>{error}</div>}

      {/* Filters */}
      <div style={{ background: '#1e293b', borderRadius: 12, padding: 20, marginBottom: 24, border: '1px solid #334155' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 12, alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, color: '#94a3b8', fontSize: 13 }}>ACCOUNT</label>
            <select value={selectedAccount} onChange={handleAccountChange} disabled={loadingAccounts}
              style={{ width: '100%', background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 8, padding: '10px 12px' }}>
              <option value="">{loadingAccounts ? 'Loading accounts...' : 'Select Account'}</option>
              {accounts.map(a => (
                <option key={a._id || a.id} value={a._id || a.id}>{a.account_code} — {a.account_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, color: '#94a3b8', fontSize: 13 }}>DATE FROM</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              style={{ width: '100%', background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 8, padding: '10px 12px', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, color: '#94a3b8', fontSize: 13 }}>DATE TO</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              style={{ width: '100%', background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 8, padding: '10px 12px', boxSizing: 'border-box' }} />
          </div>
          <button onClick={applyFilter} disabled={!selectedAccount}
            style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}>
            Apply Filter
          </button>
        </div>
      </div>

      {/* Ledger Table */}
      {selectedAcc && (
        <div style={{ marginBottom: 8, color: '#94a3b8', fontSize: 14 }}>
          Showing ledger for: <strong style={{ color: '#e2e8f0' }}>{selectedAcc.account_code} — {selectedAcc.account_name}</strong>
        </div>
      )}
      <div style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #334155', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Loading entries...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#0f172a' }}>
                {['Date', 'Description', 'Debit', 'Credit', 'Balance'].map(col => (
                  <th key={col} style={{ padding: '12px 16px', textAlign: col === 'Date' || col === 'Description' ? 'left' : 'right', color: '#94a3b8', fontSize: 13, fontWeight: 600, borderBottom: '1px solid #334155' }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #1e293b', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                  <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: 13 }}>{e.entry_date ? new Date(e.entry_date).toLocaleDateString('en-IN') : '—'}</td>
                  <td style={{ padding: '12px 16px', color: '#e2e8f0' }}>{e.description}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', color: '#22c55e', fontWeight: 600 }}>{e.debit ? fmt(e.debit) : '—'}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', color: '#ef4444', fontWeight: 600 }}>{e.credit ? fmt(e.credit) : '—'}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', color: '#3b82f6', fontWeight: 700 }}>{fmt(e.balance)}</td>
                </tr>
              ))}
              {entries.length === 0 && !loading && (
                <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                  {selectedAccount ? 'No entries found' : 'Select an account to view ledger'}
                </td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Trial Balance Modal */}
      {showTrialBalance && trialBalance && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#1e293b', borderRadius: 12, padding: 32, width: 700, maxHeight: '80vh', overflowY: 'auto', border: '1px solid #334155' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Trial Balance</h2>
              <button onClick={() => setShowTrialBalance(false)} style={{ background: '#334155', color: '#e2e8f0', border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer' }}>Close</button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#0f172a' }}>
                  {['Account Code', 'Account Name', 'Debit', 'Credit'].map(col => (
                    <th key={col} style={{ padding: '10px 14px', textAlign: col.includes('Account') ? 'left' : 'right', color: '#94a3b8', fontSize: 13, borderBottom: '1px solid #334155' }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(trialBalance.accounts || []).map((a, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '10px 14px', color: '#94a3b8', fontSize: 13 }}>{a.account_code}</td>
                    <td style={{ padding: '10px 14px', color: '#e2e8f0' }}>{a.account_name}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', color: '#22c55e' }}>{a.debit ? fmt(a.debit) : '—'}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', color: '#ef4444' }}>{a.credit ? fmt(a.credit) : '—'}</td>
                  </tr>
                ))}
                <tr style={{ background: '#0f172a', fontWeight: 700 }}>
                  <td colSpan={2} style={{ padding: '12px 14px', color: '#e2e8f0' }}>TOTAL</td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', color: '#22c55e' }}>{fmt(trialBalance.total_debit)}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', color: '#ef4444' }}>{fmt(trialBalance.total_credit)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
