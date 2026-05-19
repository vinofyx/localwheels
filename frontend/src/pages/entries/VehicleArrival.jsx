import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';

const pad = n => String(n).padStart(2, '0');
const getToday = () => { const d = new Date(); return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`; };
const getNow   = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; };

const SaveIcon    = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>;
const SearchIcon  = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/></svg>;
const RefreshIcon = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>;
const PrintIcon   = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>;

const BRANCHES    = ['--ALL--','ADILABAD','ANANTHAPUR','CUDDAPAH','GUNTUR','HYDERABAD','HYDERABAD-HEAD OFFICE','HYDERABAD1','KAKINADA','KARIMNAGAR','KERALA','KHAMMAM','KURNOOL','MAHBUBNAGAR','MANCHERIAL','NALGONDA','NELLORE','NIZAMABAD','ONGOLE','RAJAHMUNDRY'];
const MATERIALS   = ['--Select--','GENERAL','FRAGILE','LIQUID','HAZARDOUS'];
const ENTRY_TYPES = ['MEMO','LDM','LCM'];

const VENDOR_CHARGES = [
  { name:'2ND ATTEMPT CHARGES',            color:'orange' },
  { name:'APPOINTMENT DELIVERY CHARGES',   color:'teal'   },
  { name:'DRIVER FOODING EXPENSE CHARGES', color:'black'  },
  { name:'DRIVER UNLOADING CHARGES',       color:'black'  },
  { name:'DRIVER-LOADING CHARGES',         color:'black'  },
  { name:'HELPER FOODING EXPENSE CHARGES', color:'black'  },
  { name:'HELPER UNLOADING CHARGES',       color:'black'  },
  { name:'LOADING CHARGES BY HAMALI',      color:'teal'   },
  { name:'OTHER EXPENSE CHARGES',          color:'black'  },
  { name:'RE-ATTEMPT CHARGES',             color:'teal'   },
  { name:'THAI BAZAR CHARGES',             color:'black'  },
  { name:'TOLL EXPENSE CHARGES',           color:'black'  },
  { name:'TRIP UNLOADING CHARGES',         color:'black'  },
  { name:'UNLOADING CHARGES BY HAMALI',    color:'teal'   },
  { name:'VECHILE BREAKDOWN EXPENSES',     color:'teal'   },
];

const cc = c => c === 'orange' ? 'text-orange-500' : c === 'teal' ? 'text-[#0b8fd3]' : 'text-gray-900';

const initForm = () => ({
  unloadingDate: getToday(), unloadingTime: getNow(),
  unloadingPerson: '', arrivalDate: getToday(),
  arrivalTime: getNow(), vehicleNo: '', entryType: 'MEMO', sealNo: '',
});

const inp  = 'border border-gray-300 px-2 py-1 text-[13px] focus:outline-none focus:border-blue-400';
const inpR = 'border border-blue-400 px-2 py-1 text-[13px] focus:outline-none focus:border-blue-500';
const lblR = 'whitespace-nowrap text-red-600 font-medium text-[13px]';
const lbl  = 'whitespace-nowrap font-medium text-[13px]';

function DetailRow({ branch, setBranch, lrNo, setLrNo, material, setMaterial, actualQty, setActualQty, excessQty, setExcessQty }) {
  return (
    <div className="px-3 py-3">
      <div className="flex items-end gap-2 mb-3">
        <div className="flex flex-col gap-0.5">
          <label className={lbl}>Branch</label>
          <select value={branch} onChange={e => setBranch(e.target.value)} className={`${inp} w-36`}>
            {BRANCHES.map(b => <option key={b}>{b}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-0.5">
          <label className={lbl}>LR NO</label>
          <input value={lrNo} onChange={e => setLrNo(e.target.value)} className={`${inp} w-28`} />
        </div>
        <div className="flex flex-col gap-0.5">
          <label className={lbl}>Material</label>
          <select value={material} onChange={e => setMaterial(e.target.value)} className={`${inp} w-36`}>
            {MATERIALS.map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-0.5">
          <label className={lbl}>Actual Qty</label>
          <input value={actualQty} onChange={e => setActualQty(e.target.value)} className={`${inp} w-24`} />
        </div>
        <div className="flex flex-col gap-0.5">
          <label className={lbl}>Excess Qty</label>
          <input value={excessQty} onChange={e => setExcessQty(e.target.value)} className={`${inp} w-24`} />
        </div>
        <button onClick={() => toast('Added')}
          className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] font-medium px-5 py-1.5 rounded">
          Add
        </button>
      </div>
      <div className="border border-gray-200 min-h-[80px] rounded" />
    </div>
  );
}

export default function VehicleArrival() {
  const [tab,         setTab]         = useState('unloading');
  const [form,        setForm]        = useState(initForm);
  const [receivedQty, setReceivedQty] = useState('');
  const [udBranch,    setUdBranch]    = useState('--ALL--');
  const [udLrNo,      setUdLrNo]      = useState('');
  const [udMaterial,  setUdMaterial]  = useState('--Select--');
  const [udActualQty, setUdActualQty] = useState('');
  const [udExcessQty, setUdExcessQty] = useState('');
  const [exBranch,    setExBranch]    = useState('--ALL--');
  const [exLrNo,      setExLrNo]      = useState('');
  const [exMaterial,  setExMaterial]  = useState('--Select--');
  const [exActualQty, setExActualQty] = useState('');
  const [exExcessQty, setExExcessQty] = useState('');
  const [vendor,      setVendor]      = useState({ vendorName:'', from:'', to:'', freight:'', extraCharges:'', total:'' });
  const [charges,     setCharges]     = useState(() => Object.fromEntries(VENDOR_CHARGES.map(c => [c.name, ''])));
  const fileRef = useRef(null);

  const setF = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const setV = k => e => setVendor(v => ({ ...v, [k]: e.target.value }));

  const handleRefresh = () => {
    setForm(initForm()); setReceivedQty(''); setTab('unloading');
    setUdBranch('--ALL--'); setUdLrNo(''); setUdMaterial('--Select--'); setUdActualQty(''); setUdExcessQty('');
    setExBranch('--ALL--'); setExLrNo(''); setExMaterial('--Select--'); setExActualQty(''); setExExcessQty('');
    setVendor({ vendorName:'', from:'', to:'', freight:'', extraCharges:'', total:'' });
    setCharges(Object.fromEntries(VENDOR_CHARGES.map(c => [c.name, ''])));
    if (fileRef.current) fileRef.current.value = '';
  };

  const topBtn = v => `flex items-center gap-1.5 text-white text-[12px] font-medium px-3 py-1.5 rounded ${
    v==='save' ? 'bg-[#1565c0] hover:bg-[#0d47a1]' : v==='search' ? 'bg-[#0288d1] hover:bg-[#0277bd]' : 'bg-[#546e7a] hover:bg-[#455a64]'
  }`;

  return (
    <div className="p-3 min-h-screen text-[13px]" style={{ backgroundColor: '#cfd6de' }}>

      {/* ── Top bar ──────────────────────────────────────────────── */}
      <div className="flex items-center mb-2">
        <p className="text-red-600 text-[12px] font-medium flex-1">* Mark fields are compulsory</p>
        <h2 className="font-bold text-[15px] tracking-wide" style={{ fontVariant: 'small-caps' }}>VehicleArrival(VAR)</h2>
        <div className="flex-1 flex justify-end gap-1.5">
          <button onClick={() => toast.success('Saved')}   className={topBtn('save')}>  {SaveIcon}    Save   </button>
          <button onClick={() => toast('Search')}          className={topBtn('search')}>{SearchIcon}  Search </button>
          <button onClick={handleRefresh}                  className={topBtn('gray')}>  {RefreshIcon} Refersh</button>
          <button onClick={() => toast('Printing...')}     className={topBtn('gray')}>  {PrintIcon}   Print  </button>
        </div>
      </div>

      {/* ── Form card ─────────────────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm px-4 py-3 mb-2 overflow-x-auto">

        {/* Row 1 */}
        <div className="flex items-center gap-3 mb-3 min-w-max">
          <div className="flex items-center gap-1.5">
            <label className={lblR}>* Unloading NO</label>
            <input value="1" readOnly className="border border-gray-300 bg-gray-100 px-2 py-1 w-20 text-[13px] cursor-not-allowed" />
          </div>
          <div className="flex items-center gap-1.5">
            <label className={lblR}>* Unloading Date.</label>
            <input value={form.unloadingDate} onChange={setF('unloadingDate')} className={`${inpR} w-28`} />
          </div>
          <div className="flex items-center gap-1.5">
            <label className={lblR}>* Unloading Time</label>
            <input value={form.unloadingTime} onChange={setF('unloadingTime')} className={`${inpR} w-24`} />
            <span className="text-orange-500 text-[12px] font-medium">(HH:MM)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <label className={lblR}>* Unloading Person</label>
            <input value={form.unloadingPerson} onChange={setF('unloadingPerson')} className={`${inpR} w-32`} />
          </div>
        </div>

        {/* Row 2 */}
        <div className="flex items-center gap-3 mb-3 min-w-max">
          <div className="flex items-center gap-1.5">
            <label className={lblR}>* Arrival Date</label>
            <input value={form.arrivalDate} onChange={setF('arrivalDate')} className={`${inpR} w-28`} />
          </div>
          <div className="flex items-center gap-1.5">
            <label className={lblR}>* Arrival Time</label>
            <input value={form.arrivalTime} onChange={setF('arrivalTime')} className={`${inpR} w-24`} />
          </div>
          <div className="flex items-center gap-1.5">
            <label className={lblR}>* Vehicle No</label>
            <input value={form.vehicleNo} onChange={setF('vehicleNo')} className={`${inpR} w-32`} />
          </div>
          <div className="flex items-center gap-1.5 ml-4">
            <label className={lbl}>Entry Type</label>
            <select value={form.entryType} onChange={setF('entryType')} className={`${inp} w-32`}>
              {ENTRY_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* Row 3 */}
        <div className="flex items-center gap-6 min-w-max">
          <div className="flex items-center gap-1.5">
            <label className={lbl}>Seal No.</label>
            <input value={form.sealNo} onChange={setF('sealNo')} className={`${inp} w-20`} />
          </div>
          <button onClick={() => fileRef.current?.click()}
            className="text-[#0b8fd3] text-[13px] hover:underline flex items-center gap-1">
            Upload Documents
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
            </svg>
          </button>
          <input ref={fileRef} type="file" className="hidden"
            onChange={e => e.target.files?.[0] && toast(`File: ${e.target.files[0].name}`)} />
          <div className="ml-8">
            <button onClick={() => toast('Select Memo')}
              className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] font-medium px-10 py-1.5 rounded">
              Select Memo
            </button>
          </div>
        </div>
      </div>

      {/* ── Stats card ────────────────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm px-4 py-3 mb-2 overflow-x-auto">
        <div className="flex items-center gap-8 min-w-max">
          <span className="font-bold text-orange-500">Unloaded LR Count :</span>
          <span className="font-bold text-orange-500">Actual Quantity :</span>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-orange-500 whitespace-nowrap">Received Quantity :</span>
            <input value={receivedQty} onChange={e => setReceivedQty(e.target.value)} className={`${inp} w-20`} />
          </div>
          <span className="font-bold text-orange-500">Excess Qty:</span>
          <span className="font-bold text-orange-500">Total Weight:</span>
        </div>
      </div>

      {/* ── Tabs card ─────────────────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm">
        <div className="flex border-b border-gray-200">
          {[['unloading','Unloading Details'],['excess','Excess()'],['vendor','Vendor Info']].map(([key,label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-4 py-2 text-[13px] font-medium border-r border-gray-200 last:border-r-0 ${
                tab === key ? 'bg-[#0b8fd3] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {tab === 'unloading' && (
          <DetailRow branch={udBranch} setBranch={setUdBranch} lrNo={udLrNo} setLrNo={setUdLrNo}
            material={udMaterial} setMaterial={setUdMaterial} actualQty={udActualQty} setActualQty={setUdActualQty}
            excessQty={udExcessQty} setExcessQty={setUdExcessQty} />
        )}
        {tab === 'excess' && (
          <DetailRow branch={exBranch} setBranch={setExBranch} lrNo={exLrNo} setLrNo={setExLrNo}
            material={exMaterial} setMaterial={setExMaterial} actualQty={exActualQty} setActualQty={setExActualQty}
            excessQty={exExcessQty} setExcessQty={setExExcessQty} />
        )}

        {tab === 'vendor' && (
          <div className="px-4 py-3">
            <div className="flex items-center gap-4 mb-2">
              <div className="flex items-center gap-1.5">
                <label className={lbl}>Vendor Name</label>
                <input value={vendor.vendorName} onChange={setV('vendorName')} className={`${inp} w-32`} />
              </div>
              <div className="flex items-center gap-1.5">
                <label className={lbl}>From</label>
                <input value={vendor.from} onChange={setV('from')} className={`${inp} w-28`} />
              </div>
              <div className="flex items-center gap-1.5">
                <label className={lbl}>To</label>
                <input value={vendor.to} onChange={setV('to')} className={`${inp} w-28`} />
              </div>
            </div>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1.5">
                <label className={lbl}>Freight</label>
                <input value={vendor.freight} onChange={setV('freight')} className={`${inp} w-28`} />
              </div>
              <div className="flex items-center gap-1.5">
                <label className="font-medium text-[#0b8fd3] whitespace-nowrap text-[13px]">Extra Charges</label>
                <input value={vendor.extraCharges} onChange={setV('extraCharges')} className={`${inp} w-28`} />
              </div>
              <div className="flex items-center gap-1.5">
                <label className="font-medium text-[#0b8fd3] whitespace-nowrap text-[13px]">Total</label>
                <input value={vendor.total} onChange={setV('total')} className={`${inp} w-28`} />
              </div>
            </div>
            <div className="font-bold text-[13px] mb-2">EXTRA CHARGES</div>
            <table className="border-collapse text-[13px]">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold w-72">Charge Head</th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold w-40">Amount</th>
                </tr>
              </thead>
              <tbody>
                {VENDOR_CHARGES.map(c => (
                  <tr key={c.name}>
                    <td className={`border border-gray-300 px-4 py-1.5 font-medium ${cc(c.color)}`}>{c.name}</td>
                    <td className="border border-gray-300 px-2 py-1">
                      <input value={charges[c.name]}
                        onChange={e => setCharges(p => ({ ...p, [c.name]: e.target.value }))}
                        className="border border-gray-300 px-2 py-0.5 w-full text-[13px] focus:outline-none focus:border-blue-400" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
