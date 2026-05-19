import React, { useState } from 'react';
import toast from 'react-hot-toast';

const BRANCHES = [
  '--ALL--', 'ADILABAD', 'ANANTHAPUR', 'CUDDAPAH', 'GUNTUR',
  'HYDERABAD', 'HYDERABAD-HEAD OFFICE', 'HYDERABAD1', 'KAKINADA',
  'KARIMNAGAR', 'KERALA', 'KHAMMAM', 'KURNOOL', 'MAHBUBNAGAR',
  'MANCHERIAL', 'NALGONDA', 'NELLORE', 'NIZAMABAD', 'ONGOLE',
  'RAJAHMUNDRY', 'SECUNDERABAD', 'SRIKAKULAM', 'TIRUPATI',
  'VIJAYAWADA', 'VISAKHAPATNAM', 'WARANGAL',
];

const CLOSING_OPTS = ['WITH ZERO', 'WITHOUT ZERO'];
const DISPLAY_MODES = ['Single Line', 'Group Wise', 'Ledger Wise'];
const SECTIONS = ['ASSESTS', 'EXPENCE', 'INCOME', 'LIABILITIES'];

// Financial year generator
const genFY = () => {
  const now = new Date();
  const fy = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return Array.from({ length: 5 }, (_, i) => {
    const y = fy + 1 - i;
    return `${y}-${y + 1}`;
  });
};
const FY_YEARS = genFY();

const fyStartDate = () => {
  const now = new Date();
  const y = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return `01/04/${y}`;
};
const todayStr = new Date().toLocaleDateString('en-GB').replace(/\//g, '/');

const INITIAL_GROUPS = [
  { section: 'ASSESTS',     name: 'FIXED ASSETS',            order: '1' },
  { section: 'ASSESTS',     name: 'CURRENT ASSETS',          order: '2' },
  { section: 'ASSESTS',     name: 'INVESTMENTS',             order: '3' },
  { section: 'ASSESTS',     name: 'DEPOSIT',                 order: '4' },
  { section: 'EXPENCE',     name: 'INDIRECT EXPENSES',       order: '1' },
  { section: 'EXPENCE',     name: 'ADMINISTRATION EXPENSES', order: '2' },
  { section: 'EXPENCE',     name: 'PURCHASE ACCOUNT',        order: '3' },
  { section: 'EXPENCE',     name: 'DIRECT EXPENSES',         order: '4' },
  { section: 'EXPENCE',     name: 'AUDITORS REMUNERATION',   order: '5' },
  { section: 'INCOME',      name: 'SALES ACCOUNT',           order: '1' },
  { section: 'INCOME',      name: 'DIRECT INCOME',           order: '2' },
  { section: 'INCOME',      name: 'INDIRECT INCOME',         order: '3' },
  { section: 'INCOME',      name: 'FREIGHT EARNING',         order: '4' },
  { section: 'INCOME',      name: 'OTHER INCOME',            order: '5' },
  { section: 'LIABILITIES', name: 'CAPITAL A/C',             order: '1' },
  { section: 'LIABILITIES', name: 'Loans ( Liability )',     order: '2' },
  { section: 'LIABILITIES', name: 'CURRENT LAIBILITIES',    order: '3' },
  { section: 'LIABILITIES', name: 'SHARE CAPITAL',           order: '4' },
  { section: 'LIABILITIES', name: 'SUSPENS A/C',             order: '5' },
  { section: 'LIABILITIES', name: 'DIRECTORS ACCOUNT',       order: '6' },
  { section: 'LIABILITIES', name: 'RESERVE & SURPLUS',       order: '7' },
];

const sel = 'border border-gray-300 px-2 py-1 text-[13px] bg-white focus:outline-none';
const inp = 'border border-gray-300 px-2 py-1 text-[13px] bg-white focus:outline-none';

export default function TrailBalance() {
  const [fy,       setFy]       = useState(FY_YEARS[0]);
  const [fromDate, setFromDate] = useState(fyStartDate());
  const [toDate,   setToDate]   = useState(todayStr);
  const [branch,   setBranch]   = useState('--ALL--');
  const [closing,  setClosing]  = useState('WITH ZERO');
  const [display,  setDisplay]  = useState('Single Line');
  const [groups,   setGroups]   = useState(INITIAL_GROUPS);

  const setOrder = (i, val) =>
    setGroups(prev => prev.map((g, j) => j === i ? { ...g, order: val } : g));

  const bySection = SECTIONS.reduce((acc, sec) => {
    acc[sec] = groups.map((g, i) => ({ ...g, i })).filter(g => g.section === sec);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-white text-[13px]">
      {/* Title */}
      <div className="text-center py-2 border-b border-[#0b8fd3]">
        <span className="font-bold text-[14px] underline">Trail Balance</span>
      </div>

      {/* Filter box */}
      <div className="border border-gray-300 mx-3 mt-3 mb-3 px-4 py-3 bg-white">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <p className="text-[12px] text-gray-600 mb-0.5">Financial Year</p>
            <select value={fy} onChange={e => setFy(e.target.value)} className={`${sel} w-28`}>
              {FY_YEARS.map(y => <option key={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <p className="text-[12px] text-gray-600 mb-0.5">From Date</p>
            <input value={fromDate} onChange={e => setFromDate(e.target.value)} className={`${inp} w-28`} />
          </div>
          <div>
            <p className="text-[12px] text-gray-600 mb-0.5">To Date</p>
            <input value={toDate} onChange={e => setToDate(e.target.value)} className={`${inp} w-28`} />
          </div>
          <div>
            <p className="text-[12px] text-gray-600 mb-0.5">Branch</p>
            <select value={branch} onChange={e => setBranch(e.target.value)} className={`${sel} w-48`}>
              {BRANCHES.map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <p className="text-[12px] text-gray-600 mb-0.5">Closing Balance</p>
            <select value={closing} onChange={e => setClosing(e.target.value)} className={`${sel} w-32`}>
              {CLOSING_OPTS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex items-end gap-3 pb-1">
            {DISPLAY_MODES.map(m => (
              <label key={m} className="flex items-center gap-1 cursor-pointer whitespace-nowrap">
                <input type="radio" checked={display === m} onChange={() => setDisplay(m)}
                  className="w-3.5 h-3.5 accent-[#0b8fd3]" />
                <span className="text-[13px]">{m}</span>
              </label>
            ))}
          </div>
          <div className="flex items-end pb-0.5">
            <button onClick={() => toast('Loading Trail Balance…')}
              className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] px-6 py-1.5 rounded">
              Show
            </button>
          </div>
        </div>
      </div>

      {/* Update Sortorder */}
      <div className="mx-3 mb-3">
        <button onClick={() => toast.success('Sort order updated')}
          className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] px-4 py-1.5 rounded">
          Update Sortorder
        </button>
      </div>

      {/* Sort order table */}
      <div className="mx-3 mb-6 inline-block min-w-[320px] border border-gray-300 rounded overflow-hidden">
        <table className="border-collapse text-[12px] w-full">
          <thead>
            <tr className="bg-[#0b8fd3] text-white">
              <th className="px-3 py-1.5 text-left font-medium border-r border-blue-400 w-60">
                Group Name <span className="text-[10px]">⇅</span>
              </th>
              <th className="px-3 py-1.5 text-center font-medium w-24">
                Sort Order <span className="text-[10px]">⇅</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {SECTIONS.map(sec => (
              <React.Fragment key={sec}>
                <tr>
                  <td colSpan={2}
                    className="px-3 py-1 font-bold text-gray-900 bg-white border-b border-gray-200">
                    {sec}
                  </td>
                </tr>
                {bySection[sec].map(g => (
                  <tr key={g.i} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-3 py-1 text-[#0b6fcc] border-r border-gray-200 whitespace-nowrap">
                      {g.name}
                    </td>
                    <td className="px-2 py-0.5 text-center">
                      <input value={g.order} onChange={e => setOrder(g.i, e.target.value)}
                        className="border border-gray-300 px-1 py-0.5 text-[12px] bg-white
                                   focus:outline-none w-14 text-center" />
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
