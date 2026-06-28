import React, { useState } from 'react';
import api from '../../api/client';
import toast from 'react-hot-toast';

function todayStr() { return new Date().toISOString().split('T')[0]; }
function monthAgo() {
  const d = new Date(); d.setDate(d.getDate() - 30);
  return d.toISOString().split('T')[0];
}

const REPORT_TYPES = [
  { id: 'fleet',    label: '🚛 Fleet Performance' },
  { id: 'driver',   label: '👤 Driver Performance' },
  { id: 'fuel',     label: '⛽ Fuel Consumption' },
  { id: 'route',    label: '🗺️ Route Analytics' },
  { id: 'delivery', label: '📦 Delivery Performance' },
  { id: 'revenue',  label: '💰 Revenue vs Cost' },
  { id: 'pod',      label: '✅ POD Status' },
  { id: 'maintenance', label: '🔧 Maintenance' },
  { id: 'customer', label: '🌐 Customer Shipment' },
  { id: 'branch',   label: '🏢 Branch Comparison' },
];

const COLUMNS = {
  fleet:       ['Vehicle','Driver','Trips','KM','Fuel (L)','Revenue (₹)','Utilization %','Status'],
  driver:      ['Driver','Trips','On-Time %','Violations','Safety Score','Rating','KM Driven','Fuel Saving %'],
  fuel:        ['Vehicle','Driver','Litres','Cost (₹)','Mileage (km/l)','Expected (km/l)','Variance %','Theft Alerts'],
  route:       ['Route','Vehicles','Avg Time (Hrs)','Avg Cost (₹)','Efficiency %','AI Savings %','Avg Toll (₹)'],
  delivery:    ['Date','Total','Delivered','Delayed','Pending','On-Time %'],
  revenue:     ['Date','Revenue (₹)','Cost (₹)','Profit (₹)','Margin %'],
  pod:         ['LR No.','Driver','Consignee','Delivery Date','Status','Days Pending'],
  maintenance: ['Vehicle','Last Service','Cost (₹)','Next Due','Health %','Alerts','Status'],
  customer:    ['Customer','Shipments','Value (₹)','On-Time %','Disputes','Outstanding (₹)','Top Route'],
  branch:      ['Branch','Shipments','Revenue (₹)','Profit %','On-Time %','Fleet Count','Drivers'],
};

const ROW_KEYS = {
  fleet:       ['vehicle','driver','trips','km','fuel_lt','revenue','utilization_pct','status'],
  driver:      ['driver','trips_month','on_time_pct','violations','safety_score','rating','km_driven','fuel_savings_pct'],
  fuel:        ['vehicle','driver','litres','cost_rs','mileage_kmpl','expected_kmpl','variance_pct','theft_alerts'],
  route:       ['route','vehicles','avg_time_hrs','avg_cost_rs','efficiency_pct','ai_savings_pct','toll_avg_rs'],
  delivery:    ['date','total','delivered','delayed','pending','on_time_pct'],
  revenue:     ['date','revenue','cost','profit','margin_pct'],
  pod:         ['lr_no','driver','consignee','delivery_date','status','days_pending'],
  maintenance: ['vehicle','last_service','service_cost_rs','next_due','health_pct','alerts','status'],
  customer:    ['customer','shipments','value_rs','on_time_pct','disputes','outstanding_rs','top_route'],
  branch:      ['branch','shipments','revenue_rs','profit_pct','on_time_pct','fleet_count','drivers'],
};

const CURRENCY_KEYS = new Set(['revenue','cost','profit','avg_cost_rs','toll_avg_rs','service_cost_rs','value_rs','outstanding_rs','revenue_rs','cost_rs','fuel_lt']);
const PCT_KEYS      = new Set(['on_time_pct','efficiency_pct','ai_savings_pct','utilization_pct','profit_pct','safety_score','fuel_efficiency','health_pct','variance_pct','fuel_savings_pct','margin_pct']);

function fmtCell(key, val) {
  if (val === undefined || val === null) return '—';
  if (CURRENCY_KEYS.has(key)) return `₹${Number(val).toLocaleString('en-IN')}`;
  if (PCT_KEYS.has(key))      return `${val}%`;
  if (typeof val === 'number') return val.toLocaleString('en-IN');
  return String(val);
}

function cellColor(key, val) {
  if (key === 'status') {
    if (['Active','Good','Normal'].includes(val)) return 'text-green-600 font-semibold';
    if (['Idle','Warning'].includes(val))          return 'text-yellow-600 font-semibold';
    if (['Breakdown','Critical','Rejected','Theft Suspected'].includes(val)) return 'text-red-600 font-semibold';
  }
  if (key === 'on_time_pct') return Number(val) >= 90 ? 'text-green-600 font-bold' : Number(val) >= 80 ? 'text-yellow-600 font-bold' : 'text-red-600 font-bold';
  if (key === 'variance_pct') return Number(val) < -5 ? 'text-red-600 font-bold' : 'text-green-600';
  if (key === 'profit' || key === 'margin_pct') return Number(val) >= 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold';
  return '';
}

export default function AIReports() {
  const [type, setType]       = useState('fleet');
  const [fromDate, setFrom]   = useState(monthAgo());
  const [toDate, setTo]       = useState(todayStr());
  const [rows, setRows]       = useState([]);
  const [loading, setLoad]    = useState(false);
  const [generated, setGen]   = useState(false);

  function generate() {
    setLoad(true);
    setGen(false);
    api.get(`/ai/reports?type=${type}&from=${fromDate}&to=${toDate}`)
      .then(r => { setRows(r.data.rows || []); setGen(true); })
      .catch(() => toast.error('Failed to generate report'))
      .finally(() => setLoad(false));
  }

  function exportCSV() {
    if (!rows.length) return;
    const keys = ROW_KEYS[type];
    const cols = COLUMNS[type];
    const header = cols.join(',');
    const body   = rows.map(r => keys.map(k => r[k] ?? '').join(',')).join('\n');
    const blob   = new Blob([header + '\n' + body], { type: 'text/csv' });
    const url    = URL.createObjectURL(blob);
    const a      = document.createElement('a');
    a.href = url; a.download = `ai_report_${type}_${todayStr()}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported as CSV');
  }

  const cols = COLUMNS[type] || [];
  const keys = ROW_KEYS[type] || [];

  return (
    <div className="p-3 space-y-3">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0891b2] to-[#0284c7] rounded shadow text-white px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold">📋 AI Reports</h1>
          <p className="text-cyan-100 text-[12px]">10 AI-powered reports: Fleet, Driver, Fuel, Route, Delivery, Revenue, POD, Maintenance, Customer, Branch</p>
        </div>
        <span className="bg-white/20 text-white text-[11px] font-bold px-2 py-1 rounded">10 Report Types</span>
      </div>

      {/* Report type tabs */}
      <div className="bg-white rounded shadow-sm">
        <div className="border-b px-3 pt-2 flex gap-1 overflow-x-auto">
          {REPORT_TYPES.map(rt => (
            <button key={rt.id} onClick={() => { setType(rt.id); setGen(false); setRows([]); }}
              className={`text-[11px] font-bold pb-2 px-3 border-b-2 whitespace-nowrap ${type === rt.id ? 'border-cyan-500 text-cyan-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {rt.label}
            </button>
          ))}
        </div>

        {/* Filter bar */}
        <div className="px-4 py-3 bg-gray-50 border-b flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">From Date</label>
            <input type="date" value={fromDate} onChange={e => setFrom(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-[12px]"/>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">To Date</label>
            <input type="date" value={toDate} onChange={e => setTo(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-[12px]"/>
          </div>
          <button onClick={generate} disabled={loading}
            className="bg-cyan-600 hover:bg-cyan-700 disabled:opacity-60 text-white font-bold px-6 py-1.5 rounded text-[12px] transition-colors flex items-center gap-2">
            {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : '⚡'}
            Generate Report
          </button>
          {generated && rows.length > 0 && (
            <button onClick={exportCSV}
              className="bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-1.5 rounded text-[12px] transition-colors">
              📥 Export CSV
            </button>
          )}
        </div>

        {/* Table */}
        <div className="p-3">
          {!generated && !loading && (
            <div className="py-12 text-center text-gray-400">
              <p className="text-3xl mb-2">📋</p>
              <p className="text-sm font-medium">Select a date range and click Generate Report</p>
              <p className="text-[11px] mt-1 text-gray-300">Report: {REPORT_TYPES.find(r => r.id === type)?.label}</p>
            </div>
          )}
          {loading && (
            <div className="py-12 flex items-center justify-center gap-3 text-gray-500">
              <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"/>
              <span className="text-sm">Generating report…</span>
            </div>
          )}
          {generated && rows.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-gray-500 font-semibold">{rows.length} records · {fromDate} to {toDate}</span>
                <span className="text-[11px] bg-cyan-50 text-cyan-700 font-bold px-2 py-0.5 rounded">{REPORT_TYPES.find(r => r.id === type)?.label}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[11.5px]">
                  <thead className="bg-cyan-50 border-b">
                    <tr>
                      <th className="text-left px-3 py-2 font-bold text-cyan-700">#</th>
                      {cols.map(c => (
                        <th key={c} className="text-left px-3 py-2 font-bold text-cyan-700 whitespace-nowrap">{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rows.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-1.5 text-gray-400 font-medium">{i + 1}</td>
                        {keys.map(k => (
                          <td key={k} className={`px-3 py-1.5 whitespace-nowrap ${cellColor(k, row[k])}`}>
                            {fmtCell(k, row[k])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
