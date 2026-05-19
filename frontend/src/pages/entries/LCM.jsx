import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

const pad = n => String(n).padStart(2, '0');
const getToday = () => { const d = new Date(); return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`; };
const getTime  = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; };

const SaveIcon    = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>;
const SearchIcon  = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/></svg>;
const RefreshIcon = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>;
const PrintIcon   = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>;
const UploadIcon  = <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>;

const LOAD_TYPES = ['--Select--', 'LCV', 'HCV', 'LCV-L'];

const EXTRA_CHARGES = [
  '2ND ATTEMPT CHARGES',
  'APPOINTMENT DELIVERY CHARGES',
  'DRIVER FOODING EXPENSE CHARGES',
  'DRIVER UNLOADING CHARGES',
  'DRIVER-LOADING CHARGES',
  'HELPER FOODING EXPENSE CHARGES',
  'HELPER UNLOADING CHARGES',
  'LOADING CHARGES BY HAMALI',
  'OTHER EXPENSE CHARGES',
  'RE-ATTEMPT CHARGES',
  'THAI BAZAR CHARGES',
  'TOLL EXPENSE CHARGES',
  'TRIP UNLOADING CHARGES',
  'UNLOADING CHARGES BY HAMALI',
  'VECHILE BREAKDOWN EXPENSES',
];

const TABLE_COLS = [
  'Branch','LR No','LR Date','Consignor','Consignee','Pay Type',
  'Pick-Up Location','KM','Memo Freight','Weight','Qty','Balance Qty','Dispatch Qty','Action',
];

const lblR = 'whitespace-nowrap text-red-600 font-medium text-[13px]';
const lbl  = 'whitespace-nowrap font-medium text-[13px]';
const inp  = 'border border-gray-300 px-2 py-1 text-[13px] focus:outline-none focus:border-blue-400';
const inpR = 'border border-blue-400 px-2 py-1 text-[13px] focus:outline-none focus:border-blue-500';
const topBtn = v => `flex items-center gap-1.5 text-white text-[12px] font-medium px-3 py-1.5 rounded ${
  v === 'save'   ? 'bg-[#1565c0] hover:bg-[#0d47a1]' :
  v === 'search' ? 'bg-[#0288d1] hover:bg-[#0277bd]' :
                   'bg-[#546e7a] hover:bg-[#455a64]'
}`;

export default function LCM() {
  const [date,          setDate]          = useState(getToday());
  const [time,          setTime]          = useState(getTime());
  const [pickupLoc,     setPickupLoc]     = useState('');
  const [vehicleNo,     setVehicleNo]     = useState('');
  const [loadType,      setLoadType]      = useState('--Select--');
  const [vendor,        setVendor]        = useState('');
  const [driverCode,    setDriverCode]    = useState('');
  const [driverName,    setDriverName]    = useState('');
  const [driverNo,      setDriverNo]      = useState('');
  const [eWayBillNo,    setEWayBillNo]    = useState('');
  const [remarks,       setRemarks]       = useState('');
  const [totalKm,       setTotalKm]       = useState('');
  const [supervisorName,setSupervisorName]= useState('');
  const [updatePartB,   setUpdatePartB]   = useState(true);
  const [dispQty,       setDispQty]       = useState('');
  const [enterLrNo,     setEnterLrNo]     = useState('');
  const [lrRows,        setLrRows]        = useState([]);
  // Payment fields
  const [basicFreight,  setBasicFreight]  = useState('0');
  const [extraChargesAmt,setExtraChargesAmt] = useState('0');
  const [tdsPct,        setTdsPct]        = useState('');
  const [tdsAmount,     setTdsAmount]     = useState('');
  const [cashAdvance,   setCashAdvance]   = useState('0');
  const [bankAdvance,   setBankAdvance]   = useState('0');
  const [bankAccount,   setBankAccount]   = useState('--Select--');
  const [bankCharges,   setBankCharges]   = useState('');
  const [trnNoType,     setTrnNoType]     = useState('');
  const [trnDate,       setTrnDate]       = useState('');
  const [dieselReceiptNo,setDieselReceiptNo]= useState('');
  const [dieselAgent,   setDieselAgent]   = useState('');
  const [dieselInLtr,   setDieselInLtr]   = useState('');
  const [dieselRate,    setDieselRate]    = useState('');
  const [dieselAmount,  setDieselAmount]  = useState('0');
  const [balance,       setBalance]       = useState('0');
  // Extra charges
  const [extraVals,     setExtraVals]     = useState(() => Object.fromEntries(EXTRA_CHARGES.map(k => [k, ''])));

  const fileRef = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setTime(getTime()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleRefresh = () => {
    setDate(getToday()); setPickupLoc(''); setVehicleNo(''); setLoadType('--Select--');
    setVendor(''); setDriverCode(''); setDriverName(''); setDriverNo('');
    setEWayBillNo(''); setRemarks(''); setTotalKm(''); setSupervisorName('');
    setUpdatePartB(true); setDispQty(''); setEnterLrNo(''); setLrRows([]);
    setBasicFreight('0'); setExtraChargesAmt('0'); setTdsPct(''); setTdsAmount('');
    setCashAdvance('0'); setBankAdvance('0'); setBankAccount('--Select--');
    setBankCharges(''); setTrnNoType(''); setTrnDate(''); setDieselReceiptNo('');
    setDieselAgent(''); setDieselInLtr(''); setDieselRate(''); setDieselAmount('0');
    setBalance('0'); setExtraVals(Object.fromEntries(EXTRA_CHARGES.map(k => [k, ''])));
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="p-3 min-h-screen text-[13px]" style={{ backgroundColor: '#cfd6de' }}>

      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <div className="flex items-center mb-2">
        <p className="text-red-600 text-[12px] font-medium flex-1">* Mark fields are compulsory</p>
        <h2 className="font-bold text-[15px] tracking-wide" style={{ fontVariant: 'small-caps' }}>LCM</h2>
        <div className="flex-1 flex justify-end gap-1.5">
          <button onClick={() => toast.success('Saved')} className={topBtn('save')}>{SaveIcon} Save</button>
          <button onClick={() => toast('Search')}        className={topBtn('search')}>{SearchIcon} Search</button>
          <button onClick={handleRefresh}                className={topBtn('gray')}>{RefreshIcon} Refersh</button>
          <button onClick={() => toast('Printing...')}   className={topBtn('gray')}>{PrintIcon} Print</button>
        </div>
      </div>

      {/* ── Main form card ──────────────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm px-4 py-3 mb-2 overflow-x-auto">
        <div className="min-w-max">

          {/* Row 1: LCM NO | Date + Time | PickUp Location | Vehicle No. */}
          <div className="flex items-center gap-5 mb-3">
            <div className="flex items-center gap-2">
              <label className={lblR}>* LCM NO</label>
              <input value="1" readOnly
                className="border border-gray-300 bg-gray-100 px-2 py-1 w-28 text-[13px] cursor-not-allowed" />
            </div>
            <div className="flex items-center gap-2">
              <label className={lblR}>* Date</label>
              <input value={date} onChange={e => setDate(e.target.value)}
                className={`${inpR} w-28`} />
              <input value={time} readOnly
                className="border border-gray-300 bg-gray-50 px-2 py-1 w-20 text-[13px] text-center cursor-not-allowed" />
            </div>
            <div className="flex items-center gap-2">
              <label className={lblR}>* PickUp Location</label>
              <input value={pickupLoc} onChange={e => setPickupLoc(e.target.value)}
                className={`${inpR} w-44`} />
            </div>
            <div className="flex items-center gap-2">
              <label className={lblR}>* Vehicle No.</label>
              <input value={vehicleNo} onChange={e => setVehicleNo(e.target.value)}
                className={`${inpR} w-36`} />
            </div>
          </div>

          {/* Row 2: Load Type | Vendor | Driver (Code + Name) | Driver No. */}
          <div className="flex items-center gap-5 mb-3">
            <div className="flex items-center gap-2">
              <label className={lblR}>* Load Type</label>
              <select value={loadType} onChange={e => setLoadType(e.target.value)}
                className={`${inp} w-32`}>
                {LOAD_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className={lblR}>* Vendor</label>
              <input value={vendor} onChange={e => setVendor(e.target.value)}
                className={`${inpR} w-40`} />
            </div>
            <div className="flex items-center gap-2">
              <label className={lblR}>* Driver</label>
              <button onClick={() => toast('Driver Code')}
                className="border border-gray-300 bg-gray-50 px-3 py-1 text-[13px] hover:bg-gray-100">
                Code
              </button>
              <input value={driverName} onChange={e => setDriverName(e.target.value)}
                className={`${inpR} w-40`} />
            </div>
            <div className="flex items-center gap-2">
              <label className={lbl}>Driver No.</label>
              <input value={driverNo} onChange={e => setDriverNo(e.target.value)}
                className={`${inp} w-36`} />
            </div>
          </div>

          {/* Row 3: Consolidated E-Way BillNo. | Remarks | Total KM */}
          <div className="flex items-center gap-5 mb-3">
            <div className="flex items-center gap-2">
              <label className={lbl} style={{ maxWidth: 140 }}>Consolidated E-Way BillNo.</label>
              <input value={eWayBillNo} onChange={e => setEWayBillNo(e.target.value)}
                className={`${inp} w-32`} />
            </div>
            <div className="flex items-center gap-2">
              <label className={lblR}>* Remarks</label>
              <input value={remarks} onChange={e => setRemarks(e.target.value)}
                className={`${inpR} w-44`} />
            </div>
            <div className="flex items-center gap-2">
              <label className={lbl}>Total KM</label>
              <input value={totalKm} onChange={e => setTotalKm(e.target.value)}
                className={`${inp} w-36`} />
            </div>
          </div>

          {/* Row 4: Supervisor Name */}
          <div className="flex items-center gap-5 mb-3">
            <div className="flex items-center gap-2">
              <label className={lbl}>Supervisor Name</label>
              <input value={supervisorName} onChange={e => setSupervisorName(e.target.value)}
                className={`${inp} w-36`} />
            </div>
          </div>

          {/* Row 5: Update Part-B | Verify Eway Bill | Download CEWB Print | Upload Documents */}
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-1.5 cursor-pointer text-[13px]">
              <input type="checkbox" checked={updatePartB} onChange={e => setUpdatePartB(e.target.checked)} />
              Update Part-B
            </label>
            <button onClick={() => toast('Verifying Eway Bill…')}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-[13px]">
              <span className="text-lg leading-none">⊕</span> Verify Eway Bill
            </button>
            <button onClick={() => toast('Downloading CEWB Print…')}
              className="text-blue-600 underline hover:text-blue-800 text-[13px]">
              Download CEWB Print
            </button>
            <button onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-[13px] ml-auto">
              Upload Documents {UploadIcon}
            </button>
            <input ref={fileRef} type="file" multiple className="hidden" />
          </div>
        </div>
      </div>

      {/* ── Stats + LR bar ──────────────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm px-3 py-2 mb-2 overflow-x-auto">
        <div className="flex items-center gap-0 min-w-max text-[13px]">
          <span className="font-bold">Total LR Count :&nbsp;</span><span className="mr-3"></span>
          <span className="border-l border-gray-400 pl-3 font-bold">TBB :&nbsp;</span><span className="mr-3"></span>
          <span className="border-l border-gray-400 pl-3 font-bold">Paid :&nbsp;</span><span className="mr-3"></span>
          <span className="border-l border-gray-400 pl-3 font-bold">To Pay :&nbsp;</span><span className="mr-3"></span>
          <span className="border-l border-gray-400 pl-3 font-bold">Total :&nbsp;</span><span className="mr-3">0</span>
          <span className="border-l border-gray-400 pl-3 font-bold">Act Wt :&nbsp;</span><span className="mr-3"></span>
          <span className="border-l border-gray-400 pl-3 font-bold">Charge Wt :&nbsp;</span><span className="mr-3"></span>
          <span className="border-l border-gray-400 pl-3 font-bold">Total Qty :&nbsp;</span><span className="mr-3"></span>
          <span className="border-l border-gray-400 pl-3 font-bold">Disp Qty :&nbsp;</span>
          <input value={dispQty} onChange={e => setDispQty(e.target.value)}
            className="border border-gray-300 px-2 py-0.5 w-20 text-[13px] focus:outline-none mr-3" />
          <span className="font-bold">Enter LR No&nbsp;</span>
          <input value={enterLrNo} onChange={e => setEnterLrNo(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && enterLrNo.trim()) {
                setLrRows(r => [...r, { lrNo: enterLrNo.trim(), lrDate: getToday() }]);
                setEnterLrNo('');
              }
            }}
            className="border border-gray-300 px-2 py-0.5 w-28 text-[13px] focus:outline-none mr-2" />
          <button onClick={() => toast('Select LR')}
            className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] font-medium px-4 py-1 rounded">
            Select LR
          </button>
        </div>
      </div>

      {/* ── LR Table ────────────────────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm mb-2 overflow-x-auto">
        <table className="w-full border-collapse text-[13px] min-w-max">
          <thead>
            <tr style={{ backgroundColor: '#0b8fd3', color: '#fff' }}>
              {TABLE_COLS.map(col => (
                <th key={col} className="px-3 py-2 text-left font-medium border border-[#0a7ab8] whitespace-nowrap">
                  {col}{col !== 'Branch' && col !== 'Action' ? <span className="ml-1 opacity-70 text-[10px]">⇅</span> : col === 'Action' ? <span className="ml-1 opacity-70 text-[10px]">⇅</span> : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lrRows.length === 0 ? (
              <tr>
                <td colSpan={TABLE_COLS.length} className="text-center py-5 text-gray-500">
                  No data available in table
                </td>
              </tr>
            ) : (
              lrRows.map((r, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-3 py-1.5 border-b border-gray-200"></td>
                  <td className="px-3 py-1.5 border-b border-gray-200">{r.lrNo}</td>
                  <td className="px-3 py-1.5 border-b border-gray-200">{r.lrDate}</td>
                  {Array(11).fill('').map((_, j) => (
                    <td key={j} className="px-3 py-1.5 border-b border-gray-200"></td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Bottom: Payment fields + Extra Charges ──────────────────── */}
      <div className="flex gap-2">

        {/* Left: payment fields */}
        <div className="bg-white rounded shadow-sm px-4 py-3 flex-1 overflow-x-auto">
          <div className="min-w-max">

            {/* Row 1: Basic Freight | Extra Charges | TDS(%) | TDS Amount | Cash Advance */}
            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-1.5">
                <label className="text-[#0b8fd3] font-medium text-[13px]">Basic Freight</label>
                <input value={basicFreight} onChange={e => setBasicFreight(e.target.value)}
                  className={`${inp} w-20`} />
                <button className="text-gray-600 hover:text-[#0b8fd3] text-lg leading-none">⊕</button>
              </div>
              <div className="flex items-center gap-1.5">
                <label className="text-[#0b8fd3] font-medium text-[13px]">Extra Charges</label>
                <input value={extraChargesAmt} onChange={e => setExtraChargesAmt(e.target.value)}
                  className={`${inp} w-20`} />
              </div>
              <div className="flex items-center gap-1.5">
                <label className={lbl}>TDS(%)</label>
                <input value={tdsPct} onChange={e => setTdsPct(e.target.value)}
                  className={`${inp} w-20`} />
              </div>
              <div className="flex items-center gap-1.5">
                <label className={lbl}>TDS Amount</label>
                <input value={tdsAmount} onChange={e => setTdsAmount(e.target.value)}
                  className={`${inp} w-24`} />
              </div>
              <div className="flex items-center gap-1.5">
                <label className="text-[#c0392b] font-medium text-[13px]">Cash Advance</label>
                <input value={cashAdvance} onChange={e => setCashAdvance(e.target.value)}
                  className={`${inp} w-20`} />
              </div>
            </div>

            {/* Row 2: Bank Advance | Bank Account | Bank Charges | TRN No/Type | TRN Date */}
            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-1.5">
                <label className="text-[#0b8fd3] font-medium text-[13px]">Bank Advance</label>
                <input value={bankAdvance} onChange={e => setBankAdvance(e.target.value)}
                  className={`${inp} w-20`} />
              </div>
              <div className="flex items-center gap-1.5">
                <label className={lbl}>Bank Account</label>
                <select value={bankAccount} onChange={e => setBankAccount(e.target.value)}
                  className={`${inp} w-32`}>
                  <option>--Select--</option>
                </select>
              </div>
              <div className="flex items-center gap-1.5">
                <label className={lbl}>Bank Charges</label>
                <input value={bankCharges} onChange={e => setBankCharges(e.target.value)}
                  className={`${inp} w-24`} />
              </div>
              <div className="flex items-center gap-1.5">
                <label className={lbl}>TRN No/Type</label>
                <input value={trnNoType} onChange={e => setTrnNoType(e.target.value)}
                  className={`${inp} w-24`} />
              </div>
              <div className="flex items-center gap-1.5">
                <label className={lbl}>TRN Date</label>
                <input value={trnDate} onChange={e => setTrnDate(e.target.value)}
                  className={`${inp} w-24`} />
              </div>
            </div>

            {/* Row 3: Diesel receipt No | Diesel Agent | Diesel In LTR + Rate | DieselAmount | Balance */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <label className="text-[#c0392b] font-medium text-[13px]">Diesel receipt No</label>
                <input value={dieselReceiptNo} onChange={e => setDieselReceiptNo(e.target.value)}
                  className={`${inp} w-24`} />
              </div>
              <div className="flex items-center gap-1.5">
                <label className="text-[#c0392b] font-medium text-[13px]">Diesel Agent</label>
                <input value={dieselAgent} onChange={e => setDieselAgent(e.target.value)}
                  className={`${inp} w-24`} />
              </div>
              <div className="flex items-center gap-1.5">
                <label className="text-[#c0392b] font-medium text-[13px]">Diesel In LTR</label>
                <input value={dieselInLtr} onChange={e => setDieselInLtr(e.target.value)}
                  className={`${inp} w-14`} />
                <span className="text-[13px] font-medium">Rate</span>
                <input value={dieselRate} onChange={e => setDieselRate(e.target.value)}
                  className={`${inp} w-14`} />
              </div>
              <div className="flex items-center gap-1.5">
                <label className={lbl}>DieselAmount</label>
                <input value={dieselAmount} onChange={e => setDieselAmount(e.target.value)}
                  className={`${inp} w-20`} />
              </div>
              <div className="flex items-center gap-1.5">
                <label className={lbl}>Balance</label>
                <input value={balance} onChange={e => setBalance(e.target.value)}
                  className={`${inp} w-20`} />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Extra Charges panel */}
        <div className="bg-white rounded shadow-sm w-52 flex-shrink-0 overflow-hidden">
          <div style={{ backgroundColor: '#0b8fd3' }}
            className="flex text-white text-[12px] font-bold">
            <div className="flex-1 px-2 py-1.5">Charge Head</div>
            <div className="w-20 px-2 py-1.5 text-right">Amount</div>
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: 180 }}>
            {EXTRA_CHARGES.map(charge => (
              <div key={charge}
                className="flex items-center border-b border-gray-100 px-2 py-1 gap-2">
                <span className="text-[11px] font-medium text-gray-700 flex-1 leading-tight">{charge}</span>
                <input
                  value={extraVals[charge]}
                  onChange={e => setExtraVals(v => ({ ...v, [charge]: e.target.value }))}
                  className="border border-gray-300 px-1 py-0.5 text-[12px] w-16 focus:outline-none focus:border-blue-400 text-right"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
