import React, { useState } from 'react';
import toast from 'react-hot-toast';

const SaveIcon    = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>;
const SearchIcon  = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/></svg>;
const RefreshIcon = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>;
const PrintIcon   = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>;
const UploadIcon  = <svg className="w-4 h-4 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M16 12l-4-4m0 0l-4 4m4-4v12"/></svg>;

const DELIVERY_TYPES = ['Godown Delivery', 'Direct Delivery'];
const TRANSIT_MODES  = ['ROAD', 'AIR', 'SEA', 'TRAIN'];
const LOAD_TYPES     = ['LCV', 'HCV', 'LCV-L'];
const RATE_TYPES     = ['KG', 'TON', 'QTY', 'Freight(%)'];

const today = new Date().toISOString().slice(0, 10);
const tomorrow = (() => {
  const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10);
})();
function nowTime() { return new Date().toLocaleTimeString('en-GB', { hour12: false }); }

const INITIAL = {
  linkToLHS: false,
  deliveryType: 'Godown Delivery', transitMode: 'ROAD', unloadingBranch: '',
  date: today, time: nowTime(),
  vehicleNo: '', loadType: '', driverCode: '', driverName: '', driverNo: '',
  tripVendorName: '', tripStartKM: '', exceptedDelivery: tomorrow, routeName: '',
  consolidatedEWayBillNo: '', remarks: '', supervisorName: '',
  updatePartB: true,
  dispQty: '', enterLRNo: '',
  rateType: 'KG', rate: '', vendorCNNo: '', vendorChargeWT: '',
  ownerName: '', contactNo: '', deliveryAgent: '', panNo: '', totalPayableAdvance: '0',
  memoFreight: '0', extraCharges: '0', tdsPercent: '', tdsAmount: '0', cashAdvance: '',
  bankAdvance: '0', bankAccount: '', bankCharges: '', trnNoType: '', trnDate: '',
  dieselReceiptCardNo: '', dieselInLiter: '', dieselRate: '', dieselAmount: '0',
  dieselAgent: '', balanceAmount: '',
};

function FL({ label, required, orange, children }) {
  return (
    <div className="flex items-center gap-2">
      <label className={`text-[13px] whitespace-nowrap flex-shrink-0 ${required ? 'text-red-600 font-medium' : ''} ${orange ? 'text-orange-500' : ''}`}>
        {required ? `* ${label}` : label}
      </label>
      {children}
    </div>
  );
}

export default function Memo() {
  const [form, setForm] = useState(INITIAL);
  const [memoNo] = useState(1);

  const set = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = () => {
    if (!form.vehicleNo.trim())      { toast.error('Vehicle No is required');      return; }
    if (!form.loadType)               { toast.error('Load Type is required');        return; }
    if (!form.driverName.trim())      { toast.error('Driver is required');           return; }
    if (!form.driverNo.trim())        { toast.error('Driver No is required');        return; }
    if (!form.unloadingBranch.trim()) { toast.error('Unloading Branch is required'); return; }
    toast.success('Saved successfully');
  };

  const handleRefresh = () => setForm({ ...INITIAL, date: today, time: nowTime() });

  const inp  = 'border border-gray-400 px-2 py-1 flex-1 text-[13px] focus:outline-none focus:border-blue-500';
  const inpR = 'border border-blue-400 px-2 py-1 flex-1 text-[13px] focus:outline-none focus:border-blue-600';
  const inpG = 'border border-gray-300 px-2 py-1 flex-1 text-[13px] bg-gray-100 cursor-not-allowed';
  const sel  = 'border border-gray-400 px-2 py-1 flex-1 text-[13px] focus:outline-none focus:border-blue-500';
  const ec   = 'border border-gray-400 px-2 py-1 text-[13px] focus:outline-none focus:border-blue-500 w-full';

  return (
    <div className="p-3 bg-[#cfd6de] min-h-screen text-[13px]">

      {/* ── Top bar ──────────────────────────────────────────── */}
      <div className="flex items-center mb-2">
        <p className="text-red-600 text-[12px] font-medium flex-1">* Mark fields are compulsory</p>
        <h2 className="font-bold text-[15px] tracking-wide" style={{ fontVariant: 'small-caps' }}>Memo(Manifest)</h2>
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

      {/* ── Main form panel ──────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm px-5 py-4 mb-2">
        <div className="grid grid-cols-4 gap-x-4 gap-y-3">

          {/* Row 0: Link To LHS | Delivery Type | Transit Mode | Unloading Branch */}
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap">Link To LHS-</label>
            <input type="checkbox" name="linkToLHS" checked={form.linkToLHS} onChange={set}
              className="w-4 h-4 cursor-pointer" />
          </div>
          <FL label="Delivery Type">
            <select name="deliveryType" value={form.deliveryType} onChange={set} className={sel}>
              {DELIVERY_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </FL>
          <FL label="Transit Mode">
            <select name="transitMode" value={form.transitMode} onChange={set} className={sel}>
              <option value="">--Select--</option>
              {TRANSIT_MODES.map(m => <option key={m}>{m}</option>)}
            </select>
          </FL>
          <FL label="Unloading Branch" required>
            <input name="unloadingBranch" value={form.unloadingBranch} onChange={set} className={inpR} />
          </FL>

          {/* Row 1: Memo No | Date + Time | empty | empty */}
          <FL label="Memo No." required>
            <input disabled value={memoNo} className={inpG} />
          </FL>
          <div className="flex items-center gap-1">
            <label className="text-[13px] text-red-600 font-medium whitespace-nowrap flex-shrink-0 w-[50px]">* Date</label>
            <input type="date" name="date" value={form.date} onChange={set}
              className="border border-blue-400 px-2 py-1 text-[13px] focus:outline-none focus:border-blue-600 w-[120px] flex-shrink-0" />
            <input type="time" name="time" value={form.time} onChange={set} step="1"
              className="border border-gray-400 px-2 py-1 text-[13px] focus:outline-none focus:border-blue-500 w-[88px]" />
          </div>
          <div /><div />

          {/* Row 2: Vehicle No | Load Type | Driver | Driver No */}
          <div className="flex flex-col gap-1">
            <FL label="Vehicle No." required>
              <input name="vehicleNo" value={form.vehicleNo} onChange={set} className={inpR} />
            </FL>
            <div className="pl-[108px]">
              <button type="button" className="text-blue-600 text-[12px] underline hover:text-blue-800">
                Verify Expiry Documents
              </button>
            </div>
          </div>
          <FL label="Load Type" required>
            <select name="loadType" value={form.loadType} onChange={set} className={sel}>
              <option value="">--Select--</option>
              {LOAD_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </FL>
          <div className="flex items-center gap-1">
            <label className="text-[13px] text-red-600 font-medium whitespace-nowrap flex-shrink-0 w-[50px]">* Driver</label>
            <input name="driverCode" value={form.driverCode} onChange={set} placeholder="Code"
              className="border border-gray-400 px-2 py-1 w-[58px] text-[13px] focus:outline-none focus:border-blue-500 flex-shrink-0" />
            <input name="driverName" value={form.driverName} onChange={set}
              className="border border-blue-400 px-2 py-1 flex-1 text-[13px] focus:outline-none focus:border-blue-600" />
          </div>
          <FL label="Driver No." required>
            <input name="driverNo" value={form.driverNo} onChange={set} className={inpR} />
          </FL>

          {/* Row 3: Trip Vendor Name | Trip Start KM | Excepted Delivery | Route Name */}
          <FL label="Trip Vendor Name">
            <input name="tripVendorName" value={form.tripVendorName} onChange={set} className={inp} />
          </FL>
          <FL label="Trip Start KM">
            <input name="tripStartKM" value={form.tripStartKM} onChange={set} className={inp} />
          </FL>
          <FL label="Excepted Delivery">
            <input type="date" name="exceptedDelivery" value={form.exceptedDelivery} onChange={set} className={inp} />
          </FL>
          <FL label="Route Name">
            <input name="routeName" value={form.routeName} onChange={set} className={inp} />
          </FL>

          {/* Row 4: Consolidated E-Way BillNo. | Remarks | Supervisor Name | empty */}
          <FL label="Consolidated E-Way BillNo.">
            <input name="consolidatedEWayBillNo" value={form.consolidatedEWayBillNo} onChange={set} className={inp} />
          </FL>
          <FL label="Remarks">
            <input name="remarks" value={form.remarks} onChange={set} className={inp} />
          </FL>
          <FL label="Supervisor Name">
            <input name="supervisorName" value={form.supervisorName} onChange={set} className={inp} />
          </FL>
          <div />

          {/* Row 5: Update Part-B | Verify Eway Bill | Download CEWB Print | Upload Documents */}
          <div className="flex items-center gap-2">
            <input type="checkbox" name="updatePartB" checked={form.updatePartB} onChange={set}
              className="w-4 h-4 cursor-pointer" />
            <label className="text-[13px] cursor-pointer">Update Part-B</label>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-gray-800 text-white text-[13px] flex items-center justify-center leading-none flex-shrink-0">+</span>
            <button type="button" className="text-blue-600 text-[13px] underline hover:text-blue-800">
              Verify Eway Bill
            </button>
          </div>
          <div>
            <button type="button" className="text-blue-600 text-[13px] underline hover:text-blue-800">
              Download CEWB Print
            </button>
          </div>
          <div>
            <button type="button" className="text-blue-600 text-[13px] underline hover:text-blue-800 flex items-center gap-1">
              Upload Documents {UploadIcon}
            </button>
          </div>
        </div>
      </div>

      {/* ── Summary bar (scrollable) ──────────────────────────── */}
      <div className="bg-white rounded shadow-sm mb-2">
        <div className="flex items-center">
          <span className="px-2 text-gray-400 flex-shrink-0 text-[11px]">◀</span>
          <div className="flex items-center gap-2 py-2 px-1 overflow-x-auto whitespace-nowrap flex-1 text-[12px]">
            <span className="font-semibold">Total LR Count:</span>
            <span className="text-gray-300">|</span>
            <span className="font-semibold">TBB:</span>
            <span className="text-gray-300">|</span>
            <span className="font-semibold">Paid:</span>
            <span className="text-gray-300">|</span>
            <span className="font-semibold">To Pay:</span>
            <span className="text-gray-300">|</span>
            <span className="font-semibold">Total:</span>
            <span className="text-gray-300">|</span>
            <span className="font-semibold">Act Wt:</span>
            <span className="text-gray-300">|</span>
            <span className="font-semibold">Charge Wt:</span>
            <span className="text-gray-300">|</span>
            <span className="font-semibold">Total Qty:</span>
            <span className="text-gray-300">|</span>
            <span className="font-semibold flex-shrink-0">Disp Qty:</span>
            <input name="dispQty" value={form.dispQty} onChange={set}
              className="border border-gray-400 px-1.5 py-0.5 w-14 text-[12px] focus:outline-none flex-shrink-0" />
            <span className="text-gray-300">|</span>
            <span className="font-semibold flex-shrink-0">Disp Wt</span>
            <span className="text-gray-300">|</span>
            <input disabled placeholder="Vehicle Capacity (KG)"
              className="border border-gray-300 px-2 py-0.5 w-36 text-[12px] bg-gray-100 cursor-not-allowed flex-shrink-0" />
            <input name="enterLRNo" value={form.enterLRNo} onChange={set} placeholder="Enter LR No"
              className="border border-gray-400 px-2 py-0.5 w-28 text-[12px] focus:outline-none flex-shrink-0" />
            <button onClick={() => toast('Select LR')}
              className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[12px] font-medium px-4 py-1 rounded flex-shrink-0">
              Select LR
            </button>
          </div>
          <span className="px-2 text-gray-400 flex-shrink-0 text-[11px]">▶</span>
        </div>
      </div>

      {/* ── Rate / Vendor section ─────────────────────────────── */}
      <div className="bg-white rounded shadow-sm px-5 py-3 mb-2">
        <div className="grid grid-cols-9 gap-x-3 gap-y-1">
          {[
            { key: 'rateType',            label: 'Rate Type',            type: 'select' },
            { key: 'rate',                label: 'Rate' },
            { key: 'vendorCNNo',          label: 'Vendor CN No.' },
            { key: 'vendorChargeWT',      label: 'Vendor Charge WT' },
            { key: 'ownerName',           label: 'Owner Name' },
            { key: 'contactNo',           label: 'Contact No.' },
            { key: 'deliveryAgent',       label: 'Delivery Agent', orange: true },
            { key: 'panNo',               label: 'PAN No' },
            { key: 'totalPayableAdvance', label: 'Total Payable Advance' },
          ].map(({ key, label, type, orange }) => (
            <div key={key} className="flex flex-col gap-0.5">
              <label className={`text-[11px] whitespace-nowrap ${orange ? 'text-orange-500' : 'text-gray-500'}`}>{label}</label>
              {type === 'select' ? (
                <select name={key} value={form[key]} onChange={set}
                  className="border border-gray-400 px-1.5 py-1 text-[13px] focus:outline-none focus:border-blue-500 w-full">
                  {RATE_TYPES.map(r => <option key={r}>{r}</option>)}
                </select>
              ) : (
                <input name={key} value={form[key]} onChange={set}
                  className="border border-gray-400 px-1.5 py-1 text-[13px] focus:outline-none focus:border-blue-500 w-full" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Extra Charges section ────────────────────────────── */}
      <div className="bg-white rounded shadow-sm px-5 py-4">
        <div className="flex items-center gap-3 mb-4">
          <button type="button"
            className="w-5 h-5 rounded-full bg-gray-800 text-white text-[14px] flex items-center justify-center leading-none flex-shrink-0">
            +
          </button>
          <button type="button"
            className="bg-[#0b8fd3] text-white text-[12px] font-medium px-4 py-1.5 rounded">
            Extra Charges
          </button>
        </div>

        <div className="grid grid-cols-5 gap-x-4 gap-y-3">

          {/* Row 1 */}
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap flex-shrink-0">Memo Freight</label>
            <input name="memoFreight" value={form.memoFreight} onChange={set} className={ec} />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap flex-shrink-0">Extra Charges</label>
            <input name="extraCharges" value={form.extraCharges} onChange={set} className={ec} />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap flex-shrink-0">TDS(%)</label>
            <input name="tdsPercent" value={form.tdsPercent} onChange={set} className={ec} />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap flex-shrink-0">TDS Amount</label>
            <input name="tdsAmount" value={form.tdsAmount} onChange={set} className={ec} />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap flex-shrink-0">Cash Advance</label>
            <input name="cashAdvance" value={form.cashAdvance} onChange={set} className={ec} />
          </div>

          {/* Row 2 */}
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap flex-shrink-0">Bank Advance</label>
            <input name="bankAdvance" value={form.bankAdvance} onChange={set} className={ec} />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap flex-shrink-0">Bank Account</label>
            <select name="bankAccount" value={form.bankAccount} onChange={set}
              className="border border-gray-400 px-2 py-1 text-[13px] focus:outline-none focus:border-blue-500 w-full">
              <option value="">--Select--</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap flex-shrink-0">Bank Charges</label>
            <input name="bankCharges" value={form.bankCharges} onChange={set} className={ec} />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap flex-shrink-0">TRN No/Type</label>
            <input name="trnNoType" value={form.trnNoType} onChange={set} className={ec} />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap flex-shrink-0">TRN Date</label>
            <input type="date" name="trnDate" value={form.trnDate} onChange={set} className={ec} />
          </div>

          {/* Row 3 */}
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap flex-shrink-0">Diesel Receipt / Card No</label>
            <input name="dieselReceiptCardNo" value={form.dieselReceiptCardNo} onChange={set} className={ec} />
          </div>
          <div className="flex items-center gap-1">
            <label className="text-[13px] whitespace-nowrap flex-shrink-0">Diesel (In Liter)</label>
            <input name="dieselInLiter" value={form.dieselInLiter} onChange={set}
              className="border border-gray-400 px-2 py-1 w-[52px] text-[13px] focus:outline-none focus:border-blue-500 flex-shrink-0" />
            <label className="text-[13px] whitespace-nowrap flex-shrink-0">Rate</label>
            <input name="dieselRate" value={form.dieselRate} onChange={set}
              className="border border-gray-400 px-2 py-1 w-[48px] text-[13px] focus:outline-none focus:border-blue-500 flex-shrink-0" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap flex-shrink-0">DieselAmount</label>
            <input name="dieselAmount" value={form.dieselAmount} onChange={set} className={ec} />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap flex-shrink-0">Diesel Agent</label>
            <input name="dieselAgent" value={form.dieselAgent} onChange={set} className={ec} />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap flex-shrink-0">Balance Amount</label>
            <input name="balanceAmount" value={form.balanceAmount} onChange={set} className={ec} />
          </div>
        </div>
      </div>
    </div>
  );
}
