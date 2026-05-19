import React, { useState } from 'react';
import toast from 'react-hot-toast';

const SaveIcon    = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>;
const RefreshIcon = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>;
const EditIcon    = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>;
const SortIcon    = <svg className="w-3 h-3 inline-block ml-1 opacity-80" fill="currentColor" viewBox="0 0 24 24"><path d="M7 10l5-5 5 5H7zm0 4l5 5 5-5H7z"/></svg>;

const COLS = ['division', 'createdUser', 'createdDate', 'lastModify', 'modifyDate'];

const INITIAL_ROWS = [
  { id: 1, division: 'ANDHRAPRADESH',    createdUser: 'D.SUNILKUMAR', createdDate: '23/04/2025 21:57:00', lastModify: '', modifyDate: '' },
  { id: 2, division: 'TRANSPORT DIVISION', createdUser: '',            createdDate: '',                   lastModify: '', modifyDate: '' },
];

function nowStr() {
  return new Date().toLocaleString('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).replace(',', '');
}

export default function Division() {
  const [form, setForm]           = useState({ division: '' });
  const [rows, setRows]           = useState(INITIAL_ROWS);
  const [editId, setEditId]       = useState(null);
  const [colSearch, setColSearch] = useState(Object.fromEntries(COLS.map(k => [k, ''])));
  const [page, setPage]           = useState(1);
  const perPage = 10;

  const handleSave = () => {
    if (!form.division.trim()) { toast.error('Division is required'); return; }
    const now = nowStr();
    if (editId !== null) {
      setRows(r => r.map(row => row.id === editId
        ? { ...row, division: form.division.trim(), lastModify: 'admin', modifyDate: now }
        : row));
      setEditId(null);
      toast.success('Updated successfully');
    } else {
      setRows(r => [...r, { id: Date.now(), division: form.division.trim(), createdUser: 'admin', createdDate: now, lastModify: '', modifyDate: '' }]);
      toast.success('Saved successfully');
    }
    setForm({ division: '' });
  };

  const handleEdit = id => {
    const row = rows.find(r => r.id === id);
    if (row) { setForm({ division: row.division }); setEditId(id); }
  };

  const handleRefresh = () => {
    setForm({ division: '' });
    setEditId(null);
    setColSearch(Object.fromEntries(COLS.map(k => [k, ''])));
    setPage(1);
  };

  const filtered    = rows.filter(r => COLS.every(c => (r[c] ?? '').toString().toLowerCase().includes(colSearch[c].toLowerCase())));
  const totalPages  = Math.max(1, Math.ceil(filtered.length / perPage));
  const sliced      = filtered.slice((page - 1) * perPage, page * perPage);
  const from        = filtered.length === 0 ? 0 : (page - 1) * perPage + 1;
  const to          = Math.min(page * perPage, filtered.length);

  return (
    <div className="p-3 bg-[#cfd6de] min-h-screen text-[13px]">

      {/* ── Top bar ─────────────────────────────────────────── */}
      <div className="flex items-center mb-2">
        <div className="flex-1" />
        <h2 className="font-bold text-[15px] tracking-wide" style={{ fontVariant: 'small-caps' }}>Division</h2>
        <div className="flex-1 flex justify-end gap-1.5">
          <button onClick={handleSave}
            className="flex items-center gap-1.5 bg-[#1565c0] hover:bg-[#0d47a1] text-white text-[12px] font-medium px-3 py-1.5 rounded">
            {SaveIcon} Save
          </button>
          <button onClick={handleRefresh}
            className="flex items-center gap-1.5 bg-[#546e7a] hover:bg-[#455a64] text-white text-[12px] font-medium px-3 py-1.5 rounded">
            {RefreshIcon} Refresh
          </button>
        </div>
      </div>

      {/* ── Form panel ──────────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm px-5 py-3 mb-2">
        <div className="flex items-center gap-3">
          <label className="text-[13px] whitespace-nowrap text-red-600 font-medium">* Division</label>
          <input value={form.division} onChange={e => setForm({ division: e.target.value })}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            className="border border-blue-400 px-2 py-1 w-64 text-[13px] focus:outline-none focus:border-blue-600" />
        </div>
      </div>

      {/* ── Table panel ─────────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm px-4 py-3">
        <div className="flex justify-end mb-2">
          <div className="flex items-center gap-2 text-[13px]">
            <span className="text-gray-600">Export as:</span>
            <select className="border border-gray-300 px-2 py-0.5 text-[13px] bg-white">
              <option>-- Select --</option><option>Excel</option><option>PDF</option><option>CSV</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr style={{ backgroundColor: '#0b8fd3', color: '#fff' }}>
                <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8]">Division {SortIcon}</th>
                <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8]">Created User {SortIcon}</th>
                <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8]">Created Date {SortIcon}</th>
                <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8]">Last Modify {SortIcon}</th>
                <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8]">Modify Date {SortIcon}</th>
                <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8]">Edit {SortIcon}</th>
              </tr>
              <tr className="bg-white">
                {COLS.map(col => (
                  <td key={col} className="px-2 py-1 border border-gray-300">
                    <input value={colSearch[col]}
                      onChange={e => { setColSearch(s => ({ ...s, [col]: e.target.value })); setPage(1); }}
                      placeholder="Search"
                      className="w-full px-1.5 py-0.5 border border-gray-300 text-[12px] focus:outline-none focus:border-blue-400" />
                  </td>
                ))}
                <td className="px-2 py-1 border border-gray-300">
                  <input placeholder="Search" className="w-full px-1.5 py-0.5 border border-gray-300 text-[12px] focus:outline-none" readOnly />
                </td>
              </tr>
            </thead>
            <tbody>
              {sliced.length === 0 ? (
                <tr><td colSpan={6} className="px-3 py-6 text-center text-gray-500 border border-gray-200">No data available in table</td></tr>
              ) : sliced.map((row, i) => (
                <tr key={row.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-3 py-1.5 border-b border-gray-200 font-medium">{row.division}</td>
                  <td className="px-3 py-1.5 border-b border-gray-200 text-[#1565c0]">{row.createdUser}</td>
                  <td className="px-3 py-1.5 border-b border-gray-200">{row.createdDate}</td>
                  <td className="px-3 py-1.5 border-b border-gray-200 text-[#1565c0]">{row.lastModify}</td>
                  <td className="px-3 py-1.5 border-b border-gray-200">{row.modifyDate}</td>
                  <td className="px-3 py-1.5 border-b border-gray-200 text-center">
                    <button onClick={() => handleEdit(row.id)} className="text-gray-600 hover:text-blue-600">{EditIcon}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-2 text-[12px] text-gray-600">
          <span>Showing <b className="text-[#1565c0]">{from}</b> to <b className="text-[#1565c0]">{to}</b> of <b className="text-[#1565c0]">{filtered.length}</b> entries</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(p-1,1))} disabled={page===1}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40">Previous</button>
            {Array.from({length: totalPages}, (_, i) => i+1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className={`px-3 py-1 border rounded ${p===page ? 'bg-[#0b8fd3] text-white border-[#0b8fd3]' : 'border-gray-300 hover:bg-gray-100'}`}>{p}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(p+1,totalPages))} disabled={page===totalPages}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
