import React, { useState } from 'react';
import toast from 'react-hot-toast';

const pad = n => String(n).padStart(2, '0');
const getToday = () => { const d = new Date(); return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`; };
const getYesterday = () => {
  const d = new Date(); d.setDate(d.getDate() - 1);
  return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`;
};

const PdfIcon   = <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><rect x="3" y="2" width="18" height="20" rx="2" fill="#fff" stroke="#e53e3e"/><path d="M7 12h2a2 2 0 000-4H7v8m5-8h2a3 3 0 010 6h-2V8m5 0v8" stroke="#e53e3e" strokeWidth={1.5}/></svg>;
const XlsIcon   = <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><rect x="3" y="2" width="18" height="20" rx="2" fill="#fff" stroke="#38a169"/><path d="M7 8l3 4-3 4m4-8h3m-3 4h3m-3 4h3" stroke="#38a169" strokeWidth={1.5}/></svg>;
const WordIcon  = <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><rect x="3" y="2" width="18" height="20" rx="2" fill="#fff" stroke="#3182ce"/><path d="M7 8l2 8 2-5 2 5 2-8" stroke="#3182ce" strokeWidth={1.5}/></svg>;

const lbl  = 'whitespace-nowrap font-medium text-[13px]';
const inp  = 'border border-gray-300 px-2 py-1 text-[13px] focus:outline-none focus:border-blue-400';

const FILTERS = ['PERIOD WISE', 'ALL'];
const TABS    = ['Unbilled LR(Unverify)', 'Unbilled LR(Verify)', 'Unverify Report'];

export default function UnbilledChecklist() {
  const [filter,         setFilter]         = useState('PERIOD WISE');
  const [fromDate,       setFromDate]       = useState(getYesterday());
  const [toDate,         setToDate]         = useState(getToday());
  const [allBillingParty,setAllBillingParty]= useState(false);
  const [billingPartyVal,setBillingPartyVal]= useState('');
  const [billingBranch,  setBillingBranch]  = useState('');
  const [lrBranch,       setLrBranch]       = useState('');
  const [from,           setFrom]           = useState('');
  const [to,             setTo]             = useState('');
  const [consignor,      setConsignor]      = useState('');
  const [consignee,      setConsignee]      = useState('');
  const [multiLrNos,     setMultiLrNos]     = useState('');
  const [skipBilling,    setSkipBilling]    = useState(false);
  const [tab,            setTab]            = useState('Unbilled LR(Unverify)');
  const [selectAll,      setSelectAll]      = useState(false);

  const handleRefresh = () => {
    setFilter('PERIOD WISE'); setFromDate(getYesterday()); setToDate(getToday());
    setAllBillingParty(false); setBillingPartyVal(''); setBillingBranch('');
    setLrBranch(''); setFrom(''); setTo(''); setConsignor(''); setConsignee('');
    setMultiLrNos(''); setSkipBilling(false); setSelectAll(false);
  };

  return (
    <div className="p-3 min-h-screen text-[13px]" style={{ backgroundColor: '#dce9f5' }}>

      {/* ── Title ──────────────────────────────────────────────────── */}
      <div className="text-center mb-2">
        <h2 className="font-bold text-[15px] tracking-wide" style={{ fontVariant: 'small-caps' }}>
          Unbilled CheckList
        </h2>
      </div>

      {/* ── Filter card ────────────────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm px-4 py-3 mb-2">

        {/* Row 1: Filter | From Date | To Date | All Billing Party | Show */}
        <div className="flex items-center gap-4 mb-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className={lbl}>Filter</label>
            <select value={filter} onChange={e => setFilter(e.target.value)}
              className={`${inp} w-36`}>
              {FILTERS.map(f => <option key={f}>{f}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className={lbl}>From Date</label>
            <input value={fromDate} onChange={e => setFromDate(e.target.value)}
              className={`${inp} w-28`} />
          </div>
          <div className="flex items-center gap-2">
            <label className={lbl}>To Date</label>
            <input value={toDate} onChange={e => setToDate(e.target.value)}
              className={`${inp} w-28`} />
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 cursor-pointer text-[13px]">
              <input type="checkbox" checked={allBillingParty} onChange={e => setAllBillingParty(e.target.checked)} />
              All Billing Party
            </label>
            <input value={billingPartyVal} onChange={e => setBillingPartyVal(e.target.value)}
              disabled={allBillingParty}
              className={`${inp} w-36 ${allBillingParty ? 'bg-gray-100 cursor-not-allowed' : ''}`} />
          </div>
          <button onClick={() => toast('Showing data…')}
            className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] font-medium px-6 py-1.5 rounded ml-auto">
            Show
          </button>
        </div>

        {/* Row 2: Billing Branch | LR Branch | From | To */}
        <div className="flex items-center gap-4 mb-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className={lbl}>Billing Branch</label>
            <input value={billingBranch} onChange={e => setBillingBranch(e.target.value)}
              className={`${inp} w-36`} />
          </div>
          <div className="flex items-center gap-2">
            <label className={lbl}>LR Branch</label>
            <input value={lrBranch} onChange={e => setLrBranch(e.target.value)}
              className={`${inp} w-36`} />
          </div>
          <div className="flex items-center gap-2">
            <label className={lbl}>From</label>
            <input value={from} onChange={e => setFrom(e.target.value)}
              className={`${inp} w-36`} />
          </div>
          <div className="flex items-center gap-2">
            <label className={lbl}>To</label>
            <input value={to} onChange={e => setTo(e.target.value)}
              className={`${inp} w-36`} />
          </div>
        </div>

        {/* Row 3: Consignor | Consignee | Multi LR No's | Skip Billing Condition */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className={lbl}>Consignor</label>
            <input value={consignor} onChange={e => setConsignor(e.target.value)}
              className={`${inp} w-36`} />
          </div>
          <div className="flex items-center gap-2">
            <label className={lbl}>Consignee</label>
            <input value={consignee} onChange={e => setConsignee(e.target.value)}
              className={`${inp} w-36`} />
          </div>
          <div className="flex items-center gap-2">
            <label className={lbl}>Multi LR No's</label>
            <textarea value={multiLrNos} onChange={e => setMultiLrNos(e.target.value)}
              rows={2} className={`${inp} w-40 resize-none`} />
          </div>
          <label className="flex items-center gap-1.5 cursor-pointer text-[13px] ml-auto">
            <input type="checkbox" checked={skipBilling} onChange={e => setSkipBilling(e.target.checked)} />
            Skip Billing Condition
          </label>
        </div>
      </div>

      {/* ── Tabs card ──────────────────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm">

        {/* Tab headers */}
        <div className="flex border-b border-gray-200">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-[13px] font-medium border-r border-gray-200 last:border-r-0 ${
                tab === t ? 'bg-[#0b8fd3] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}>
              {t}
            </button>
          ))}
        </div>

        {/* ── Unbilled LR(Unverify) ─────────────────────────────── */}
        {tab === 'Unbilled LR(Unverify)' && (
          <div className="px-3 py-3">
            <div className="flex items-center gap-0 flex-wrap mb-2">
              {/* Stats */}
              <div className="flex items-center gap-0 text-[13px] font-bold flex-1 flex-wrap gap-y-1">
                <span>Total Count :&nbsp;</span><span className="font-normal mr-3"></span>
                <span className="border-l border-gray-400 pl-3">Total Wt :&nbsp;</span><span className="font-normal mr-3"></span>
                <span className="border-l border-gray-400 pl-3">Total Qty :&nbsp;</span><span className="font-normal mr-3"></span>
                <span className="border-l border-gray-400 pl-3">Freight Amt :&nbsp;</span><span className="font-normal mr-3"></span>
                <span className="border-l border-gray-400 pl-3">Other Amt :&nbsp;</span><span className="font-normal mr-3"></span>
                <span className="border-l border-gray-400 pl-3">LR Amt :&nbsp;</span><span className="font-normal">|</span>
              </div>
              {/* Buttons */}
              <div className="flex items-center gap-2 ml-auto">
                <button onClick={() => toast('Calculating contract…')}
                  className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] font-medium px-3 py-1.5 rounded">
                  Cal Contract
                </button>
                <button onClick={() => toast('Verifying…')}
                  className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] font-medium px-3 py-1.5 rounded">
                  Verify
                </button>
                <button onClick={handleRefresh}
                  className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] font-medium px-3 py-1.5 rounded">
                  Refresh
                </button>
                <button onClick={() => toast('Exporting Excel…')}
                  title="Export Excel">{XlsIcon}</button>
              </div>
            </div>
            <div className="min-h-[80px]" />
          </div>
        )}

        {/* ── Unbilled LR(Verify) ────────────────────────────────── */}
        {tab === 'Unbilled LR(Verify)' && (
          <div className="px-3 py-3">
            <div className="flex items-center flex-wrap mb-2">
              {/* Stats */}
              <div className="flex items-center gap-0 text-[13px] font-bold flex-1 flex-wrap gap-y-1">
                <span>Total Count :&nbsp;</span><span className="font-normal mr-3"></span>
                <span className="border-l border-gray-400 pl-3">Total Wt :&nbsp;</span><span className="font-normal mr-3"></span>
                <span className="border-l border-gray-400 pl-3">Total Qty :&nbsp;</span><span className="font-normal mr-3"></span>
                <span className="border-l border-gray-400 pl-3">Total Freight Amount:&nbsp;</span><span className="font-normal mr-3"></span>
                <span className="border-l border-gray-400 pl-3">Total Other Charges:&nbsp;</span><span className="font-normal mr-3"></span>
                <span className="border-l border-gray-400 pl-3">Total Amount:&nbsp;</span><span className="font-normal"></span>
              </div>
              {/* Export icons */}
              <div className="flex items-center gap-1 ml-auto">
                <button onClick={() => toast('Exporting PDF…')}   title="Export PDF">{PdfIcon}</button>
                <button onClick={() => toast('Exporting Excel…')} title="Export Excel">{XlsIcon}</button>
                <button onClick={() => toast('Exporting Word…')}  title="Export Word">{WordIcon}</button>
              </div>
            </div>
            {/* Select All + Delete */}
            <div className="flex items-center gap-3 mb-2">
              <label className="flex items-center gap-1.5 cursor-pointer text-[13px]">
                <input type="checkbox" checked={selectAll} onChange={e => setSelectAll(e.target.checked)} />
                Select All
              </label>
              <button onClick={() => toast('Deleting selected…')}
                className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] font-medium px-4 py-1 rounded">
                Delete
              </button>
            </div>
            <div className="min-h-[60px]" />
          </div>
        )}

        {/* ── Unverify Report ────────────────────────────────────── */}
        {tab === 'Unverify Report' && (
          <div className="min-h-[120px]" />
        )}
      </div>
    </div>
  );
}
