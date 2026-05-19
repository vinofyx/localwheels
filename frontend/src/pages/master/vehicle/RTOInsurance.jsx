import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';

const SearchIcon  = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/></svg>;
const RefreshIcon = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>;
const SortIcon    = <svg className="w-3 h-3 inline-block ml-1 opacity-80" fill="currentColor" viewBox="0 0 24 24"><path d="M7 10l5-5 5 5H7zm0 4l5 5 5-5H7z"/></svg>;
const EditIcon    = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>;

const DOC_NAMES = ['--Select-', 'ABC', 'ALL INDIA PERMIT', 'ENV. TAX', 'Environmental Tax', 'Fitness Certificate', 'Form 20','GOODS CARRIAGE PERMIT', 'Government Tax', 'PUC', 'Registration Certificate', 'Road Tax', 'RTO', 'RTO Tax', 'service Tax', 'Vehicle Insurance'];
const TABS      = ['Renewal Details', 'Import Data'];
const COL_KEYS  = ['documentName', 'documentDate', 'validDate', 'amount', 'remark', 'createdUser', 'createdDate'];

const INITIAL_FORM = {
  vehicleType: 'Company Vehicle', vehicleNo: '', deactive: false,
};
const INITIAL_RENEWAL = {
  documentName: '--Select--', documentDate: '', validDate: '', amount: '', remark: '',
};
const INITIAL_PAYMENT = {
  paymentDetail: false, cashBank: 'CASH', paymentAccount: '--Select--',
  chequeNo: '', chequeDate: '',
};

export default function RTOInsurance() {
  const [form, setForm]         = useState(INITIAL_FORM);
  const [renewal, setRenewal]   = useState(INITIAL_RENEWAL);
  const [payment, setPayment]   = useState(INITIAL_PAYMENT);
  const [rows, setRows]         = useState([]);
  const [colSearch, setColSearch] = useState(Object.fromEntries(COL_KEYS.map(k => [k, ''])));
  const [page, setPage]         = useState(1);
  const [activeTab, setActiveTab] = useState('Renewal Details');
  const [uploadFile, setUploadFile] = useState('No file chosen');
  const [importFile, setImportFile] = useState('No file chosen');
  const uploadRef = useRef();
  const importRef = useRef();
  const perPage = 10;

  const setF = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };
  const setR = e => {
    const { name, value } = e.target;
    setRenewal(r => ({ ...r, [name]: value }));
  };
  const setP = e => {
    const { name, value, type, checked } = e.target;
    setPayment(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleAdd = () => {
    if (renewal.documentName === '--Select--') { toast.error('Document Name is required'); return; }
    if (!renewal.documentDate.trim())          { toast.error('Document Date is required'); return; }
    if (!renewal.validDate.trim())             { toast.error('Valid Date is required');    return; }
    if (!renewal.amount.trim())                { toast.error('Amount is required');        return; }
    const now = new Date().toLocaleString('en-GB', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    }).replace(',', '');
    setRows(r => [...r, { id: Date.now(), ...renewal, createdUser: 'admin', createdDate: now }]);
    setRenewal(INITIAL_RENEWAL);
    setUploadFile('No file chosen');
    toast.success('Added successfully');
  };

  const handleRefresh = () => {
    setForm(INITIAL_FORM); setRenewal(INITIAL_RENEWAL);
    setPayment(INITIAL_PAYMENT); setUploadFile('No file chosen');
    setColSearch(Object.fromEntries(COL_KEYS.map(k => [k, '']))); setPage(1);
  };

  const filtered   = rows.filter(r => COL_KEYS.every(c => (r[c] ?? '').toString().toLowerCase().includes(colSearch[c].toLowerCase())));
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const sliced     = filtered.slice((page - 1) * perPage, page * perPage);
  const from       = filtered.length === 0 ? 0 : (page - 1) * perPage + 1;
  const to         = Math.min(page * perPage, filtered.length);

  return (
    <div className="p-3 bg-[#cfd6de] min-h-screen text-[13px]">

      {/* ── Top bar ─────────────────────────────────────────────── */}
      <div className="flex items-center mb-2">
        <span className="text-red-600 text-[12px] font-medium">* Mark fields are compulsory</span>
        <div className="flex-1 flex justify-center">
          <h2 className="font-bold text-[15px] tracking-wide" style={{ fontVariant: 'small-caps' }}>RTO/Insurance Document</h2>
        </div>
        <div className="flex gap-1.5">
          <button className="flex items-center gap-1.5 bg-[#1976d2] hover:bg-[#1565c0] text-white text-[12px] font-medium px-3 py-1.5 rounded">
            {SearchIcon} Search
          </button>
          <button onClick={handleRefresh}
            className="flex items-center gap-1.5 bg-[#546e7a] hover:bg-[#455a64] text-white text-[12px] font-medium px-3 py-1.5 rounded">
            {RefreshIcon} Refersh
          </button>
        </div>
      </div>

      {/* ── Vehicle info panel ──────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm px-6 py-3 mb-2">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <label className="text-[13px] whitespace-nowrap"><span className="text-red-600">* </span>Vehicle Type</label>
            {['Company Vehicle', 'Other Vehicle'].map(v => (
              <label key={v} className="flex items-center gap-1.5 text-[13px] cursor-pointer">
                <input type="radio" name="vehicleType" value={v} checked={form.vehicleType === v} onChange={setF} className="cursor-pointer" />
                {v}
              </label>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap"><span className="text-red-600">* </span>Vehicle No</label>
            <input name="vehicleNo" value={form.vehicleNo} onChange={setF}
              className="border border-gray-400 px-2 py-1 w-44 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap">Deactive</label>
            <input type="checkbox" name="deactive" checked={form.deactive} onChange={setF} id="deactive" className="w-3.5 h-3.5 cursor-pointer" />
          </div>
        </div>
      </div>

      {/* ── Renewal Details panel ───────────────────────────────── */}
      <div className="bg-white rounded shadow-sm px-6 py-3 mb-2">
        <p className="font-semibold text-[13px] mb-3 border-b pb-1">Renewal Details:-</p>
        {/* Row 1 */}
        <div className="flex items-start gap-6 mb-3">
          <div className="flex flex-col gap-1">
            <label className="text-[13px]"><span className="text-red-600">* </span>Document Name</label>
            <select name="documentName" value={renewal.documentName} onChange={setR}
              className="border border-gray-400 px-2 py-1 w-36 text-[13px] bg-white focus:outline-none focus:border-blue-500">
              {DOC_NAMES.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[13px]"><span className="text-red-600">* </span>Document Date</label>
            <input name="documentDate" value={renewal.documentDate} onChange={setR} type="date"
              className="border border-gray-400 px-2 py-1 w-44 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[13px]"><span className="text-red-600">* </span>Valid Date</label>
            <input name="validDate" value={renewal.validDate} onChange={setR} type="date"
              className="border border-gray-400 px-2 py-1 w-36 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[13px]"><span className="text-red-600">* </span>Amount</label>
            <input name="amount" value={renewal.amount} onChange={setR}
              className="border border-gray-400 px-2 py-1 w-28 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>
        </div>
        {/* Row 2 */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap">Remark</label>
            <input name="remark" value={renewal.remark} onChange={setR}
              className="border border-gray-400 px-2 py-1 w-36 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap">Upload<br />Document</label>
            <button type="button" onClick={() => uploadRef.current?.click()}
              className="px-2 py-0.5 border border-gray-400 bg-gray-100 text-[12px] hover:bg-gray-200 rounded-sm">
              Choose File
            </button>
            <span className="text-[12px] text-gray-500">{uploadFile}</span>
            <input ref={uploadRef} type="file" className="hidden"
              onChange={e => setUploadFile(e.target.files[0]?.name || 'No file chosen')} />
            <button onClick={handleAdd}
              className="px-4 py-1 bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[12px] font-medium rounded ml-2">
              Add
            </button>
          </div>
        </div>
      </div>

      {/* ── Payment Detail panel ────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm px-6 py-3 mb-2">
        <div className="flex items-center gap-2 mb-3">
          <p className="font-semibold text-[13px]">Payment Detail:-</p>
          <input type="checkbox" name="paymentDetail" checked={payment.paymentDetail} onChange={setP}
            className="w-3.5 h-3.5 cursor-pointer" />
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap">Cash/Bank</label>
            <select name="cashBank" value={payment.cashBank} onChange={setP}
              disabled={!payment.paymentDetail}
              className="border border-gray-400 px-2 py-1 w-24 text-[13px] bg-white focus:outline-none disabled:bg-gray-100 disabled:text-gray-400">
              <option>CASH</option>
              <option>BANK</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap">Payment Account</label>
            <select name="paymentAccount" value={payment.paymentAccount} onChange={setP}
              disabled={!payment.paymentDetail}
              className="border border-gray-400 px-2 py-1 w-36 text-[13px] bg-white focus:outline-none disabled:bg-gray-100 disabled:text-gray-400">
              <option>--Select--</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap">Cheque NO/TRN No</label>
            <input name="chequeNo" value={payment.chequeNo} onChange={setP}
              disabled={!payment.paymentDetail}
              className="border border-gray-300 px-2 py-1 w-40 text-[13px] bg-gray-100 focus:outline-none disabled:text-gray-400" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap">Cheque Date/TRN Date</label>
            <input name="chequeDate" value={payment.chequeDate} onChange={setP}
              disabled={!payment.paymentDetail}
              className="border border-gray-300 px-2 py-1 w-40 text-[13px] bg-gray-100 focus:outline-none disabled:text-gray-400" />
          </div>
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm px-4 py-3">
        <div className="flex gap-0 mb-3 border-b border-gray-300">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 text-[13px] font-medium border border-b-0 rounded-t transition-colors ${
                activeTab === tab
                  ? 'bg-[#0b8fd3] text-white border-[#0b8fd3]'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Renewal Details tab — table */}
        {activeTab === 'Renewal Details' && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr style={{ backgroundColor: '#0b8fd3', color: '#fff' }}>
                    <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8] w-[14%]">Document Name {SortIcon}</th>
                    <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8] w-[12%]">Document Date {SortIcon}</th>
                    <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8] w-[12%]">Valid Date {SortIcon}</th>
                    <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8] w-[10%]">Amount {SortIcon}</th>
                    <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8] w-[12%]">Remark {SortIcon}</th>
                    <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8] w-[12%]">Created User {SortIcon}</th>
                    <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8] w-[16%]">Created Date {SortIcon}</th>
                    <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8] w-[6%]">Edit {SortIcon}</th>
                  </tr>
                  <tr className="bg-white">
                    {COL_KEYS.map(col => (
                      <td key={col} className="px-2 py-1 border border-gray-300">
                        <input value={colSearch[col]}
                          onChange={e => { setColSearch(s => ({ ...s, [col]: e.target.value })); setPage(1); }}
                          placeholder="Search"
                          className="w-full px-1.5 py-0.5 border border-gray-300 text-[12px] focus:outline-none focus:border-blue-400" />
                      </td>
                    ))}
                    <td className="px-2 py-1 border border-gray-300">
                      <input placeholder="Search" className="w-full px-1.5 py-0.5 border border-gray-300 text-[12px] focus:outline-none" />
                    </td>
                  </tr>
                </thead>
                <tbody>
                  {sliced.length === 0 ? (
                    <tr><td colSpan={8} className="px-3 py-6 text-center text-gray-500 border border-gray-200">No data available in table</td></tr>
                  ) : (
                    sliced.map((row, i) => (
                      <tr key={row.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-3 py-1.5 border-b border-gray-200 text-[#1565c0] font-medium">{row.documentName}</td>
                        <td className="px-3 py-1.5 border-b border-gray-200">{row.documentDate}</td>
                        <td className="px-3 py-1.5 border-b border-gray-200">{row.validDate}</td>
                        <td className="px-3 py-1.5 border-b border-gray-200">{row.amount}</td>
                        <td className="px-3 py-1.5 border-b border-gray-200">{row.remark}</td>
                        <td className="px-3 py-1.5 border-b border-gray-200 text-[#1565c0]">{row.createdUser}</td>
                        <td className="px-3 py-1.5 border-b border-gray-200">{row.createdDate}</td>
                        <td className="px-3 py-1.5 border-b border-gray-200 text-center">
                          <button className="text-gray-600 hover:text-blue-600">{EditIcon}</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between mt-2 text-[12px] text-gray-600">
              <span>Showing <span className="text-[#1565c0] font-medium">{from}</span> to <span className="text-[#1565c0] font-medium">{to}</span> of <span className="text-[#1565c0] font-medium">{filtered.length}</span> entries</span>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page === 1}
                  className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40">Previous</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)}
                    className={`px-3 py-1 border rounded ${p === page ? 'bg-[#0b8fd3] text-white border-[#0b8fd3]' : 'border-gray-300 hover:bg-gray-100'}`}>{p}</button>
                ))}
                <button onClick={() => setPage(p => Math.min(p + 1, totalPages))} disabled={page === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40">Next</button>
              </div>
            </div>
          </>
        )}

        {/* Import Data tab */}
        {activeTab === 'Import Data' && (
          <div className="flex items-center gap-3 flex-wrap px-2 py-2">
            <label className="text-[13px] font-medium whitespace-nowrap">Select Import File</label>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => importRef.current?.click()}
                className="px-2 py-0.5 border border-gray-400 bg-gray-100 text-[12px] hover:bg-gray-200 rounded-sm">
                Choose File
              </button>
              <span className="text-[12px] text-gray-500">{importFile}</span>
              <input ref={importRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
                onChange={e => setImportFile(e.target.files[0]?.name || 'No file chosen')} />
            </div>
            <button className="px-4 py-1 bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[12px] rounded">Show Data</button>
            <button className="px-4 py-1 bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[12px] rounded">Import Data</button>
            <button onClick={() => setImportFile('No file chosen')}
              className="px-4 py-1 bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[12px] rounded">Refresh</button>
            <span className="text-[#1565c0] text-[12px] underline cursor-pointer ml-2">Download Sample Excel Template</span>
          </div>
        )}
      </div>

    </div>
  );
}
