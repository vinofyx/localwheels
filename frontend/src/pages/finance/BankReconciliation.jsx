import React, { useState, useEffect } from 'react';
const _BASE = import.meta.env.VITE_API_URL || '/api';
const h = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}`, 'Content-Type': 'application/json' });

const s = {
  page: { padding: '24px', background: '#0f172a', minHeight: '100vh', color: '#e2e8f0', fontFamily: 'sans-serif' },
  title: { fontSize: '22px', fontWeight: 700, marginBottom: '20px', color: '#f1f5f9' },
  card: { background: '#1e293b', borderRadius: '10px', padding: '20px', border: '1px solid #334155', marginBottom: '16px' },
  sectionTitle: { fontSize: '13px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '14px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '16px' },
  accCard: { background: '#0f172a', borderRadius: '8px', padding: '14px', cursor: 'pointer', border: '2px solid transparent', transition: 'border-color 0.2s' },
  accCardSel: { borderColor: '#3b82f6' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
  th: { textAlign: 'left', padding: '9px 12px', color: '#64748b', borderBottom: '1px solid #334155', fontSize: '11px', textTransform: 'uppercase' },
  td: { padding: '10px 12px', borderBottom: '1px solid #1e293b', verticalAlign: 'middle' },
  btn: (c) => ({ background: c, color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, marginRight: '8px' }),
  label: { fontSize: '12px', color: '#64748b', marginBottom: '4px' },
  input: { width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#e2e8f0', borderRadius: '6px', padding: '8px 10px', fontSize: '13px', marginBottom: '12px', boxSizing: 'border-box' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#1e293b', borderRadius: '12px', padding: '28px', width: '400px', border: '1px solid #334155' },
  modalTitle: { fontSize: '16px', fontWeight: 700, marginBottom: '20px' },
  modalRow: { display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' },
  row: { display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' },
  error: { background: '#450a0a', color: '#fca5a5', padding: '12px', borderRadius: '8px', marginBottom: '16px' },
  success: { background: '#052e16', color: '#86efac', padding: '12px', borderRadius: '8px', marginBottom: '16px' },
};

const emptyRecon = { period_start: '', period_end: '', statement_balance: '' };

export default function BankReconciliation() {
  const [accounts, setAccounts] = useState([]);
  const [selectedAcc, setSelectedAcc] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [reconciliation, setReconciliation] = useState(null);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyRecon);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch(`${_BASE}/banking/accounts`, { headers: h() })
      .then(r => r.json())
      .then(d => { setAccounts(Array.isArray(d.data) ? d.data : []); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  const selectAccount = async (acc) => {
    setSelectedAcc(acc); setSelected([]);
    try {
      setTxLoading(true);
      const res = await fetch(`${_BASE}/banking/accounts/${acc._id}/transactions`, { headers: h() });
      const d = await res.json();
      setTransactions(Array.isArray(d.data) ? d.data : []);
    } catch (e) { setError(e.message); }
    finally { setTxLoading(false); }
  };

  const startRecon = async () => {
    if (!form.period_start || !form.period_end || !form.statement_balance) { setError('All fields required'); return; }
    try {
      setSaving(true); setError('');
      const res = await fetch(`${_BASE}/reconciliation`, { method: 'POST', headers: h(), body: JSON.stringify({ ...form, account_id: selectedAcc._id, statement_balance: parseFloat(form.statement_balance) }) });
      const d = await res.json();
      setReconciliation(d.data || d);
      setMsg('Reconciliation started'); setShowModal(false); setForm(emptyRecon);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const toggleSelect = (id) => setSelected(sel => sel.includes(id) ? sel.filter(s => s !== id) : [...sel, id]);

  const matchSelected = async () => {
    if (!reconciliation || selected.length === 0) return;
    try {
      await fetch(`${_BASE}/reconciliation/${reconciliation._id}/match`, { method: 'PUT', headers: h(), body: JSON.stringify({ transaction_ids: selected }) });
      setMsg(`${selected.length} transaction(s) matched`); setSelected([]);
      selectAccount(selectedAcc);
    } catch (e) { setError(e.message); }
  };

  const complete = async () => {
    if (!reconciliation) return;
    try {
      await fetch(`${_BASE}/reconciliation/${reconciliation._id}/complete`, { method: 'PUT', headers: h() });
      setMsg('Reconciliation completed'); setReconciliation(null);
    } catch (e) { setError(e.message); }
  };

  const fmt = (n) => n != null ? `₹${Number(n).toLocaleString('en-IN')}` : '—';
  const unreconciled = transactions.filter(t => !t.reconciled);

  return (
    <div style={s.page}>
      <div style={s.title}>Bank Reconciliation</div>
      {error && <div style={s.error}>{error}</div>}
      {msg && <div style={s.success}>{msg}</div>}

      {loading ? <div>Loading...</div> : (
        <>
          <div style={s.card}>
            <div style={s.sectionTitle}>Bank Accounts</div>
            <div style={s.grid}>
              {accounts.map(acc => (
                <div key={acc._id} style={{ ...s.accCard, ...(selectedAcc?._id === acc._id ? s.accCardSel : {}) }} onClick={() => selectAccount(acc)}>
                  <div style={{ fontWeight: 600, marginBottom: '4px' }}>{acc.account_name || acc.bank_name}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{acc.account_number}</div>
                  <div style={{ fontSize: '14px', color: '#34d399', marginTop: '6px', fontWeight: 600 }}>{fmt(acc.balance)}</div>
                </div>
              ))}
              {accounts.length === 0 && <div style={{ color: '#64748b', fontSize: '13px' }}>No bank accounts found</div>}
            </div>
          </div>

          {selectedAcc && (
            <div style={s.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={s.sectionTitle}>Transactions — {selectedAcc.account_name || selectedAcc.bank_name}</div>
                <div style={s.row}>
                  {reconciliation && selected.length > 0 && (
                    <button style={s.btn('#7c3aed')} onClick={matchSelected}>Match Selected ({selected.length})</button>
                  )}
                  {reconciliation && (
                    <button style={s.btn('#16a34a')} onClick={complete}>Complete Reconciliation</button>
                  )}
                  {!reconciliation && (
                    <button style={s.btn('#3b82f6')} onClick={() => setShowModal(true)}>Start Reconciliation</button>
                  )}
                </div>
              </div>
              {txLoading ? <div>Loading transactions...</div> : (
                <table style={s.table}>
                  <thead>
                    <tr>{['', 'Date', 'Description', 'Type', 'Amount', 'Status'].map(c => <th key={c} style={s.th}>{c}</th>)}</tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx, i) => (
                      <tr key={i} style={{ opacity: tx.reconciled ? 0.5 : 1 }}>
                        <td style={s.td}>
                          {!tx.reconciled && reconciliation && (
                            <input type="checkbox" checked={selected.includes(tx._id)} onChange={() => toggleSelect(tx._id)} />
                          )}
                        </td>
                        <td style={s.td}>{tx.date ? new Date(tx.date).toLocaleDateString('en-IN') : '—'}</td>
                        <td style={s.td}>{tx.description}</td>
                        <td style={s.td}><span style={{ color: tx.type === 'credit' ? '#34d399' : '#f87171' }}>{tx.type}</span></td>
                        <td style={s.td}>{fmt(tx.amount)}</td>
                        <td style={s.td}><span style={{ color: tx.reconciled ? '#34d399' : '#f59e0b' }}>{tx.reconciled ? 'Reconciled' : 'Pending'}</span></td>
                      </tr>
                    ))}
                    {transactions.length === 0 && <tr><td colSpan={6} style={{ ...s.td, textAlign: 'center', color: '#64748b' }}>No transactions</td></tr>}
                  </tbody>
                </table>
              )}
              {reconciliation && <div style={{ marginTop: '12px', fontSize: '13px', color: '#64748b' }}>{unreconciled.length} unreconciled transactions</div>}
            </div>
          )}
        </>
      )}

      {showModal && (
        <div style={s.overlay} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div style={s.modal}>
            <div style={s.modalTitle}>Start Reconciliation</div>
            {[['Period Start', 'period_start', 'date'], ['Period End', 'period_end', 'date'], ['Statement Balance', 'statement_balance', 'number']].map(([lbl, k, t]) => (
              <div key={k}>
                <div style={s.label}>{lbl}</div>
                <input style={s.input} type={t} value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} />
              </div>
            ))}
            <div style={s.modalRow}>
              <button style={s.btn('#334155')} onClick={() => setShowModal(false)}>Cancel</button>
              <button style={s.btn('#3b82f6')} onClick={startRecon} disabled={saving}>{saving ? 'Starting...' : 'Start'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
