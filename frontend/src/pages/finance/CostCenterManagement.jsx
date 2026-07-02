import React, { useState, useEffect } from 'react';
const _BASE = import.meta.env.VITE_API_URL || '/api';
const h = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}`, 'Content-Type': 'application/json' });

const s = {
  page: { padding: '24px', background: '#0f172a', minHeight: '100vh', color: '#e2e8f0', fontFamily: 'sans-serif' },
  title: { fontSize: '22px', fontWeight: 700, marginBottom: '20px', color: '#f1f5f9' },
  card: { background: '#1e293b', borderRadius: '10px', padding: '20px', border: '1px solid #334155', marginBottom: '16px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px', marginBottom: '20px' },
  ccCard: { background: '#0f172a', borderRadius: '8px', padding: '16px', cursor: 'pointer', border: '2px solid transparent', transition: 'border-color 0.15s' },
  ccCardSel: { borderColor: '#3b82f6' },
  sectionTitle: { fontSize: '13px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '12px' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
  th: { textAlign: 'left', padding: '9px 12px', color: '#64748b', borderBottom: '1px solid #334155', fontSize: '11px', textTransform: 'uppercase' },
  td: { padding: '10px 12px', borderBottom: '1px solid #1e293b' },
  btn: (c) => ({ background: c, color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }),
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#1e293b', borderRadius: '12px', padding: '28px', width: '400px', border: '1px solid #334155' },
  modalTitle: { fontSize: '16px', fontWeight: 700, marginBottom: '20px' },
  label: { fontSize: '12px', color: '#64748b', marginBottom: '4px' },
  input: { width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#e2e8f0', borderRadius: '6px', padding: '8px 10px', fontSize: '13px', marginBottom: '12px', boxSizing: 'border-box' },
  modalRow: { display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  typeBadge: { display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', background: '#1e3a8a', color: '#93c5fd', fontWeight: 600 },
  progressBar: { background: '#334155', borderRadius: '4px', height: '6px', marginTop: '6px', overflow: 'hidden' },
  progressFill: (pct, over) => ({ height: '100%', borderRadius: '4px', background: over ? '#f87171' : '#3b82f6', width: `${Math.min(pct, 100)}%` }),
  error: { background: '#450a0a', color: '#fca5a5', padding: '12px', borderRadius: '8px', marginBottom: '16px' },
  success: { background: '#052e16', color: '#86efac', padding: '12px', borderRadius: '8px', marginBottom: '16px' },
};

const TYPES = ['branch', 'department', 'project', 'region'];
const emptyForm = { code: '', name: '', type: 'department', budget_amount: '' };

export default function CostCenterManagement() {
  const [centers, setCenters] = useState([]);
  const [selected, setSelected] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expLoading, setExpLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${_BASE}/cost-centers/summary`, { headers: h() });
      const d = await res.json();
      setCenters(Array.isArray(d.data) ? d.data : []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const selectCenter = async (cc) => {
    setSelected(cc);
    try {
      setExpLoading(true);
      const res = await fetch(`${_BASE}/cost-centers/${cc._id}/expenses`, { headers: h() });
      const d = await res.json();
      setExpenses(Array.isArray(d.data) ? d.data : []);
    } catch (e) { setError(e.message); }
    finally { setExpLoading(false); }
  };

  const create = async () => {
    if (!form.code || !form.name) { setError('Code and name required'); return; }
    try {
      setSaving(true); setError('');
      const res = await fetch(`${_BASE}/cost-centers`, { method: 'POST', headers: h(), body: JSON.stringify({ ...form, budget_amount: parseFloat(form.budget_amount) || 0 }) });
      if (!res.ok) throw new Error((await res.json()).message || 'Failed');
      setMsg('Cost center created'); setShowModal(false); setForm(emptyForm); load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const fmt = (n) => n != null ? `₹${Number(n).toLocaleString('en-IN')}` : '—';

  const utilPct = (cc) => {
    if (!cc.budget_amount || cc.budget_amount === 0) return 0;
    return Math.round(((cc.actual_amount || 0) / cc.budget_amount) * 100);
  };

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={s.title}>Cost Center Management</div>
        <button style={s.btn('#3b82f6')} onClick={() => setShowModal(true)}>+ Create Cost Center</button>
      </div>
      {error && <div style={s.error}>{error}</div>}
      {msg && <div style={s.success}>{msg}</div>}

      {loading ? <div>Loading...</div> : (
        <>
          <div style={s.grid}>
            {centers.map(cc => {
              const pct = utilPct(cc);
              const over = pct > 100;
              return (
                <div key={cc._id} style={{ ...s.ccCard, ...(selected?._id === cc._id ? s.ccCardSel : {}) }} onClick={() => selectCenter(cc)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 700, fontSize: '14px' }}>{cc.name}</span>
                    <span style={s.typeBadge}>{cc.type}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px' }}>Code: {cc.code}</div>
                  <div style={{ fontSize: '12px', marginBottom: '2px' }}>Budget: <span style={{ color: '#94a3b8' }}>{fmt(cc.budget_amount)}</span></div>
                  <div style={{ fontSize: '12px', marginBottom: '2px' }}>Actual: <span style={{ color: over ? '#f87171' : '#34d399' }}>{fmt(cc.actual_amount)}</span></div>
                  <div style={{ fontSize: '12px' }}>Variance: <span style={{ color: (cc.variance || 0) >= 0 ? '#34d399' : '#f87171', fontWeight: 600 }}>{fmt(cc.variance)}</span></div>
                  <div style={s.progressBar}><div style={s.progressFill(pct, over)} /></div>
                  <div style={{ fontSize: '10px', color: over ? '#f87171' : '#64748b', marginTop: '3px', textAlign: 'right' }}>{pct}% utilized</div>
                </div>
              );
            })}
            {centers.length === 0 && <div style={{ color: '#64748b', fontSize: '13px' }}>No cost centers found</div>}
          </div>

          {selected && (
            <div style={s.card}>
              <div style={s.sectionTitle}>Expenses — {selected.name} ({selected.code})</div>
              {expLoading ? <div>Loading expenses...</div> : (
                <table style={s.table}>
                  <thead>
                    <tr>{['Expense #', 'Category', 'Description', 'Amount', 'Date', 'Status'].map(c => <th key={c} style={s.th}>{c}</th>)}</tr>
                  </thead>
                  <tbody>
                    {expenses.map((exp, i) => (
                      <tr key={i}>
                        <td style={s.td}><span style={{ color: '#60a5fa' }}>{exp.expense_no || exp._id?.slice(-6)}</span></td>
                        <td style={s.td}>{exp.category}</td>
                        <td style={s.td}>{exp.description}</td>
                        <td style={s.td}>{fmt(exp.amount)}</td>
                        <td style={s.td}>{exp.expense_date ? new Date(exp.expense_date).toLocaleDateString('en-IN') : '—'}</td>
                        <td style={s.td}>
                          <span style={{ color: exp.status === 'paid' ? '#34d399' : exp.status === 'approved' ? '#93c5fd' : '#f59e0b' }}>
                            {exp.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {expenses.length === 0 && <tr><td colSpan={6} style={{ ...s.td, textAlign: 'center', color: '#64748b' }}>No expenses for this cost center</td></tr>}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}

      {showModal && (
        <div style={s.overlay} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div style={s.modal}>
            <div style={s.modalTitle}>Create Cost Center</div>
            {[['Code', 'code', 'text'], ['Name', 'name', 'text'], ['Budget Amount', 'budget_amount', 'number']].map(([lbl, k, t]) => (
              <div key={k}>
                <div style={s.label}>{lbl}</div>
                <input style={s.input} type={t} value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} />
              </div>
            ))}
            <div style={s.label}>Type</div>
            <select style={{ ...s.input, background: '#0f172a' }} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <div style={s.modalRow}>
              <button style={s.btn('#334155')} onClick={() => setShowModal(false)}>Cancel</button>
              <button style={s.btn('#3b82f6')} onClick={create} disabled={saving}>{saving ? 'Creating...' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
