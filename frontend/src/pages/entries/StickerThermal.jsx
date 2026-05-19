import React, { useState } from 'react';
import toast from 'react-hot-toast';

const inp = 'border border-gray-300 px-2 py-1 text-[13px] focus:outline-none focus:border-blue-400';

const BRANCHES = [
  '--Select--','ADILABAD','ANANTHAPUR','CUDDAPAH','GUNTUR','HYDERABAD',
  'HYDERABAD-HEAD OFFICE','HYDERABAD1','KAKINADA','KARIMNAGAR','KERALA',
  'KHAMMAM','KURNOOL','MAHBUBNAGAR','MANCHERIAL','NALGONDA','NELLORE',
  'NIZAMABAD','ONGOLE','RAJAHMUNDRY','SANGAREDDY','TAMILNADU',
  'TEST_API_2','TEST_API_BRANCH','TIRUPATHI','VIJAYAWADA','VIKARABAD',
  'VISAKHAPATNAM','WARANGAL',
];

export default function StickerThermal() {
  const [branch,   setBranch]   = useState('--Select--');
  const [fromLR,   setFromLR]   = useState('');
  const [toLR,     setToLR]     = useState('');

  return (
    <div className="p-3 min-h-screen text-[13px]" style={{ backgroundColor: '#dce9f5' }}>

      {/* Title */}
      <div className="text-center mb-2">
        <h2 className="font-bold text-[15px] tracking-wide" style={{ fontVariant: 'small-caps' }}>
          Sticker(Thermal)
        </h2>
      </div>

      {/* Filter card */}
      <div className="bg-white rounded shadow-sm px-4 py-3 mb-2">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="font-medium text-[13px] whitespace-nowrap">Branch</label>
            <select value={branch} onChange={e => setBranch(e.target.value)}
              className={`${inp} w-52`}>
              {BRANCHES.map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="font-medium text-[13px] whitespace-nowrap">From LR No</label>
            <input value={fromLR} onChange={e => setFromLR(e.target.value)}
              className={`${inp} w-40`} />
          </div>
          <div className="flex items-center gap-2">
            <label className="font-medium text-[13px] whitespace-nowrap">To LR No</label>
            <input value={toLR} onChange={e => setToLR(e.target.value)}
              className={`${inp} w-40`} />
          </div>
          <button onClick={() => toast('Showing data…')}
            className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] font-medium px-5 py-1.5 rounded">
            Show
          </button>
        </div>
      </div>

      {/* Empty results area */}
      <div className="bg-white rounded shadow-sm min-h-[200px]" />
    </div>
  );
}
