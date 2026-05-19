import React, { useState } from 'react';
import toast from 'react-hot-toast';

const SaveIcon    = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>;
const RefreshIcon = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>;
const EditIcon    = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>;
const SortIcon    = <svg className="w-3 h-3 inline-block ml-1 opacity-80" fill="currentColor" viewBox="0 0 24 24"><path d="M7 10l5-5 5 5H7zm0 4l5 5 5-5H7z"/></svg>;

const ALLOW_IN_OPTS        = ['OTHER', 'FREIGHT'];
const SHOW_IN_OPTS         = ['LR', 'WITHOUTLRBILLING', 'BOTH'];
const GST_APPLICABLE       = ['NO', 'YES'];
const FIX_CHARGE_TYPE      = ['FIX', 'INV(%)', 'FREIGHT(%)'];
const CHARGE_HEAD_LINK_OPTS = ['--Select--', 'Local Collection', 'Local Delivery', 'EWay Bill', 'ODA'];

const INITIAL = {
  chargeHead: '', allowIn: 'OTHER',
  linkLedger: '', showIn: 'LR',
  sortIndex: '0', gstApplicable: 'NO',
  igst: '0', sgst: '0',
  cgst: '0', sacCode: '-',
  fixChargeType: 'FIX', fixChargeAmount: '0',
  chargeHeadLink: '--Select--',
};

const COL_KEYS = ['chargeHead', 'entryType', 'gstApplicable', 'sacCode', 'cgst', 'sgst', 'igst', 'chargeLinkTo', 'sortOrder', 'ledger', 'chargeType', 'fixCharge', 'chargeHeadType', 'createdUser', 'createdDate', 'lastModify', 'modifyDate'];

export default function SalesCharges() {
  const [form, setForm]           = useState(INITIAL);
  const [rows, setRows]           = useState([]);
  const [colSearch, setColSearch] = useState(Object.fromEntries(COL_KEYS.map(k => [k, ''])));
  const [page, setPage]           = useState(1);
  const perPage = 10;

  const set = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSave = () => {
    if (!form.chargeHead.trim()) { toast.error('Charge Head is required');  return; }
    if (!form.linkLedger.trim()) { toast.error('Link Ledger is required');   return; }
    if (!form.sortIndex.trim())  { toast.error('Sort Index is required');    return; }
    const now = new Date().toLocaleString('en-GB', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    }).replace(',', '');
    setRows(r => [...r, {
      id: Date.now(),
      chargeHead: form.chargeHead.trim(),
      entryType: form.allowIn,
      gstApplicable: form.gstApplicable,
      sacCode: form.sacCode,
      cgst: form.cgst, sgst: form.sgst, igst: form.igst,
      chargeLinkTo: form.chargeHeadLink,
      sortOrder: form.sortIndex,
      ledger: form.linkLedger.trim(),
      chargeType: form.showIn,
      fixCharge: form.fixChargeAmount,
      chargeHeadType: form.fixChargeType,
      createdUser: 'admin', createdDate: now, lastModify: '', modifyDate: '',
    }]);
    setForm(INITIAL);
    toast.success('Saved successfully');
  };

  const handleEdit = id => {
    const row = rows.find(r => r.id === id);
    if (row) { setForm({ chargeHead: row.chargeHead, allowIn: row.entryType, linkLedger: row.ledger, showIn: row.chargeType, sortIndex: row.sortOrder, gstApplicable: row.gstApplicable, igst: row.igst, sgst: row.sgst, cgst: row.cgst, sacCode: row.sacCode, fixChargeType: row.chargeHeadType, fixChargeAmount: row.fixCharge, chargeHeadLink: row.chargeLinkTo }); toast.success('Loaded for editing'); }
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
          <h2 className="font-bold text-[15px] tracking-wide" style={{ fontVariant: 'small-caps' }}>Sales Charges</h2>
        </div>
        <div className="flex gap-1.5">
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

      {/* ── Form panel ──────────────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm px-6 py-4 mb-2">
        <div className="grid grid-cols-2 gap-x-10 gap-y-3">

          {/* Row 1 */}
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap w-32"><span className="text-red-600">* </span>Charge Head</label>
            <input name="chargeHead" value={form.chargeHead} onChange={set}
              className="border border-blue-400 px-2 py-1 flex-1 text-[13px] focus:outline-none focus:border-blue-600" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap w-28"><span className="text-red-600">* </span>Allow In</label>
            <select name="allowIn" value={form.allowIn} onChange={set}
              className="border border-gray-400 px-2 py-1 flex-1 text-[13px] bg-white focus:outline-none focus:border-blue-500">
              {ALLOW_IN_OPTS.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>

          {/* Row 2 */}
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap w-32"><span className="text-red-600">* </span>linkledger</label>
            <input name="linkLedger" value={form.linkLedger} onChange={set}
              className="border border-gray-300 bg-gray-100 px-2 py-1 flex-1 text-[13px] focus:outline-none" />
            <button type="button"
              className="w-6 h-6 rounded-full bg-gray-800 text-white text-[14px] font-bold flex items-center justify-center hover:bg-gray-700 flex-shrink-0">+</button>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap w-28"><span className="text-red-600">* </span>Show In</label>
            <select name="showIn" value={form.showIn} onChange={set}
              className="border border-gray-400 px-2 py-1 flex-1 text-[13px] bg-white focus:outline-none focus:border-blue-500">
              {SHOW_IN_OPTS.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>

          {/* Row 3 */}
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap w-32"><span className="text-red-600">* </span>SortIndex</label>
            <input name="sortIndex" value={form.sortIndex} onChange={set}
              className="border border-gray-400 px-2 py-1 flex-1 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap w-28"><span className="text-red-600">* </span>GST Applicable</label>
            <select name="gstApplicable" value={form.gstApplicable} onChange={set}
              className="border border-gray-400 px-2 py-1 flex-1 text-[13px] bg-white focus:outline-none focus:border-blue-500">
              {GST_APPLICABLE.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>

          {/* Row 4 */}
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap w-32">IGST %</label>
            <input name="igst" value={form.igst} onChange={set}
              className="border border-gray-400 px-2 py-1 flex-1 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap w-28">SGST %</label>
            <input name="sgst" value={form.sgst} onChange={set}
              className="border border-gray-400 px-2 py-1 flex-1 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>

          {/* Row 5 */}
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap w-32">CGST %</label>
            <input name="cgst" value={form.cgst} onChange={set}
              className="border border-gray-400 px-2 py-1 flex-1 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap w-28">ServiceAccountCode(SAC)</label>
            <input name="sacCode" value={form.sacCode} onChange={set}
              className="border border-gray-400 px-2 py-1 flex-1 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>

          {/* Row 6 */}
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap w-32">Fix Charges</label>
            <select name="fixChargeType" value={form.fixChargeType} onChange={set}
              className="border border-gray-400 px-2 py-1 w-28 text-[13px] bg-white focus:outline-none focus:border-blue-500">
              {FIX_CHARGE_TYPE.map(o => <option key={o}>{o}</option>)}
            </select>
            <input name="fixChargeAmount" value={form.fixChargeAmount} onChange={set}
              className="border border-gray-400 px-2 py-1 w-24 text-[13px] focus:outline-none focus:border-blue-500 ml-1" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap w-28">Charge Head</label>
            <select name="chargeHeadLink" value={form.chargeHeadLink} onChange={set}
              className="border border-gray-400 px-2 py-1 flex-1 text-[13px] bg-white focus:outline-none focus:border-blue-500">
              {CHARGE_HEAD_LINK_OPTS.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>

        </div>
      </div>

      {/* ── Table panel ─────────────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm px-4 py-3">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]" style={{ minWidth: '1400px' }}>
            <thead>
              <tr style={{ backgroundColor: '#0b8fd3', color: '#fff' }}>
                <th className="px-2 py-2 text-left font-medium border border-[#0a7ab8] whitespace-nowrap">Charge Head {SortIcon}</th>
                <th className="px-2 py-2 text-left font-medium border border-[#0a7ab8] whitespace-nowrap">EntryType {SortIcon}</th>
                <th className="px-2 py-2 text-left font-medium border border-[#0a7ab8] whitespace-nowrap">GST Applicable {SortIcon}</th>
                <th className="px-2 py-2 text-left font-medium border border-[#0a7ab8] whitespace-nowrap">SAC Code {SortIcon}</th>
                <th className="px-2 py-2 text-left font-medium border border-[#0a7ab8] whitespace-nowrap">CGST % {SortIcon}</th>
                <th className="px-2 py-2 text-left font-medium border border-[#0a7ab8] whitespace-nowrap">SGST % {SortIcon}</th>
                <th className="px-2 py-2 text-left font-medium border border-[#0a7ab8] whitespace-nowrap">IGST % {SortIcon}</th>
                <th className="px-2 py-2 text-left font-medium border border-[#0a7ab8] whitespace-nowrap">Charge Link To {SortIcon}</th>
                <th className="px-2 py-2 text-left font-medium border border-[#0a7ab8] whitespace-nowrap">sortorder {SortIcon}</th>
                <th className="px-2 py-2 text-left font-medium border border-[#0a7ab8] whitespace-nowrap">Ledger {SortIcon}</th>
                <th className="px-2 py-2 text-left font-medium border border-[#0a7ab8] whitespace-nowrap">Charge Type {SortIcon}</th>
                <th className="px-2 py-2 text-left font-medium border border-[#0a7ab8] whitespace-nowrap">Fix Charge {SortIcon}</th>
                <th className="px-2 py-2 text-left font-medium border border-[#0a7ab8] whitespace-nowrap">Charge Head Type {SortIcon}</th>
                <th className="px-2 py-2 text-left font-medium border border-[#0a7ab8] whitespace-nowrap">Created User {SortIcon}</th>
                <th className="px-2 py-2 text-left font-medium border border-[#0a7ab8] whitespace-nowrap">Created Date {SortIcon}</th>
                <th className="px-2 py-2 text-left font-medium border border-[#0a7ab8] whitespace-nowrap">Last Modify {SortIcon}</th>
                <th className="px-2 py-2 text-left font-medium border border-[#0a7ab8] whitespace-nowrap">Modify Date {SortIcon}</th>
                <th className="px-2 py-2 text-left font-medium border border-[#0a7ab8] whitespace-nowrap">Edit {SortIcon}</th>
              </tr>
              <tr className="bg-white">
                {COL_KEYS.map(col => (
                  <td key={col} className="px-1 py-1 border border-gray-300">
                    <input value={colSearch[col]}
                      onChange={e => { setColSearch(s => ({ ...s, [col]: e.target.value })); setPage(1); }}
                      placeholder="Search"
                      className="w-full px-1.5 py-0.5 border border-gray-300 text-[12px] focus:outline-none focus:border-blue-400" />
                  </td>
                ))}
                <td className="px-1 py-1 border border-gray-300">
                  <input placeholder="Search" className="w-full px-1.5 py-0.5 border border-gray-300 text-[12px] focus:outline-none" />
                </td>
              </tr>
            </thead>
            <tbody>
              {sliced.length === 0 ? (
                <tr><td colSpan={18} className="px-3 py-6 text-center text-gray-500 border border-gray-200">No data available in table</td></tr>
              ) : (
                sliced.map((row, i) => (
                  <tr key={row.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-2 py-1.5 border-b border-gray-200 text-[#1565c0] font-medium whitespace-nowrap">{row.chargeHead}</td>
                    <td className="px-2 py-1.5 border-b border-gray-200">{row.entryType}</td>
                    <td className="px-2 py-1.5 border-b border-gray-200">{row.gstApplicable}</td>
                    <td className="px-2 py-1.5 border-b border-gray-200">{row.sacCode}</td>
                    <td className="px-2 py-1.5 border-b border-gray-200">{row.cgst}</td>
                    <td className="px-2 py-1.5 border-b border-gray-200">{row.sgst}</td>
                    <td className="px-2 py-1.5 border-b border-gray-200">{row.igst}</td>
                    <td className="px-2 py-1.5 border-b border-gray-200">{row.chargeLinkTo}</td>
                    <td className="px-2 py-1.5 border-b border-gray-200">{row.sortOrder}</td>
                    <td className="px-2 py-1.5 border-b border-gray-200">{row.ledger}</td>
                    <td className="px-2 py-1.5 border-b border-gray-200">{row.chargeType}</td>
                    <td className="px-2 py-1.5 border-b border-gray-200">{row.fixCharge}</td>
                    <td className="px-2 py-1.5 border-b border-gray-200">{row.chargeHeadType}</td>
                    <td className="px-2 py-1.5 border-b border-gray-200 text-[#1565c0]">{row.createdUser}</td>
                    <td className="px-2 py-1.5 border-b border-gray-200 whitespace-nowrap">{row.createdDate}</td>
                    <td className="px-2 py-1.5 border-b border-gray-200 text-[#1565c0]">{row.lastModify}</td>
                    <td className="px-2 py-1.5 border-b border-gray-200">{row.modifyDate}</td>
                    <td className="px-2 py-1.5 border-b border-gray-200 text-center">
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
                className={`px-3 py-1 border rounded ${p === page ? 'bg-[#0b8fd3] text-white border-[#0b8fd3]' : 'border-gray-300 hover:bg-gray-100'}`}>{p}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(p + 1, totalPages))} disabled={page === totalPages}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
