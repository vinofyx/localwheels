import React, { useState, useEffect } from 'react';
const _BASE = import.meta.env.VITE_API_URL || '/api';
const h = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}`, 'Content-Type': 'application/json' });

const s = {
  page: { padding: '24px', background: '#0f172a', minHeight: '100vh', color: '#e2e8f0', fontFamily: 'sans-serif' },
  title: { fontSize: '22px', fontWeight: 700, marginBottom: '20px', color: '#f1f5f9' },
  card: { background: '#1e293b', borderRadius: '10px', padding: '20px', border: '1px solid #334155', marginBottom: '16px' },
  budgetGrid: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px', marginBottom: '16px' },
  budgetCard: { background: '#0f172a', borderRadius: '8px', padding: '16px', cursor: 'pointer', border: '2px solid transparent' },
  budgetCardSel: { borderColor: '#3b82f6' },
  sectionTitle: { fontSize: '13px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '12px' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
  th: { textAlign: 'left', padding: '9px 12px', color: '#64748b', borderBottom: '1px solid #334155', fontSize: '11px', textTransform: 'uppercase' },
  td: { padding: '10px 12px', borderBottom: '1px solid #1e293b' },
  btn: (c) => ({ background: c, color: '#fff', border: 'none', borderRadius: '6px', padding: '7px 14px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, marginRight: '6px' }),
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#1e293b', borderRadius: '12px', padding: '28px', width: '420px', border: '1px solid #334155' },
  modalTitle: { fontSize: '16px', fontWeight: 700, marginBottom: '20px' },
  label: { fontSize: '12px', color: '#64748b', marginBottom: '4px' },
  input: { width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#e2e8f0', borderRadius: '6px', padding: '8px 10px', fontSize: '13px', marginBottom: '12px', boxSizing: 'border-box' },
  modalRow: { display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' },
  badge: (c) => ({ display: 'inline-block', padding: '2px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600, background: c[0], color: c[1] }),
  varBadge: (v) => ({ color: v >= 0 ? '#34d399' : '#f87171', fontWeight: 600 }),
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  error: { background: '#450a0a', color: '#fca5a5', padding: '12px', borderRadius: '8px', marginBottom: '16px' },
  success: { background: '#052e16', color: '#86efac', padding: '12px', borderRadius: '8px', marginBottom: '16px' },
};

const STATUS_COLORS = { draft: ['#334155', '#94a3b8'], approved: ['#14532d', '#86efac'], active: ['#1e3a8a', '#93c5fd'], closed: ['#1c1917', '#78716c'] };
const YEARS = ['2024-25', '2025-26', '2026-27'];
const PERIOD_TYPES = ['monthly', 'quarterly', 'annual'];

const emptyBudget = { budget_name: '', financial_year: '2025-26', period_type: 'annual', revenue_budget: '', expense_budget: '' };
const emptyLine = { account_name: '', category: '', budget_amount: '' };

export default function BudgetPlanner() {
  const [budgets, setBudgets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [linesLoading, setLinesLoading] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showLineModal, setShowLineModal] = useState(false);
  const [form, setForm] = useState(emptyBudget);
  const [lineForm, setLineForm] = useState(emptyLine);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${_BASE}/budget`, { headers: h() });
      const d = await res.json();
      setBudgets(Array.isArray(d.data) ? d.data : []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const selectBudget = async (b) => {
    setSelected(b);
    try {
      setLinesLoading(true);
      const res = await fetch(`${_BASE}/budget/${b._id}/lines`, { headers: h() });
      const d = await res.json();
      setLines(Array.isArray(d.data) ? d.data : []);
    } catch (e) { setError(e.message); }
    finally { setLinesLoading(false); }
  };

  const createBudget = async () => {
    if (!form.budget_name) { setError('Budget name required'); return; }
    try {
      setSaving(true); setError('');
      const res = await fetch(`${_BASE}/budget`, { method: 'POST', headers: h(), body: JSON.stringify({ ...form, revenue_budget: parseFloat(form.revenue_budget) || 0, expense_budget: parseFloat(form.expense_budget) || 0 }) });
      if (!res.ok) throw new Error((await res.json()).message || 'Failed');
      setMsg('Budget created'); setShowBudgetModal(false); setForm(emptyBudget); load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const addLine = async () => {
    if (!lineForm.account_name || !lineForm.budget_amount) { setError('Account name and amount required'); return; }
    try {
      setSaving(true); setError('');
      const res = await fetch(`${_BASE}/budget/${selected._id}/lines`, { method: 'POST', headers: h(), body: JSON.stringify({ ...lineForm, budget_amount: parseFloat(lineForm.budget_amount) }) });
      if (!res.ok) throw new Error((await res.json()).message || 'Failed');
      setMsg('Line added'); setShowLineModal(false); setLineForm(emptyLine); selectBudget(selected);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const approve = async (id) => {
    try {
      await fetch(`${_BASE}/budget/${id}/approve`, { method: 'PUT', headers: h() });
      setMsg('Budget approved'); load();
      if (selected?._id === id) setSelected(b => ({ ...b, status: 'approved' }));
    } catch (e) { setError(e.message); }
  };

  const fmt = (n) => n != null ? `₹${Number(n).toLocaleString('en-IN')}` : '—';

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={s.title}>Budget Planner</div>
        <button style={s.btn('#3b82f6')} onClick={() => setShowBudgetModal(true)}>+ Create Budget</button>
      </div>
      {error && <div style={s.error}>{error}</div>}
      {msg && <div style={s.success}>{msg}</div>}

      {loading ? <div>Loading...</div> : (
        <>
          <div style={s.budgetGrid}>
            {budgets.map(b => (
              <div key={b._id} style={{ ...s.budgetCard, ...(selected?._id === b._id ? s.budgetCardSel : {}) }} onClick={() => selectBudget(b)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 700, fontSize: '14px' }}>{b.budget_name}</span>
                  <span style={s.badge(STATUS_COLORS[b.status] || ['#334155', '#94a3b8'])}>{b.status}</span>
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>{b.financial_year} · {b.period_type}</div>
                <div style={{ fontSize: '12px' }}>Revenue: <span style={{ color: '#34d399' }}>{fmt(b.total_revenue_budget)}</span></div>
                <div style={{ fontSize: '12px' }}>Expenses: <span style={{ color: '#f87171' }}>{fmt(b.total_expense_budget)}</span></div>
                {b.status !== 'approved' && (
                  <button style={{ ...s.btn('#16a34a'), marginTop: '10px' }} onClick={e => { e.stopPropagation(); approve(b._id); }}>Approve</button>
                )}
              </div>
            ))}
            {budgets.length === 0 && <div style={{ color: '#64748b', fontSize: '13px' }}>No budgets found</div>}
          </div>

          {selected && (
            <div style={s.card}>
              <div style={s.header}>
                <div style={s.sectionTitle}>Budget Lines — {selected.budget_name}</div>
                <button style={s.btn('#7c3aed')} onClick={() => setShowLineModal(true)}>+ Add Line</button>
              </div>
              {linesLoading ? <div>Loading lines...</div> : (
                <table style={s.table}>
                  <thead>
                    <tr>{['Account', 'Category', 'Budget', 'Actual', 'Variance', 'Variance %'].map(c => <th key={c} style={s.th}>{c}</th>)}</tr>
                  </thead>
                  <tbody>
                    {lines.map((line, i) => (
                      <tr key={i}>
                        <td style={s.td}>{line.account_name}</td>
                        <td style={s.td}>{line.category || '—'}</td>
                        <td style={s.td}>{fmt(line.budget_amount)}</td>
                        <td style={s.td}>{fmt(line.actual_amount)}</td>
                        <td style={s.td}><span style={s.varBadge(line.variance || 0)}>{fmt(line.variance)}</span></td>
                        <td style={s.td}><span style={s.varBadge(line.variance_pct || 0)}>{line.variance_pct != null ? `${line.variance_pct}%` : '—'}</span></td>
                      </tr>
                    ))}
                    {lines.length === 0 && <tr><td colSpan={6} style={{ ...s.td, textAlign: 'center', color: '#64748b' }}>No budget lines</td></tr>}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}

      {showBudgetModal && (
        <div style={s.overlay} onClick={e => e.target === e.currentTarget && setShowBudgetModal(false)}>
          <div style={s.modal}>
            <div style={s.modalTitle}>Create Budget</div>
            <div style={s.label}>Budget Name</div>
            <input style={s.input} value={form.budget_name} onChange={e => setForm(f => ({ ...f, budget_name: e.target.value }))} />
            <div style={s.label}>Financial Year</div>
            <select style={{ ...s.input, background: '#0f172a' }} value={form.financial_year} onChange={e => setForm(f => ({ ...f, financial_year: e.target.value }))}>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <div style={s.label}>Period Type</div>
            <select style={{ ...s.input, background: '#0f172a' }} value={form.period_type} onChange={e => setForm(f => ({ ...f, period_type: e.target.value }))}>
              {PERIOD_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            {[['Revenue Budget', 'revenue_budget'], ['Expense Budget', 'expense_budget']].map(([lbl, k]) => (
              <div key={k}><div style={s.label}>{lbl}</div><input style={s.input} type="number" value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} /></div>
            ))}
            <div style={s.modalRow}>
              <button style={s.btn('#334155')} onClick={() => setShowBudgetModal(false)}>Cancel</button>
              <button style={s.btn('#3b82f6')} onClick={createBudget} disabled={saving}>{saving ? 'Creating...' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}

      {showLineModal && (
        <div style={s.overlay} onClick={e => e.target === e.currentTarget && setShowLineModal(false)}>
          <div style={s.modal}>
            <div style={s.modalTitle}>Add Budget Line</div>
            {[['Account Name', 'account_name', 'text'], ['Category', 'category', 'text'], ['Budget Amount', 'budget_amount', 'number']].map(([lbl, k, t]) => (
              <div key={k}><div style={s.label}>{lbl}</div><input style={s.input} type={t} value={lineForm[k]} onChange={e => setLineForm(f => ({ ...f, [k]: e.target.value }))} /></div>
            ))}
            <div style={s.modalRow}>
              <button style={s.btn('#334155')} onClick={() => setShowLineModal(false)}>Cancel</button>
              <button style={s.btn('#7c3aed')} onClick={addLine} disabled={saving}>{saving ? 'Adding...' : 'Add Line'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
