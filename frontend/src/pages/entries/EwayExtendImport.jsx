import React, { useState } from 'react';
import toast from 'react-hot-toast';

const pad = n => String(n).padStart(2, '0');
const getToday = () => { const d = new Date(); return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`; };

const inp = 'border border-gray-300 px-2 py-1 text-[13px] focus:outline-none focus:border-blue-400';

const PdfIcon = () => (
  <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="3" fill="#e53e3e"/>
    <text x="4" y="22" fontSize="11" fontWeight="bold" fill="white" fontFamily="Arial">PDF</text>
  </svg>
);
const ExcelIcon = () => (
  <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="3" fill="#217346"/>
    <text x="3" y="22" fontSize="10" fontWeight="bold" fill="white" fontFamily="Arial">XLS</text>
  </svg>
);
const WordIcon = () => (
  <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="3" fill="#2b579a"/>
    <text x="3" y="22" fontSize="10" fontWeight="bold" fill="white" fontFamily="Arial">DOC</text>
  </svg>
);

const ExportIcons = () => (
  <div className="flex items-center gap-1 ml-auto flex-shrink-0">
    <button onClick={() => toast('PDF')}   title="PDF">  <PdfIcon />  </button>
    <button onClick={() => toast('Excel')} title="Excel"><ExcelIcon /></button>
    <button onClick={() => toast('Word')}  title="Word"> <WordIcon />  </button>
  </div>
);

const RADIO_OPTIONS = [
  'Import E-Way Bill',
  'E-Way Bill List',
  'Extend E_Way Bill Validity',
  'UnDelivered E-Way Bills',
];

export default function EwayExtendImport() {
  const [selected,      setSelected]      = useState('Import E-Way Bill');
  const [transporterId, setTransporterId] = useState('ALL');
  const [ewayDate,      setEwayDate]      = useState(getToday());
  const [expiryDate,    setExpiryDate]    = useState(getToday());
  const [udFilter,      setUdFilter]      = useState('PERIOD WISE');
  const [udFromDate,    setUdFromDate]    = useState(getToday());
  const [udToDate,      setUdToDate]      = useState(getToday());
  const [ewayBills,     setEwayBills]     = useState('Map');

  return (
    <div className="p-3 min-h-screen text-[13px]" style={{ backgroundColor: '#dce9f5' }}>

      {/* Top bar */}
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <span className="text-green-700 font-bold text-[13px]">
          E-way Bill API Balance - 38914 &nbsp; Valid Date - 25/03/2027 10:28:31
        </span>
        <button onClick={() => toast('Token refreshed')}
          className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[12px] font-medium px-3 py-1 rounded">
          Refresh Token
        </button>
        <h2 className="font-bold text-[15px] tracking-wide ml-2" style={{ fontVariant: 'small-caps' }}>
          Extend/Import E-Waybill
        </h2>
      </div>

      {/* Radio options */}
      <div className="flex items-center gap-6 mb-3 flex-wrap">
        {RADIO_OPTIONS.map(opt => (
          <label key={opt} className="flex items-center gap-1.5 cursor-pointer text-[13px]">
            <input type="radio" name="ewayMode" value={opt}
              checked={selected === opt}
              onChange={() => setSelected(opt)}
              className="accent-[#0b8fd3]" />
            {opt}
          </label>
        ))}
      </div>

      {/* Import E-Way Bill panel */}
      {selected === 'Import E-Way Bill' && (
        <div className="bg-white rounded shadow-sm px-4 py-3 mb-2">
          <p className="font-bold text-[13px] mb-3">Import E-Way Bill</p>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="font-medium text-[13px] whitespace-nowrap">Transporter ID</label>
              <select value={transporterId} onChange={e => setTransporterId(e.target.value)}
                className={`${inp} w-36`}>
                <option>ALL</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="font-medium text-[13px] whitespace-nowrap">E-WayBill Date -</label>
              <input value={ewayDate} onChange={e => setEwayDate(e.target.value)}
                className={`${inp} w-32`} />
            </div>
            <button onClick={() => toast('Importing E-way bills…')}
              className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] font-medium px-4 py-1.5 rounded">
              Import E-WayBill
            </button>
            <ExportIcons />
          </div>
        </div>
      )}

      {/* E-Way Bill List panel */}
      {selected === 'E-Way Bill List' && (
        <div className="bg-white rounded shadow-sm px-4 py-3 mb-2">
          <p className="font-bold text-[13px] mb-3">E-Way Bill List</p>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="font-medium text-[13px] whitespace-nowrap">Transporter ID</label>
              <select value={transporterId} onChange={e => setTransporterId(e.target.value)}
                className={`${inp} w-36`}>
                <option>ALL</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="font-medium text-[13px] whitespace-nowrap">E-WayBill Date -</label>
              <input value={ewayDate} onChange={e => setEwayDate(e.target.value)}
                className={`${inp} w-32`} />
            </div>
            <button onClick={() => toast('Showing E-way bills…')}
              className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] font-medium px-4 py-1.5 rounded">
              Show E-way Bill
            </button>
            <ExportIcons />
          </div>
        </div>
      )}

      {/* Extend E_Way Bill Validity panel */}
      {selected === 'Extend E_Way Bill Validity' && (
        <div className="bg-white rounded shadow-sm px-4 py-3 mb-2">
          <p className="font-bold text-[13px] mb-3">Extend E_Way Bill Validity</p>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="font-medium text-[13px] whitespace-nowrap">Transporter ID</label>
              <select value={transporterId} onChange={e => setTransporterId(e.target.value)}
                className={`${inp} w-36`}>
                <option>ALL</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="font-medium text-[13px] whitespace-nowrap">Expiry date -</label>
              <input value={expiryDate} onChange={e => setExpiryDate(e.target.value)}
                className={`${inp} w-32`} />
            </div>
            <button onClick={() => toast('Showing expiry E-way bills…')}
              className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] font-medium px-4 py-1.5 rounded">
              Show Expiry E-WayBill
            </button>
            <button onClick={() => toast('Validity extended')}
              className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] font-medium px-4 py-1.5 rounded">
              Extend Validity
            </button>
            <ExportIcons />
          </div>
        </div>
      )}

      {/* UnDelivered E-Way Bills panel */}
      {selected === 'UnDelivered E-Way Bills' && (
        <div className="bg-white rounded shadow-sm px-4 py-3 mb-2">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="font-medium text-[13px] whitespace-nowrap">Filter</label>
              <select value={udFilter} onChange={e => setUdFilter(e.target.value)}
                className={`${inp} w-32`}>
                <option>PERIOD WISE</option>
                <option>ALL</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="font-medium text-[13px] whitespace-nowrap">E-way Bill From Date</label>
              <input value={udFromDate} onChange={e => setUdFromDate(e.target.value)}
                className={`${inp} w-28`} />
            </div>
            <div className="flex items-center gap-2">
              <label className="font-medium text-[13px] whitespace-nowrap">E-way Bill To Date</label>
              <input value={udToDate} onChange={e => setUdToDate(e.target.value)}
                className={`${inp} w-28`} />
            </div>
            <div className="flex items-center gap-2">
              <label className="font-medium text-[13px] whitespace-nowrap">E-way Bills</label>
              <select value={ewayBills} onChange={e => setEwayBills(e.target.value)}
                className={`${inp} w-24`}>
                <option>Map</option>
                <option>Un-Map</option>
              </select>
            </div>
            <button onClick={() => toast('Showing…')}
              className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] font-medium px-3 py-1.5 rounded">
              Show
            </button>
            <button onClick={() => toast('Status updated')}
              className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] font-medium px-4 py-1.5 rounded">
              Update Current Status
            </button>
            <button onClick={() => toast('EWB deleted')}
              className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] font-medium px-4 py-1.5 rounded">
              Delete EWB
            </button>
          </div>
          <div className="flex items-center mt-2">
            <span className="font-bold text-[13px]">Total Records :&nbsp;</span>
            <span className="text-[13px]">0</span>
            <ExportIcons />
          </div>
        </div>
      )}

      {/* Empty results area */}
      <div className="bg-white rounded shadow-sm min-h-[120px]" />
    </div>
  );
}
