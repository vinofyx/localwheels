import React, { useState, useEffect } from 'react';
const _BASE = import.meta.env.VITE_API_URL || '/api';
const h = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}`, 'Content-Type': 'application/json' });

const s = {
  page: { padding: '24px', background: '#0f172a', minHeight: '100vh', color: '#e2e8f0', fontFamily: 'sans-serif' },
  title: { fontSize: '22px', fontWeight: 700, marginBottom: '20px', color: '#f1f5f9' },
  card: { background: '#1e293b', borderRadius: '10px', padding: '20px', border: '1px solid #334155', marginBottom: '16px' },
  statsRow: { display: 'flex', gap: '12px', marginBottom: '20px' },
  stat: { background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '14px 20px', flex: 1 },
  statLabel: { fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' },
  statVal: { fontSize: '22px', fontWeight: 700 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
  th: { textAlign: 'left', padding: '9px 12px', color: '#64748b', borderBottom: '1px solid #334155', fontSize: '11px', textTransform: 'uppercase' },
  td: { padding: '10px 12px', borderBottom: '1px solid #1e293b', verticalAlign: 'middle' },
  btn: (c) => ({ background: c, color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, marginRight: '4px' }),
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#1e293b', borderRadius: '12px', padding: '28px', width: '440px', border: '1px solid #334155', maxHeight: '85vh', overflowY: 'auto' },
  modalTitle: { fontSize: '16px', fontWeight: 700, marginBottom: '20px' },
  label: { fontSize: '12px', color: '#64748b', marginBottom: '4px' },
  input: { width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#e2e8f0', borderRadius: '6px', padding: '8px 10px', fontSize: '13px', marginBottom: '12px', boxSizing: 'border-box' },
  modalRow: { display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' },
  badge: (c) => ({ display: 'inline-block', padding: '2px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600, background: c[0], color: c[1] }),
  error: { background: '#450a0a', color: '#fca5a5', padding: '12px', borderRadius: '8px', marginBottom: '16px' },
  success: { background: '#052e16', color: '#86efac', padding: '12px', borderRadius: '8px', marginBottom: '16px' },
};

const STATUS_COLORS = {
  submitted: ['#1e3a8a', '#93c5fd'],
  approved: ['#14532d', '#86efac'],
  paid: ['#052e16', '#34d399'],
  rejected: ['#450a0a', '#fca5a5'],
};

const emptyForm = { category: '', description: '', amount: '', tax_amount: '', payment_mode: 'cash', vendor_name: '', expense_date: new Date().toISOString().split('T')[0] };

export default function ExpenseCenter() {
  const [stats, setStats] = useState({});
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const [st, ex, cats] = await Promise.all([
        fetch(`${_BASE}/expenses/stats`, { headers: h() }).then(r => r.json()),
        fetch(`${_BASE}/expenses`, { headers: h() }).then(r => r.json()),
        fetch(`${_BASE}/expenses/categories`, { headers: h() }).then(r => r.json()),
      ]);
      setStats(st.data || st);
      setExpenses(Array.isArray(ex.data) ? ex.data : []);
      setCategories(Array.isArray(cats.data) ? cats.data : cats.data?.categories || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const action = async (id, endpoint) => {
    try {
      await fetch(`${_BASE}/expenses/${id}/${endpoint}`, { method: 'PUT', headers: h() });
      setMsg(`Expense ${endpoint}d`); load();
    } catch (e) { setError(e.message); }
  };

  const submit = async () => {
    if (!form.category || !form.amount) { setError('Category and amount required'); return; }
    try {
      setSaving(true); setError('');
      const res = await fetch(`${_BASE}/expenses`, { method: 'POST', headers: h(), body: JSON.stringify({ ...form, amount: parseFloat(form.amount), tax_amount: parseFloat(form.tax_amount) || 0 }) });
      if (!res.ok) throw new Error((await res.json()).message || 'Failed');
      setMsg('Expense created'); setShowModal(false); setForm(emptyForm); load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const fmt = (n) => n != null ? `₹${Number(n).toLocaleString('en-IN')}` : '—';

  return (
    <div style={s.page}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={s.title}>Expense Center</div>
        <button style={s.btn('#3b82f6')} onClick={() => setShowModal(true)}>+ Create Expense</button>
      </div>
      {error && <div style={s.error}>{error}</div>}
      {msg && <div style={s.success}>{msg}</div>}

      <div style={s.statsRow}>
        <div style={s.stat}><div style={s.statLabel}>Submitted</div><div style={s.statVal}>{stats.total_submitted ?? '—'}</div></div>
        <div style={s.stat}><div style={s.statLabel}>Approved</div><div style={{ ...s.statVal, color: '#34d399' }}>{stats.total_approved ?? '—'}</div></div>
        <div style={s.stat}><div style={s.statLabel}>Total Amount</div><div style={{ ...s.statVal, color: '#f59e0b' }}>{fmt(stats.total_amount)}</div></div>
      </div>

      {loading ? <div>Loading...</div> : (
        <div style={s.card}>
          <table style={s.table}>
            <thead>
              <tr>{['Expense #', 'Category', 'Description', 'Amount', 'Status', 'Date', 'Actions'].map(c => <th key={c} style={s.th}>{c}</th>)}</tr>
            </thead>
            <tbody>
              {expenses.map((exp, i) => (
                <tr key={i}>
                  <td style={s.td}><span style={{ color: '#60a5fa' }}>{exp.expense_no || exp._id?.slice(-6)}</span></td>
                  <td style={s.td}>{exp.category}</td>
                  <td style={s.td}>{exp.description}</td>
                  <td style={s.td}>{fmt(exp.amount)}</td>
                  <td style={s.td}><span style={s.badge(STATUS_COLORS[exp.status] || ['#334155', '#94a3b8'])}>{exp.status}</span></td>
                  <td style={s.td}>{exp.expense_date ? new Date(exp.expense_date).toLocaleDateString('en-IN') : '—'}</td>
                  <td style={s.td}>
                    {exp.status === 'submitted' && <button style={s.btn('#16a34a')} onClick={() => action(exp._id, 'approve')}>Approve</button>}
                    {exp.status === 'approved' && <button style={s.btn('#7c3aed')} onClick={() => action(exp._id, 'pay')}>Pay</button>}
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && <tr><td colSpan={7} style={{ ...s.td, textAlign: 'center', color: '#64748b' }}>No expenses</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div style={s.overlay} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div style={s.modal}>
            <div style={s.modalTitle}>Create Expense</div>
            <div style={s.label}>Category</div>
            <select style={{ ...s.input, background: '#0f172a' }} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              <option value="">Select category</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {[['Description', 'description', 'text'], ['Amount', 'amount', 'number'], ['Tax Amount', 'tax_amount', 'number'], ['Vendor Name', 'vendor_name', 'text'], ['Expense Date', 'expense_date', 'date']].map(([lbl, k, t]) => (
              <div key={k}>
                <div style={s.label}>{lbl}</div>
                <input style={s.input} type={t} value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} />
              </div>
            ))}
            <div style={s.label}>Payment Mode</div>
            <select style={{ ...s.input, background: '#0f172a' }} value={form.payment_mode} onChange={e => setForm(f => ({ ...f, payment_mode: e.target.value }))}>
              {['cash', 'bank_transfer', 'cheque', 'upi', 'credit_card'].map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <div style={s.modalRow}>
              <button style={s.btn('#334155')} onClick={() => setShowModal(false)}>Cancel</button>
              <button style={s.btn('#3b82f6')} onClick={submit} disabled={saving}>{saving ? 'Saving...' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
