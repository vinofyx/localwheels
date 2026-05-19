import React, { useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

const PIE_COLORS_IE = ['#2563eb', '#f59e0b', '#ef4444'];

const SIDEBAR = [
  {
    label: 'Account', icon: '👤',
    children: ['Sale Analysis', 'Recovery Analysis', 'Payment Analysis', 'Income/Expences Analysis'],
  },
  { label: 'Operation', icon: '⚙️' },
  { label: 'Fleet',     icon: '🚛' },
  { label: 'Payroll',   icon: '💰' },
  { label: 'WMS',       icon: '📦' },
];

const inp = 'border border-gray-300 rounded px-2 py-1.5 text-[13px] focus:outline-none w-full bg-white';

function StatCard({ title, year, value, icon }) {
  return (
    <div className="border border-gray-200 rounded p-3 flex items-center justify-between bg-white shadow-sm">
      <div>
        <p className="text-gray-500 text-[12px]">{title} {year && <span className="text-red-500 font-semibold">({year})</span>}</p>
        <p className="text-[#2563eb] font-bold text-[20px] mt-1">{value}</p>
      </div>
      <span className="text-[#2563eb] text-2xl">{icon}</span>
    </div>
  );
}

function SectionCard({ title, children }) {
  return (
    <div className="border border-gray-200 rounded bg-white shadow-sm mb-4">
      <div className="px-3 py-2 border-b border-gray-100">
        <p className="font-bold text-[13px] text-[#2563eb]">{title}</p>
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

function ChartBox({ title, children }) {
  return (
    <div className="border border-gray-200 rounded p-3 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <p className="font-semibold text-[13px] text-center w-full">{title}</p>
        <span className="text-gray-400 text-[12px] cursor-pointer flex-shrink-0">≡</span>
      </div>
      {children}
    </div>
  );
}

function DataTable({ columns, rows, emptyMsg = 'No records.' }) {
  return (
    <div className="overflow-auto max-h-64 border border-gray-200 rounded text-[12px]">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-[#2563eb] text-white">
            <th className="px-2 py-1.5 w-8 text-center border-r border-blue-400">#</th>
            {columns.map(c => (
              <th key={c.key} className="px-2 py-1.5 text-left border-r border-blue-400 last:border-r-0">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={columns.length + 1} className="text-center py-3 text-gray-400">{emptyMsg}</td></tr>
          ) : rows.map((r, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="px-2 py-1 text-center border-r border-gray-200">{i + 1}</td>
              {columns.map(c => (
                <td key={c.key} className="px-2 py-1 border-r border-gray-200 last:border-r-0">{r[c.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Sale Analysis ─────────────────────────────────────────────────────── */
function SaleAnalysisContent() {
  const [fromDate,  setFromDate]  = useState('01/04/2026');
  const [toDate,    setToDate]    = useState('11/05/2026');
  const [party,     setParty]     = useState('');
  const [branch,    setBranch]    = useState('');
  const [branchAll, setBranchAll] = useState('All');
  const fy = '2026-2027', prevFy = '2025-2026';

  return (
    <div>
      <div className="bg-white border border-gray-200 rounded p-3 mb-4 shadow-sm">
        <div className="grid grid-cols-6 gap-3 items-end">
          <div>
            <p className="text-[12px] text-gray-600 mb-1 font-medium">From Date</p>
            <div className="relative"><span className="absolute left-2 top-1.5 text-gray-400">📅</span>
              <input value={fromDate} onChange={e => setFromDate(e.target.value)} className={`${inp} pl-7`} /></div>
          </div>
          <div>
            <p className="text-[12px] text-gray-600 mb-1 font-medium">To Date</p>
            <div className="relative"><span className="absolute left-2 top-1.5 text-gray-400">📅</span>
              <input value={toDate} onChange={e => setToDate(e.target.value)} className={`${inp} pl-7`} /></div>
          </div>
          <div>
            <p className="text-[12px] text-gray-600 mb-1 font-medium">Party</p>
            <div className="relative"><span className="absolute left-2 top-1.5 text-gray-400">👥</span>
              <input value={party} onChange={e => setParty(e.target.value)} className={`${inp} pl-7`} /></div>
          </div>
          <div>
            <p className="text-[12px] text-gray-600 mb-1 font-medium">Branch</p>
            <div className="relative"><span className="absolute left-2 top-1.5 text-gray-400">🔀</span>
              <input value={branch} onChange={e => setBranch(e.target.value)} className={`${inp} pl-7`} /></div>
          </div>
          <div>
            <p className="text-[12px] text-gray-600 mb-1 font-medium">&nbsp;</p>
            <select value={branchAll} onChange={e => setBranchAll(e.target.value)} className={inp}>
              <option>All</option><option>Own</option>
            </select>
          </div>
          <div>
            <p className="text-[12px] text-gray-600 mb-1 font-medium">&nbsp;</p>
            <button className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[13px] font-medium px-4 py-1.5 rounded w-full flex items-center justify-center gap-1">
              🔍 Search
            </button>
          </div>
        </div>
      </div>
      <h3 className="font-bold text-[14px] mb-2">Net Sale Growth</h3>
      <div className="grid grid-cols-4 gap-3 mb-4">
        <StatCard title="Current Year Sales"  year={fy}     value="0.00"   icon="🪙" />
        <StatCard title="Previous Year Sales" year={prevFy} value="0.00"   icon="📶" />
        <StatCard title="Net Sale Growth"                   value="0.00"   icon="📈" />
        <StatCard title="Net Sale Growth(%)"                value="0.00 %" icon="%" />
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <ChartBox title="Month Wise Sale Growth">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={[]}><CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" /><YAxis /><Tooltip /><Legend />
              <Line type="monotone" dataKey="currentYear" name="Current Year" stroke="#2563eb" dot={false} />
              <Line type="monotone" dataKey="prevYear"    name="Previous Year" stroke="#ef4444" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartBox>
        <ChartBox title="Top 10 Branch Wise Sale Growth">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={[]}><CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="branch" /><YAxis label={{ value: 'Sale', angle: -90, position: 'insideLeft' }} /><Tooltip /><Legend />
              <Bar dataKey="currentYear" name="Current Year" fill="#2563eb" />
              <Bar dataKey="prevYear"    name="Previous Year" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <ChartBox title="Region Wise Sale Growth">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={[]}><CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="region" /><YAxis label={{ value: 'Sale', angle: -90, position: 'insideLeft' }} /><Tooltip /><Legend />
              <Bar dataKey="currentYear" name="Current Year" fill="#2563eb" />
              <Bar dataKey="prevYear"    name="Previous Year" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>
        <ChartBox title="Top 10 Customer Wise Sale Growth">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={[]} layout="vertical"><CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" /><YAxis dataKey="customer" type="category" width={130} /><Tooltip /><Legend />
              <Bar dataKey="currentYear" name="Current Year" fill="#2563eb" />
              <Bar dataKey="prevYear"    name="Previous Year" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>
      </div>
    </div>
  );
}

/* ─── Recovery Analysis ─────────────────────────────────────────────────── */
function RecoveryAnalysisContent() {
  const [fromDate, setFromDate] = useState('01/04/2000');
  const [toDate,   setToDate]   = useState('11/05/2026');
  const [party,    setParty]    = useState('');

  return (
    <div>
      {/* Filter */}
      <div className="bg-white border border-gray-200 rounded p-3 mb-4 shadow-sm">
        <div className="grid grid-cols-5 gap-3 items-end">
          <div>
            <p className="text-[12px] text-gray-600 mb-1 font-medium">From Date</p>
            <div className="relative"><span className="absolute left-2 top-1.5 text-gray-400">📅</span>
              <input value={fromDate} onChange={e => setFromDate(e.target.value)} className={`${inp} pl-7`} /></div>
          </div>
          <div>
            <p className="text-[12px] text-gray-600 mb-1 font-medium">To Date</p>
            <div className="relative"><span className="absolute left-2 top-1.5 text-gray-400">📅</span>
              <input value={toDate} onChange={e => setToDate(e.target.value)} className={`${inp} pl-7`} /></div>
          </div>
          <div>
            <p className="text-[12px] text-gray-600 mb-1 font-medium">Party</p>
            <div className="relative"><span className="absolute left-2 top-1.5 text-gray-400">👥</span>
              <input value={party} onChange={e => setParty(e.target.value)} className={`${inp} pl-7`} /></div>
          </div>
          <div className="flex items-end">
            <button className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[13px] font-medium px-6 py-1.5 rounded">
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <SectionCard title="Monthwise Balance">
          <ChartBox title="Monthwise Balance">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={[]}><CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" label={{ value: 'Month', position: 'insideBottom', offset: -2 }} />
                <YAxis label={{ value: 'Amount', angle: -90, position: 'insideLeft' }} /><Tooltip />
                <Bar dataKey="amount" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
        </SectionCard>
        <SectionCard title="Sale recovery">
          <ChartBox title="Sale recovery">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={[]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" label={{ value: 'Category', position: 'insideBottom', offset: -2 }} />
                <YAxis label={{ value: 'Amount', angle: -90, position: 'insideLeft' }} /><Tooltip />
                <Bar dataKey="amount" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
        </SectionCard>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-2 gap-4">
        <SectionCard title="Branch wise detail">
          <DataTable
            columns={[{ key: 'party', label: 'Party' }, { key: 'unbilled', label: 'UnBilled' }]}
            rows={[]}
          />
        </SectionCard>
        <SectionCard title="Sale detail">
          <DataTable
            columns={[{ key: 'party', label: 'Party' }, { key: 'dueAmount', label: 'Due Amount' }]}
            rows={[]}
          />
        </SectionCard>
      </div>
    </div>
  );
}

/* ─── Payment Analysis ──────────────────────────────────────────────────── */
function PaymentAnalysisContent() {
  const [fromDate, setFromDate] = useState('01/04/2026');
  const [toDate,   setToDate]   = useState('11/05/2026');
  const [branch,   setBranch]   = useState('');
  const [groupBy,  setGroupBy]  = useState('Booking Branchwise');

  return (
    <div>
      {/* Filter */}
      <div className="bg-white border border-gray-200 rounded p-3 mb-4 shadow-sm">
        <div className="flex items-end gap-3 flex-wrap">
          <div>
            <p className="text-[12px] text-gray-600 mb-1 font-medium">From Date</p>
            <div className="relative"><span className="absolute left-2 top-1.5 text-gray-400">📅</span>
              <input value={fromDate} onChange={e => setFromDate(e.target.value)} className="border border-gray-300 rounded px-2 py-1.5 text-[13px] focus:outline-none bg-white pl-7 w-36" /></div>
          </div>
          <div>
            <p className="text-[12px] text-gray-600 mb-1 font-medium">To Date</p>
            <div className="relative"><span className="absolute left-2 top-1.5 text-gray-400">📅</span>
              <input value={toDate} onChange={e => setToDate(e.target.value)} className="border border-gray-300 rounded px-2 py-1.5 text-[13px] focus:outline-none bg-white pl-7 w-36" /></div>
          </div>
          <div>
            <p className="text-[12px] text-gray-600 mb-1 font-medium">Branch</p>
            <div className="relative"><span className="absolute left-2 top-1.5 text-gray-400">📅</span>
              <input value={branch} onChange={e => setBranch(e.target.value)} className="border border-gray-300 rounded px-2 py-1.5 text-[13px] focus:outline-none bg-white pl-7 w-36" /></div>
          </div>
          <div>
            <p className="text-[12px] text-gray-600 mb-1 font-medium">&nbsp;</p>
            <select value={groupBy} onChange={e => setGroupBy(e.target.value)} className="border border-gray-300 rounded px-2 py-1.5 text-[13px] bg-white focus:outline-none w-44">
              <option>Booking Branchwise</option>
              <option>Delivery Branchwise</option>
            </select>
          </div>
          <div className="flex items-end pb-0.5">
            <button className="flex items-center justify-center w-8 h-8 hover:bg-gray-100 rounded border border-gray-300">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="7" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Monthwise Payment chart */}
      <SectionCard title="Monthwise Payment">
        <ChartBox title="Monthwise Payment">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={[]}><CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" label={{ value: 'Month', position: 'insideBottom', offset: -2 }} />
              <YAxis label={{ value: 'Payment', angle: -90, position: 'insideLeft' }} /><Tooltip />
              <Bar dataKey="amount" fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>
      </SectionCard>

      {/* Branchwise charts row */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <SectionCard title="Sale recovery">
          <ChartBox title="Branchwise Payment">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={[]}><CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="branch" label={{ value: 'Branch', position: 'insideBottom', offset: -2 }} />
                <YAxis label={{ value: 'Payment', angle: -90, position: 'insideLeft' }} /><Tooltip />
                <Bar dataKey="amount" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
        </SectionCard>
        <SectionCard title="Sale recovery">
          <div className="flex items-center justify-center h-40 text-gray-400 text-[12px]">
            No data available
          </div>
        </SectionCard>
      </div>

      {/* Breakdown tables */}
      <div className="grid grid-cols-2 gap-4">
        <SectionCard title="Payment IN Breakdown">
          <DataTable
            columns={[{ key: 'head', label: 'HEAD' }, { key: 'in', label: 'IN' }]}
            rows={[]}
          />
        </SectionCard>
        <SectionCard title="Payment OUT Breakdown">
          <DataTable
            columns={[{ key: 'head', label: 'HEAD' }, { key: 'out', label: 'OUT' }]}
            rows={[]}
          />
        </SectionCard>
      </div>
    </div>
  );
}

/* ─── Income/Expences Analysis ──────────────────────────────────────────── */
function IncomeExpencesContent() {
  const [fromDate,  setFromDate]  = useState('01/04/2026');
  const [toDate,    setToDate]    = useState('11/05/2026');
  const [branch,    setBranch]    = useState('');
  const [groupBy,   setGroupBy]   = useState('Booking Branchwise');
  const [piePage,   setPiePage]   = useState(1);
  const PIE_PAGES = 3;

  return (
    <div>
      {/* Filter */}
      <div className="bg-white border border-gray-200 rounded p-3 mb-4 shadow-sm">
        <div className="flex items-end gap-3 flex-wrap">
          <div>
            <p className="text-[12px] text-gray-600 mb-1 font-medium">From Date</p>
            <div className="relative"><span className="absolute left-2 top-1.5 text-gray-400">📅</span>
              <input value={fromDate} onChange={e => setFromDate(e.target.value)} className="border border-gray-300 rounded px-2 py-1.5 text-[13px] focus:outline-none bg-white pl-7 w-36" /></div>
          </div>
          <div>
            <p className="text-[12px] text-gray-600 mb-1 font-medium">To Date</p>
            <div className="relative"><span className="absolute left-2 top-1.5 text-gray-400">📅</span>
              <input value={toDate} onChange={e => setToDate(e.target.value)} className="border border-gray-300 rounded px-2 py-1.5 text-[13px] focus:outline-none bg-white pl-7 w-36" /></div>
          </div>
          <div>
            <p className="text-[12px] text-gray-600 mb-1 font-medium">Branch</p>
            <div className="relative"><span className="absolute left-2 top-1.5 text-gray-400">👥</span>
              <input value={branch} onChange={e => setBranch(e.target.value)} className="border border-gray-300 rounded px-2 py-1.5 text-[13px] focus:outline-none bg-white pl-7 w-36" /></div>
          </div>
          <div>
            <p className="text-[12px] text-gray-600 mb-1 font-medium">&nbsp;</p>
            <select value={groupBy} onChange={e => setGroupBy(e.target.value)} className="border border-gray-300 rounded px-2 py-1.5 text-[13px] bg-white focus:outline-none w-44">
              <option>Booking Branchwise</option>
              <option>Delivery Branchwise</option>
            </select>
          </div>
          <div className="flex items-end pb-0.5">
            <button className="flex items-center justify-center w-8 h-8 hover:bg-gray-100 rounded border border-gray-300">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="7" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Monthwise Profit/Loss chart */}
      <SectionCard title="Monthwise Profit / Loss">
        <ChartBox title="Monthwise Profit">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={[]}><CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" label={{ value: 'Month', position: 'insideBottom', offset: -2 }} />
              <YAxis label={{ value: 'Profit', angle: -90, position: 'insideLeft' }} /><Tooltip /><Legend />
              <Bar dataKey="income"  name="Income"  fill="#2563eb" />
              <Bar dataKey="expense" name="Expense" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>
      </SectionCard>

      {/* Branchwise Profit/Loss + Net Profit/Loss */}
      <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: '2fr 1fr' }}>
        <SectionCard title="Branchwise Profit / Loss">
          <ChartBox title="Branchwise Profit">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={[]}><CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="branch" label={{ value: 'Month', position: 'insideBottom', offset: -2 }} tick={{ fontSize: 11 }} />
                <YAxis label={{ value: 'Profit', angle: -90, position: 'insideLeft' }} tickFormatter={v => v + '%'} />
                <Tooltip /><Legend />
                <Bar dataKey="income"  name="Income"  fill="#2563eb" />
                <Bar dataKey="expense" name="Expense" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
        </SectionCard>

        <SectionCard title="Net Profit / Loss">
          {/* Carousel header */}
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-1.5 text-[12px]">
              <span className="w-3 h-3 rounded-full inline-block bg-[#2563eb]" />
              <span>Income</span>
            </div>
            <div className="flex items-center gap-1 text-[12px] text-gray-500">
              <button onClick={() => setPiePage(p => Math.max(1, p - 1))} className="hover:text-gray-800">◄</button>
              <span>{piePage}/{PIE_PAGES}</span>
              <button onClick={() => setPiePage(p => Math.min(PIE_PAGES, p + 1))} className="hover:text-gray-800">►</button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={[{ name: 'No Data', value: 1 }]}
                cx="50%" cy="50%" outerRadius={85} dataKey="value"
              >
                <Cell fill="#e5e7eb" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </SectionCard>
      </div>

      {/* Headwise tables */}
      <div className="grid grid-cols-2 gap-4">
        <SectionCard title="Headwise Expences">
          <DataTable
            columns={[{ key: 'head', label: 'HEAD' }, { key: 'expences', label: 'EXPENCES' }]}
            rows={[]}
          />
        </SectionCard>
        <SectionCard title="Headwise Income">
          <DataTable
            columns={[{ key: 'head', label: 'HEAD' }, { key: 'income', label: 'INCOME' }]}
            rows={[]}
          />
        </SectionCard>
      </div>
    </div>
  );
}

/* ─── Main Dashboard ────────────────────────────────────────────────────── */
const SECTION_MAP = {
  'Sale Analysis':           <SaleAnalysisContent />,
  'Recovery Analysis':       <RecoveryAnalysisContent />,
  'Payment Analysis':        <PaymentAnalysisContent />,
  'Income/Expences Analysis': <IncomeExpencesContent />,
};

export default function MISDashboard() {
  const [sidebarOpen,   setSidebarOpen]   = useState(false);
  const [expanded,      setExpanded]      = useState('Account');
  const [activeSection, setActiveSection] = useState('Sale Analysis');

  return (
    <div className="min-h-screen bg-gray-50 text-[13px] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(o => !o)} className="text-gray-500 hover:text-gray-700">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-semibold text-[14px] text-gray-700">MIS Dashboard</span>
        </div>
        <button className="text-gray-400 hover:text-gray-600">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {sidebarOpen && (
          <aside className="w-56 bg-[#2563eb] text-white flex-shrink-0 overflow-y-auto">
            <div className="flex items-center justify-between px-3 py-2 border-b border-blue-500">
              <span className="font-bold text-[14px]">Dashboard</span>
              <button onClick={() => setSidebarOpen(false)} className="text-white/70 hover:text-white text-lg leading-none">✕</button>
            </div>
            {SIDEBAR.map(section => (
              <div key={section.label}>
                <button
                  onClick={() => {
                    setExpanded(e => e === section.label ? '' : section.label);
                    if (!section.children) setActiveSection(section.label);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 hover:bg-blue-700 text-[13px] font-medium"
                >
                  <span className="flex items-center gap-2"><span>{section.icon}</span>{section.label}</span>
                  {section.children && <span className="text-xs">{expanded === section.label ? '▲' : '▼'}</span>}
                </button>
                {section.children && expanded === section.label && (
                  <div className="bg-white/10">
                    {section.children.map(child => (
                      <button key={child} onClick={() => setActiveSection(child)}
                        className={`w-full text-left px-6 py-1.5 text-[12px] hover:bg-white/20 ${activeSection === child ? 'bg-white text-[#2563eb] font-semibold' : ''}`}>
                        {child}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </aside>
        )}

        {/* Main */}
        <main className="flex-1 p-4 overflow-y-auto">
          <h2 className="font-bold text-[15px] mb-3">{activeSection}</h2>
          {SECTION_MAP[activeSection] ?? (
            <div className="bg-white border border-gray-200 rounded p-8 text-center text-gray-400 shadow-sm">
              {activeSection} — No data available
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
