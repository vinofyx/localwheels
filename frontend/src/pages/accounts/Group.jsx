import React, { useState } from 'react';
import toast from 'react-hot-toast';

const SaveIcon    = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>;
const SearchIcon  = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/></svg>;
const RefreshIcon = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>;
const EditIcon    = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>;
const SortIcon    = <svg className="w-3 h-3 inline-block ml-1 opacity-80" fill="currentColor" viewBox="0 0 24 24"><path d="M7 10l5-5 5 5H7zm0 4l5 5 5-5H7z"/></svg>;

const MAIN_GROUPS = [
  'ADMINISTRATION EXPENSES', 'ADVANCE TO PARTY', 'AUDITORS REMUNERATION',
  'BANK A/C', 'BANK OD A/C', 'BIKE AND VEHICLE', 'CAPITAL A/C', 'CAR (VEHICLE)',
  'CASH IN HAND', 'CREDITORS', 'CURRENT ASSETS', 'CURRENT LIABILITIES',
  'DEDUCTION', 'DEPOSIT', 'DEPOSIT ASSETS', 'DEPOSIT FOR HOUSE',
  'DEPOSIT FOR OFFICE', 'DEPOSIT FROM PARTY', 'DEPOSIT WITH PARTY',
  'DIRECT EXPENSES', 'DIRECT INCOME', 'DIRECTORS ACCOUNT', 'DUTIES AND TAXES',
  'EMPLOYEE OVERHEADS', 'FINANCE CHARGES', 'FIXED ASSETS', 'FREIGHT EARNING',
  'FURNITURE & FIXTURE', 'GENERATOR AND POWER EQUIPMENTS', 'GODOWN OWNER',
  'HEAVY COMMERCIAL VEHICLE', 'INDIRECT EXPENSES', 'INDIRECT INCOME',
  'INVESTMENTS', 'LOANS & ADVANCES', 'MISCELLANEOUS EXPENSES', 'OTHER ASSETS',
  'OTHER LIABILITIES', 'PROVISIONS', 'PURCHASE ACCOUNT', 'RESERVES & SURPLUS',
  'SALES ACCOUNT', 'SECURED LOANS', 'SHARE CAPITAL', 'SUSPENSE A/C',
  'TRANSPORT INCOME', 'UNSECURED LOANS',
];

const GROUP_TYPE_MAP = {
  'BANK A/C': 'Assets', 'BANK OD A/C': 'Liability', 'BIKE AND VEHICLE': 'Assets',
  'CAPITAL A/C': 'Equity', 'CAR (VEHICLE)': 'Assets', 'CASH IN HAND': 'Assets',
  'CREDITORS': 'Liability', 'CURRENT ASSETS': 'Assets', 'CURRENT LIABILITIES': 'Liability',
  'DEPOSIT': 'Assets', 'DEPOSIT ASSETS': 'Assets', 'DEPOSIT FOR HOUSE': 'Assets',
  'DEPOSIT FOR OFFICE': 'Assets', 'DEPOSIT FROM PARTY': 'Assets', 'DEPOSIT WITH PARTY': 'Assets',
  'DIRECT EXPENSES': 'Expenses', 'DIRECT INCOME': 'Revenue', 'DIRECTORS ACCOUNT': 'Liability',
  'DUTIES AND TAXES': 'Liability', 'EMPLOYEE OVERHEADS': 'Expenses',
  'FINANCE CHARGES': 'Expenses', 'FIXED ASSETS': 'Assets', 'FREIGHT EARNING': 'Revenue',
  'FURNITURE & FIXTURE': 'Assets', 'GENERATOR AND POWER EQUIPMENTS': 'Assets',
  'GODOWN OWNER': 'Assets', 'HEAVY COMMERCIAL VEHICLE': 'Assets',
  'INDIRECT EXPENSES': 'Expenses', 'INDIRECT INCOME': 'Revenue',
  'INVESTMENTS': 'Assets', 'LOANS & ADVANCES': 'Assets', 'OTHER ASSETS': 'Assets',
  'OTHER LIABILITIES': 'Liability', 'PROVISIONS': 'Liability',
  'PURCHASE ACCOUNT': 'Expenses', 'RESERVES & SURPLUS': 'Equity',
  'SALES ACCOUNT': 'Revenue', 'SECURED LOANS': 'Liability', 'SHARE CAPITAL': 'Equity',
  'TRANSPORT INCOME': 'Revenue', 'UNSECURED LOANS': 'Liability',
};

const COL_KEYS = ['groupName', 'mainGroup', 'groupType', 'createdUser', 'createdDate', 'lastModify', 'modifyDate'];
const INITIAL  = { groupName: '', mainGroup: '', primaryGroup: false };

function nowStr() {
  return new Date().toLocaleString('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).replace(',', '');
}

export default function Group() {
  const [form, setForm]           = useState(INITIAL);
  const [rows, setRows]           = useState([]);
  const [editId, setEditId]       = useState(null);
  const [colSearch, setColSearch] = useState(Object.fromEntries(COL_KEYS.map(k => [k, ''])));
  const [page, setPage]           = useState(1);
  const perPage = 10;

  const groupType = GROUP_TYPE_MAP[form.mainGroup] || 'Liability';

  const set = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = () => {
    if (!form.groupName.trim()) { toast.error('Group Name is required'); return; }
    if (!form.mainGroup)        { toast.error('Main Group is required'); return; }
    const now = nowStr();
    if (editId !== null) {
      setRows(r => r.map(row => row.id === editId
        ? { ...row, groupName: form.groupName.trim(), mainGroup: form.mainGroup, primaryGroup: form.primaryGroup, groupType, lastModify: 'admin', modifyDate: now }
        : row));
      setEditId(null);
      toast.success('Updated successfully');
    } else {
      setRows(r => [...r, { id: Date.now(), groupName: form.groupName.trim(), mainGroup: form.mainGroup, primaryGroup: form.primaryGroup, groupType, createdUser: 'admin', createdDate: now, lastModify: '', modifyDate: '' }]);
      toast.success('Saved successfully');
    }
    setForm(INITIAL);
  };

  const handleEdit = id => {
    const row = rows.find(r => r.id === id);
    if (row) { setForm({ groupName: row.groupName, mainGroup: row.mainGroup, primaryGroup: row.primaryGroup }); setEditId(id); }
  };

  const handleRefresh = () => { setForm(INITIAL); setEditId(null); setColSearch(Object.fromEntries(COL_KEYS.map(k => [k, '']))); setPage(1); };

  const filtered   = rows.filter(r => COL_KEYS.every(c => (r[c] ?? '').toString().toLowerCase().includes(colSearch[c].toLowerCase())));
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const sliced     = filtered.slice((page - 1) * perPage, page * perPage);
  const from       = filtered.length === 0 ? 0 : (page - 1) * perPage + 1;
  const to         = Math.min(page * perPage, filtered.length);

  return (
    <div className="p-3 bg-[#cfd6de] min-h-screen text-[13px]">

      {/* ── Top bar ─────────────────────────────────────────── */}
      <div className="flex items-center mb-2">
        <div className="flex-1" />
        <h2 className="font-bold text-[15px] tracking-wide" style={{ fontVariant: 'small-caps' }}>Group</h2>
        <div className="flex-1 flex justify-end gap-1.5">
          <button onClick={handleSave}
            className="flex items-center gap-1.5 bg-[#1565c0] hover:bg-[#0d47a1] text-white text-[12px] font-medium px-3 py-1.5 rounded">
            {SaveIcon} Save
          </button>
          <button onClick={() => toast('Search functionality coming soon')}
            className="flex items-center gap-1.5 bg-[#0288d1] hover:bg-[#0277bd] text-white text-[12px] font-medium px-3 py-1.5 rounded">
            {SearchIcon} Search
          </button>
          <button onClick={handleRefresh}
            className="flex items-center gap-1.5 bg-[#546e7a] hover:bg-[#455a64] text-white text-[12px] font-medium px-3 py-1.5 rounded">
            {RefreshIcon} Refresh
          </button>
        </div>
      </div>

      {/* ── Form panel ──────────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm px-6 py-4 mb-2">
        <div className="grid grid-cols-2 gap-x-16 gap-y-3">
          {/* Row 1 */}
          <div className="flex items-center gap-3">
            <label className="text-[13px] whitespace-nowrap text-red-600 font-medium w-28">* Group Name</label>
            <input name="groupName" value={form.groupName} onChange={set}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              className="border border-blue-400 px-2 py-1 flex-1 text-[13px] focus:outline-none focus:border-blue-600" />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-[13px] whitespace-nowrap w-28">Primary Group</label>
            <input type="checkbox" name="primaryGroup" checked={form.primaryGroup} onChange={set}
              className="w-4 h-4 cursor-pointer" />
          </div>

          {/* Row 2 */}
          <div className="flex items-center gap-3">
            <label className="text-[13px] whitespace-nowrap text-red-600 font-medium w-28">* Main Group</label>
            <select name="mainGroup" value={form.mainGroup} onChange={set}
              className="border border-gray-400 px-2 py-1 flex-1 text-[13px] focus:outline-none focus:border-blue-500">
              <option value="">--Select--</option>
              {MAIN_GROUPS.map(g => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-[13px] whitespace-nowrap w-28">Group Type</label>
            <select value={groupType} disabled
              className="border border-gray-300 px-2 py-1 flex-1 text-[13px] bg-gray-100 cursor-not-allowed text-gray-600">
              <option>{groupType}</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Table panel ─────────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm px-4 py-3">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr style={{ backgroundColor: '#0b8fd3', color: '#fff' }}>
                <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8]">Group Name {SortIcon}</th>
                <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8]">Main Group {SortIcon}</th>
                <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8]">Group Type {SortIcon}</th>
                <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8]">Created User {SortIcon}</th>
                <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8]">Created Date {SortIcon}</th>
                <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8]">Last Modify {SortIcon}</th>
                <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8]">Modify Date {SortIcon}</th>
                <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8]">Edit {SortIcon}</th>
              </tr>
              <tr className="bg-white">
                {COL_KEYS.map(col => (
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
                <tr><td colSpan={8} className="px-3 py-6 text-center text-gray-500 border border-gray-200">No data available in table</td></tr>
              ) : sliced.map((row, i) => (
                <tr key={row.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-3 py-1.5 border-b border-gray-200 font-medium">{row.groupName}</td>
                  <td className="px-3 py-1.5 border-b border-gray-200">{row.mainGroup}</td>
                  <td className="px-3 py-1.5 border-b border-gray-200">{row.groupType}</td>
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
