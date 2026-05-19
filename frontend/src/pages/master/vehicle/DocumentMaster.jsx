import React, { useState } from 'react';
import toast from 'react-hot-toast';

const SaveIcon    = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>;
const RefreshIcon = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>;
const EditIcon    = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>;
const SortIcon    = <svg className="w-3 h-3 inline-block ml-1 opacity-80" fill="currentColor" viewBox="0 0 24 24"><path d="M7 10l5-5 5 5H7zm0 4l5 5 5-5H7z"/></svg>;

const RENEWAL_TYPES = ['Select', 'Renewal', 'Non Renewal'];
const INITIAL = { taxName: '', renewalType: 'Select', renewalPeriod: '', expiryAlertDays: '', holdLoading: false, linkLedger: '' };
const COL_KEYS = ['taxName', 'renewalType', 'renewalPeriod', 'ledger', 'expiryAlertDays', 'holdLoading', 'createdUser', 'createdDate', 'lastModify', 'modifyDate'];

export default function DocumentMaster() {
  const [form, setForm]           = useState(INITIAL);
  const [rows, setRows]           = useState([]);
  const [colSearch, setColSearch] = useState(Object.fromEntries(COL_KEYS.map(k => [k, ''])));
  const [page, setPage]           = useState(1);
  const perPage = 10;

  const set = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = () => {
    if (!form.taxName.trim())          { toast.error('Tax Name is required');           return; }
    if (!form.renewalPeriod.trim())    { toast.error('Renewal Period is required');     return; }
    if (!form.expiryAlertDays.trim())  { toast.error('Expiry Alert Days is required'); return; }
    const now = new Date().toLocaleString('en-GB', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    }).replace(',', '');
    setRows(r => [...r, {
      id: Date.now(),
      taxName: form.taxName.trim(),
      renewalType: form.renewalType,
      renewalPeriod: form.renewalPeriod.trim(),
      ledger: form.linkLedger.trim(),
      expiryAlertDays: form.expiryAlertDays.trim(),
      holdLoading: form.holdLoading ? 'YES' : 'NO',
      createdUser: 'admin', createdDate: now, lastModify: '', modifyDate: '',
    }]);
    setForm(INITIAL);
    toast.success('Saved successfully');
  };

  const handleEdit = id => {
    const row = rows.find(r => r.id === id);
    if (row) {
      setForm({ taxName: row.taxName, renewalType: row.renewalType, renewalPeriod: row.renewalPeriod,
        expiryAlertDays: row.expiryAlertDays, holdLoading: row.holdLoading === 'YES', linkLedger: row.ledger });
      toast.success('Loaded for editing');
    }
  };

  const handleRefresh = () => { setForm(INITIAL); setColSearch(Object.fromEntries(COL_KEYS.map(k => [k, '']))); setPage(1); };

  const filtered   = rows.filter(r => COL_KEYS.every(c => (r[c] ?? '').toString().toLowerCase().includes(colSearch[c].toLowerCase())));
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const sliced     = filtered.slice((page - 1) * perPage, page * perPage);
  const from       = filtered.length === 0 ? 0 : (page - 1) * perPage + 1;
  const to         = Math.min(page * perPage, filtered.length);

  return (
    <div className="p-3 bg-[#cfd6de] min-h-screen text-[13px]">

      {/* ── Top bar ─────────────────────────────────────────────── */}
      <div className="flex items-center mb-2">
        <span className="text-red-600 text-[12px] font-medium">* Mark fields are compulsory</span>
        <div className="flex-1 flex justify-center">
          <h2 className="font-bold text-[15px] tracking-wide" style={{ fontVariant: 'small-caps' }}>Document Master</h2>
        </div>
        <div className="flex gap-1.5">
          <button onClick={handleSave}
            className="flex items-center gap-1.5 bg-[#1565c0] hover:bg-[#0d47a1] text-white text-[12px] font-medium px-3 py-1.5 rounded">
            {SaveIcon} Save
          </button>
          <button onClick={handleRefresh}
            className="flex items-center gap-1.5 bg-[#546e7a] hover:bg-[#455a64] text-white text-[12px] font-medium px-3 py-1.5 rounded">
            {RefreshIcon} Refersh
          </button>
        </div>
      </div>

      {/* ── Form panel ──────────────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm px-6 py-4 mb-2">
        {/* Row 1 */}
        <div className="grid grid-cols-3 gap-x-8 gap-y-3 mb-3">
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap w-28"><span className="text-red-600">* </span>Tax Name</label>
            <input name="taxName" value={form.taxName} onChange={set}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              className="border border-blue-400 px-2 py-1 flex-1 text-[13px] focus:outline-none focus:border-blue-600" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap w-28">Renewal Type</label>
            <select name="renewalType" value={form.renewalType} onChange={set}
              className="border border-gray-400 px-2 py-1 flex-1 text-[13px] bg-white focus:outline-none focus:border-blue-500">
              {RENEWAL_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap w-44"><span className="text-red-600">* </span>Renewal Period(In Month)</label>
            <input name="renewalPeriod" value={form.renewalPeriod} onChange={set}
              className="border border-gray-400 px-2 py-1 flex-1 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>
        </div>
        {/* Row 2 */}
        <div className="grid grid-cols-3 gap-x-8 gap-y-3">
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap w-28"><span className="text-red-600">* </span>Expiry Alert Days</label>
            <input name="expiryAlertDays" value={form.expiryAlertDays} onChange={set}
              className="border border-gray-400 px-2 py-1 flex-1 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap w-28">Hold Loading</label>
            <input type="checkbox" name="holdLoading" checked={form.holdLoading} onChange={set}
              id="holdLoading" className="w-3.5 h-3.5 cursor-pointer" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap w-44">Link Ledger</label>
            <input name="linkLedger" value={form.linkLedger} onChange={set}
              className="border border-gray-400 px-2 py-1 flex-1 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>
        </div>
      </div>

      {/* ── Table panel ─────────────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm px-4 py-3">

        {/* Export */}
        <div className="flex justify-end mb-2">
          <div className="flex items-center gap-2 text-[13px]">
            <span className="text-gray-600">Export as:</span>
            <select className="border border-gray-300 px-2 py-0.5 text-[13px] bg-white">
              <option>-- Select --</option>
              <option>Excel</option>
              <option>PDF</option>
              <option>CSV</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr style={{ backgroundColor: '#0b8fd3', color: '#fff' }}>
                <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8] w-[14%]">Tax Name {SortIcon}</th>
                <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8] w-[10%]">Renewal Type {SortIcon}</th>
                <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8] w-[10%]">Renewal Period {SortIcon}</th>
                <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8] w-[10%]">Ledger {SortIcon}</th>
                <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8] w-[10%]">Expiry Alert Days {SortIcon}</th>
                <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8] w-[8%]">Hold Loading {SortIcon}</th>
                <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8] w-[10%]">Created User {SortIcon}</th>
                <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8] w-[12%]">Created Date {SortIcon}</th>
                <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8] w-[8%]">Last Modify {SortIcon}</th>
                <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8] w-[8%]">Modify Date {SortIcon}</th>
                <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8] w-[5%]">Edit {SortIcon}</th>
              </tr>
              <tr className="bg-white">
                {COL_KEYS.map(col => (
                  <td key={col} className="px-2 py-1 border border-gray-300">
                    <input
                      value={colSearch[col]}
                      onChange={e => { setColSearch(s => ({ ...s, [col]: e.target.value })); setPage(1); }}
                      placeholder="Search"
                      className="w-full px-1.5 py-0.5 border border-gray-300 text-[12px] focus:outline-none focus:border-blue-400"
                    />
                  </td>
                ))}
                <td className="px-2 py-1 border border-gray-300">
                  <input placeholder="Search" className="w-full px-1.5 py-0.5 border border-gray-300 text-[12px] focus:outline-none" />
                </td>
              </tr>
            </thead>
            <tbody>
              {sliced.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-3 py-6 text-center text-gray-500 border border-gray-200">
                    No data available in table
                  </td>
                </tr>
              ) : (
                sliced.map((row, i) => (
                  <tr key={row.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-3 py-1.5 border-b border-gray-200 text-[#1565c0] font-medium">{row.taxName}</td>
                    <td className="px-3 py-1.5 border-b border-gray-200">{row.renewalType}</td>
                    <td className="px-3 py-1.5 border-b border-gray-200">{row.renewalPeriod}</td>
                    <td className="px-3 py-1.5 border-b border-gray-200">{row.ledger}</td>
                    <td className="px-3 py-1.5 border-b border-gray-200">{row.expiryAlertDays}</td>
                    <td className="px-3 py-1.5 border-b border-gray-200">{row.holdLoading}</td>
                    <td className="px-3 py-1.5 border-b border-gray-200 text-[#1565c0]">{row.createdUser}</td>
                    <td className="px-3 py-1.5 border-b border-gray-200 whitespace-nowrap">{row.createdDate}</td>
                    <td className="px-3 py-1.5 border-b border-gray-200 text-[#1565c0]">{row.lastModify}</td>
                    <td className="px-3 py-1.5 border-b border-gray-200">{row.modifyDate}</td>
                    <td className="px-3 py-1.5 border-b border-gray-200 text-center">
                      <button onClick={() => handleEdit(row.id)} className="text-gray-600 hover:text-blue-600">{EditIcon}</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-2 text-[12px] text-gray-600">
          <span>
            Showing <span className="text-[#1565c0] font-medium">{from}</span> to{' '}
            <span className="text-[#1565c0] font-medium">{to}</span> of{' '}
            <span className="text-[#1565c0] font-medium">{filtered.length}</span> entries
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page === 1}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40">Previous</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className={`px-3 py-1 border rounded ${p === page ? 'bg-[#0b8fd3] text-white border-[#0b8fd3]' : 'border-gray-300 hover:bg-gray-100'}`}>
                {p}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(p + 1, totalPages))} disabled={page === totalPages}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40">Next</button>
          </div>
        </div>

      </div>
    </div>
  );
}
