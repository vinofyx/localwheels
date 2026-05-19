import React, { useState } from 'react';
import toast from 'react-hot-toast';

const pad = n => String(n).padStart(2, '0');
const getToday = () => { const d = new Date(); return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`; };

const SaveIcon    = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>;
const SearchIcon  = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/></svg>;
const RefreshIcon = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>;
const PrintIcon   = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>;

const BRANCHES = [
  '--Select--','ADILABAD','ANANTHAPUR','CUDDAPAH','GUNTUR','HYDERABAD',
  'HYDERABAD-HEAD OFFICE','HYDERABAD1','KAKINADA','KARIMNAGAR','KERALA',
  'KHAMMAM','KURNOOL','MAHBUBNAGAR','MANCHERIAL','NALGONDA','NELLORE',
  'NIZAMABAD','ONGOLE','RAJAHMUNDRY','SANGAREDDY','TAMILNADU',
  'TEST_API_2','TEST_API_BRANCH','TIRUPATHI','VIJAYAWADA','VIKARABAD',
  'VISAKHAPATNAM','WARANGAL',
];

const lblR = 'whitespace-nowrap text-red-600 font-medium text-[13px]';
const lbl  = 'whitespace-nowrap font-medium text-[13px]';
const inp  = 'border border-gray-300 px-2 py-1 text-[13px] focus:outline-none focus:border-blue-400';
const inpR = 'border border-blue-400 px-2 py-1 text-[13px] focus:outline-none focus:border-blue-500';

export default function PODSendBranch() {
  const [sendingDate, setSendingDate] = useState(getToday());
  const [remark,      setRemark]      = useState('');
  const [toBranch,    setToBranch]    = useState('HYDERABAD-HEAD OFFICE');
  const [enterLrNo,   setEnterLrNo]   = useState('');
  const [lrList,      setLrList]      = useState([]);

  const handleRefresh = () => {
    setSendingDate(getToday()); setRemark('');
    setToBranch('HYDERABAD-HEAD OFFICE'); setEnterLrNo(''); setLrList([]);
  };

  const topBtn = v => `flex items-center gap-1.5 text-white text-[12px] font-medium px-3 py-1.5 rounded ${
    v === 'save'   ? 'bg-[#1565c0] hover:bg-[#0d47a1]' :
    v === 'search' ? 'bg-[#0288d1] hover:bg-[#0277bd]' :
                     'bg-[#546e7a] hover:bg-[#455a64]'
  }`;

  return (
    <div className="p-3 min-h-screen text-[13px]" style={{ backgroundColor: '#cfd6de' }}>

      {/* ── Top bar ──────────────────────────────────────────────── */}
      <div className="flex items-center mb-2">
        <p className="text-red-600 text-[12px] font-medium flex-1">* Mark fields are compulsory</p>
        <h2 className="font-bold text-[15px] tracking-wide" style={{ fontVariant: 'small-caps' }}>
          POD Send(Branch)
        </h2>
        <div className="flex-1 flex justify-end gap-1.5">
          <button onClick={() => toast.success('Saved')}  className={topBtn('save')}>  {SaveIcon}    Save    </button>
          <button onClick={() => toast('Search')}         className={topBtn('search')}>{SearchIcon}  Search  </button>
          <button onClick={handleRefresh}                 className={topBtn('gray')}>  {RefreshIcon} Refersh </button>
          <button onClick={() => toast('Printing...')}    className={topBtn('gray')}>  {PrintIcon}   Print   </button>
        </div>
      </div>

      {/* ── Form card ─────────────────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm px-4 py-3 mb-2">

        {/* Row 1: POD Send No | Sending Date | Remark */}
        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-2">
            <label className={lblR}>* POD Send No:</label>
            <input value="1" readOnly
              className="border border-gray-300 bg-gray-100 px-2 py-1 w-28 text-[13px] cursor-not-allowed" />
          </div>
          <div className="flex items-center gap-2">
            <label className={lblR}>* Sending Date</label>
            <input value={sendingDate} onChange={e => setSendingDate(e.target.value)}
              className={`${inpR} w-32`} />
          </div>
          <div className="flex items-center gap-2 flex-1">
            <label className={lblR}>* Remark</label>
            <input value={remark} onChange={e => setRemark(e.target.value)}
              className={`${inpR} flex-1`} />
          </div>
        </div>

        {/* Row 2: From Branch | To Branch | Enter LR No | Select LR */}
        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-2">
            <label className={lblR}>* From Branch</label>
            <select disabled
              className="border border-gray-300 bg-gray-100 px-2 py-1 text-[13px] w-48 cursor-not-allowed">
              <option>HYDERABAD-HEAD OFFICE</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className={lblR}>* To Branch</label>
            <select value={toBranch} onChange={e => setToBranch(e.target.value)}
              className={`${inp} w-52`}>
              {BRANCHES.map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <label className={lbl}>Enter LR No</label>
            <input value={enterLrNo} onChange={e => setEnterLrNo(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && enterLrNo.trim()) { setLrList(l => [...l, enterLrNo.trim()]); setEnterLrNo(''); } }}
              className={`${inp} w-40`} />
            <button onClick={() => toast('Select LR')}
              className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] font-medium px-5 py-1.5 rounded">
              Select LR
            </button>
          </div>
        </div>

        {/* Row 3: Total LR Count */}
        <div>
          <span className="font-bold text-[13px]">Total LR Count : </span>
          <span className="text-[13px]">{lrList.length || ''}</span>
        </div>
      </div>

      {/* ── LR list area ──────────────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm min-h-[120px] px-3 py-2">
        {lrList.length > 0 && (
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr style={{ backgroundColor: '#0b8fd3', color: '#fff' }}>
                <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8]">LR No</th>
              </tr>
            </thead>
            <tbody>
              {lrList.map((lr, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-3 py-1.5 border-b border-gray-200">{lr}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
