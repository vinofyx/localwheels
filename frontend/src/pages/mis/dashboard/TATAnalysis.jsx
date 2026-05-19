import React, { useState } from 'react';
import {
  PieChart, Pie, Cell, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import toast from 'react-hot-toast';

const inp = 'border border-gray-300 px-1.5 py-1 text-[13px] focus:outline-none bg-white w-full';
const lbl = 'text-[12px] text-gray-600 font-medium mb-0.5 block';
const PIE_COLORS = ['#2563eb', '#ef4444', '#f59e0b'];

function ChartBox({ title, count, children }) {
  return (
    <div className="border border-gray-200 rounded bg-white shadow-sm">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-100">
        <span className="text-[12px] font-semibold text-gray-600">Total Count : {count}</span>
        <span className="text-[11px] text-gray-400 cursor-pointer">Export as: 🖼</span>
      </div>
      <div className="px-3 pt-1 pb-0 text-right">
        <span className="text-[11px] text-[#2563eb] cursor-pointer hover:underline">Click On Graph For Details</span>
      </div>
      <div className="px-3 pb-3">
        {title && <p className="text-[12px] font-semibold text-center mb-1">{title}</p>}
        {children}
      </div>
    </div>
  );
}

export default function TATAnalysis() {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const fmtDate = d => d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).split('/').join('/');

  const [fromDate,       setFromDate]       = useState(fmtDate(sixMonthsAgo));
  const [toDate,         setToDate]         = useState(fmtDate(new Date()));
  const [bookingBranch,  setBookingBranch]  = useState('');
  const [deliveryBranch, setDeliveryBranch] = useState('');
  const [billingParty,   setBillingParty]   = useState('');
  const [consignor,      setConsignor]      = useState('');
  const [consignee,      setConsignee]      = useState('');
  const [transitMode,    setTransitMode]    = useState('');

  return (
    <div className="min-h-screen bg-[#e8f4fb] text-[13px] pb-4">
      <div className="text-center py-2">
        <h2 className="font-bold text-[14px] underline">TAT Analysis (Transit Shipment)</h2>
      </div>

      {/* Filter row */}
      <div className="mx-3 mb-3 border border-gray-300 rounded bg-white px-4 py-3 shadow-sm">
        <div className="grid grid-cols-9 gap-2 items-end">
          <div>
            <label className={lbl}>From Date :</label>
            <input value={fromDate} onChange={e => setFromDate(e.target.value)} className={inp} />
          </div>
          <div>
            <label className={lbl}>To Date :</label>
            <input value={toDate} onChange={e => setToDate(e.target.value)} className={inp} />
          </div>
          <div>
            <label className={lbl}>Booking Branch</label>
            <input value={bookingBranch} onChange={e => setBookingBranch(e.target.value)} className={inp} />
          </div>
          <div>
            <label className={lbl}>Delivery Branch</label>
            <input value={deliveryBranch} onChange={e => setDeliveryBranch(e.target.value)} className={inp} />
          </div>
          <div>
            <label className={lbl}>Billing Party</label>
            <input value={billingParty} onChange={e => setBillingParty(e.target.value)} className={inp} />
          </div>
          <div>
            <label className={lbl}>Consignor</label>
            <input value={consignor} onChange={e => setConsignor(e.target.value)} className={inp} />
          </div>
          <div>
            <label className={lbl}>Consignee</label>
            <input value={consignee} onChange={e => setConsignee(e.target.value)} className={inp} />
          </div>
          <div>
            <label className={lbl}>Transit Mode</label>
            <select value={transitMode} onChange={e => setTransitMode(e.target.value)} className={inp}>
              <option value="">--Select--</option>
              <option>ROAD</option>
              <option>AIR</option>
              <option>SEA</option>
              <option>TRAIN</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => toast('Searching…')}
              className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] font-medium px-4 py-1.5 rounded w-full"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      {/* 3 rows × 2 columns of charts */}
      <div className="mx-3 grid grid-cols-2 gap-3">

        {/* Row 1: TAT Status pie + TAT Fail Aging line */}
        <ChartBox title="Transit Shipment TAT Status" count={0}>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="55%" height={190}>
              <PieChart>
                <Pie data={[{ name: 'No Data', value: 1 }]} cx="50%" cy="50%" outerRadius={75} dataKey="value">
                  <Cell fill="#e5e7eb" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="text-[11px] space-y-1.5">
              {['TAT Missing', 'TAT Available', 'TAT Fail'].map((l, i) => (
                <div key={l} className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i] }} />
                  {l}
                </div>
              ))}
            </div>
          </div>
        </ChartBox>

        <ChartBox title="TAT Fail Shipment ( Aging )" count={0}>
          <ResponsiveContainer width="100%" height={190}>
            <LineChart data={[]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="days" ticks={['1 Day', '2 Days', '3 Days', 'Above 3 Days']} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" name="LRCo..." stroke="#2563eb" dot />
            </LineChart>
          </ResponsiveContainer>
        </ChartBox>

        {/* Row 2: TAT Fail Delivery Branchwise + empty */}
        <ChartBox title="TAT Fail Shipment ( Delivery Branchwise )" count={0}>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={[]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="branch" tick={{ fontSize: 11 }} />
              <YAxis label={{ value: 'LR Count', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>

        <ChartBox title="" count={0}>
          <div className="flex items-center justify-center h-[190px] text-gray-400 text-[12px]">
            No data available
          </div>
        </ChartBox>

        {/* Row 3: Today/Tomorrow EDD + empty */}
        <ChartBox title="Today/Tomorrow EDD (But Shipment not arrival at destination)" count={0}>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={[]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="branch"
                label={{ value: 'Branch', position: 'insideBottom', offset: -2, style: { fill: '#ef4444', fontSize: 11 } }}
                tick={{ fontSize: 11 }}
              />
              <YAxis label={{ value: 'LR Count', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>

        <ChartBox title="" count={0}>
          <div className="flex items-center justify-center h-[190px] text-gray-400 text-[12px]">
            No data available
          </div>
        </ChartBox>

      </div>
    </div>
  );
}
