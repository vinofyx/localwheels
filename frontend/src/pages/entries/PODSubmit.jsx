import React, { useState } from 'react';
import toast from 'react-hot-toast';

const pad = n => String(n).padStart(2, '0');
const getToday = () => { const d = new Date(); return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`; };

const SaveIcon    = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>;
const SearchIcon  = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/></svg>;
const RefreshIcon = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>;

const BRANCHES = [
  'HYDERABAD-HEAD OFFICE','ADILABAD','ANANTHAPUR','CUDDAPAH','GUNTUR','HYDERABAD',
  'HYDERABAD1','KAKINADA','KARIMNAGAR','KERALA','KHAMMAM','KURNOOL',
  'MAHBUBNAGAR','MANCHERIAL','NALGONDA','NELLORE','NIZAMABAD','ONGOLE','RAJAHMUNDRY',
];

const lblR = 'whitespace-nowrap text-red-600 font-medium text-[13px]';
const inp  = 'border border-gray-300 px-2 py-1 text-[13px] focus:outline-none focus:border-blue-400';
const inpR = 'border border-blue-400 px-2 py-1 text-[13px] focus:outline-none focus:border-blue-500';

export default function PODSubmit() {
  const [submitDate,   setSubmitDate]   = useState(getToday());
  const [submitPerson, setSubmitPerson] = useState('');
  const [submitBranch, setSubmitBranch] = useState('HYDERABAD-HEAD OFFICE');
  const [enterLrNo,    setEnterLrNo]    = useState('');
  const [lrList,       setLrList]       = useState([]);

  const handleRefresh = () => {
    setSubmitDate(getToday()); setSubmitPerson('');
    setSubmitBranch('HYDERABAD-HEAD OFFICE'); setEnterLrNo(''); setLrList([]);
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
          POD Submit
        </h2>
        <div className="flex-1 flex justify-end gap-1.5">
          <button onClick={() => toast.success('Saved')}  className={topBtn('save')}>  {SaveIcon}    Save    </button>
          <button onClick={() => toast('Search')}         className={topBtn('search')}>{SearchIcon}  Search  </button>
          <button onClick={handleRefresh}                 className={topBtn('gray')}>  {RefreshIcon} Refresh </button>
        </div>
      </div>

      {/* ── Form card ─────────────────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm px-4 py-3 mb-2">

        {/* Row 1: Submit Date | Submit Person | Submit Branch */}
        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-2">
            <label className={lblR}>* Submit Date</label>
            <input value={submitDate} onChange={e => setSubmitDate(e.target.value)}
              className={`${inpR} w-32`} />
          </div>
          <div className="flex items-center gap-2">
            <label className={lblR}>* Submit Person</label>
            <input value={submitPerson} onChange={e => setSubmitPerson(e.target.value)}
              className={`${inpR} w-48`} />
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <label className={lblR}>* Submit Branch</label>
            <select value={submitBranch} onChange={e => setSubmitBranch(e.target.value)}
              className="border border-gray-300 bg-gray-100 px-2 py-1 text-[13px] focus:outline-none w-52 cursor-not-allowed"
              disabled>
              {BRANCHES.map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
        </div>

        {/* Row 2: Enter LR No | Select LR */}
        <div className="flex items-center gap-3 mb-3">
          <label className="font-medium whitespace-nowrap text-[13px]">Enter LR No</label>
          <input value={enterLrNo} onChange={e => setEnterLrNo(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && enterLrNo.trim()) { setLrList(l => [...l, enterLrNo.trim()]); setEnterLrNo(''); } }}
            className={`${inp} w-48`} />
          <button onClick={() => toast('Select LR')}
            className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] font-medium px-5 py-1.5 rounded">
            Select LR
          </button>
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
