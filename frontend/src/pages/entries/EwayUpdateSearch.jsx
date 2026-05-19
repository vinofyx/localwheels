import React, { useState } from 'react';
import toast from 'react-hot-toast';

const pad = n => String(n).padStart(2, '0');
const getToday = () => { const d = new Date(); return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`; };

const inp = 'border border-gray-300 px-2 py-1 text-[13px] focus:outline-none focus:border-blue-400';

const BRANCHES = [
  'HYDERABAD-HEAD OFFICE','ADILABAD','ANANTHAPUR','CUDDAPAH','GUNTUR','HYDERABAD',
  'HYDERABAD1','KAKINADA','KARIMNAGAR','KERALA','KHAMMAM','KURNOOL',
  'MAHBUBNAGAR','MANCHERIAL','NALGONDA','NELLORE','NIZAMABAD','ONGOLE',
  'RAJAHMUNDRY','SANGAREDDY','TAMILNADU','TIRUPATHI','VIJAYAWADA',
  'VIKARABAD','VISAKHAPATNAM','WARANGAL',
];

const TABS = ['Pending Part-B', 'Generated Part-B', 'Search/Print E-waybill', 'Update Vehicle No/Transporter ID'];

export default function EwayUpdateSearch() {
  const [branch,       setBranch]       = useState('HYDERABAD-HEAD OFFICE');
  const [fromDate,     setFromDate]     = useState(getToday());
  const [toDate,       setToDate]       = useState(getToday());
  const [docNo,        setDocNo]        = useState('');
  const [tab,          setTab]          = useState('Pending Part-B');

  // Search/Print tab
  const [transporterId, setTransporterId] = useState('ALL');
  const [ewbNumber,     setEwbNumber]     = useState('');

  // Update tab
  const [updateType,    setUpdateType]    = useState('Update Transporter ID');
  const [ewbType,       setEwbType]       = useState('EWB');
  const [ewbNo,         setEwbNo]         = useState('');
  const [updateTrId,    setUpdateTrId]    = useState('');
  const [trName,        setTrName]        = useState('');
  const [updFromDate,   setUpdFromDate]   = useState(getToday());
  const [updToDate,     setUpdToDate]     = useState(getToday());

  return (
    <div className="p-3 min-h-screen text-[13px]" style={{ backgroundColor: '#dce9f5' }}>

      {/* Title */}
      <div className="text-center mb-2">
        <h2 className="font-bold text-[15px] tracking-wide underline">
          Update/Search E-waybill
        </h2>
      </div>

      {/* Filter card */}
      <div className="bg-white rounded shadow-sm px-4 py-3 mb-2 overflow-x-auto">
        <div className="flex items-center gap-4 min-w-max flex-wrap">
          <div className="flex items-center gap-2">
            <label className="font-medium text-[13px] whitespace-nowrap">Branch</label>
            <select value={branch} onChange={e => setBranch(e.target.value)}
              className={`${inp} w-52`}>
              {BRANCHES.map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="font-medium text-[13px] whitespace-nowrap">From Date</label>
            <input value={fromDate} onChange={e => setFromDate(e.target.value)}
              className={`${inp} w-28`} />
          </div>
          <div className="flex items-center gap-2">
            <label className="font-medium text-[13px] whitespace-nowrap">To Date</label>
            <input value={toDate} onChange={e => setToDate(e.target.value)}
              className={`${inp} w-28`} />
          </div>
          <div className="flex items-center gap-2">
            <label className="font-medium text-[13px] whitespace-nowrap">Doc No</label>
            <input value={docNo} onChange={e => setDocNo(e.target.value)}
              className={`${inp} w-36`} />
          </div>
          <button onClick={() => toast('Showing data…')}
            className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] font-medium px-5 py-1.5 rounded">
            Show
          </button>
        </div>
      </div>

      {/* Tabs + content card */}
      <div className="bg-white rounded shadow-sm overflow-hidden">
        {/* Tab bar */}
        <div className="flex" style={{ backgroundColor: '#0b8fd3' }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-[13px] font-medium border-r border-[#0a7ab8] last:border-r-0 whitespace-nowrap ${
                tab === t
                  ? 'bg-[#f59e0b] text-white'
                  : 'text-white hover:bg-white/20'
              }`}>
              {t}
            </button>
          ))}
        </div>

        {/* Pending Part-B */}
        {tab === 'Pending Part-B' && (
          <div className="px-4 py-3 min-h-[120px]">
            <span className="text-red-600 font-bold text-[13px]">Total Count :</span>
          </div>
        )}

        {/* Generated Part-B */}
        {tab === 'Generated Part-B' && (
          <div className="px-4 py-3 min-h-[120px]">
            <span className="text-red-600 font-bold text-[13px]">Total Count :</span>
          </div>
        )}

        {/* Search/Print E-waybill */}
        {tab === 'Search/Print E-waybill' && (
          <div className="px-4 py-3 min-h-[120px]">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="font-medium text-[13px] whitespace-nowrap">Transporter ID</label>
                <select value={transporterId} onChange={e => setTransporterId(e.target.value)}
                  className={`${inp} w-52`}>
                  <option>ALL</option>
                  <option>36AAFCL7262D1ZJ</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="font-medium text-[13px] whitespace-nowrap">E-way Bill Number -</label>
                <input value={ewbNumber} onChange={e => setEwbNumber(e.target.value)}
                  className={`${inp} w-40`} />
              </div>
              <button onClick={() => toast('Showing E-way bill…')}
                className="border border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-[13px] px-4 py-1.5 rounded">
                Show Expiry E-WayBill
              </button>
            </div>
          </div>
        )}

        {/* Update Vehicle No/Transporter ID */}
        {tab === 'Update Vehicle No/Transporter ID' && (
          <div className="min-h-[280px]">
            {/* Top controls */}
            <div className="flex items-center gap-3 px-3 py-2 flex-wrap border-b border-gray-200">
              <select value={updateType} onChange={e => setUpdateType(e.target.value)}
                className={`${inp} w-44`}>
                <option>Update Transporter ID</option>
                <option>Update Vehicle No</option>
              </select>
              <select value={ewbType} onChange={e => setEwbType(e.target.value)}
                className={`${inp} w-20`}>
                <option>EWB</option>
                <option>Memo</option>
                <option>LDM</option>
              </select>
              <div className="flex items-center gap-2">
                <label className="font-medium text-[13px] whitespace-nowrap">EWB No</label>
                <input value={ewbNo} onChange={e => setEwbNo(e.target.value)}
                  className={`${inp} w-36`} />
              </div>
              {updateType === 'Update Transporter ID' ? (
                <>
                  <div className="flex items-center gap-2">
                    <label className="font-medium text-[13px] whitespace-nowrap">Update Transporter ID</label>
                    <input value={updateTrId} onChange={e => setUpdateTrId(e.target.value)}
                      className={`${inp} w-36`} />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="font-medium text-[13px] whitespace-nowrap">Transporter Name</label>
                    <input value={trName} onChange={e => setTrName(e.target.value)}
                      className={`${inp} w-36`} />
                  </div>
                  <button onClick={() => toast('Transporter ID updated')}
                    className="border border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-[13px] px-4 py-1.5 rounded">
                    Update Transporter ID
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <label className="font-medium text-[13px] whitespace-nowrap">Vehicle No</label>
                    <input value={updateTrId} onChange={e => setUpdateTrId(e.target.value)}
                      className={`${inp} w-36`} />
                  </div>
                  <button onClick={() => toast('Vehicle No updated')}
                    className="border border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-[13px] px-4 py-1.5 rounded">
                    Update Vehicle No
                  </button>
                </>
              )}
            </div>

            {/* Gray scrollable area */}
            <div className="bg-gray-200 mx-0" style={{ minHeight: 160 }} />

            {/* Bottom row */}
            <div className="flex items-center gap-3 px-3 py-2 border-t border-gray-200 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="font-medium text-[13px] whitespace-nowrap">From Date</label>
                <input value={updFromDate} onChange={e => setUpdFromDate(e.target.value)}
                  className={`${inp} w-28`} />
              </div>
              <div className="flex items-center gap-2">
                <label className="font-medium text-[13px] whitespace-nowrap">To Date</label>
                <input value={updToDate} onChange={e => setUpdToDate(e.target.value)}
                  className={`${inp} w-28`} />
              </div>
              <button onClick={() => toast('Showing updated transporter IDs…')}
                className="border border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-[13px] px-4 py-1.5 rounded">
                Show Updated Transporter ID
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
