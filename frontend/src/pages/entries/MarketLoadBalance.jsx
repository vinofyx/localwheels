import React, { useState } from 'react';
import toast from 'react-hot-toast';

const SaveIcon    = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>;
const SearchIcon  = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/></svg>;
const RefreshIcon = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>;

const todayISO    = new Date().toISOString().slice(0, 10);

const PAYMENT_MODES = ['CASH', 'CHEQUE', 'NEFT', 'RTGS', 'BANK'];
const FILTER_OPTS   = ['Memo No', 'Vehicle No', 'LHS No'];

const INIT_FORM    = { paymentDate: todayISO, party: '', referenceNo: '', remark: '' };
const INIT_PAYMENT = { receiveAmount: '', paymentMode: 'CASH', depositedAc: '', chequeNo: '', chequeDate: '' };

export default function MarketLoadBalance() {
  const [form,       setForm]       = useState(INIT_FORM);
  const [payment,    setPayment]    = useState(INIT_PAYMENT);
  const [showFilter, setShowFilter] = useState(false);
  const [filterBy,   setFilterBy]   = useState('Memo No');
  const [filterVal,  setFilterVal]  = useState('');
  const [filterRows, setFilterRows] = useState([]);
  const [selectAll,  setSelectAll]  = useState(false);

  const set    = e => { const { name, value } = e.target; setForm(f => ({ ...f, [name]: value })); };
  const setPay = e => { const { name, value } = e.target; setPayment(p => ({ ...p, [name]: value })); };

  const isCash = payment.paymentMode === 'CASH';

  const handleSave = () => {
    if (!form.party.trim()) { toast.error('Party is required'); return; }
    toast.success('Saved successfully');
  };

  const handleRefresh = () => {
    setForm(INIT_FORM); setPayment(INIT_PAYMENT);
    setShowFilter(false); setFilterVal(''); setFilterRows([]); setSelectAll(false);
  };

  const handleFilterSearch = () => {
    if (!filterVal.trim()) { toast.error(`Please enter ${filterBy}`); return; }
    setFilterRows([]);
  };

  const inp  = 'border border-gray-400 px-2 py-1 text-[13px] focus:outline-none focus:border-blue-500';
  const inpR = 'border border-blue-400 px-2 py-1 text-[13px] focus:outline-none focus:border-blue-600';
  const inpG = 'border border-gray-300 px-2 py-1 text-[13px] bg-gray-100 cursor-not-allowed';
  const lbl  = 'whitespace-nowrap font-medium';
  const lblR = 'whitespace-nowrap font-medium text-red-600';

  /* Stacked two-line label + input helper */
  const StackField = ({ line1, line2, isReq = false, children }) => (
    <div className="flex flex-col gap-0.5">
      <span className={isReq ? lblR : lbl}>{line1}</span>
      <span className={isReq ? lblR : lbl}>{line2}</span>
      {children}
    </div>
  );

  return (
    <div className="p-3 bg-[#cfd6de] min-h-screen text-[13px]">

      {/* ── Top bar ──────────────────────────────────────────────── */}
      <div className="flex items-center mb-2">
        <p className="text-red-600 text-[12px] font-medium flex-1">* Mark fields are compulsory</p>
        <h2 className="font-bold text-[15px] tracking-wide" style={{ fontVariant: 'small-caps' }}>
          MarketLoad(Balance)
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
        </div>
      </div>

      {/* ── Main form card ────────────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm px-5 py-4 mb-2">

        {/* Row 1: Payment No | Payment Date | Party */}
        <div className="flex items-center gap-4 flex-wrap mb-3">
          <div className="flex items-center gap-2">
            <label className={lblR}>* Payment No</label>
            <input disabled value="1" className={`${inpG} w-28`} />
          </div>
          <div className="flex items-center gap-2">
            <label className={lblR}>* Payment Date</label>
            <input type="date" name="paymentDate" value={form.paymentDate} onChange={set}
              className={`${inp} w-36`} />
          </div>
          <div className="flex items-center gap-2">
            <label className={lblR}>* Party</label>
            <input name="party" value={form.party} onChange={set}
              className={`${inpR} w-56`} />
          </div>
        </div>

        {/* Row 2: Reference No | Remark (flex-1) | Select Trip */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 flex-shrink-0">
            <label className={lbl}>Reference No</label>
            <input name="referenceNo" value={form.referenceNo} onChange={set}
              className={`${inp} w-36`} />
          </div>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <label className={lbl}>Remark</label>
            <input name="remark" value={form.remark} onChange={set}
              className={`${inp} flex-1 min-w-0`} />
          </div>
          <button
            onClick={() => { setShowFilter(true); setFilterVal(''); setFilterRows([]); setSelectAll(false); }}
            className="flex-shrink-0 bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[12px] font-medium px-5 py-1.5 rounded">
            Select Trip
          </button>
        </div>
      </div>

      {/* ── Payment Details card ──────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm mb-2">
        <div className="px-5 py-2.5 border-b border-gray-200">
          <span className="font-bold text-[14px]">Payment Details</span>
        </div>
        <div className="px-5 py-4 flex items-end gap-5 flex-wrap">

          {/* Receive Amount */}
          <StackField line1="Receive" line2="Amount">
            <input name="receiveAmount" value={payment.receiveAmount} onChange={setPay}
              className={`${inp} w-36`} />
          </StackField>

          {/* * Payment Mode */}
          <StackField line1="* Payment" line2="Mode" isReq>
            <select name="paymentMode" value={payment.paymentMode} onChange={setPay}
              className={`${inp} w-28`}>
              {PAYMENT_MODES.map(m => <option key={m}>{m}</option>)}
            </select>
          </StackField>

          {/* Deposited In A/C */}
          <StackField line1="Deposited In" line2="A/C">
            <select name="depositedAc" value={payment.depositedAc} onChange={setPay}
              disabled={isCash}
              className={isCash ? `${inpG} w-36` : `${inp} w-36`}>
              <option value="">--Select--</option>
            </select>
          </StackField>

          {/* Cheque No / TRN No */}
          <StackField line1="Cheque No /" line2="TRN No">
            <input name="chequeNo" value={isCash ? '' : payment.chequeNo} onChange={setPay}
              disabled={isCash}
              className={isCash ? `${inpG} w-36` : `${inp} w-36`} />
          </StackField>

          {/* Cheque Date / TRN Date */}
          <StackField line1="Cheque Date /" line2="TRN Date">
            <input type="date" name="chequeDate" value={isCash ? '' : payment.chequeDate} onChange={setPay}
              disabled={isCash}
              className={isCash ? `${inpG} w-36` : `${inp} w-36`} />
          </StackField>
        </div>
      </div>

      {/* ── Empty separator strip ─────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm mb-2 h-8" />

      {/* ── Trip Freight, Advance and Diesel Details ──────────────── */}
      <div className="bg-white rounded shadow-sm px-5 py-4">
        <span className="font-bold text-[14px]">Trip Freight,Advance and Diesel Details</span>
      </div>

      {/* ── Select Filter Modal ───────────────────────────────────── */}
      {showFilter && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white w-[700px] max-h-[90vh] flex flex-col shadow-2xl rounded-sm overflow-hidden">

            {/* Title bar */}
            <div className="flex items-center px-4 py-2.5" style={{ backgroundColor: '#1a9fc2' }}>
              <span className="text-white font-semibold text-[14px] flex-1 text-center">Select Filter</span>
              <button onClick={() => setShowFilter(false)}
                className="text-white font-bold text-[18px] leading-none hover:opacity-80">✕</button>
            </div>

            {/* Filter bar */}
            <div className="flex items-center gap-2 px-4 py-2 border-b-2 border-black">
              <label className="text-[13px] font-medium">Filter</label>
              <select value={filterBy}
                onChange={e => { setFilterBy(e.target.value); setFilterVal(''); setFilterRows([]); }}
                className="border border-gray-400 px-2 py-1 text-[13px] focus:outline-none min-w-[100px]">
                {FILTER_OPTS.map(o => <option key={o}>{o}</option>)}
              </select>
              <input value={filterVal} onChange={e => setFilterVal(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleFilterSearch()}
                className="border border-gray-400 px-2 py-1 w-44 text-[13px] focus:outline-none" />
              <button onClick={handleFilterSearch}>
                <svg viewBox="0 0 24 24" className="w-6 h-6 text-gray-700 fill-current hover:text-gray-900 cursor-pointer">
                  <path d="M21.71 20.29l-4.1-4.1A8 8 0 103.69 17.31a8 8 0 0011.9.3l4.1 4.1a1 1 0 001.42-1.42zM5 11a6 6 0 116 6 6 6 0 01-6-6z"/>
                </svg>
              </button>
            </div>

            {/* Select All */}
            <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-300">
              <input type="checkbox" checked={selectAll}
                onChange={e => setSelectAll(e.target.checked)}
                className="w-4 h-4 cursor-pointer" />
              <label className="text-[13px] font-medium cursor-pointer"
                onClick={() => setSelectAll(s => !s)}>Select All</label>
              <svg className="w-5 h-5 text-gray-700 fill-current" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-auto px-4 py-3 min-h-[260px]">
              {filterRows.length === 0 && (
                <div className="text-center text-gray-400 py-10 text-[13px]">No records found</div>
              )}
            </div>

            <div className="border-t border-gray-200 h-4 overflow-x-auto">
              <div className="w-[800px] h-1" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
