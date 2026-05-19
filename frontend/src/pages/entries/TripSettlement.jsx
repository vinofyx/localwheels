import React, { useState } from 'react';
import toast from 'react-hot-toast';

const SaveIcon    = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>;
const SearchIcon  = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/></svg>;
const RefreshIcon = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>;
const PrintIcon   = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>;
const UploadIcon  = <svg className="w-5 h-5 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M16 12l-4-4m0 0l-4 4m4-4v12"/></svg>;
const SortIcon    = <svg className="w-3 h-3 inline-block ml-1 opacity-80" fill="currentColor" viewBox="0 0 24 24"><path d="M7 10l5-5 5 5H7zm0 4l5 5 5-5H7z"/></svg>;

const todayISO = new Date().toISOString().slice(0, 10);

const TRIP_EXPENSE_OPTS = [
  '--Select--',
  'DRIVER FOODING EXPENSE CHARGES',
  'DRIVER UNLOADING CHARGES',
  'DRIVER-LOADING CHARGES',
  'HELPER FOODING EXPENSE CHARGES',
  'HELPER UNLOADING CHARGES',
  'LOADING CHARGES BY HAMALI',
  'OTHER EXPENSE CHARGES',
  'THAI BAZAR CHARGES',
  'TOLL EXPENSE CHARGES',
  'TRIP UNLOADING CHARGES',
  'UNLOADING CHARGES BY HAMALI',
  'VECHILE BREAKDOWN EXPENSES',
];

const PAYMENT_BY_OPTS = ['CASH', 'BANK'];
const FILTER_OPTS     = ['Memo No', 'Vehicle No', 'LHS No'];
const PAID_COLS       = ['Ledger', 'Payment Mode', 'Amount', 'TRN No', 'TRN Date', 'Edit', 'Delete'];

const INIT_FORM = {
  manually: false, entryDate: todayISO, vehicleNo: '',
  startDate: todayISO, endDate: todayISO, driver: '', remark: '',
  startKm: '', endKm: '', kmTollerance: '',
  openingDiesel: '0', tripDiesel: '0', closingDiesel: '0',
  tripMilage: '', avgDieselRate: '0', tripDieselAmount: '',
  routeName: '', routeKm: '', fastagAmount: '0',
};

const INIT_PAYMENT = {
  paidAmount: '', paymentBy: 'CASH', depositedAc: '', chequeNo: '', chequeTrnDate: '',
};

const INIT_PAYABLE = {
  previousBalance: '', paidAdvance: '', driverKmPayable: '', tripExpenses: '', totalPayable: '',
};

/* Small filled-circle info button */
const DotBtn = ({ title = 'Info', onClick }) => (
  <button
    onClick={onClick ?? (() => {})}
    title={title}
    className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full bg-gray-800 text-white text-[10px] flex-shrink-0 cursor-pointer">
    ●
  </button>
);

export default function TripSettlement() {
  const [form,       setForm]       = useState(INIT_FORM);
  const [payment,    setPayment]    = useState(INIT_PAYMENT);
  const [payable,    setPayable]    = useState(INIT_PAYABLE);
  const [expense,    setExpense]    = useState('--Select--');
  const [expRemark,  setExpRemark]  = useState('');
  const [paidRows,   setPaidRows]   = useState([]);
  const [showKmCalc, setShowKmCalc] = useState(true);
  const [showFilter, setShowFilter] = useState(false);
  const [filterBy,   setFilterBy]   = useState('Memo No');
  const [filterVal,  setFilterVal]  = useState('');
  const [filterRows, setFilterRows] = useState([]);
  const [selectAll,  setSelectAll]  = useState(false);

  const set    = e => { const { name, value, type, checked } = e.target; setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value })); };
  const setPay = e => { const { name, value } = e.target; setPayment(p => ({ ...p, [name]: value })); };
  const setPayb= e => { const { name, value } = e.target; setPayable(p => ({ ...p, [name]: value })); };

  const isCash = payment.paymentBy === 'CASH';
  const totalKm        = Math.max(0, (parseFloat(form.endKm) || 0) - (parseFloat(form.startKm) || 0));
  const consumedDiesel = Math.max(0, (parseFloat(form.openingDiesel) || 0) + (parseFloat(form.tripDiesel) || 0) - (parseFloat(form.closingDiesel) || 0));

  const handleSave = () => {
    if (!form.vehicleNo.trim()) { toast.error('Vehicle No is required'); return; }
    if (!form.driver.trim())    { toast.error('Driver is required');     return; }
    toast.success('Saved successfully');
  };

  const handleRefresh = () => {
    setForm(INIT_FORM); setPayment(INIT_PAYMENT); setPayable(INIT_PAYABLE);
    setExpense('--Select--'); setExpRemark(''); setPaidRows([]);
    setShowKmCalc(true); setShowFilter(false);
    setFilterVal(''); setFilterRows([]); setSelectAll(false);
  };

  const handleAddPayment = () => {
    if (!payment.paidAmount) { toast.error('Paid Amount is required'); return; }
    setPaidRows(r => [...r, { ...payment, id: Date.now() }]);
    setPayment(INIT_PAYMENT);
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

  return (
    <div className="p-3 bg-[#cfd6de] min-h-screen text-[13px]">

      {/* ── Top bar ──────────────────────────────────────────────── */}
      <div className="flex items-center mb-2">
        <p className="text-red-600 text-[12px] font-medium flex-1">* Mark fields are compulsory</p>
        <h2 className="font-bold text-[15px] tracking-wide" style={{ fontVariant: 'small-caps' }}>
          Trip Settlement
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

        {/* Row 1: Manually + Entry No | Entry Date | Vehicle No | Select Trip */}
        <div className="flex items-center gap-4 flex-wrap mb-3">
          <div className="flex items-center gap-1.5">
            <label className={lblR}>*</label>
            <input type="checkbox" name="manually" checked={form.manually} onChange={set}
              className="w-4 h-4 cursor-pointer" />
            <label className={`${lbl} ml-0.5`}>Manually- Entry No.</label>
            <input disabled value="1" className={`${inpG} w-24 ml-1`} />
          </div>
          <div className="flex items-center gap-2">
            <label className={lblR}>* Entry Date</label>
            <input type="date" name="entryDate" value={form.entryDate} onChange={set}
              className={`${inp} w-36`} />
          </div>
          <div className="flex items-center gap-2">
            <label className={lblR}>* Vehicle No</label>
            <input name="vehicleNo" value={form.vehicleNo} onChange={set}
              className={`${inpR} w-40`} />
          </div>
          <button
            onClick={() => { setShowFilter(true); setFilterVal(''); setFilterRows([]); setSelectAll(false); }}
            className="ml-auto bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[12px] font-medium px-5 py-1.5 rounded">
            Select Trip
          </button>
        </div>

        {/* Row 2: Start Date | End Date | Driver | Remark */}
        <div className="flex items-center gap-4 flex-wrap mb-3">
          <div className="flex items-center gap-2">
            <label className={lblR}>* Start Date</label>
            <input type="date" name="startDate" value={form.startDate} onChange={set}
              className={`${inp} w-36`} />
          </div>
          <div className="flex items-center gap-2">
            <label className={lblR}>* End Date</label>
            <input type="date" name="endDate" value={form.endDate} onChange={set}
              className={`${inp} w-36`} />
          </div>
          <div className="flex items-center gap-2">
            <label className={lblR}>* Driver</label>
            <input name="driver" value={form.driver} onChange={set}
              className={`${inpR} w-40`} />
          </div>
          <div className="flex items-center gap-2">
            <label className={lbl}>Remark</label>
            <input name="remark" value={form.remark} onChange={set}
              className={`${inp} w-52`} />
          </div>
        </div>

        {/* Row 3: Start KM | End KM | Km Tollerance | (-/+Tollerance) | Total KM */}
        <div className="flex items-center gap-4 flex-wrap mb-3">
          <div className="flex items-center gap-2">
            <label className={lblR}>* Start Kilometer</label>
            <input name="startKm" value={form.startKm} onChange={set}
              className={`${inpR} w-32`} />
          </div>
          <div className="flex items-center gap-2">
            <label className={lblR}>* End Kilometer</label>
            <input name="endKm" value={form.endKm} onChange={set}
              className={`${inpR} w-28`} />
          </div>
          <div className="flex items-center gap-2">
            <label className={lbl}>Km Tollerance</label>
            <input name="kmTollerance" value={form.kmTollerance} onChange={set}
              className={`${inp} w-28`} />
            <span className="text-orange-500 font-medium text-[12px] whitespace-nowrap">(-/+Tollerance)</span>
          </div>
          <div className="flex items-center gap-2">
            <label className={lbl}>Total Kilometer</label>
            <input disabled value={totalKm} className={`${inpG} w-24`} />
          </div>
        </div>

        {/* Row 4: Opening Diesel | Trip Diesel ● | Closing Diesel | Consumed Diesel */}
        <div className="flex items-center gap-4 flex-wrap mb-3">
          <div className="flex items-center gap-2">
            <label className={lbl}>Opening Diesel(L)</label>
            <input name="openingDiesel" value={form.openingDiesel} onChange={set}
              className={`${inp} w-28`} />
          </div>
          <div className="flex items-center gap-2">
            <label className={lbl}>Trip Diesel(L)</label>
            <input name="tripDiesel" value={form.tripDiesel} onChange={set}
              className={`${inp} w-24`} />
            <DotBtn onClick={() => toast('Trip Diesel info')} />
          </div>
          <div className="flex items-center gap-2">
            <label className={lbl}>Closing Diesel(L)</label>
            <input name="closingDiesel" value={form.closingDiesel} onChange={set}
              className={`${inp} w-28`} />
          </div>
          <div className="flex items-center gap-2">
            <label className={lbl}>Consumed Diesel(L)</label>
            <input disabled value={consumedDiesel} className={`${inpG} w-24`} />
          </div>
        </div>

        {/* Row 5: Trip Milage ● | AVG Diesel Rate | Trip Diesel Amount | Upload Documents */}
        <div className="flex items-center gap-4 flex-wrap mb-3">
          <div className="flex items-center gap-2">
            <label className={lbl}>Trip Milage(KM)</label>
            <input name="tripMilage" value={form.tripMilage} onChange={set}
              className={`${inp} w-28`} />
            <DotBtn onClick={() => toast('Trip Milage info')} />
          </div>
          <div className="flex items-center gap-2">
            <label className={lbl}>AVG Diesel Rate</label>
            <input name="avgDieselRate" value={form.avgDieselRate} onChange={set}
              className={`${inp} w-24`} />
          </div>
          <div className="flex items-center gap-2">
            <label className={lbl}>Trip Diesel Amount</label>
            <input name="tripDieselAmount" value={form.tripDieselAmount} onChange={set}
              className={`${inp} w-32`} />
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="text-blue-600 underline text-[13px] hover:text-blue-800">
              Upload Documents
            </button>
            <span className="text-gray-600">{UploadIcon}</span>
          </div>
        </div>

        {/* Row 6: Driver Per KM Calculation */}
        {showKmCalc && (
          <div className="flex items-center gap-2 mb-3">
            <span className="text-orange-500 font-bold text-[13px]">Driver Per KM Calculation</span>
            <button
              className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-gray-500 text-gray-600 text-[10px] font-bold"
              title="Info">
              i
            </button>
            <button onClick={() => setShowKmCalc(false)}
              className="text-red-500 font-bold text-[15px] leading-none hover:text-red-700" title="Close">
              ✕
            </button>
          </div>
        )}

        {/* Row 7: Route Name | Km | Route Expenses | FasTag Amount ● */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className={lbl}>Route Name</label>
            <input name="routeName" value={form.routeName} onChange={set}
              className={`${inp} w-52`} />
          </div>
          <div className="flex items-center gap-2">
            <label className={lbl}>Km</label>
            <input name="routeKm" value={form.routeKm} onChange={set}
              className={`${inp} w-24`} />
          </div>
          <button onClick={() => toast('Route Expenses')}
            className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[12px] font-medium px-5 py-1.5 rounded">
            Route Expenses
          </button>
          <div className="flex items-center gap-2 ml-auto">
            <label className={lbl}>FasTag Amount</label>
            <input name="fastagAmount" value={form.fastagAmount} onChange={set}
              className={`${inp} w-24`} />
            <DotBtn onClick={() => toast('FasTag Amount info')} />
          </div>
        </div>
      </div>

      {/* ── Total Payable + Trip Detail ───────────────────────────── */}
      <div className="bg-white rounded shadow-sm px-5 py-4 mb-2">
        <div className="flex gap-10 items-start">

          {/* Left: Total Payable */}
          <div>
            <p className="font-bold text-[13px] mb-2">Total Payable</p>
            {[
              { label: 'Previous Balance',        name: 'previousBalance' },
              { label: 'Paid Advance',            name: 'paidAdvance' },
              { label: 'Driver KM Payable Amount',name: 'driverKmPayable' },
              { label: 'Trip Expences',           name: 'tripExpenses' },
              { label: 'Total Payable',           name: 'totalPayable' },
            ].map(({ label, name }) => (
              <div key={name} className="flex items-center gap-2 mb-1.5">
                <label className="w-48 text-[13px]">{label}</label>
                <input name={name} value={payable[name]} onChange={setPayb}
                  className={`${inp} w-32`} />
              </div>
            ))}
          </div>

          {/* Right: Trip Detail stats row */}
          <div className="flex-1 flex items-center gap-6 flex-wrap pt-8 text-[12px]">
            <span className="text-orange-500 font-semibold">Trip Detail:</span>
            <span className="text-orange-500 font-semibold">Total Route Kilometer :</span>
            <span className="text-orange-500 font-semibold">Total Advance:</span>
            <span className="text-orange-500 font-semibold">Total Diesel:</span>
            <span className="text-orange-500 font-semibold">Total Toll:</span>
          </div>
        </div>
      </div>

      {/* ── Lower 2-col: Trip Expenses (left) + Driver Paid/Received (right) ─ */}
      <div className="flex gap-2 items-start">

        {/* LEFT: Trip Expenses */}
        <div className="w-56 flex-shrink-0">
          <div className="bg-white rounded shadow-sm overflow-hidden">
            <div className="px-3 py-2 border-b border-gray-200">
              <span className="font-bold text-[13px]">Trip Expenses:</span>
            </div>
            <div className="px-3 py-3">
              {/* Expense select + button */}
              <div className="flex items-center gap-1 mb-2">
                <select value={expense} onChange={e => setExpense(e.target.value)}
                  className={`${inp} flex-1 min-w-0 text-[12px]`}>
                  {TRIP_EXPENSE_OPTS.map(o => <option key={o}>{o}</option>)}
                </select>
                <button
                  onClick={() => {
                    if (expense === '--Select--') { toast.error('Select an expense'); return; }
                    toast.success(`Added: ${expense}`);
                  }}
                  className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[11px] font-medium px-2 py-1 rounded whitespace-nowrap flex-shrink-0">
                  Enter Expens
                </button>
              </div>
              {/* Remark + green plus */}
              <div className="flex items-center gap-1 mb-2">
                <input value={expRemark} onChange={e => setExpRemark(e.target.value)}
                  placeholder="Enter Remark"
                  className={`${inp} flex-1 min-w-0 text-[12px]`} />
                <button
                  onClick={() => {
                    if (!expRemark.trim()) { toast.error('Enter a remark'); return; }
                    toast.success(`Remark added`);
                    setExpRemark('');
                  }}
                  className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-600 text-white text-[16px] font-bold flex-shrink-0 hover:bg-green-700">
                  +
                </button>
              </div>
              {/* Scroll arrows */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-1">
                <span className="text-gray-400 text-[18px] cursor-pointer select-none hover:text-gray-600">◀</span>
                <span className="text-gray-400 text-[18px] cursor-pointer select-none hover:text-gray-600">▶</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Driver Paid / Received */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded shadow-sm overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-200">
              <span className="font-bold text-[14px]">Driver Paid / Received</span>
            </div>

            <div className="px-4 py-3 border-b border-gray-200">
              <p className="text-[13px] font-medium mb-3">
                Total Paid/Received Amount- <span className="text-red-600 font-bold">0</span>
              </p>

              {/* Payment form */}
              <div className="flex items-center gap-3 flex-wrap mb-3">
                <div className="flex items-center gap-1.5">
                  <label className={lblR}>* Paid Amount</label>
                  <input name="paidAmount" value={payment.paidAmount} onChange={setPay}
                    className={`${inpR} w-28`} />
                </div>
                <div className="flex items-center gap-1.5">
                  <label className={lblR}>* Payment by</label>
                  <select name="paymentBy" value={payment.paymentBy} onChange={setPay}
                    className={`${inp} w-20`}>
                    {PAYMENT_BY_OPTS.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-1.5">
                  <label className={lbl}>Deposited In A/C</label>
                  <select name="depositedAc" value={payment.depositedAc} onChange={setPay}
                    disabled={isCash}
                    className={isCash ? `${inpG} w-28` : `${inp} w-28`}>
                    <option value="">--Select--</option>
                  </select>
                </div>
                <div className="flex items-center gap-1.5">
                  <label className={lblR}>* Cheque/TRN No</label>
                  <input name="chequeNo" value={isCash ? '' : payment.chequeNo} onChange={setPay}
                    disabled={isCash}
                    className={isCash ? `${inpG} w-28` : `${inpR} w-28`} />
                </div>
                <div className="flex items-center gap-1.5">
                  <label className={lblR}>* Cheque/TRN Date</label>
                  <input type="date" name="chequeTrnDate"
                    value={isCash ? '' : payment.chequeTrnDate} onChange={setPay}
                    disabled={isCash}
                    className={isCash ? `${inpG} w-32` : `${inp} w-32`} />
                  <span className="text-red-500 text-[11px] whitespace-nowrap">(dd/MM/yyyy)</span>
                </div>
                <button onClick={handleAddPayment}
                  className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[12px] font-medium px-4 py-1.5 rounded">
                  Add
                </button>
              </div>

              {/* Payments table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[13px]">
                  <thead>
                    <tr style={{ backgroundColor: '#0b8fd3', color: '#fff' }}>
                      {PAID_COLS.map(col => (
                        <th key={col}
                          className="px-3 py-2 text-left font-medium border border-[#0a7ab8] whitespace-nowrap">
                          {col}
                          {['Amount','TRN No','TRN Date','Edit','Delete'].includes(col) ? SortIcon : null}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paidRows.length === 0 ? (
                      <tr>
                        <td colSpan={PAID_COLS.length}
                          className="px-3 py-4 text-center text-gray-500 border-b border-gray-200">
                          No data available in table
                        </td>
                      </tr>
                    ) : paidRows.map((row, i) => (
                      <tr key={row.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-3 py-1.5 border-b border-gray-200">-</td>
                        <td className="px-3 py-1.5 border-b border-gray-200">{row.paymentBy}</td>
                        <td className="px-3 py-1.5 border-b border-gray-200">{row.paidAmount}</td>
                        <td className="px-3 py-1.5 border-b border-gray-200">{row.chequeNo}</td>
                        <td className="px-3 py-1.5 border-b border-gray-200">{row.chequeTrnDate}</td>
                        <td className="px-3 py-1.5 border-b border-gray-200 text-center">
                          <button className="text-blue-600 text-[12px] hover:underline">Edit</button>
                        </td>
                        <td className="px-3 py-1.5 border-b border-gray-200 text-center">
                          <button onClick={() => setPaidRows(r => r.filter(rr => rr.id !== row.id))}
                            className="text-red-500 text-[12px] hover:underline">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Trip Extra Advance/Diesel */}
            <div className="px-4 py-2.5 border-b border-gray-200">
              <p className="text-red-500 font-semibold text-[13px] mb-1">Trip Extra Advance/Diesel</p>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-[18px] cursor-pointer select-none hover:text-gray-600">◀</span>
                <span className="text-gray-400 text-[18px] cursor-pointer select-none hover:text-gray-600">▶</span>
              </div>
            </div>

            {/* LR Details */}
            <div className="px-4 py-2.5">
              <p className="text-red-500 font-semibold text-[13px] mb-1">LR Details</p>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-[18px] cursor-pointer select-none hover:text-gray-600">◀</span>
                <span className="text-gray-400 text-[18px] cursor-pointer select-none hover:text-gray-600">▶</span>
              </div>
            </div>
          </div>
        </div>
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
