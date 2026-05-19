import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';

const SortIcon = <svg className="w-3 h-3 inline-block ml-1 opacity-80" fill="currentColor" viewBox="0 0 24 24"><path d="M7 10l5-5 5 5H7zm0 4l5 5 5-5H7z"/></svg>;
const EditIcon = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>;

const WEEKLY_DAYS   = ['--Select--', 'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const HOLIDAY_TYPES = ['COMMON', 'STATE WISE', 'BRANCH WISE', 'LOCATION WISE', 'CUSTOMER WISE', 'EMPLOYEE WISE'];

function nowStr() {
  return new Date().toLocaleString('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).replace(',', '');
}

const INITIAL_HOLIDAYS  = [];
const INITIAL_LEAVE_ROWS = [];

function DataTable({ rows, columns, perPage, setPerPage, search, setSearch, page, setPage }) {
  const filtered = useMemo(() =>
    rows.filter(r => columns.some(c => (r[c.key] ?? '').toString().toLowerCase().includes(search.toLowerCase())))
  , [rows, search, columns]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage   = Math.min(page, totalPages);
  const sliced     = filtered.slice((safePage - 1) * perPage, safePage * perPage);
  const from       = filtered.length === 0 ? 0 : (safePage - 1) * perPage + 1;
  const to         = Math.min(safePage * perPage, filtered.length);

  return (
    <div className="border border-gray-200 rounded mt-4">
      {/* Controls */}
      <div className="flex items-center justify-between px-3 py-2 bg-white border-b border-gray-200">
        <div className="flex items-center gap-1.5 text-[13px]">
          <span>Show</span>
          <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }}
            className="border border-gray-300 px-1 py-0.5 text-[12px]">
            {[10,25,50,100].map(n => <option key={n}>{n}</option>)}
          </select>
          <span>entries</span>
        </div>
        <div className="flex items-center gap-1.5 text-[13px]">
          <span>Search:</span>
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="border border-gray-300 px-2 py-0.5 w-36 text-[13px] focus:outline-none focus:border-blue-400" />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr style={{ backgroundColor: '#0b8fd3', color: '#fff' }}>
              {columns.map(c => (
                <th key={c.key} className="px-3 py-2 text-left font-medium border border-[#0a7ab8] whitespace-nowrap">
                  {c.label} {SortIcon}
                </th>
              ))}
              <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8]">Edit {SortIcon}</th>
            </tr>
          </thead>
          <tbody>
            {sliced.length === 0 ? (
              <tr><td colSpan={columns.length + 1} className="px-3 py-6 text-center text-gray-500">No data available in table</td></tr>
            ) : sliced.map((row, i) => (
              <tr key={row.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                {columns.map(c => (
                  <td key={c.key} className={`px-3 py-1.5 border-b border-gray-200 ${c.blue ? 'text-[#1565c0] font-medium' : ''}`}>
                    {row[c.key]}
                  </td>
                ))}
                <td className="px-3 py-1.5 border-b border-gray-200 text-center">
                  <button onClick={() => row.onEdit && row.onEdit(row.id)} className="text-gray-600 hover:text-blue-600">{EditIcon}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-3 py-2 bg-white border-t border-gray-200 text-[12px] text-gray-600">
        <span>Showing <b>{from}</b> to <b>{to}</b> of <b>{filtered.length}</b> entries</span>
        <div className="flex items-center gap-1">
          <button onClick={() => setPage(p => Math.max(p-1,1))} disabled={safePage===1}
            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">Previous</button>
          {Array.from({length: totalPages}, (_, i) => i+1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={`px-3 py-1 border rounded ${p===safePage ? 'bg-[#0b8fd3] text-white border-[#0b8fd3]' : 'border-gray-300 hover:bg-gray-100'}`}>{p}</button>
          ))}
          <button onClick={() => setPage(p => Math.min(p+1,totalPages))} disabled={safePage===totalPages}
            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">Next</button>
        </div>
      </div>
    </div>
  );
}

export default function LeaveHolidayMaster() {
  const [activeTab, setActiveTab] = useState(0);

  // Holiday Master state
  const [hForm, setHForm]       = useState({ holiday: 'COMMON', location: '', date: '', holidayName: '' });
  const [hRows, setHRows]       = useState(INITIAL_HOLIDAYS);
  const [hEditId, setHEditId]   = useState(null);
  const [hPerPage, setHPerPage] = useState(10);
  const [hSearch, setHSearch]   = useState('');
  const [hPage, setHPage]       = useState(1);

  // Weekly Off state
  const [wForm, setWForm]       = useState({ holiday: 'COMMON', location: '', weeklyOff: '' });
  const [wRows, setWRows]       = useState([]);
  const [wEditId, setWEditId]   = useState(null);
  const [wPerPage, setWPerPage] = useState(10);
  const [wSearch, setWSearch]   = useState('');
  const [wPage, setWPage]       = useState(1);

  // Leave Master state
  const [lForm, setLForm]       = useState({ leaveType: '' });
  const [lRows, setLRows]       = useState(INITIAL_LEAVE_ROWS);
  const [lEditId, setLEditId]   = useState(null);
  const [lPerPage, setLPerPage] = useState(10);
  const [lSearch, setLSearch]   = useState('');
  const [lPage, setLPage]       = useState(1);

  // Excel Import state
  const [fileType, setFileType] = useState('');
  const [fileName, setFileName] = useState('No file chosen');

  const setH = e => setHForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const setW = e => setWForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const setL = e => setLForm(f => ({ ...f, [e.target.name]: e.target.value }));

  // ── Holiday Master handlers ─────────────────────────────
  const handleHSave = () => {
    if (!hForm.date.trim())        { toast.error('Date is required');         return; }
    if (!hForm.holidayName.trim()) { toast.error('Holiday Name is required'); return; }
    const now = nowStr();
    if (hEditId !== null) {
      setHRows(r => r.map(row => row.id === hEditId
        ? { ...row, holiday: hForm.holiday, location: hForm.location, holidayDate: hForm.date, holidayName: hForm.holidayName, lastModify: 'admin', modifyDate: now }
        : row));
      setHEditId(null);
      toast.success('Updated successfully');
    } else {
      setHRows(r => [...r, { id: Date.now(), holiday: hForm.holiday, location: hForm.location, holidayDate: hForm.date, holidayName: hForm.holidayName, createdUser: 'admin', createdDate: now, lastModify: '', modifyDate: '' }]);
      toast.success('Saved successfully');
    }
    setHForm({ holiday: 'COMMON', location: '', date: '', holidayName: '' });
  };

  const handleHEdit = id => {
    const row = hRows.find(r => r.id === id);
    if (row) { setHForm({ holiday: row.holiday, location: row.location, date: row.holidayDate, holidayName: row.holidayName }); setHEditId(id); }
  };

  // ── Weekly Off handlers ─────────────────────────────────
  const handleWSave = () => {
    if (!wForm.weeklyOff || wForm.weeklyOff === '--Select--') { toast.error('Weekly Off day is required'); return; }
    const now = nowStr();
    if (wEditId !== null) {
      setWRows(r => r.map(row => row.id === wEditId
        ? { ...row, holiday: wForm.holiday, location: wForm.location, weeklyOff: wForm.weeklyOff, lastModify: 'admin', modifyDate: now }
        : row));
      setWEditId(null);
      toast.success('Updated successfully');
    } else {
      setWRows(r => [...r, { id: Date.now(), holiday: wForm.holiday, location: wForm.location, weeklyOff: wForm.weeklyOff, createdUser: 'admin', createdDate: now, lastModify: '', modifyDate: '' }]);
      toast.success('Saved successfully');
    }
    setWForm({ holiday: 'COMMON', location: '', weeklyOff: '' });
  };

  const handleWEdit = id => {
    const row = wRows.find(r => r.id === id);
    if (row) { setWForm({ holiday: row.holiday, location: row.location, weeklyOff: row.weeklyOff }); setWEditId(id); }
  };

  // ── Leave Master handlers ───────────────────────────────
  const handleLSave = () => {
    if (!lForm.leaveType.trim()) { toast.error('Leave Type is required'); return; }
    const now = nowStr();
    if (lEditId !== null) {
      setLRows(r => r.map(row => row.id === lEditId
        ? { ...row, leaveType: lForm.leaveType, lastModify: 'admin', modifyDate: now }
        : row));
      setLEditId(null);
      toast.success('Updated successfully');
    } else {
      setLRows(r => [...r, { id: Date.now(), leaveType: lForm.leaveType, createdUser: 'admin', createdDate: now, lastModify: '', modifyDate: '' }]);
      toast.success('Saved successfully');
    }
    setLForm({ leaveType: '' });
  };

  const handleLEdit = id => {
    const row = lRows.find(r => r.id === id);
    if (row) { setLForm({ leaveType: row.leaveType }); setLEditId(id); }
  };

  const TABS = ['Holiday Master', 'Weekly Off', 'Leave Master', 'Excel Import'];

  const hCols = [
    { key: 'holiday',     label: 'Holiday' },
    { key: 'location',    label: 'Location' },
    { key: 'holidayDate', label: 'Holiday Date' },
    { key: 'holidayName', label: 'Holiday Name', blue: true },
    { key: 'createdUser', label: 'Created User', blue: true },
    { key: 'createdDate', label: 'Created Date' },
    { key: 'lastModify',  label: 'Last Modify',  blue: true },
    { key: 'modifyDate',  label: 'Modify Date' },
  ];

  const wCols = [
    { key: 'holiday',     label: 'Holiday' },
    { key: 'location',    label: 'Location' },
    { key: 'weeklyOff',   label: 'Weekly Off' },
    { key: 'createdUser', label: 'Created User', blue: true },
    { key: 'createdDate', label: 'Created Date' },
    { key: 'lastModify',  label: 'Last Modify',  blue: true },
    { key: 'modifyDate',  label: 'Modify Date' },
  ];

  const lCols = [
    { key: 'leaveType',   label: 'Leave Type' },
    { key: 'createdUser', label: 'Created User', blue: true },
    { key: 'createdDate', label: 'Created Date' },
    { key: 'lastModify',  label: 'Last Modify',  blue: true },
    { key: 'modifyDate',  label: 'Modify Date' },
  ];

  const hRowsWithEdit = hRows.map(r => ({ ...r, onEdit: handleHEdit }));
  const wRowsWithEdit = wRows.map(r => ({ ...r, onEdit: handleWEdit }));
  const lRowsWithEdit = lRows.map(r => ({ ...r, onEdit: handleLEdit }));

  return (
    <div className="p-3 bg-[#cfd6de] min-h-screen text-[13px]">

      {/* ── Title ─────────────────────────────────────────── */}
      <div className="flex justify-center mb-2">
        <h2 className="font-bold text-[15px] tracking-wide" style={{ fontVariant: 'small-caps' }}>Leave/Holiday Master</h2>
      </div>

      {/* ── Main panel ────────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm overflow-hidden">

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {TABS.map((tab, i) => (
            <button key={tab} onClick={() => setActiveTab(i)}
              className={`px-5 py-2 text-[13px] font-medium border-b-2 transition-colors ${
                activeTab === i
                  ? 'border-[#0b8fd3] bg-[#0b8fd3] text-white'
                  : 'border-transparent text-gray-700 bg-gray-100 hover:bg-gray-200'
              }`}>
              {tab}
            </button>
          ))}
        </div>

        <div className="p-4">

          {/* ═══ Holiday Master ═══════════════════════════════ */}
          {activeTab === 0 && (
            <>
              <div className="flex items-center gap-4 flex-wrap mb-1">
                <div className="flex items-center gap-1.5">
                  <label className="text-[13px] whitespace-nowrap text-[#e65100] font-medium">Holiday</label>
                  <select name="holiday" value={hForm.holiday} onChange={setH}
                    className="border border-gray-400 px-2 py-1 text-[13px] focus:outline-none focus:border-blue-500 min-w-[120px]">
                    {HOLIDAY_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-1.5">
                  <label className="text-[13px] whitespace-nowrap text-[#e65100] font-medium">Location</label>
                  <input name="location" value={hForm.location} onChange={setH}
                    disabled={hForm.holiday === 'COMMON'}
                    className="border border-gray-300 px-2 py-1 w-36 text-[13px] focus:outline-none focus:border-blue-500 bg-gray-100 disabled:cursor-not-allowed" />
                </div>
                <div className="flex items-center gap-1.5">
                  <label className="text-[13px] whitespace-nowrap">Date</label>
                  <input name="date" value={hForm.date} onChange={setH} placeholder="DD/MM/YYYY"
                    className="border border-gray-400 px-2 py-1 w-32 text-[13px] focus:outline-none focus:border-blue-500" />
                </div>
                <div className="flex items-center gap-1.5">
                  <label className="text-[13px] whitespace-nowrap text-[#e65100] font-medium">Holiday Name</label>
                  <input name="holidayName" value={hForm.holidayName} onChange={setH}
                    onKeyDown={e => e.key === 'Enter' && handleHSave()}
                    className="border border-gray-400 px-2 py-1 w-44 text-[13px] focus:outline-none focus:border-blue-500" />
                </div>
                <button onClick={handleHSave}
                  className="bg-[#0288d1] hover:bg-[#0277bd] text-white text-[12px] font-semibold px-5 py-1.5 rounded ml-auto">
                  {hEditId !== null ? 'Update' : 'Save'}
                </button>
              </div>
              <DataTable rows={hRowsWithEdit} columns={hCols}
                perPage={hPerPage} setPerPage={setHPerPage}
                search={hSearch} setSearch={setHSearch}
                page={hPage} setPage={setHPage} />
            </>
          )}

          {/* ═══ Weekly Off ════════════════════════════════════ */}
          {activeTab === 1 && (
            <>
              <div className="flex items-center gap-4 flex-wrap mb-1">
                <div className="flex items-center gap-1.5">
                  <label className="text-[13px] whitespace-nowrap text-[#e65100] font-medium">Holiday</label>
                  <select name="holiday" value={wForm.holiday} onChange={setW}
                    className="border border-gray-400 px-2 py-1 text-[13px] focus:outline-none focus:border-blue-500 min-w-[120px]">
                    {HOLIDAY_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-1.5">
                  <label className="text-[13px] whitespace-nowrap text-[#e65100] font-medium">Location</label>
                  <input name="location" value={wForm.location} onChange={setW}
                    disabled={wForm.holiday === 'COMMON'}
                    className="border border-gray-300 px-2 py-1 w-36 text-[13px] focus:outline-none focus:border-blue-500 bg-gray-100 disabled:cursor-not-allowed" />
                </div>
                <div className="flex items-center gap-1.5">
                  <label className="text-[13px] whitespace-nowrap">Weekly Off</label>
                  <select name="weeklyOff" value={wForm.weeklyOff} onChange={setW}
                    className="border border-gray-400 px-2 py-1 text-[13px] focus:outline-none focus:border-blue-500 min-w-[130px]">
                    {WEEKLY_DAYS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <button onClick={handleWSave}
                  className="bg-[#0288d1] hover:bg-[#0277bd] text-white text-[12px] font-semibold px-5 py-1.5 rounded ml-auto">
                  {wEditId !== null ? 'Update' : 'Save'}
                </button>
              </div>
              <DataTable rows={wRowsWithEdit} columns={wCols}
                perPage={wPerPage} setPerPage={setWPerPage}
                search={wSearch} setSearch={setWSearch}
                page={wPage} setPage={setWPage} />
            </>
          )}

          {/* ═══ Leave Master ══════════════════════════════════ */}
          {activeTab === 2 && (
            <>
              <div className="flex items-center gap-4 flex-wrap mb-1">
                <div className="flex items-center gap-1.5">
                  <label className="text-[13px] whitespace-nowrap">Leave Type</label>
                  <input name="leaveType" value={lForm.leaveType} onChange={setL}
                    onKeyDown={e => e.key === 'Enter' && handleLSave()}
                    className="border border-gray-400 px-2 py-1 w-40 text-[13px] focus:outline-none focus:border-blue-500" />
                </div>
                <button onClick={handleLSave}
                  className="bg-[#0288d1] hover:bg-[#0277bd] text-white text-[12px] font-semibold px-5 py-1.5 rounded">
                  {lEditId !== null ? 'Update' : 'Save'}
                </button>
              </div>
              <DataTable rows={lRowsWithEdit} columns={lCols}
                perPage={lPerPage} setPerPage={setLPerPage}
                search={lSearch} setSearch={setLSearch}
                page={lPage} setPage={setLPage} />
            </>
          )}

          {/* ═══ Excel Import ══════════════════════════════════ */}
          {activeTab === 3 && (
            <>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <label className="text-[13px] whitespace-nowrap">
                    <span className="text-red-600 font-bold">* </span>File Type
                  </label>
                  <select value={fileType} onChange={e => setFileType(e.target.value)}
                    className="border border-gray-400 px-2 py-1 text-[13px] focus:outline-none focus:border-blue-500">
                    <option value="">--Select--</option>
                    <option value="holiday">Holiday</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
                <button onClick={() => toast('Downloading sample template…')}
                  className="text-[#1565c0] text-[13px] underline hover:text-blue-800 whitespace-nowrap">
                  Download Sample Excel Template
                </button>
                <div className="flex items-center gap-1.5">
                  <label className="text-[13px] whitespace-nowrap">Select Excel File</label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="border border-gray-400 bg-gray-100 px-3 py-1 text-[12px] rounded hover:bg-gray-200">Choose File</span>
                    <span className="text-[12px] text-gray-500">{fileName}</span>
                    <input type="file" accept=".xlsx,.xls" className="hidden"
                      onChange={e => setFileName(e.target.files[0]?.name || 'No file chosen')} />
                  </label>
                </div>
                <div className="flex items-center gap-1.5 ml-auto">
                  <button onClick={() => toast('Showing data…')}
                    className="bg-[#0288d1] hover:bg-[#0277bd] text-white text-[12px] font-semibold px-4 py-1.5 rounded">
                    Show Data
                  </button>
                  <button onClick={() => toast('Importing data…')}
                    className="bg-[#0288d1] hover:bg-[#0277bd] text-white text-[12px] font-semibold px-4 py-1.5 rounded">
                    Import Data
                  </button>
                  <button onClick={() => { setFileType(''); setFileName('No file chosen'); }}
                    className="bg-[#546e7a] hover:bg-[#455a64] text-white text-[12px] font-semibold px-4 py-1.5 rounded">
                    Refresh
                  </button>
                </div>
              </div>
              <div className="mt-4 border border-gray-200 rounded min-h-[160px] bg-white" />
            </>
          )}

        </div>
      </div>
    </div>
  );
}
