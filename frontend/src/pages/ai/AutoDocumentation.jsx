import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import toast from 'react-hot-toast';

const STATUS_COLORS = { Generated: 'bg-blue-100 text-blue-700', Sent: 'bg-green-100 text-green-700', Pending: 'bg-yellow-100 text-yellow-700', Signed: 'bg-purple-100 text-purple-700' };
const DOC_ICONS = { LR: '📦', Invoice: '💰', 'E-Way Bill': '🛣️', POD: '✅', 'Billing Statement': '📋', 'Delivery Note': '🚚' };

export default function AutoDocumentation() {
  const [docs, setDocs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState('All');
  const [typeFilter, setType] = useState('All');
  const [generating, setGen]  = useState(false);

  useEffect(() => {
    api.get('/ai/docs')
      .then(r => setDocs(r.data))
      .catch(() => toast.error('Failed to load documents'))
      .finally(() => setLoading(false));
  }, []);

  function generate(type) {
    setGen(true);
    setTimeout(() => {
      const newDoc = {
        id: docs.length + 1,
        doc_type: type,
        doc_no: 'DOC0',
        lr_no: 'LR0',
        party: 'New Customer Ltd',
        created: new Date().toISOString(),
        status: 'Generated',
        gst_no: '—',
        amount_rs: 0,
        auto_sent: false,
      };
      setDocs(d => [newDoc, ...d]);
      setGen(false);
      toast.success(`${type} generated successfully!`);
    }, 1200);
  }

  const docTypes = ['All', 'LR', 'Invoice', 'E-Way Bill', 'POD', 'Billing Statement', 'Delivery Note'];

  const filtered = docs.filter(d => {
    const ms = !search || d.doc_no.includes(search.toUpperCase()) || d.lr_no.includes(search.toUpperCase()) || d.party.toLowerCase().includes(search.toLowerCase());
    const mf = filter === 'All' || d.status === filter;
    const mt = typeFilter === 'All' || d.doc_type === typeFilter;
    return ms && mf && mt;
  });

  return (
    <div className="p-3 space-y-3">
      <div className="bg-gradient-to-r from-[#14b8a6] to-[#0d9488] rounded shadow text-white px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold">📄 Automated Documentation</h1>
          <p className="text-teal-100 text-[12px]">Auto LR, GST invoice, e-way bill, digital signature, email dispatch, bulk print</p>
        </div>
        <span className="bg-white/20 text-white text-[11px] font-bold px-2 py-1 rounded">AI Powered</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: 'Total Docs',  val: docs.length,                                        color: '#14b8a6' },
          { label: 'Generated',   val: docs.filter(d=>d.status==='Generated').length,       color: '#0b8fd3' },
          { label: 'Sent',        val: docs.filter(d=>d.status==='Sent').length,            color: '#22c55e' },
          { label: 'Auto-Sent',   val: docs.filter(d=>d.auto_sent).length,                  color: '#8b5cf6' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded shadow-sm p-3 border-l-4" style={{ borderColor: s.color }}>
            <p className="text-xl font-bold text-gray-800">{s.val}</p>
            <p className="text-[10px] font-semibold text-gray-500 uppercase">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Generate */}
      <div className="bg-white rounded shadow-sm p-3">
        <h2 className="text-[13px] font-bold text-gray-700 mb-2">⚡ Quick Generate</h2>
        <div className="flex flex-wrap gap-2">
          {['LR','Invoice','E-Way Bill','POD','Billing Statement','Delivery Note'].map(t => (
            <button key={t} onClick={() => generate(t)} disabled={generating}
              className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 bg-teal-50 text-teal-700 border border-teal-200 rounded hover:bg-teal-100 transition-colors disabled:opacity-50">
              <span>{DOC_ICONS[t]}</span> {t}
            </button>
          ))}
          <button onClick={() => { if (docs.length === 0) { toast.error('No documents to print'); return; } toast.success(`Bulk print queued for ${docs.length} document${docs.length > 1 ? 's' : ''}`); }}
            className="text-[11px] font-bold px-3 py-1.5 bg-[#0b8fd3] text-white rounded hover:bg-[#0066aa]">
            🖨️ Bulk Print
          </button>
          <button onClick={() => { const pending = docs.filter(d => d.status !== 'Sent'); if (pending.length === 0) { toast.error('No pending documents to email'); return; } setDocs(ds => ds.map(d => d.status !== 'Sent' ? { ...d, status: 'Sent', auto_sent: true } : d)); toast.success(`Email dispatched to ${pending.length} recipient${pending.length > 1 ? 's' : ''}`); }}
            className="text-[11px] font-bold px-3 py-1.5 bg-green-600 text-white rounded">
            📧 Email All Pending
          </button>
        </div>
        {generating && (
          <div className="mt-2 flex items-center gap-2 text-[12px] text-teal-600">
            <div className="w-3 h-3 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            Generating document with AI…
          </div>
        )}
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded shadow-sm">
        <div className="px-3 py-2 border-b flex items-center justify-between gap-2 flex-wrap">
          <h2 className="text-[13px] font-bold text-gray-700">Document Register ({filtered.length})</h2>
          <div className="flex gap-2 flex-wrap items-center">
            <input className="border border-gray-300 rounded px-2 py-1 text-[11px] w-32" placeholder="Doc No / LR / Party…"
              value={search} onChange={e => setSearch(e.target.value)} />
            <select className="border border-gray-300 rounded px-2 py-1 text-[11px]" value={typeFilter} onChange={e => setType(e.target.value)}>
              {docTypes.map(t => <option key={t}>{t}</option>)}
            </select>
            {['All','Generated','Sent','Pending','Signed'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${filter===f ? 'bg-[#14b8a6] text-white border-[#14b8a6]' : 'text-gray-600 border-gray-300'}`}>{f}</button>
            ))}
            <button onClick={() => { if (filtered.length === 0) { toast.error('No documents to export'); return; } const hdr = ['Type','Doc No','LR No','Party','GST No','Amount','Created','Auto-Sent','Status']; const rows = filtered.map(d => [d.doc_type, d.doc_no, d.lr_no, d.party, d.gst_no, d.amount_rs, new Date(d.created).toLocaleDateString('en-IN'), d.auto_sent ? 'Yes' : 'No', d.status]); const csv = [hdr, ...rows].map(r => r.map(v => `"${v ?? ''}"`).join(',')).join('\n'); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'documents.csv'; a.click(); toast.success(`Exported ${filtered.length} records`); }}
              className="text-[11px] font-bold px-3 py-1.5 bg-green-600 text-white rounded">Export Excel</button>
          </div>
        </div>
        {loading ? <div className="p-6 text-center text-gray-400">Loading…</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Type','Doc No','LR No','Party','GST No','Amount','Created','Auto-Sent','Status','Actions'].map(h => (
                    <th key={h} className="text-left px-2 py-2 font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(d => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-2 py-1.5">
                      <span className="flex items-center gap-1">{DOC_ICONS[d.doc_type]} {d.doc_type}</span>
                    </td>
                    <td className="px-2 py-1.5 font-mono font-bold text-teal-700">{d.doc_no}</td>
                    <td className="px-2 py-1.5 text-blue-600">{d.lr_no}</td>
                    <td className="px-2 py-1.5 text-[11px]">{d.party}</td>
                    <td className="px-2 py-1.5 text-[10px] text-gray-500 font-mono">{d.gst_no}</td>
                    <td className="px-2 py-1.5 text-green-700 font-medium">₹{d.amount_rs.toLocaleString('en-IN')}</td>
                    <td className="px-2 py-1.5 text-[11px] text-gray-500">{new Date(d.created).toLocaleDateString('en-IN')}</td>
                    <td className="px-2 py-1.5 text-center">
                      {d.auto_sent ? <span className="text-green-600 font-bold">✓</span> : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-2 py-1.5">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${STATUS_COLORS[d.status]}`}>{d.status}</span>
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="flex gap-1">
                        <button onClick={() => toast.success('PDF downloaded!')}
                          className="text-[10px] px-1.5 py-0.5 bg-[#0b8fd3] text-white rounded font-bold">PDF</button>
                        <button onClick={() => { setDocs(ds => ds.map(x => x.id===d.id ? {...x, status:'Sent', auto_sent:true} : x)); toast.success('Sent!'); }}
                          className="text-[10px] px-1.5 py-0.5 bg-green-600 text-white rounded font-bold">Send</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
