import React, { useState } from 'react';
import toast from 'react-hot-toast';

const SaveIcon    = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>;
const SearchIcon  = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/></svg>;
const RefreshIcon = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>;
const PrintIcon   = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>;
const UploadIcon  = <svg className="w-4 h-4 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M16 12l-4-4m0 0l-4 4m4-4v12"/></svg>;

const todayISO = new Date().toISOString().slice(0, 10);

const PAYMENT_MODES = ['DRIVER RECEIVED', 'BANK', 'CASH'];

/* Additional Charges – left table (default value "0") */
const ADD_CHARGES = [
  { label: 'FREIGHT',                            color: null     },
  { label: 'DOCKET CHARGES',                     color: null     },
  { label: 'FUEL SURCHARGE',                     color: null     },
  { label: 'FOV CHARGES',                        color: 'orange' },
  { label: 'TOPAY CHARGES',                      color: 'teal'   },
  { label: 'HANDLING CHARGES',                   color: null     },
  { label: 'COD / DOD CHARGES',                  color: 'orange' },
  { label: 'OTHER CHARGES',                      color: null     },
  { label: 'ODA CHARGES',                        color: null     },
  { label: 'DOCKET FIX AMOUNT DELIVERY CHARGES', color: 'teal'   },
  { label: 'APPOINTMENT DELIVERY CHARGES',       color: 'teal'   },
  { label: 'DEDICATED COST',                     color: 'teal'   },
  { label: 'RE-ATTEMPT DELIVERY CHARGES',        color: 'teal'   },
];

/* Deduction Charges – right table (empty inputs) */
const DED_CHARGES = [
  { label: '2ND ATTEMPT CHARGES',         split: ['2ND ', 'ATTEMPT CHARGES'] },
  { label: 'APPOINTMENT DELIVERY CHARGES' },
  { label: 'DRIVER FOODING EXPENSE CHARGES' },
  { label: 'DRIVER UNLOADING CHARGES' },
  { label: 'DRIVER-LOADING CHARGES' },
  { label: 'HELPER FOODING EXPENSE CHARGES' },
  { label: 'HELPER UNLOADING CHARGES' },
  { label: 'LOADING CHARGES BY HAMALI' },
  { label: 'OTHER EXPENSE CHARGES' },
  { label: 'RE-ATTEMPT CHARGES' },
  { label: 'THAI BAZAR CHARGES' },
  { label: 'TOLL EXPENSE CHARGES' },
  { label: 'TRIP UNLOADING CHARGES' },
  { label: 'UNLOADING CHARGES BY HAMALI' },
  { label: 'VECHILE BREAKDOWN EXPENSES' },
];

const initAdd = () => Object.fromEntries(ADD_CHARGES.map(c => [c.label, '0']));
const initDed = () => Object.fromEntries(DED_CHARGES.map(c => [c.label, '']));

const INIT_FORM   = { mlDate: todayISO, vehicleNo: '', driverName: '', fromLocation: '', toLocation: '', party: '', remark: '', rate: '', weight: '', referenceNo: '' };
const INIT_PARTY  = { freight: '', additionalCharges: '', advance: '', dieselAmount: '', otherDeduction: '', tdsPercent: '', tdsAmount: '', igst: '', sgst: '', cgst: '', balance: '' };
const INIT_DRIVER = { paymentMode: 'DRIVER RECEIVED', paymentBy: '', trnNoType: '', trnDate: '' };

const addColorClass = c => c === 'orange' ? 'text-orange-500' : c === 'teal' ? 'text-[#0b8fd3]' : 'text-gray-800';

export default function MarketLoadMemo() {
  const [form,       setForm]       = useState(INIT_FORM);
  const [party,      setParty]      = useState(INIT_PARTY);
  const [driver,     setDriver]     = useState(INIT_DRIVER);
  const [addCharges, setAddCharges] = useState(initAdd());
  const [dedCharges, setDedCharges] = useState(initDed());

  const set    = e => { const { name, value } = e.target; setForm(f => ({ ...f, [name]: value })); };
  const setPty = e => { const { name, value } = e.target; setParty(p => ({ ...p, [name]: value })); };
  const setDrv = e => { const { name, value } = e.target; setDriver(d => ({ ...d, [name]: value })); };

  const isDriverReceived = driver.paymentMode === 'DRIVER RECEIVED';

  const handleSave = () => {
    if (!form.vehicleNo.trim())    { toast.error('Vehicle No is required');    return; }
    if (!form.driverName.trim())   { toast.error('Driver Name is required');   return; }
    if (!form.fromLocation.trim()) { toast.error('From Location is required'); return; }
    if (!form.toLocation.trim())   { toast.error('To Location is required');   return; }
    if (!form.party.trim())        { toast.error('Party is required');         return; }
    toast.success('Saved successfully');
  };

  const handleRefresh = () => {
    setForm(INIT_FORM); setParty(INIT_PARTY); setDriver(INIT_DRIVER);
    setAddCharges(initAdd()); setDedCharges(initDed());
  };

  const inp  = 'border border-gray-400 px-2 py-1 text-[13px] focus:outline-none focus:border-blue-500';
  const inpR = 'border border-blue-400 px-2 py-1 text-[13px] focus:outline-none focus:border-blue-600';
  const inpG = 'border border-gray-300 px-2 py-1 text-[13px] bg-gray-100 cursor-not-allowed';
  const lbl  = 'whitespace-nowrap font-medium';
  const lblR = 'whitespace-nowrap font-medium text-red-600';

  return (
    <div className="p-3 bg-[#cfd6de] min-h-screen text-[13px]">

      {/* ── Top bar ──────────────────────────────────────────────── */}
      <div className="flex items-center mb-2">
        <p className="text-red-600 text-[12px] font-medium flex-1">* Mark fields are compulsory</p>
        <h2 className="font-bold text-[15px] tracking-wide" style={{ fontVariant: 'small-caps' }}>
          MarketLoad(Memo)
        </h2>
        <div className="flex-1 flex justify-end gap-1.5">
          <button onClick={handleSave}
            className="flex items-center gap-1.5 bg-[#1565c0] hover:bg-[#0d47a1] text-white text-[12px] font-medium px-3 py-1.5 rounded">
            {SaveIcon} Save
          </button>
          <button onClick={() => toast('Search')}
            className="flex items-center gap-1.5 bg-[#0288d1] hover:bg-[#0277bd] text-white text-[12px] font-medium px-3 py-1.5 rounded">
            {SearchIcon} Search
          </button>
          <button onClick={handleRefresh}
            className="flex items-center gap-1.5 bg-[#546e7a] hover:bg-[#455a64] text-white text-[12px] font-medium px-3 py-1.5 rounded">
            {RefreshIcon} Refersh
          </button>
          <button onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-[#546e7a] hover:bg-[#455a64] text-white text-[12px] font-medium px-3 py-1.5 rounded">
            {PrintIcon} Print
          </button>
        </div>
      </div>

      {/* ── Main form card ────────────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm px-5 py-4 mb-2">

        {/* Row 1: ML No | ML Date | Vehicle No | Driver Name */}
        <div className="flex items-center gap-4 flex-wrap mb-3">
          <div className="flex items-center gap-2">
            <label className={lblR}>* ML No</label>
            <input disabled value="1" className={`${inpG} w-28`} />
          </div>
          <div className="flex items-center gap-2">
            <label className={lblR}>* ML Date</label>
            <input type="date" name="mlDate" value={form.mlDate} onChange={set}
              className={`${inp} w-36`} />
          </div>
          <div className="flex items-center gap-2">
            <label className={lblR}>* Vehicle No</label>
            <input name="vehicleNo" value={form.vehicleNo} onChange={set}
              className={`${inpR} w-40`} />
          </div>
          <div className="flex items-center gap-2">
            <label className={lblR}>* Driver Name</label>
            <input name="driverName" value={form.driverName} onChange={set}
              className={`${inp} w-40`} />
          </div>
        </div>

        {/* Row 2: From Location | To Location | Party | Remark */}
        <div className="flex items-center gap-4 flex-wrap mb-3">
          <div className="flex items-center gap-2">
            <label className={lblR}>* From Location</label>
            <input name="fromLocation" value={form.fromLocation} onChange={set}
              className={`${inp} w-36`} />
          </div>
          <div className="flex items-center gap-2">
            <label className={lblR}>* To Location</label>
            <input name="toLocation" value={form.toLocation} onChange={set}
              className={`${inp} w-36`} />
          </div>
          <div className="flex items-center gap-2">
            <label className={lblR}>* Party</label>
            <input name="party" value={form.party} onChange={set}
              className={`${inp} w-36`} />
          </div>
          <div className="flex items-center gap-2">
            <label className={lbl}>Remark</label>
            <input name="remark" value={form.remark} onChange={set}
              className={`${inp} w-40`} />
          </div>
        </div>

        {/* Row 3: Rate | Weight | Reference No */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className={lbl}>Rate</label>
            <input name="rate" value={form.rate} onChange={set}
              className={`${inp} w-36`} />
          </div>
          <div className="flex items-center gap-2">
            <label className={lbl}>Weight</label>
            <input name="weight" value={form.weight} onChange={set}
              className={`${inp} w-36`} />
          </div>
          <div className="flex items-center gap-2">
            <label className={lbl}>Reference No</label>
            <input name="referenceNo" value={form.referenceNo} onChange={set}
              className={`${inp} w-36`} />
          </div>
        </div>
      </div>

      {/* ── Party Amount Details ──────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm mb-2">
        <div className="flex items-center justify-between px-5 py-2.5 border-b border-gray-200">
          <span className="font-bold text-[14px]">Party Amount Details</span>
          <button type="button"
            className="text-blue-600 underline text-[13px] hover:text-blue-800 flex items-center gap-1">
            Upload Documents {UploadIcon}
          </button>
        </div>
        <div className="px-5 py-4">

          {/* Row 1: stacked-label layout */}
          <div className="flex items-end gap-5 flex-wrap mb-3">
            {/* Freight */}
            <div className="flex flex-col gap-0.5">
              <div><span className="text-red-600 text-[12px]">*</span></div>
              <label className={lbl}>Freight</label>
              <input name="freight" value={party.freight} onChange={setPty}
                className={`${inpR} w-32`} />
            </div>
            {/* Additional Charges */}
            <div className="flex flex-col gap-0.5">
              <div className="text-[12px] invisible">*</div>
              <label className={lbl}>Additional Charges</label>
              <input name="additionalCharges" value={party.additionalCharges} onChange={setPty}
                className={`${inp} w-40`} />
            </div>
            {/* Advance */}
            <div className="flex flex-col gap-0.5">
              <div className="text-[12px] invisible">*</div>
              <label className={lbl}>Advance</label>
              <input name="advance" value={party.advance} onChange={setPty}
                className={`${inp} w-32`} />
            </div>
            {/* Diesel Amount */}
            <div className="flex flex-col gap-0.5">
              <div className="text-[12px] invisible">*</div>
              <label className={lbl}>Diesel Amount</label>
              <input name="dieselAmount" value={party.dieselAmount} onChange={setPty}
                className={`${inp} w-32`} />
            </div>
            {/* Other Deduction */}
            <div className="flex flex-col gap-0.5">
              <div className="text-[12px] invisible">*</div>
              <label className={lbl}>Other Deduction</label>
              <input name="otherDeduction" value={party.otherDeduction} onChange={setPty}
                className={`${inp} w-32`} />
            </div>
          </div>

          {/* Row 2: TDS(%) | [amt] IGST | SGST | CGST | Balance */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <label className={lbl}>TDS(%)</label>
              <input name="tdsPercent" value={party.tdsPercent} onChange={setPty}
                className={`${inp} w-14`} />
              <input name="tdsAmount" value={party.tdsAmount} onChange={setPty}
                className={`${inp} w-24`} />
              <label className={lbl}>IGST</label>
              <input name="igst" value={party.igst} onChange={setPty}
                className={`${inp} w-24`} />
            </div>
            <div className="flex items-center gap-1.5">
              <label className={lbl}>SGST</label>
              <input name="sgst" value={party.sgst} onChange={setPty}
                className={`${inp} w-24`} />
            </div>
            <div className="flex items-center gap-1.5">
              <label className={lbl}>CGST</label>
              <input name="cgst" value={party.cgst} onChange={setPty}
                className={`${inp} w-24`} />
            </div>
            <div className="flex items-center gap-1.5">
              <label className={lbl}>Balance</label>
              <input name="balance" value={party.balance} onChange={setPty}
                className={`${inp} w-28`} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Driver Paid Details + Charges (unified card) ─────────── */}
      <div className="bg-white rounded shadow-sm overflow-hidden">

        {/* Driver Paid Details header */}
        <div className="px-5 py-2.5 border-b border-gray-200">
          <span className="font-bold text-[14px]">Driver Paid Details</span>
        </div>

        {/* Payment Mode row */}
        <div className="px-5 py-3 flex items-center gap-4 flex-wrap border-b border-gray-300">
          <div className="flex items-center gap-2">
            <label className={lblR}>* Payment Mode</label>
            <select name="paymentMode" value={driver.paymentMode} onChange={setDrv}
              className={`${inp} w-40`}>
              {PAYMENT_MODES.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className={lbl}>Payment By</label>
            <select name="paymentBy" value={driver.paymentBy} onChange={setDrv}
              disabled={isDriverReceived}
              className={isDriverReceived ? `${inpG} w-36` : `${inp} w-36`}>
              <option value="">--Select--</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="whitespace-nowrap font-medium text-[#0b8fd3]">TRN No/Type</label>
            <input name="trnNoType" value={driver.trnNoType} onChange={setDrv}
              disabled={isDriverReceived}
              className={isDriverReceived ? `${inpG} w-36` : `${inp} w-36`} />
          </div>
          <div className="flex items-center gap-2">
            <label className="whitespace-nowrap font-medium text-orange-500">TRN Date</label>
            <input name="trnDate" value={driver.trnDate} onChange={setDrv}
              disabled={isDriverReceived}
              className={isDriverReceived ? `${inpG} w-36` : `${inp} w-36`} />
          </div>
        </div>

        {/* Two-column area inside the same card */}
        <div className="flex items-start divide-x divide-gray-200">

          {/* LEFT: Additional Charges */}
          <div className="flex-1 min-w-0">
            <div className="px-4 py-2.5 border-b border-gray-200">
              <span className="font-bold text-[14px]">Additional Charges</span>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: '340px' }}>
              <table className="w-full border-collapse text-[13px]">
                <thead className="sticky top-0">
                  <tr style={{ backgroundColor: '#0b8fd3', color: '#fff' }}>
                    <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8]">Charge Head</th>
                    <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8] w-28">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {ADD_CHARGES.map(({ label, color }, i) => (
                    <tr key={label} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className={`px-3 py-1.5 border-b border-gray-100 font-medium ${addColorClass(color)}`}>
                        {label}
                      </td>
                      <td className="px-2 py-1 border-b border-gray-100">
                        <input
                          value={addCharges[label]}
                          onChange={e => setAddCharges(c => ({ ...c, [label]: e.target.value }))}
                          className="border border-gray-300 px-1.5 py-0.5 w-full text-[13px] focus:outline-none focus:border-blue-400" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* RIGHT: Deduction Charges */}
          <div className="flex-1 min-w-0">
            <div className="px-4 py-2.5 border-b border-gray-200">
              <span className="font-bold text-[14px]">Dedution Charges</span>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: '340px' }}>
              <table className="w-full border-collapse text-[13px]">
                <thead className="sticky top-0">
                  <tr style={{ backgroundColor: '#0b8fd3', color: '#fff' }}>
                    <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8]">Charge Head</th>
                    <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8] w-28">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {DED_CHARGES.map(({ label, split }, i) => (
                    <tr key={label} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-3 py-1.5 border-b border-gray-100 text-gray-800">
                        {split ? (
                          <>
                            <span>{split[0]}</span>
                            <span className="text-orange-500">{split[1]}</span>
                          </>
                        ) : label}
                      </td>
                      <td className="px-2 py-1 border-b border-gray-100">
                        <input
                          value={dedCharges[label]}
                          onChange={e => setDedCharges(c => ({ ...c, [label]: e.target.value }))}
                          className="border border-gray-300 px-1.5 py-0.5 w-full text-[13px] focus:outline-none focus:border-blue-400" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
