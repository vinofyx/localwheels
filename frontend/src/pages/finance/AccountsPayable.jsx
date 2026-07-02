import React, { useState, useEffect } from 'react';
const _BASE = import.meta.env.VITE_API_URL || '/api';
const h = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}`, 'Content-Type': 'application/json' });

const s = {
  page: { padding: '24px', background: '#0f172a', minHeight: '100vh', color: '#e2e8f0', fontFamily: 'sans-serif' },
  title: { fontSize: '22px', fontWeight: 700, marginBottom: '20px', color: '#f1f5f9' },
  card: { background: '#1e293b', borderRadius: '10px', padding: '20px', border: '1px solid #334155', marginBottom: '16px' },
  grid3: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', marginBottom: '20px' },
  kpiLabel: { fontSize: '11px', color: '#94a3b8', marginBottom: '5px', textTransform: 'uppercase' },
  kpiValue: { fontSize: '22px', fontWeight: 700 },
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
  row: { display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' },
  error: { background: '#450a0a', color: '#fca5a5', padding: '12px', borderRadius: '8px', marginBottom: '16px' },
  success: { background: '#052e16', color: '#86efac', padding: '12px', borderRadius: '8px', marginBottom: '16px' },
};

const emptyForm = { vendor_name: '', amount: '', payment_mode: 'bank_transfer', due_date: '' };

export default function AccountsPayable() {
  const [dash, setDash] = useState({});
  const [aging, setAging] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const [d, a, p] = await Promise.all([
        fetch(`${_BASE}/accounts-payable/dashboard`, { headers: h() }).then(r => r.json()),
        fetch(`${_BASE}/accounts-payable/aging`, { headers: h() }).then(r => r.json()),
        fetch(`${_BASE}/accounts-payable`, { headers: h() }).then(r => r.json()),
      ]);
      setDash(d.data || d);
      setAging(Array.isArray(a.data) ? a.data : []);
      setPayments(Array.isArray(p.data) ? p.data : []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const payNow = async (id) => {
    try {
      await fetch(`${_BASE}/accounts-payable/${id}/pay`, { method: 'PUT', headers: h() });
      setMsg('Payment processed'); load();
    } catch (e) { setError(e.message); }
  };

  const submit = async () => {
    if (!form.vendor_name || !form.amount) { setError('Vendor name and amount are required'); return; }
    try {
      setSaving(true); setError('');
      const res = await fetch(`${_BASE}/accounts-payable`, { method: 'POST', headers: h(), body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }) });
      if (!res.ok) throw new Error((await res.json()).message || 'Failed');
      setMsg('Vendor payment added'); setShowModal(false); setForm(emptyForm); load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const fmt = (n) => n != null ? `₹${Number(n).toLocaleString('en-IN')}` : '—';

  return (
    <div style={s.page}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={s.title}>Accounts Payable</div>
        <button style={s.btn('#3b82f6')} onClick={() => setShowModal(true)}>+ Add Payment</button>
      </div>
      {error && <div style={s.error}>{error}</div>}
      {msg && <div style={s.success}>{msg}</div>}

      {loading ? <div>Loading...</div> : (
        <>
          <div style={s.grid3}>
            {[
              { label: 'Total Payable', value: fmt(dash.total_payable), color: '#f59e0b' },
              { label: 'Overdue Payable', value: fmt(dash.overdue_payable), color: '#f87171' },
              { label: 'On-Time Rate', value: dash.on_time_rate != null ? `${dash.on_time_rate}%` : '—', color: '#34d399' },
            ].map(k => (
              <div key={k.label} style={s.card}>
                <div style={s.kpiLabel}>{k.label}</div>
                <div style={{ ...s.kpiValue, color: k.color }}>{k.value}</div>
              </div>
            ))}
          </div>

          <div style={s.card}>
            <div style={s.sectionTitle}>Aging Analysis</div>
            <table style={s.table}>
              <thead><tr>{['Bucket', 'Count', 'Amount'].map(c => <th key={c} style={s.th}>{c}</th>)}</tr></thead>
              <tbody>
                {aging.length > 0 ? aging.map((row, i) => (
                  <tr key={i}>
                    <td style={s.td}>{row.bucket || row.label}</td>
                    <td style={s.td}>{row.count ?? '—'}</td>
                    <td style={s.td}>{fmt(row.amount)}</td>
                  </tr>
                )) : ['Current (0-30)', '31-60 Days', '61-90 Days', '91-120 Days', '120+ Days'].map(b => (
                  <tr key={b}><td style={s.td}>{b}</td><td style={s.td}>—</td><td style={s.td}>—</td></tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={s.card}>
            <div style={s.sectionTitle}>Vendor Payments</div>
            <table style={s.table}>
              <thead><tr>{['Vendor', 'Amount', 'Mode', 'Due Date', 'Status', 'Action'].map(c => <th key={c} style={s.th}>{c}</th>)}</tr></thead>
              <tbody>
                {payments.map((p, i) => (
                  <tr key={i}>
                    <td style={s.td}>{p.vendor_name}</td>
                    <td style={s.td}>{fmt(p.amount)}</td>
                    <td style={s.td}>{p.payment_mode}</td>
                    <td style={s.td}>{p.due_date ? new Date(p.due_date).toLocaleDateString('en-IN') : '—'}</td>
                    <td style={s.td}><span style={{ color: p.status === 'paid' ? '#34d399' : p.status === 'overdue' ? '#f87171' : '#f59e0b' }}>{p.status}</span></td>
                    <td style={s.td}>{p.status !== 'paid' && <button style={s.btn('#16a34a')} onClick={() => payNow(p._id)}>Pay Now</button>}</td>
                  </tr>
                ))}
                {payments.length === 0 && <tr><td colSpan={6} style={{ ...s.td, textAlign: 'center', color: '#64748b' }}>No payments</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showModal && (
        <div style={s.overlay} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div style={s.modal}>
            <div style={s.modalTitle}>Add Vendor Payment</div>
            {[['Vendor Name', 'vendor_name', 'text'], ['Amount', 'amount', 'number'], ['Due Date', 'due_date', 'date']].map(([lbl, k, t]) => (
              <div key={k}>
                <div style={s.label}>{lbl}</div>
                <input style={s.input} type={t} value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} />
              </div>
            ))}
            <div style={s.label}>Payment Mode</div>
            <select style={{ ...s.input, background: '#0f172a' }} value={form.payment_mode} onChange={e => setForm(f => ({ ...f, payment_mode: e.target.value }))}>
              {['bank_transfer', 'cheque', 'cash', 'upi', 'neft', 'rtgs'].map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <div style={s.row}>
              <button style={s.btn('#334155')} onClick={() => setShowModal(false)}>Cancel</button>
              <button style={s.btn('#3b82f6')} onClick={submit} disabled={saving}>{saving ? 'Saving...' : 'Add Payment'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
