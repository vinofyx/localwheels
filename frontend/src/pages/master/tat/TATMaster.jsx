import React, { useState } from 'react';
import toast from 'react-hot-toast';

const SaveIcon    = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>;
const SearchIcon  = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/></svg>;
const RefreshIcon = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>;
const PrintIcon   = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>;

const TRANSIT_MODES   = ['--Select--', 'ROAD', 'AIR', 'SEA', 'TRAIN'];
const LOCATION_TYPES  = ['Pincode to Pincode', 'Branch To Branch', 'Zone To Zone', 'State To State', 'Location To Location'];
const TAT_TYPES       = ['Customer', 'Common'];

function todayStr() {
  const d = new Date();
  return [String(d.getDate()).padStart(2,'0'), String(d.getMonth()+1).padStart(2,'0'), d.getFullYear()].join('/');
}

const INITIAL_HEADER = { effectiveDate: todayStr(), tatType: 'Customer', customer: '', transitMode: 'ROAD', cutoffTime: '' };
const INITIAL_LOC    = { locationType: 'Pincode to Pincode', from: '', to: '', tatDays: '0', cutoffTime: '' };

export default function TATMaster() {
  const [header, setHeader]     = useState(INITIAL_HEADER);
  const [activeTab, setActiveTab] = useState(0);
  const [loc, setLoc]           = useState(INITIAL_LOC);
  const [locRows, setLocRows]   = useState([]);
  const [editLocId, setEditLocId] = useState(null);

  const setH = e => setHeader(h => ({ ...h, [e.target.name]: e.target.value }));
  const setL = e => setLoc(l => ({ ...l, [e.target.name]: e.target.value }));

  const handleSave = () => {
    if (!header.effectiveDate.trim()) { toast.error('Effective Date is required'); return; }
    if (header.tatType === 'Customer' && !header.customer.trim()) { toast.error('Customer is required'); return; }
    if (!header.transitMode || header.transitMode === '--Select--') { toast.error('Transit Mode is required'); return; }
    toast.success('TAT Master saved successfully');
  };

  const handleSearch = () => toast('Search functionality coming soon');

  const handleRefresh = () => {
    setHeader(INITIAL_HEADER);
    setLoc(INITIAL_LOC);
    setLocRows([]);
    setEditLocId(null);
    setActiveTab(0);
  };

  const handlePrint = () => toast('Print functionality coming soon');

  const handleAddLoc = () => {
    if (!loc.from.trim()) { toast.error('From is required'); return; }
    if (!loc.to.trim())   { toast.error('To is required');   return; }

    if (editLocId !== null) {
      setLocRows(r => r.map(row => row.id === editLocId ? { ...row, ...loc } : row));
      setEditLocId(null);
      toast.success('Updated successfully');
    } else {
      setLocRows(r => [...r, { id: Date.now(), ...loc }]);
      toast.success('Added successfully');
    }
    setLoc(INITIAL_LOC);
  };

  const handleEditLoc = id => {
    const row = locRows.find(r => r.id === id);
    if (row) { setLoc({ locationType: row.locationType, from: row.from, to: row.to, tatDays: row.tatDays, cutoffTime: row.cutoffTime }); setEditLocId(id); }
  };

  return (
    <div className="p-3 bg-[#cfd6de] min-h-screen text-[13px]">

      {/* ── Top bar ─────────────────────────────────────────── */}
      <div className="flex items-center mb-2">
        <span className="text-red-600 text-[12px] font-medium flex-shrink-0">* Mark fields are compulsory</span>
        <div className="flex-1 flex justify-center">
          <h2 className="font-bold text-[15px] tracking-wide" style={{ fontVariant: 'small-caps' }}>TAT Master</h2>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button onClick={handleSave}
            className="flex items-center gap-1.5 bg-[#1565c0] hover:bg-[#0d47a1] text-white text-[12px] font-medium px-3 py-1.5 rounded">
            {SaveIcon} Save
          </button>
          <button onClick={handleSearch}
            className="flex items-center gap-1.5 bg-[#0288d1] hover:bg-[#0277bd] text-white text-[12px] font-medium px-3 py-1.5 rounded">
            {SearchIcon} Search
          </button>
          <button onClick={handleRefresh}
            className="flex items-center gap-1.5 bg-[#546e7a] hover:bg-[#455a64] text-white text-[12px] font-medium px-3 py-1.5 rounded">
            {RefreshIcon} Refresh
          </button>
          <button onClick={handlePrint}
            className="flex items-center gap-1.5 bg-[#546e7a] hover:bg-[#455a64] text-white text-[12px] font-medium px-3 py-1.5 rounded">
            {PrintIcon} Print
          </button>
        </div>
      </div>

      {/* ── Header form ─────────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm px-4 py-3 mb-2">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <label className="text-[13px] whitespace-nowrap leading-tight">Effective<br/>Date</label>
            <input name="effectiveDate" value={header.effectiveDate} onChange={setH}
              className="border border-gray-400 px-2 py-1 w-28 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-[13px] whitespace-nowrap leading-tight">TAT<br/>Type</label>
            <select name="tatType" value={header.tatType} onChange={setH}
              className="border border-gray-400 px-2 py-1 text-[13px] focus:outline-none focus:border-blue-500">
              {TAT_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

          {header.tatType === 'Customer' && (
            <div className="flex items-center gap-1.5">
              <label className="text-[13px] whitespace-nowrap">Customer</label>
              <input name="customer" value={header.customer} onChange={setH}
                className="border border-gray-400 px-2 py-1 w-48 text-[13px] focus:outline-none focus:border-blue-500" />
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <label className="text-[13px] whitespace-nowrap">Transit Mode</label>
            <select name="transitMode" value={header.transitMode} onChange={setH}
              className="border border-gray-400 px-2 py-1 text-[13px] focus:outline-none focus:border-blue-500 min-w-[130px]">
              {TRANSIT_MODES.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-[13px] whitespace-nowrap leading-tight">Cutoff<br/>Time</label>
            <input name="cutoffTime" value={header.cutoffTime} onChange={setH}
              className="border border-gray-400 px-2 py-1 w-24 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>

          <span className="text-red-500 text-[12px] font-medium whitespace-nowrap">Cutoff Time in 24 Hrs</span>
        </div>
      </div>

      {/* ── Tab panel ───────────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm overflow-hidden">

        {/* Tab headers */}
        <div className="flex border-b border-gray-200">
          {['Location Details', 'Import Data'].map((tab, i) => (
            <button key={tab} onClick={() => setActiveTab(i)}
              className={`px-5 py-2 text-[13px] font-medium border-b-2 transition-colors ${
                activeTab === i
                  ? 'border-[#0b8fd3] bg-[#0b8fd3] text-white'
                  : 'border-transparent text-gray-600 hover:bg-gray-50'
              }`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Location Details tab */}
        {activeTab === 0 && (
          <div className="p-4">
            {/* Row 1 */}
            <div className="flex items-center gap-4 mb-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <label className="text-[13px] whitespace-nowrap">Location Type</label>
                <select name="locationType" value={loc.locationType} onChange={setL}
                  className="border border-gray-400 px-2 py-1 text-[13px] focus:outline-none focus:border-blue-500 min-w-[180px]">
                  {LOCATION_TYPES.map(lt => <option key={lt}>{lt}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <label className="text-[13px] whitespace-nowrap">From</label>
                <input name="from" value={loc.from} onChange={setL}
                  className="border border-gray-400 px-2 py-1 w-40 text-[13px] focus:outline-none focus:border-blue-500" />
              </div>

              <div className="flex items-center gap-1.5">
                <label className="text-[13px] whitespace-nowrap">To</label>
                <input name="to" value={loc.to} onChange={setL}
                  className="border border-gray-400 px-2 py-1 w-40 text-[13px] focus:outline-none focus:border-blue-500" />
              </div>

              <div className="flex items-center gap-1.5">
                <label className="text-[13px] whitespace-nowrap">TAT Days</label>
                <input name="tatDays" value={loc.tatDays} onChange={setL} type="number" min="0"
                  className="border border-gray-400 px-2 py-1 w-24 text-[13px] focus:outline-none focus:border-blue-500" />
              </div>
            </div>

            {/* Row 2 */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5">
                <label className="text-[13px] whitespace-nowrap">Cutoff Time</label>
                <input name="cutoffTime" value={loc.cutoffTime} onChange={setL}
                  onKeyDown={e => e.key === 'Enter' && handleAddLoc()}
                  className="border border-gray-400 px-2 py-1 w-32 text-[13px] focus:outline-none focus:border-blue-500" />
              </div>
              <span className="text-red-500 text-[12px] font-medium">Cutoff Time in 24 Hrs</span>

              <div className="flex-1" />

              <button onClick={handleAddLoc}
                className="bg-[#1565c0] hover:bg-[#0d47a1] text-white text-[12px] font-semibold px-5 py-1.5 rounded">
                {editLocId !== null ? 'Update' : 'Add'}
              </button>
              {editLocId !== null && (
                <button onClick={() => { setLoc(INITIAL_LOC); setEditLocId(null); }}
                  className="bg-[#546e7a] hover:bg-[#455a64] text-white text-[12px] font-medium px-3 py-1.5 rounded">
                  Cancel
                </button>
              )}
            </div>

            {/* Location rows table */}
            <div className="mt-3 border border-gray-200 rounded min-h-[80px] bg-gray-50">
              {locRows.length === 0 ? (
                <div className="flex items-center justify-center h-16 text-gray-400 text-[12px]"></div>
              ) : (
                <table className="w-full text-[13px] border-collapse">
                  <thead>
                    <tr className="bg-[#0b8fd3] text-white">
                      <th className="px-3 py-1.5 text-left font-medium border border-[#0a7ab8]">Location Type</th>
                      <th className="px-3 py-1.5 text-left font-medium border border-[#0a7ab8]">From</th>
                      <th className="px-3 py-1.5 text-left font-medium border border-[#0a7ab8]">To</th>
                      <th className="px-3 py-1.5 text-left font-medium border border-[#0a7ab8]">TAT Days</th>
                      <th className="px-3 py-1.5 text-left font-medium border border-[#0a7ab8]">Cutoff Time</th>
                      <th className="px-3 py-1.5 text-left font-medium border border-[#0a7ab8]">Edit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {locRows.map((row, i) => (
                      <tr key={row.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-3 py-1.5 border-b border-gray-200">{row.locationType}</td>
                        <td className="px-3 py-1.5 border-b border-gray-200">{row.from}</td>
                        <td className="px-3 py-1.5 border-b border-gray-200">{row.to}</td>
                        <td className="px-3 py-1.5 border-b border-gray-200">{row.tatDays}</td>
                        <td className="px-3 py-1.5 border-b border-gray-200">{row.cutoffTime}</td>
                        <td className="px-3 py-1.5 border-b border-gray-200 text-center">
                          <button onClick={() => handleEditLoc(row.id)} className="text-gray-600 hover:text-blue-600">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Import Data tab */}
        {activeTab === 1 && (
          <div className="p-4 min-h-[160px] flex items-center justify-center text-gray-400 text-[13px]">
            Import Data
          </div>
        )}
      </div>
    </div>
  );
}
