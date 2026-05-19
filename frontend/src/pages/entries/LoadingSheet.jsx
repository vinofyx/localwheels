import React, { useState } from 'react';
import toast from 'react-hot-toast';

const SaveIcon    = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>;
const SearchIcon  = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/></svg>;
const RefreshIcon = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>;
const PrintIcon   = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>;
const SortIcon    = <svg className="w-3 h-3 inline-block ml-1 opacity-80" fill="currentColor" viewBox="0 0 24 24"><path d="M7 10l5-5 5 5H7zm0 4l5 5 5-5H7z"/></svg>;

const TRANSIT_MODES   = ['ROAD', 'AIR', 'SEA', 'TRAIN'];
const LOAD_TYPES      = ['LCV', 'HCV', 'LCV-L'];
const DELIVERY_TYPES  = ['Godown Delivery(MEMO)', 'Direct Delivery(MEMO)', 'Local Delivery(LDM)', 'Pickup(LCM)'];
const TABLE_HEADERS   = ['Branch', 'LR No', 'LR Date', 'Consignor', 'Consignee', 'Pay Type', 'Destination', 'Actual WT', 'LR Qty', 'Stock Qty', 'Dispatch Qty', 'Action'];

const today = new Date().toISOString().slice(0, 10);

const INITIAL = {
  loadingDate: today, transitMode: 'ROAD',
  vehicleNo: '', loadType: '', loadingPerson: '',
  vendor: '', driverCode: '', driverName: '', driverNo: '',
  deliveryType: 'Godown Delivery(MEMO)', unloadingBranch: '', bagQty: '',
  routeName: '', enterLRNo: '', linkToMemo: false,
  dispQty: '', filteredDestBranch: '',
};

function FL({ label, required, bold, children }) {
  return (
    <div className="flex items-center gap-2">
      <label className={`text-[13px] whitespace-nowrap flex-shrink-0 w-[130px] ${required ? 'text-red-600 font-medium' : ''} ${bold ? 'font-bold' : ''}`}>
        {required ? `* ${label}` : label}
      </label>
      {children}
    </div>
  );
}

export default function LoadingSheet() {
  const [form, setForm] = useState(INITIAL);
  const [rows, setRows] = useState([]);

  const set = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = () => {
    if (!form.vehicleNo.trim())      { toast.error('Vehicle No is required');      return; }
    if (!form.loadType)               { toast.error('Load Type is required');        return; }
    if (!form.loadingPerson.trim())   { toast.error('Loading Person is required');   return; }
    if (!form.unloadingBranch.trim()) { toast.error('Unloading Branch is required'); return; }
    toast.success('Saved successfully');
  };

  const handleRefresh = () => { setForm(INITIAL); setRows([]); };

  const inp  = 'border border-gray-400 px-2 py-1 flex-1 text-[13px] focus:outline-none focus:border-blue-500';
  const inpR = 'border border-blue-400 px-2 py-1 flex-1 text-[13px] focus:outline-none focus:border-blue-600';
  const inpG = 'border border-gray-300 px-2 py-1 flex-1 text-[13px] bg-gray-100 cursor-not-allowed';
  const sel  = 'border border-gray-400 px-2 py-1 flex-1 text-[13px] focus:outline-none focus:border-blue-500';

  return (
    <div className="p-3 bg-[#cfd6de] min-h-screen text-[13px]">

      {/* ── Top bar ──────────────────────────────────────────── */}
      <div className="flex items-center mb-2">
        <p className="text-red-600 text-[12px] font-medium flex-1">* Mark fields are compulsory</p>
        <h2 className="font-bold text-[15px] tracking-wide" style={{ fontVariant: 'small-caps' }}>Loading Sheet</h2>
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
            {RefreshIcon} Refresh
          </button>
          <button onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-[#546e7a] hover:bg-[#455a64] text-white text-[12px] font-medium px-3 py-1.5 rounded">
            {PrintIcon} Print
          </button>
        </div>
      </div>

      {/* ── Form panel ───────────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm px-5 py-4 mb-2">
        <div className="grid grid-cols-3 gap-x-8 gap-y-3">

          {/* Row 1 */}
          <FL label="Loading No." required>
            <input disabled value="" className={inpG} />
          </FL>
          <FL label="Loading Date" required>
            <input type="date" name="loadingDate" value={form.loadingDate} onChange={set} className={inpR} />
          </FL>
          <FL label="Transit Mode">
            <select name="transitMode" value={form.transitMode} onChange={set} className={sel}>
              {TRANSIT_MODES.map(m => <option key={m}>{m}</option>)}
            </select>
          </FL>

          {/* Row 2 */}
          <div className="flex flex-col gap-1">
            <FL label="Vehicle No." required>
              <input name="vehicleNo" value={form.vehicleNo} onChange={set} className={inpR} />
            </FL>
            <div className="pl-[138px]">
              <button type="button" className="text-blue-600 text-[12px] underline hover:text-blue-800">
                Verify Expiry Documents
              </button>
            </div>
          </div>
          <FL label="Load Type">
            <select name="loadType" value={form.loadType} onChange={set} className={sel}>
              <option value="">--Select--</option>
              {LOAD_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </FL>
          <FL label="Loading Person" required>
            <input name="loadingPerson" value={form.loadingPerson} onChange={set} className={inpR} />
          </FL>

          {/* Row 3 */}
          <FL label="Vendor">
            <input name="vendor" value={form.vendor} onChange={set} className={inp} />
          </FL>
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap flex-shrink-0 w-[130px]">Driver Name</label>
            <input name="driverCode" value={form.driverCode} onChange={set} placeholder="Code"
              className="border border-gray-400 px-2 py-1 w-20 text-[13px] focus:outline-none focus:border-blue-500 flex-shrink-0" />
            <input name="driverName" value={form.driverName} onChange={set}
              className="border border-gray-400 px-2 py-1 flex-1 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>
          <FL label="Driver No.">
            <input name="driverNo" value={form.driverNo} onChange={set} className={inp} />
          </FL>

          {/* Row 4 */}
          <FL label="Delivery Type">
            <select name="deliveryType" value={form.deliveryType} onChange={set} className={sel}>
              {DELIVERY_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </FL>
          <FL label="Unloading Branch" required>
            <input name="unloadingBranch" value={form.unloadingBranch} onChange={set} className={inpR} />
          </FL>
          <FL label="BAG QTY">
            <input name="bagQty" value={form.bagQty} onChange={set} className={inp} />
          </FL>

          {/* Row 5 */}
          <FL label="Route Name">
            <input name="routeName" value={form.routeName} onChange={set} className={inp} />
          </FL>
          <FL label="Enter LR No" bold>
            <input name="enterLRNo" value={form.enterLRNo} onChange={set} className={inp} />
          </FL>
          <div className="flex items-center gap-2">
            <span className="w-[130px] flex-shrink-0" />
            <input type="checkbox" name="linkToMemo" checked={form.linkToMemo} onChange={set}
              className="w-4 h-4 cursor-pointer" />
            <label className="text-[13px] cursor-pointer">Link To Memo</label>
          </div>
        </div>
      </div>

      {/* ── Summary bar ──────────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm px-4 py-2 mb-2 flex items-center gap-3 flex-wrap">
        <span className="font-semibold">Total LR Count :</span>
        <span className="text-gray-500">LR Count</span>
        <span className="text-gray-300 px-1">|</span>
        <span className="font-semibold">Act Wt :</span>
        <span className="text-gray-500">Act Wt</span>
        <span className="text-gray-300 px-1">|</span>
        <span className="font-semibold">Disp Qty :</span>
        <input name="dispQty" value={form.dispQty} onChange={set}
          className="border border-gray-400 px-2 py-0.5 w-20 text-[13px] focus:outline-none" />
        <span className="text-gray-300 px-1">|</span>
        <span className="font-semibold">Vehicle Capacity (KG) :</span>
        <input disabled className="border border-gray-300 px-2 py-0.5 w-28 text-[13px] bg-gray-100 cursor-not-allowed" />
        <button onClick={() => toast('Select LR')}
          className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[12px] font-medium px-4 py-1.5 rounded ml-2">
          Select LR
        </button>
        <span className="font-semibold ml-2">Filtered Destination Branch</span>
        <input name="filteredDestBranch" value={form.filteredDestBranch} onChange={set}
          className="border border-gray-400 px-2 py-0.5 w-32 text-[13px] focus:outline-none" />
      </div>

      {/* ── Table panel ──────────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm px-4 py-3">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr style={{ backgroundColor: '#0b8fd3', color: '#fff' }}>
                {TABLE_HEADERS.map(h => (
                  <th key={h} className="px-3 py-2 text-left font-medium border border-[#0a7ab8] whitespace-nowrap">
                    {h} {SortIcon}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={TABLE_HEADERS.length} className="px-3 py-6 text-center text-gray-500 border border-gray-200">
                    No data available in table
                  </td>
                </tr>
              ) : rows.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-3 py-1.5 border-b border-gray-200">{row.branch}</td>
                  <td className="px-3 py-1.5 border-b border-gray-200 text-[#1565c0]">{row.lrNo}</td>
                  <td className="px-3 py-1.5 border-b border-gray-200">{row.lrDate}</td>
                  <td className="px-3 py-1.5 border-b border-gray-200">{row.consignor}</td>
                  <td className="px-3 py-1.5 border-b border-gray-200">{row.consignee}</td>
                  <td className="px-3 py-1.5 border-b border-gray-200">{row.payType}</td>
                  <td className="px-3 py-1.5 border-b border-gray-200">{row.destination}</td>
                  <td className="px-3 py-1.5 border-b border-gray-200 text-right">{row.actualWt}</td>
                  <td className="px-3 py-1.5 border-b border-gray-200 text-center">{row.lrQty}</td>
                  <td className="px-3 py-1.5 border-b border-gray-200 text-center">{row.stockQty}</td>
                  <td className="px-3 py-1.5 border-b border-gray-200 text-center">{row.dispatchQty}</td>
                  <td className="px-3 py-1.5 border-b border-gray-200 text-center" />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
