import React, { useState } from 'react';
import toast from 'react-hot-toast';

const SaveIcon    = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>;
const SearchIcon  = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/></svg>;
const RefreshIcon = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>;
const UploadIcon  = <svg className="w-4 h-4 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M16 12l-4-4m0 0l-4 4m4-4v12"/></svg>;

const LOCATION_TYPES = ['Godown Delivery', 'Direct Delivery'];
const LOAD_TYPES     = ['LCV', 'HCV', 'LCV-L'];

const FROM_BRANCH = 'HYDERABAD-HEAD OFFICE';

function nowDate() { return new Date().toISOString().slice(0, 10); }
function nowTime() {
  return new Date().toLocaleTimeString('en-GB', { hour12: false });
}

const INITIAL = {
  locationType: 'Godown Delivery',
  date: nowDate(), time: nowTime(),
  to: '', vehicleNo: '', loadType: '',
  driverCode: '', driverName: '', driverNo: '',
  tripStartKM: '', remarks: '',
  routeName: '', routeKM: '',
  vendor: '', brokerOwnerName: '', contactNo: '', panNo: '',
  totalPayableAdvance: '0',
  basicFreight: '0', tdsPercent: '', tdsAmount: '',
  bankAdvance: '0', cashAdvance: '0',
  bankAccount: '', bankCharges: '',
  trnNoType: '', trnDate: '', extraCharges: '',
  dieselReceiptNo: '', dieselAgent: '',
  dieselInLTR: '', rate: '', dieselAmount: '', balance: '',
};

function FL({ label, required, wLabel = 'w-[110px]', children }) {
  return (
    <div className="flex items-center gap-2">
      <label className={`text-[13px] whitespace-nowrap flex-shrink-0 ${wLabel} ${required ? 'text-red-600 font-medium' : ''}`}>
        {required ? `* ${label}` : label}
      </label>
      {children}
    </div>
  );
}

export default function LHS() {
  const [form, setForm] = useState(INITIAL);
  const [lhsNo]        = useState(1);

  const set = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSave = () => {
    if (!form.vehicleNo.trim())  { toast.error('Vehicle No is required');  return; }
    if (!form.loadType)           { toast.error('Load Type is required');    return; }
    if (!form.driverName.trim())  { toast.error('Driver is required');       return; }
    if (!form.driverNo.trim())    { toast.error('Driver No is required');    return; }
    if (!form.to.trim())          { toast.error('To is required');           return; }
    if (!form.vendor.trim())      { toast.error('Vendor is required');       return; }
    toast.success('Saved successfully');
  };

  const handleRefresh = () => setForm({ ...INITIAL, date: nowDate(), time: nowTime() });

  const inp  = 'border border-gray-400 px-2 py-1 flex-1 text-[13px] focus:outline-none focus:border-blue-500';
  const inpR = 'border border-blue-400 px-2 py-1 flex-1 text-[13px] focus:outline-none focus:border-blue-600';
  const inpG = 'border border-gray-300 px-2 py-1 flex-1 text-[13px] bg-gray-100 cursor-not-allowed';
  const sel  = 'border border-gray-400 px-2 py-1 flex-1 text-[13px] focus:outline-none focus:border-blue-500';

  return (
    <div className="p-3 bg-[#cfd6de] min-h-screen text-[13px]">

      {/* ── Top bar ──────────────────────────────────────────── */}
      <div className="flex items-center mb-2">
        <p className="text-red-600 text-[12px] font-medium flex-1">* Mark fields are compulsory</p>
        <h2 className="font-bold text-[15px] tracking-wide" style={{ fontVariant: 'small-caps' }}>LHS</h2>
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

      {/* ── Main form panel ──────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm px-5 py-4 mb-2">

        {/* Location Type — top right */}
        <div className="flex justify-end mb-3">
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap">Location Type</label>
            <select name="locationType" value={form.locationType} onChange={set}
              className="border border-gray-400 px-2 py-1 w-48 text-[13px] focus:outline-none focus:border-blue-500">
              {LOCATION_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-x-4 gap-y-3">

          {/* Row 1: LHS No | Date + Time | From | To */}
          <FL label="LHS No." required>
            <input disabled value={lhsNo} className={inpG} />
          </FL>
          <div className="flex items-center gap-1">
            <label className="text-[13px] text-red-600 font-medium whitespace-nowrap flex-shrink-0 w-[55px]">* Date</label>
            <input type="date" name="date" value={form.date} onChange={set}
              className="border border-blue-400 px-2 py-1 text-[13px] focus:outline-none focus:border-blue-600 w-[120px] flex-shrink-0" />
            <input type="time" name="time" value={form.time} onChange={set} step="1"
              className="border border-gray-400 px-2 py-1 text-[13px] focus:outline-none focus:border-blue-500 w-[90px]" />
          </div>
          <FL label="From" required>
            <input disabled value={FROM_BRANCH} className={inpG} />
          </FL>
          <FL label="To" required>
            <input name="to" value={form.to} onChange={set} className={inpR} />
          </FL>

          {/* Row 2: Vehicle No | Load Type | Driver | Driver No */}
          <FL label="Vehicle No." required>
            <input name="vehicleNo" value={form.vehicleNo} onChange={set} className={inpR} />
          </FL>
          <FL label="Load Type" required>
            <select name="loadType" value={form.loadType} onChange={set} className={sel}>
              <option value="">--Select--</option>
              {LOAD_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </FL>
          <div className="flex items-center gap-1">
            <label className="text-[13px] text-red-600 font-medium whitespace-nowrap flex-shrink-0 w-[55px]">* Driver</label>
            <input name="driverCode" value={form.driverCode} onChange={set} placeholder="Code"
              className="border border-gray-400 px-2 py-1 w-[60px] text-[13px] focus:outline-none focus:border-blue-500 flex-shrink-0" />
            <input name="driverName" value={form.driverName} onChange={set}
              className="border border-blue-400 px-2 py-1 flex-1 text-[13px] focus:outline-none focus:border-blue-600" />
          </div>
          <FL label="Driver No." required>
            <input name="driverNo" value={form.driverNo} onChange={set} className={inpR} />
          </FL>

          {/* Row 3: Trip Start KM | Remarks | Vehicle Capacity (KG) */}
          <FL label="Trip Start KM">
            <input name="tripStartKM" value={form.tripStartKM} onChange={set} className={inp} />
          </FL>
          <FL label="Remarks">
            <input name="remarks" value={form.remarks} onChange={set} className={inp} />
          </FL>
          <FL label="Vehicle Capacity (KG)">
            <input disabled className={inpG} />
          </FL>
          <div /> {/* empty 4th col */}

          {/* Row 4: Route Name | Route KM | Upload Documents + Select Memo */}
          <FL label="Route Name">
            <input name="routeName" value={form.routeName} onChange={set} className={inp} />
          </FL>
          <FL label="Route KM">
            <input name="routeKM" value={form.routeKM} onChange={set} className={inp} />
          </FL>
          <div className="col-span-2 flex items-center gap-4">
            <button type="button" className="text-blue-600 text-[13px] underline hover:text-blue-800 flex items-center gap-1">
              Upload Documents {UploadIcon}
            </button>
            <button type="button" onClick={() => toast('Select Memo')}
              className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[12px] font-medium px-4 py-1.5 rounded">
              Select Memo
            </button>
          </div>
        </div>
      </div>

      {/* ── Summary bar ──────────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm px-4 py-2 mb-2 flex items-center gap-4 text-[13px]">
        <span className="font-semibold">Count :</span>
        <span className="text-gray-300 px-1">|</span>
        <span>
          <span className="font-semibold">Total Wt : </span>
          <span className="text-[#1565c0] font-medium">0</span>
        </span>
        <span className="text-gray-300 px-1">|</span>
        <span>
          <span className="font-semibold">Dispatch Wt : </span>
          <span className="text-[#1565c0] font-medium">0</span>
        </span>
        <span className="text-gray-300 px-1">|</span>
        <span>
          <span className="font-semibold">Disp Qty : </span>
          <span className="text-[#1565c0] font-medium">0</span>
        </span>
      </div>

      {/* ── Vendor section ───────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm px-5 py-4 mb-2">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-[13px] text-red-600 font-medium whitespace-nowrap">* Vendor</label>
            <input name="vendor" value={form.vendor} onChange={set}
              className="border border-blue-400 px-2 py-1 w-32 text-[13px] focus:outline-none focus:border-blue-600" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap">Broker/Owner<br/>Name</label>
            <input name="brokerOwnerName" value={form.brokerOwnerName} onChange={set}
              className="border border-gray-400 px-2 py-1 w-36 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap">Contact No.</label>
            <input name="contactNo" value={form.contactNo} onChange={set}
              className="border border-gray-400 px-2 py-1 w-32 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap">PAN No</label>
            <input name="panNo" value={form.panNo} onChange={set}
              className="border border-gray-400 px-2 py-1 w-32 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap">Total Payable<br/>Advance</label>
            <input name="totalPayableAdvance" value={form.totalPayableAdvance} onChange={set}
              className="border border-gray-400 px-2 py-1 w-24 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>
        </div>
      </div>

      {/* ── Extra Charges section ────────────────────────────── */}
      <div className="bg-white rounded shadow-sm px-5 py-4">
        <button type="button"
          className="bg-[#0b8fd3] text-white text-[12px] font-medium px-4 py-1.5 rounded mb-4">
          Extra Charges
        </button>

        <div className="grid grid-cols-5 gap-x-4 gap-y-3">

          {/* Row 1 */}
          <div className="flex items-center gap-1">
            <label className="text-[13px] whitespace-nowrap">Basic Freight</label>
            <input name="basicFreight" value={form.basicFreight} onChange={set}
              className="border border-gray-400 px-2 py-1 w-[60px] text-[13px] focus:outline-none focus:border-blue-500 flex-shrink-0" />
            <button type="button"
              className="w-5 h-5 rounded-full bg-gray-800 text-white text-[14px] flex items-center justify-center leading-none flex-shrink-0">
              +
            </button>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap flex-shrink-0">TDS(%)</label>
            <input name="tdsPercent" value={form.tdsPercent} onChange={set} className={inp} />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap flex-shrink-0">TDS Amount</label>
            <input name="tdsAmount" value={form.tdsAmount} onChange={set} className={inp} />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap flex-shrink-0">Bank Advance</label>
            <input name="bankAdvance" value={form.bankAdvance} onChange={set} className={inp} />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap flex-shrink-0">Cash Advance</label>
            <input name="cashAdvance" value={form.cashAdvance} onChange={set} className={inp} />
          </div>

          {/* Row 2 */}
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap flex-shrink-0">Bank Account</label>
            <select name="bankAccount" value={form.bankAccount} onChange={set} className={sel}>
              <option value="">--Select--</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap flex-shrink-0">Bank Charges</label>
            <input name="bankCharges" value={form.bankCharges} onChange={set} className={inp} />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap flex-shrink-0">TRN No/Type</label>
            <input name="trnNoType" value={form.trnNoType} onChange={set} className={inp} />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap flex-shrink-0">TRN Date</label>
            <input type="date" name="trnDate" value={form.trnDate} onChange={set} className={inp} />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap flex-shrink-0">Extra Charges</label>
            <input name="extraCharges" value={form.extraCharges} onChange={set} className={inp} />
          </div>

          {/* Row 3 */}
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap flex-shrink-0">Diesel receipt No</label>
            <input name="dieselReceiptNo" value={form.dieselReceiptNo} onChange={set} className={inp} />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap flex-shrink-0">Diesel Agent</label>
            <input name="dieselAgent" value={form.dieselAgent} onChange={set} className={inp} />
          </div>
          <div className="flex items-center gap-1">
            <label className="text-[13px] whitespace-nowrap flex-shrink-0">Diesel In LTR</label>
            <input name="dieselInLTR" value={form.dieselInLTR} onChange={set}
              className="border border-gray-400 px-2 py-1 w-[50px] text-[13px] focus:outline-none focus:border-blue-500 flex-shrink-0" />
            <label className="text-[13px] whitespace-nowrap flex-shrink-0 ml-1">Rate</label>
            <input name="rate" value={form.rate} onChange={set}
              className="border border-gray-400 px-2 py-1 w-[50px] text-[13px] focus:outline-none focus:border-blue-500 flex-shrink-0" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap flex-shrink-0">DieselAmount</label>
            <input name="dieselAmount" value={form.dieselAmount} onChange={set} className={inp} />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap flex-shrink-0">Balance</label>
            <input name="balance" value={form.balance} onChange={set} className={inp} />
          </div>
        </div>
      </div>
    </div>
  );
}
