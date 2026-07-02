import React, { useState, useEffect } from 'react';
const _BASE = import.meta.env.VITE_API_URL || '/api';
const h = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}`, 'Content-Type': 'application/json' });

const emptyLine = () => ({ account_id: '', debit: '', credit: '', description: '' });

export default function JournalEntries() {
  const [journals, setJournals] = useState([]);
  const [stats, setStats] = useState({});
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ journal_no: '', journal_date: '', description: '', reference_type: '' });
  const [lines, setLines] = useState([emptyLine(), emptyLine()]);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [jr, sr, ar] = await Promise.all([
        fetch(`${_BASE}/journal`, { headers: h() }),
        fetch(`${_BASE}/journal/stats`, { headers: h() }),
        fetch(`${_BASE}/chart-of-accounts`, { headers: h() }),
      ]);
      const [jd, sd, ad] = await Promise.all([jr.json(), sr.json(), ar.json()]);
      setJournals(Array.isArray(jd) ? jd : jd.data || []);
      setStats(sd);
      setAccounts(Array.isArray(ad) ? ad : ad.data || []);
    } catch (e) { setError('Failed to load data'); }
    finally { setLoading(false); }
  };

  const postJournal = async (id) => {
    try {
      await fetch(`${_BASE}/journal/${id}/post`, { method: 'PUT', headers: h() });
      fetchAll();
    } catch (e) { setError('Failed to post journal'); }
  };

  const reverseJournal = async (id) => {
    try {
      await fetch(`${_BASE}/journal/${id}/reverse`, { method: 'PUT', headers: h() });
      fetchAll();
    } catch (e) { setError('Failed to reverse journal'); }
  };

  const totalDebit = lines.reduce((s, l) => s + (parseFloat(l.debit) || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0);
  const isBalanced = totalDebit > 0 && Math.abs(totalDebit - totalCredit) < 0.01;

  const updateLine = (i, field, val) => setLines(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: val } : l));
  const addLine = () => setLines(p => [...p, emptyLine()]);
  const removeLine = (i) => setLines(p => p.filter((_, idx) => idx !== i));

  const submitJournal = async () => {
    if (!isBalanced) { setError('Journal must be balanced before submitting'); return; }
    try {
      setSaving(true);
      await fetch(`${_BASE}/journal`, {
        method: 'POST', headers: h(),
        body: JSON.stringify({ ...form, lines })
      });
      setShowModal(false);
      setForm({ journal_no: '', journal_date: '', description: '', reference_type: '' });
      setLines([emptyLine(), emptyLine()]);
      fetchAll();
    } catch (e) { setError('Failed to create journal'); }
    finally { setSaving(false); }
  };

  const fmt = v => `₹${Number(v || 0).toLocaleString('en-IN')}`;
  const statusColor = s => ({ posted: '#22c55e', draft: '#f59e0b', reversed: '#ef4444' }[s] || '#64748b');

  const StatCard = ({ label, value, color }) => (
    <div style={{ background: '#1e293b', borderRadius: 12, padding: 20, border: '1px solid #334155', flex: 1 }}>
      <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: color || '#e2e8f0' }}>{value}</div>
    </div>
  );

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh', padding: '24px', color: '#e2e8f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Journal Entries</h1>
        <button onClick={() => setShowModal(true)} style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontWeight: 600 }}>+ New Journal</button>
      </div>
      {error && <div style={{ background: '#7f1d1d', color: '#fca5a5', padding: 12, borderRadius: 8, marginBottom: 16 }}>{error}</div>}

      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <StatCard label="Total Journals" value={stats.total_journals || 0} />
        <StatCard label="Posted" value={stats.posted_count || 0} color="#22c55e" />
        <StatCard label="Drafts" value={stats.draft_count || 0} color="#f59e0b" />
      </div>

      <div style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #334155', overflow: 'hidden' }}>
        {loading ? <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Loading...</div> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#0f172a' }}>
                {['Journal No', 'Date', 'Description', 'Debit', 'Credit', 'Balanced', 'Status', 'Actions'].map(col => (
                  <th key={col} style={{ padding: '12px 16px', textAlign: 'left', color: '#94a3b8', fontSize: 13, fontWeight: 600, borderBottom: '1px solid #334155' }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {journals.map((j, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={{ padding: '12px 16px', color: '#3b82f6', fontWeight: 600 }}>{j.journal_no}</td>
                  <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: 13 }}>{j.journal_date ? new Date(j.journal_date).toLocaleDateString('en-IN') : '—'}</td>
                  <td style={{ padding: '12px 16px', color: '#e2e8f0' }}>{j.description}</td>
                  <td style={{ padding: '12px 16px', color: '#22c55e', fontWeight: 600 }}>{fmt(j.total_debit)}</td>
                  <td style={{ padding: '12px 16px', color: '#ef4444', fontWeight: 600 }}>{fmt(j.total_credit)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ color: j.is_balanced ? '#22c55e' : '#ef4444', fontWeight: 700 }}>{j.is_balanced ? '✓ YES' : '✗ NO'}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ background: statusColor(j.status) + '22', color: statusColor(j.status), padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{j.status}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {j.status === 'draft' && (
                        <button onClick={() => postJournal(j._id || j.id)} style={{ background: '#166534', color: '#86efac', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>Post</button>
                      )}
                      {j.status === 'posted' && (
                        <button onClick={() => reverseJournal(j._id || j.id)} style={{ background: '#7f1d1d', color: '#fca5a5', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>Reverse</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {journals.length === 0 && <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>No journal entries found</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Journal Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}>
          <div style={{ background: '#1e293b', borderRadius: 12, padding: 32, width: '100%', maxWidth: 800, maxHeight: '90vh', overflowY: 'auto', border: '1px solid #334155' }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700 }}>Create Journal Entry</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
              {[['journal_no', 'Journal No', 'text'], ['journal_date', 'Journal Date', 'date'], ['description', 'Description', 'text'], ['reference_type', 'Reference Type', 'text']].map(([k, lbl, type]) => (
                <div key={k}>
                  <label style={{ display: 'block', marginBottom: 6, color: '#94a3b8', fontSize: 13 }}>{lbl.toUpperCase()}</label>
                  <input type={type} value={form[k]} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))}
                    style={{ width: '100%', background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 8, padding: '10px 12px', boxSizing: 'border-box' }} />
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontWeight: 600 }}>Journal Lines</div>
              <div style={{ color: isBalanced ? '#22c55e' : '#ef4444', fontWeight: 700, fontSize: 15 }}>
                {isBalanced ? '✓ BALANCED' : '✗ UNBALANCED'} — Debit: {fmt(totalDebit)} | Credit: {fmt(totalCredit)}
              </div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
              <thead>
                <tr style={{ background: '#0f172a' }}>
                  {['Account', 'Debit', 'Credit', 'Description', ''].map((c, i) => (
                    <th key={i} style={{ padding: '10px 12px', textAlign: 'left', color: '#94a3b8', fontSize: 12, borderBottom: '1px solid #334155' }}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lines.map((line, i) => (
                  <tr key={i}>
                    <td style={{ padding: '6px 8px' }}>
                      <select value={line.account_id} onChange={e => updateLine(i, 'account_id', e.target.value)}
                        style={{ width: '100%', background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 6, padding: '7px 10px', fontSize: 13 }}>
                        <option value="">Select Account</option>
                        {accounts.map(a => <option key={a._id || a.id} value={a._id || a.id}>{a.account_code} — {a.account_name}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '6px 8px' }}>
                      <input type="number" value={line.debit} onChange={e => updateLine(i, 'debit', e.target.value)} placeholder="0"
                        style={{ width: '100%', background: '#0f172a', color: '#22c55e', border: '1px solid #334155', borderRadius: 6, padding: '7px 10px', fontSize: 13, boxSizing: 'border-box' }} />
                    </td>
                    <td style={{ padding: '6px 8px' }}>
                      <input type="number" value={line.credit} onChange={e => updateLine(i, 'credit', e.target.value)} placeholder="0"
                        style={{ width: '100%', background: '#0f172a', color: '#ef4444', border: '1px solid #334155', borderRadius: 6, padding: '7px 10px', fontSize: 13, boxSizing: 'border-box' }} />
                    </td>
                    <td style={{ padding: '6px 8px' }}>
                      <input value={line.description} onChange={e => updateLine(i, 'description', e.target.value)} placeholder="Description"
                        style={{ width: '100%', background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 6, padding: '7px 10px', fontSize: 13, boxSizing: 'border-box' }} />
                    </td>
                    <td style={{ padding: '6px 8px' }}>
                      {lines.length > 2 && <button onClick={() => removeLine(i)} style={{ background: '#7f1d1d', color: '#fca5a5', border: 'none', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 13 }}>✕</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={addLine} style={{ background: '#1e40af', color: '#93c5fd', border: '1px dashed #3b82f6', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, marginBottom: 20 }}>+ Add Line</button>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={{ background: '#334155', color: '#e2e8f0', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={submitJournal} disabled={saving || !isBalanced} style={{ background: isBalanced ? '#3b82f6' : '#334155', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: isBalanced ? 'pointer' : 'not-allowed', fontWeight: 600 }}>
                {saving ? 'Saving...' : 'Create Journal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
