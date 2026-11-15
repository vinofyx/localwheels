import React, { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/client';

const DOC_TYPES = ['LHS', 'MEMO'];

const BRANCHES = [
  '--Select--',
  'HYDERABAD', 'WARANGAL', 'KARIMNAGAR', 'KHAMMAM', 'MAHBUBNAGAR',
  'NIZAMABAD', 'VIJAYAWADA', 'RAJAHMUNDRY', 'VISAKHAPATNAM', 'KURNOOL',
  'ANANTHAPUR', 'HYDERABAD-HEAD OFFICE', 'TAMILNADU', 'ADILABAD', 'NALGONDA',
  'SANGAREDDY', 'ONGOLE', 'NELLORE', 'GUNTUR', 'TIRUPATHI', 'CUDDAPAH',
  'TEST_API_BRANCH', 'TEST_API_2', 'HYDERABAD1', 'MANCHERIAL', 'VIKARABAD',
];

export default function TouchingLR() {
  const [docType, setDocType] = useState('LHS');
  const [branch,  setBranch]  = useState('');
  const [docNo,   setDocNo]   = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats]     = useState({ act_wt: 0, charge_wt: 0, disp_qty: 0, lr_count: 0 });

  const handleSearch = async () => {
    if (!branch) { toast.error('Please select a Branch'); return; }
    if (!docNo.trim()) { toast.error('Please enter a Doc No'); return; }

    try {
      setLoading(true);
      const res = await api.get('/dispatch/touching-lr', {
        params: { doc_type: docType, branch_name: branch, doc_no: docNo.trim() }
      });
      const items = res.data?.items || [];
      setResults(items);
      setStats(res.data?.stats || {
        act_wt: items.reduce((s, i) => s + (Number(i.act_wt) || 0), 0),
        charge_wt: items.reduce((s, i) => s + (Number(i.charge_wt) || 0), 0),
        disp_qty: items.reduce((s, i) => s + (Number(i.packages) || 0), 0),
        lr_count: items.length,
      });

      if (items.length === 0) {
        toast('No records found');
      } else {
        toast.success(`Found ${items.length} shipment(s)`);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to search Touching LR');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!results || results.length === 0) {
      toast.error('No shipments loaded to save');
      return;
    }
    try {
      setLoading(true);
      await api.post('/dispatch/touching-lr', {
        doc_type: docType,
        branch_name: branch,
        doc_no: docNo,
        lr_ids: results.map(r => r._id)
      });
      toast.success('Touching LR saved successfully');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save Touching LR');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setDocType('LHS');
    setBranch('');
    setDocNo('');
    setResults(null);
    setStats({ act_wt: 0, charge_wt: 0, disp_qty: 0, lr_count: 0 });
  };

  return (
    <div className="min-h-screen bg-white text-[13px] relative p-3">

      {/* ── Title ─────────────────────────────────────────────── */}
      <div className="text-center pt-2 pb-1 pr-28">
        <span className="font-bold text-[15px] underline">Touching LR</span>
      </div>

      {/* ── Buttons — stacked vertically on top-right ─────────── */}
      <div className="absolute top-2 right-3 flex flex-col gap-1">
        <button
          onClick={handleSave}
          disabled={loading}
          className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[12px] font-medium py-1.5 w-24 rounded text-center disabled:opacity-50">
          {loading ? 'Saving...' : 'Save'}
        </button>
        <button
          onClick={handleRefresh}
          className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[12px] font-medium py-1.5 w-24 rounded text-center">
          Refresh
        </button>
        <button
          onClick={() => window.print()}
          className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[12px] font-medium py-1.5 w-24 rounded text-center">
          Print
        </button>
      </div>

      {/* ── Search form card ──────────────────────────────────── */}
      <div className="mx-3 mb-3 border border-gray-300 rounded bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-6 flex-wrap">

          {/* Doc Type */}
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap">Doc Type</label>
            <select
              value={docType}
              onChange={e => setDocType(e.target.value)}
              className="border border-gray-400 px-2 py-1 text-[13px] focus:outline-none focus:border-blue-500 min-w-[130px]">
              {DOC_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

          {/* Branch */}
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap">Branch</label>
            <select
              value={branch}
              onChange={e => setBranch(e.target.value)}
              className="border border-gray-400 px-2 py-1 text-[13px] focus:outline-none focus:border-blue-500 min-w-[190px]">
              {BRANCHES.map(b => (
                <option key={b} value={b === '--Select--' ? '' : b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Doc No */}
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap">Doc No</label>
            <input
              value={docNo}
              placeholder="e.g. LR- or Trip No"
              onChange={e => setDocNo(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="border border-gray-400 px-2 py-1 w-40 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>

          {/* Search button */}
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[12px] font-medium px-6 py-1.5 rounded disabled:opacity-50">
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {/* ── LR Details section ────────────────────────────────── */}
      <div className="mx-3">

        {/* Section header */}
        <div className="bg-gray-300 border border-gray-400 px-3 py-1 mb-2">
          <span className="font-bold text-[13px]">LR Details</span>
        </div>

        {/* Stats bar */}
        <div className="border border-gray-300 rounded px-4 py-2 mb-2 flex items-center gap-3 text-[12px] flex-wrap bg-gray-50">
          <span><span className="font-bold">Act Wt:</span> <span className="text-blue-700 font-semibold">{stats.act_wt} kg</span></span>
          <span className="text-gray-400">|</span>
          <span><span className="font-bold">Charge Wt:</span> <span className="text-blue-700 font-semibold">{stats.charge_wt} kg</span></span>
          <span className="text-gray-400">|</span>
          <span><span className="font-bold">Disp Qty:</span> <span className="text-blue-700 font-semibold">{stats.disp_qty}</span></span>
          <span className="text-gray-400">|</span>
          <span><span className="font-bold">Total LR Count:</span> <span className="text-blue-700 font-semibold">{stats.lr_count}</span></span>
        </div>

        {/* Scrollable results area */}
        <div
          className="border border-gray-300 rounded overflow-auto"
          style={{ maxHeight: '350px' }}>
          {results === null ? (
            <p className="text-center text-gray-400 py-10">Select branch, enter Doc No and click Search</p>
          ) : results.length === 0 ? (
            <p className="text-center text-gray-500 py-10">No records found</p>
          ) : (
            <table className="w-full text-left border-collapse text-[12px]">
              <thead className="bg-gray-100 border-b border-gray-300 sticky top-0">
                <tr>
                  <th className="p-2 font-semibold">LR No</th>
                  <th className="p-2 font-semibold">Date</th>
                  <th className="p-2 font-semibold">From</th>
                  <th className="p-2 font-semibold">To</th>
                  <th className="p-2 font-semibold">Sender</th>
                  <th className="p-2 font-semibold">Receiver</th>
                  <th className="p-2 font-semibold text-right">Pkgs</th>
                  <th className="p-2 font-semibold text-right">Act Wt</th>
                  <th className="p-2 font-semibold text-right">Charge Wt</th>
                  <th className="p-2 font-semibold text-right">Amount</th>
                  <th className="p-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, idx) => (
                  <tr key={r._id || idx} className="border-b border-gray-200 hover:bg-blue-50">
                    <td className="p-2 font-medium text-blue-600">{r.lr_no}</td>
                    <td className="p-2">{r.booking_date ? new Date(r.booking_date).toLocaleDateString() : '-'}</td>
                    <td className="p-2">{r.from}</td>
                    <td className="p-2">{r.to}</td>
                    <td className="p-2">{r.sender}</td>
                    <td className="p-2">{r.receiver}</td>
                    <td className="p-2 text-right">{r.packages}</td>
                    <td className="p-2 text-right">{r.act_wt}</td>
                    <td className="p-2 text-right">{r.charge_wt}</td>
                    <td className="p-2 text-right">₹{r.amount}</td>
                    <td className="p-2">
                      <span className="px-1.5 py-0.5 rounded text-[11px] bg-blue-100 text-blue-800 uppercase font-semibold">
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
