import React, { useState } from 'react';
const _BASE = import.meta.env.VITE_API_URL || '/api';
const h = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}`, 'Content-Type': 'application/json' });

const s = {
  page: { padding: '24px', background: '#0f172a', minHeight: '100vh', color: '#e2e8f0', fontFamily: 'sans-serif' },
  title: { fontSize: '22px', fontWeight: 700, marginBottom: '20px', color: '#f1f5f9' },
  card: { background: '#1e293b', borderRadius: '10px', padding: '24px', border: '1px solid #334155', marginBottom: '16px' },
  sectionTitle: { fontSize: '13px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '14px' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' },
  label: { fontSize: '12px', color: '#64748b', marginBottom: '4px' },
  input: { width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#e2e8f0', borderRadius: '6px', padding: '8px 10px', fontSize: '13px', boxSizing: 'border-box' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
  th: { textAlign: 'left', padding: '8px 10px', color: '#64748b', borderBottom: '1px solid #334155', fontSize: '11px', textTransform: 'uppercase' },
  td: { padding: '6px 4px', borderBottom: '1px solid #1e293b', verticalAlign: 'middle' },
  btn: (c) => ({ background: c, color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 18px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }),
  addBtn: { background: 'transparent', border: '1px dashed #334155', color: '#60a5fa', borderRadius: '6px', padding: '7px 14px', cursor: 'pointer', fontSize: '12px', marginTop: '8px' },
  totals: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', marginTop: '12px' },
  totalRow: { display: 'flex', gap: '24px', fontSize: '13px' },
  totalLabel: { color: '#64748b', minWidth: '140px', textAlign: 'right' },
  totalVal: { color: '#f1f5f9', minWidth: '100px', textAlign: 'right', fontWeight: 600 },
  error: { background: '#450a0a', color: '#fca5a5', padding: '12px', borderRadius: '8px', marginBottom: '16px' },
  success: { background: '#052e16', color: '#86efac', padding: '12px', borderRadius: '8px', marginBottom: '16px' },
};

const emptyLine = () => ({ description: '', hsn_code: '', quantity: '', rate: '' });

export default function InvoiceBuilder() {
  const today = new Date().toISOString().split('T')[0];
  const invNo = `INV-${today.replace(/-/g, '')}-${Math.floor(Math.random() * 900 + 100)}`;
  const [form, setForm] = useState({ invoice_number: invNo, customer_name: '', customer_gst: '', customer_address: '', invoice_date: today, due_date: '' });
  const [lines, setLines] = useState([emptyLine()]);
  const [gst, setGst] = useState({ cgst_pct: '', sgst_pct: '', igst_pct: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setLine = (i, k, v) => setLines(ls => ls.map((l, idx) => idx === i ? { ...l, [k]: v } : l));
  const addLine = () => setLines(ls => [...ls, emptyLine()]);
  const removeLine = (i) => setLines(ls => ls.filter((_, idx) => idx !== i));

  const lineAmount = (l) => (parseFloat(l.quantity) || 0) * (parseFloat(l.rate) || 0);
  const subTotal = lines.reduce((s, l) => s + lineAmount(l), 0);
  const cgstAmt = subTotal * ((parseFloat(gst.cgst_pct) || 0) / 100);
  const sgstAmt = subTotal * ((parseFloat(gst.sgst_pct) || 0) / 100);
  const igstAmt = subTotal * ((parseFloat(gst.igst_pct) || 0) / 100);
  const total = subTotal + cgstAmt + sgstAmt + igstAmt;
  const fmt = (n) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const submit = async () => {
    if (!form.customer_name) { setError('Customer name is required'); return; }
    try {
      setLoading(true); setError(''); setSuccess('');
      const payload = {
        ...form,
        line_items: lines.map(l => ({ ...l, quantity: parseFloat(l.quantity) || 0, rate: parseFloat(l.rate) || 0, amount: lineAmount(l) })),
        cgst_pct: parseFloat(gst.cgst_pct) || 0, cgst_amount: cgstAmt,
        sgst_pct: parseFloat(gst.sgst_pct) || 0, sgst_amount: sgstAmt,
        igst_pct: parseFloat(gst.igst_pct) || 0, igst_amount: igstAmt,
        sub_total: subTotal, total,
      };
      const res = await fetch(`${_BASE}/fin-invoices`, { method: 'POST', headers: h(), body: JSON.stringify(payload) });
      if (!res.ok) throw new Error((await res.json()).message || 'Failed');
      setSuccess(`Invoice ${form.invoice_number} created successfully!`);
      setLines([emptyLine()]);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const Field = ({ label, fk, type = 'text', full }) => (
    <div style={full ? { gridColumn: '1 / -1' } : {}}>
      <div style={s.label}>{label}</div>
      <input style={s.input} type={type} value={form[fk]} onChange={e => setField(fk, e.target.value)} />
    </div>
  );

  return (
    <div style={s.page}>
      <div style={s.title}>Invoice Builder</div>
      {error && <div style={s.error}>{error}</div>}
      {success && <div style={s.success}>{success}</div>}

      <div style={s.card}>
        <div style={s.sectionTitle}>Invoice Details</div>
        <div style={s.grid3}>
          <Field label="Invoice Number" fk="invoice_number" />
          <Field label="Invoice Date" fk="invoice_date" type="date" />
          <Field label="Due Date" fk="due_date" type="date" />
          <Field label="Customer Name" fk="customer_name" />
          <Field label="Customer GST" fk="customer_gst" />
          <div />
          <Field label="Customer Address" fk="customer_address" full />
        </div>
      </div>

      <div style={s.card}>
        <div style={s.sectionTitle}>Line Items</div>
        <table style={s.table}>
          <thead>
            <tr>
              {['Description', 'HSN Code', 'Quantity', 'Rate', 'Amount', ''].map(col => (
                <th key={col} style={s.th}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lines.map((line, i) => (
              <tr key={i}>
                <td style={s.td}><input style={{ ...s.input, width: '200px' }} value={line.description} onChange={e => setLine(i, 'description', e.target.value)} placeholder="Item description" /></td>
                <td style={s.td}><input style={{ ...s.input, width: '90px' }} value={line.hsn_code} onChange={e => setLine(i, 'hsn_code', e.target.value)} placeholder="HSN" /></td>
                <td style={s.td}><input style={{ ...s.input, width: '80px' }} type="number" value={line.quantity} onChange={e => setLine(i, 'quantity', e.target.value)} placeholder="0" /></td>
                <td style={s.td}><input style={{ ...s.input, width: '100px' }} type="number" value={line.rate} onChange={e => setLine(i, 'rate', e.target.value)} placeholder="0.00" /></td>
                <td style={{ ...s.td, fontWeight: 600, color: '#34d399' }}>{fmt(lineAmount(line))}</td>
                <td style={s.td}>{lines.length > 1 && <button onClick={() => removeLine(i)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '16px' }}>×</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <button style={s.addBtn} onClick={addLine}>+ Add Line</button>
      </div>

      <div style={s.card}>
        <div style={s.sectionTitle}>GST</div>
        <div style={s.grid3}>
          {[['CGST %', 'cgst_pct'], ['SGST %', 'sgst_pct'], ['IGST %', 'igst_pct']].map(([lbl, k]) => (
            <div key={k}>
              <div style={s.label}>{lbl}</div>
              <input style={s.input} type="number" value={gst[k]} onChange={e => setGst(g => ({ ...g, [k]: e.target.value }))} placeholder="0" />
            </div>
          ))}
        </div>
        <div style={s.totals}>
          <div style={s.totalRow}><span style={s.totalLabel}>Sub Total</span><span style={s.totalVal}>{fmt(subTotal)}</span></div>
          {cgstAmt > 0 && <div style={s.totalRow}><span style={s.totalLabel}>CGST ({gst.cgst_pct}%)</span><span style={s.totalVal}>{fmt(cgstAmt)}</span></div>}
          {sgstAmt > 0 && <div style={s.totalRow}><span style={s.totalLabel}>SGST ({gst.sgst_pct}%)</span><span style={s.totalVal}>{fmt(sgstAmt)}</span></div>}
          {igstAmt > 0 && <div style={s.totalRow}><span style={s.totalLabel}>IGST ({gst.igst_pct}%)</span><span style={s.totalVal}>{fmt(igstAmt)}</span></div>}
          <div style={{ ...s.totalRow, borderTop: '1px solid #334155', paddingTop: '8px', marginTop: '4px' }}>
            <span style={{ ...s.totalLabel, color: '#f1f5f9', fontWeight: 700 }}>TOTAL</span>
            <span style={{ ...s.totalVal, color: '#34d399', fontSize: '18px' }}>{fmt(total)}</span>
          </div>
        </div>
      </div>

      <button style={s.btn('#3b82f6')} onClick={submit} disabled={loading}>
        {loading ? 'Creating...' : 'Create Invoice'}
      </button>
    </div>
  );
}
