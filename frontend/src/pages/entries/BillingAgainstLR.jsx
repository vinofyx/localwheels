import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';

const pad = n => String(n).padStart(2, '0');
const getToday = () => { const d = new Date(); return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`; };

const SaveIcon    = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>;
const SearchIcon  = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/></svg>;
const RefreshIcon = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>;
const PrintIcon   = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>;
const UploadIcon  = <svg className="w-4 h-4 inline ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>;

const GST_OPTIONS    = ['Not Applicable(N/A)', 'BillingParty', 'Transporter'];
const BILLING_TYPES  = ['FREIGHT', 'OTHERS', 'FREIGHT+OTHER'];
const UNIT_OPTIONS   = ['KG', 'NOS', 'TON'];
const CHARGE_HEADS   = ['--Select--', 'Freight', 'Loading', 'Unloading', 'Detention', 'Other'];

const TABLE_COLS = [
  'Charge Head','GST Applicable','Pkgs','Unit','Rate',
  'Charge Amount','CGST %','CGST Amount','SGST %','SGST Amount',
  'IGST %','IGST Amount','Remark','Edit',
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

export default function BillingAgainstLR() {
  const [billingParty,  setBillingParty]  = useState('');
  const [billingType,   setBillingType]   = useState('FREIGHT+OTHER');
  const [gstLiableTo,   setGstLiableTo]   = useState('Not Applicable(N/A)');
  const [poNo,          setPoNo]          = useState('');
  const [manually,      setManually]      = useState(false);
  const [billNo,        setBillNo]        = useState('15');
  const [billDate,      setBillDate]      = useState(getToday());
  const [extraCharges,  setExtraCharges]  = useState('');
  const [other,         setOther]         = useState('');
  const [total,         setTotal]         = useState('');
  const [cgst,          setCgst]          = useState('');
  const [sgst,          setSgst]          = useState('');
  const [igst,          setIgst]          = useState('');
  const [roundUp,       setRoundUp]       = useState('');
  const [billAmount,    setBillAmount]    = useState('');
  const [remarks,       setRemarks]       = useState('');

  // Charge Head row
  const [chargeHead,    setChargeHead]    = useState('--Select--');
  const [pkg,           setPkg]           = useState('');
  const [unit,          setUnit]          = useState('KG');
  const [rate,          setRate]          = useState('');
  const [chargeAmt,     setChargeAmt]     = useState('');
  const [cgstPct,       setCgstPct]       = useState('');
  const [cgstAmt,       setCgstAmt]       = useState('');
  const [sgstPct,       setSgstPct]       = useState('');
  const [sgstAmt,       setSgstAmt]       = useState('');
  const [igstPct,       setIgstPct]       = useState('');
  const [igstAmt,       setIgstAmt]       = useState('');
  const [remark,        setRemark]        = useState('');
  const [chargeRows,    setChargeRows]    = useState([]);
  const [tableSearch,   setTableSearch]   = useState('');
  const fileRef = useRef(null);

  const handleRefresh = () => {
    setBillingParty(''); setBillingType('FREIGHT+OTHER'); setGstLiableTo('Not Applicable(N/A)');
    setPoNo(''); setManually(false); setBillNo('15'); setBillDate(getToday());
    setExtraCharges(''); setOther(''); setTotal(''); setCgst(''); setSgst('');
    setIgst(''); setRoundUp(''); setBillAmount(''); setRemarks('');
    setChargeHead('--Select--'); setPkg(''); setUnit('KG'); setRate('');
    setChargeAmt(''); setCgstPct(''); setCgstAmt(''); setSgstPct(''); setSgstAmt('');
    setIgstPct(''); setIgstAmt(''); setRemark(''); setChargeRows([]); setTableSearch('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleAdd = () => {
    if (chargeHead === '--Select--') { toast.error('Select a Charge Head'); return; }
    setChargeRows(r => [...r, { chargeHead, pkg, unit, rate, chargeAmt, cgstPct, cgstAmt, sgstPct, sgstAmt, igstPct, igstAmt, remark }]);
    setPkg(''); setRate(''); setChargeAmt(''); setCgstPct(''); setCgstAmt('');
    setSgstPct(''); setSgstAmt(''); setIgstPct(''); setIgstAmt(''); setRemark('');
    toast.success('Row added');
  };

  const filteredRows = chargeRows.filter(r =>
    Object.values(r).some(v => String(v).toLowerCase().includes(tableSearch.toLowerCase()))
  );

  return (
    <div className="p-3 min-h-screen text-[13px]" style={{ backgroundColor: '#cfd6de' }}>

      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <div className="flex items-center mb-2">
        <p className="text-red-600 text-[12px] font-medium flex-1">* Mark fields are compulsory</p>
        <h2 className="font-bold text-[15px] tracking-wide" style={{ fontVariant: 'small-caps' }}>
          Billing(against LR)
        </h2>
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

          {/* Row 1: Billing Party | Billing Type | GST Liable To | Po No. */}
          <div className="flex items-center gap-6 mb-3">
            <div className="flex items-center gap-2">
              <label className={lblR}>* Billing Party</label>
              <input value={billingParty} onChange={e => setBillingParty(e.target.value)}
                className={`${inpR} w-48`} />
            </div>
            <div className="flex items-center gap-2">
              <label className={lbl}>Billing Type</label>
              <select value={billingType} onChange={e => setBillingType(e.target.value)}
                className={`${inp} w-40`}>
                {BILLING_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className={lbl}>GST Liable To</label>
              <select value={gstLiableTo} onChange={e => setGstLiableTo(e.target.value)}
                className={`${inp} w-44`}>
                {GST_OPTIONS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className={lbl}>Po No.</label>
              <input value={poNo} onChange={e => setPoNo(e.target.value)}
                className={`${inp} w-36`} />
            </div>
          </div>

          {/* Row 2: Manually Bill No | Bill Date | Extra Charges | Other */}
          <div className="flex items-center gap-6 mb-3">
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 cursor-pointer text-[13px]">
                <input type="checkbox" checked={manually} onChange={e => setManually(e.target.checked)} />
                <span className="font-medium">Manually-</span>
              </label>
              <label className={lblR}>* Bill No.</label>
              <input value={billNo} onChange={e => setBillNo(e.target.value)}
                readOnly={!manually}
                className={`${manually ? inpR : 'border border-gray-300 bg-gray-100 cursor-not-allowed'} w-24 px-2 py-1 text-[13px]`} />
            </div>
            <div className="flex items-center gap-2">
              <label className={lblR}>* Bill Date</label>
              <input value={billDate} onChange={e => setBillDate(e.target.value)}
                className={`${inpR} w-32`} />
            </div>
            <div className="flex items-center gap-2">
              <label className={lbl}>Extra Charges</label>
              <input value={extraCharges} onChange={e => setExtraCharges(e.target.value)}
                className={`${inp} w-32`} />
            </div>
            <div className="flex items-center gap-2">
              <label className={lbl}>Other</label>
              <input value={other} onChange={e => setOther(e.target.value)}
                className={`${inp} w-32`} />
            </div>
          </div>

          {/* Row 3: Total | CGST | SGST */}
          <div className="flex items-center gap-6 mb-3">
            <div className="flex items-center gap-2">
              <label className={lbl}>Total</label>
              <input value={total} onChange={e => setTotal(e.target.value)} className={`${inp} w-36`} />
            </div>
            <div className="flex items-center gap-2">
              <label className={lbl}>CGST</label>
              <input value={cgst} onChange={e => setCgst(e.target.value)} className={`${inp} w-36`} />
            </div>
            <div className="flex items-center gap-2">
              <label className={lbl}>SGST</label>
              <input value={sgst} onChange={e => setSgst(e.target.value)} className={`${inp} w-36`} />
            </div>
          </div>

          {/* Row 4: IGST | Round Up | Bill Amount */}
          <div className="flex items-center gap-6 mb-3">
            <div className="flex items-center gap-2">
              <label className={lbl}>IGST</label>
              <input value={igst} onChange={e => setIgst(e.target.value)} className={`${inp} w-36`} />
            </div>
            <div className="flex items-center gap-2">
              <label className={lbl}>Round Up(+/-)</label>
              <input value={roundUp} onChange={e => setRoundUp(e.target.value)} className={`${inp} w-36`} />
            </div>
            <div className="flex items-center gap-2">
              <label className={lbl}>Bill Amount</label>
              <input value={billAmount} onChange={e => setBillAmount(e.target.value)} className={`${inp} w-36`} />
            </div>
          </div>

          {/* Row 5: Remarks | Upload Documents */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 flex-1">
              <label className={lblR}>* Remarks</label>
              <input value={remarks} onChange={e => setRemarks(e.target.value)}
                className={`${inpR} flex-1`} style={{ minWidth: '400px' }} />
            </div>
            <button onClick={() => fileRef.current?.click()}
              className="text-blue-600 hover:text-blue-800 text-[13px] font-medium whitespace-nowrap ml-auto">
              Upload Documents {UploadIcon}
            </button>
            <input ref={fileRef} type="file" multiple className="hidden" />
          </div>
        </div>
      </div>

      {/* ── Charge Head card ────────────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm px-4 py-3 mb-2 overflow-x-auto">
        <div className="font-bold text-[14px] mb-2">Charge Head</div>
        <select value={chargeHead} onChange={e => setChargeHead(e.target.value)}
          className={`${inp} w-80 mb-3`}>
          {CHARGE_HEADS.map(h => <option key={h}>{h}</option>)}
        </select>

        <div className="min-w-max">
          <div className="flex items-center gap-1 text-[12px] font-medium text-gray-700 mb-1">
            <div className="w-16">Pkg</div>
            <div className="w-28">GST Applicable</div>
            <div className="w-20">Charge Head</div>
            <div className="w-20">Rate</div>
            <div className="w-28">Charge Amount</div>
            <div className="w-20">CGST(%)</div>
            <div className="w-20">CGST</div>
            <div className="w-20">SGST(%)</div>
            <div className="w-20">SGST</div>
            <div className="w-20">IGST(%)</div>
            <div className="w-20">IGST</div>
            <div className="w-28">Remark</div>
          </div>
          <div className="flex items-center gap-1">
            <input value={pkg} onChange={e => setPkg(e.target.value)}
              className={`${inp} w-16`} />
            <input readOnly className="border border-gray-300 bg-gray-100 px-2 py-1 text-[13px] w-28 cursor-not-allowed" />
            <select value={unit} onChange={e => setUnit(e.target.value)}
              className={`${inp} w-20`}>
              {UNIT_OPTIONS.map(u => <option key={u}>{u}</option>)}
            </select>
            <input value={rate} onChange={e => setRate(e.target.value)}       className={`${inp} w-20`} />
            <input value={chargeAmt} onChange={e => setChargeAmt(e.target.value)} className={`${inp} w-28`} />
            <input value={cgstPct} onChange={e => setCgstPct(e.target.value)} className={`${inp} w-20`} />
            <input value={cgstAmt} onChange={e => setCgstAmt(e.target.value)} className={`${inp} w-20`} />
            <input value={sgstPct} onChange={e => setSgstPct(e.target.value)} className={`${inp} w-20`} />
            <input value={sgstAmt} onChange={e => setSgstAmt(e.target.value)} className={`${inp} w-20`} />
            <input value={igstPct} onChange={e => setIgstPct(e.target.value)} className={`${inp} w-20`} />
            <input value={igstAmt} onChange={e => setIgstAmt(e.target.value)} className={`${inp} w-20`} />
            <input value={remark} onChange={e => setRemark(e.target.value)}   className={`${inp} w-28`} />
            <button onClick={handleAdd}
              className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] font-medium px-4 py-1.5 rounded ml-1">
              Add
            </button>
          </div>
        </div>
      </div>

      {/* ── Results table card ──────────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm px-4 py-3 overflow-x-auto">
        <div className="flex justify-end mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium">Search:</span>
            <input value={tableSearch} onChange={e => setTableSearch(e.target.value)}
              className={`${inp} w-40`} />
          </div>
        </div>
        <table className="w-full border-collapse text-[13px] min-w-max">
          <thead>
            <tr style={{ backgroundColor: '#0b8fd3', color: '#fff' }}>
              {TABLE_COLS.map(col => (
                <th key={col} className="px-3 py-2 text-left font-medium border border-[#0a7ab8] whitespace-nowrap">
                  {col}{col !== 'Charge Head' && <span className="ml-1 opacity-70 text-[10px]">⇅</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={TABLE_COLS.length} className="text-center py-6 text-gray-500">
                  No data available in table
                </td>
              </tr>
            ) : (
              filteredRows.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-3 py-1.5 border-b border-gray-200">{row.chargeHead}</td>
                  <td className="px-3 py-1.5 border-b border-gray-200">{row.unit}</td>
                  <td className="px-3 py-1.5 border-b border-gray-200">{row.pkg}</td>
                  <td className="px-3 py-1.5 border-b border-gray-200">{row.unit}</td>
                  <td className="px-3 py-1.5 border-b border-gray-200">{row.rate}</td>
                  <td className="px-3 py-1.5 border-b border-gray-200">{row.chargeAmt}</td>
                  <td className="px-3 py-1.5 border-b border-gray-200">{row.cgstPct}</td>
                  <td className="px-3 py-1.5 border-b border-gray-200">{row.cgstAmt}</td>
                  <td className="px-3 py-1.5 border-b border-gray-200">{row.sgstPct}</td>
                  <td className="px-3 py-1.5 border-b border-gray-200">{row.sgstAmt}</td>
                  <td className="px-3 py-1.5 border-b border-gray-200">{row.igstPct}</td>
                  <td className="px-3 py-1.5 border-b border-gray-200">{row.igstAmt}</td>
                  <td className="px-3 py-1.5 border-b border-gray-200">{row.remark}</td>
                  <td className="px-3 py-1.5 border-b border-gray-200">
                    <button className="text-blue-600 hover:underline text-[12px]">Edit</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
