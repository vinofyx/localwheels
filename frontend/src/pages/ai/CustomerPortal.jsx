import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  'Booked':             'bg-blue-100 text-blue-700',
  'In Transit':         'bg-amber-100 text-amber-700',
  'Out for Delivery':   'bg-purple-100 text-purple-700',
  'Delivered':          'bg-green-100 text-green-700',
};

export default function CustomerPortal() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [filter, setFilter]       = useState('All');
  const [selected, setSel]        = useState(null);

  useEffect(() => {
    api.get('/ai/customer-portal')
      .then(r => setShipments(r.data))
      .catch(() => toast.error('Failed to load portal data'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = shipments.filter(s => {
    const ms = !search || s.lr_no.includes(search.toUpperCase()) || s.origin.toLowerCase().includes(search.toLowerCase()) || s.destination.toLowerCase().includes(search.toLowerCase());
    const mf = filter === 'All' || s.status === filter;
    return ms && mf;
  });

  return (
    <div className="p-3 space-y-3">
      <div className="bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] rounded shadow text-white px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold">🌐 Customer Shipment Portal</h1>
          <p className="text-purple-100 text-[12px]">Live tracking, ETA, invoice download, POD, delivery confirmation</p>
        </div>
        <div className="text-right text-[12px] text-purple-100">
          <p>Active Shipments</p>
          <p className="text-xl font-bold text-white">{shipments.filter(s => s.status !== 'Delivered').length}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: 'Total',         val: shipments.length,                                                 color: '#8b5cf6' },
          { label: 'In Transit',    val: shipments.filter(s => s.status === 'In Transit').length,           color: '#f59e0b' },
          { label: 'Delivered',     val: shipments.filter(s => s.status === 'Delivered').length,            color: '#22c55e' },
          { label: 'POD Ready',     val: shipments.filter(s => s.pod_ready).length,                        color: '#0b8fd3' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded shadow-sm p-3 border-l-4" style={{ borderColor: s.color }}>
            <p className="text-xl font-bold text-gray-800">{s.val}</p>
            <p className="text-[10px] font-semibold text-gray-500 uppercase">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Table */}
        <div className="bg-white rounded shadow-sm lg:col-span-2">
          <div className="px-3 py-2 border-b flex items-center justify-between gap-2 flex-wrap">
            <h2 className="text-[13px] font-bold text-gray-700">Shipment Register ({filtered.length})</h2>
            <div className="flex gap-2 flex-wrap items-center">
              <input className="border border-gray-300 rounded px-2 py-1 text-[11px] w-32" placeholder="LR / Origin…"
                value={search} onChange={e => setSearch(e.target.value)} />
              {['All','Booked','In Transit','Out for Delivery','Delivered'].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${filter===f ? 'bg-[#8b5cf6] text-white border-[#8b5cf6]' : 'text-gray-600 border-gray-300'}`}>{f}</button>
              ))}
            </div>
          </div>
          {loading ? <div className="p-6 text-center text-gray-400">Loading…</div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {['LR No','Origin','Destination','Status','ETA','Vehicle','Driver','Weight','Amount','POD','Invoice'].map(h => (
                      <th key={h} className="text-left px-2 py-2 font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map(s => (
                    <tr key={s.lr_no} onClick={() => setSel(s)}
                      className={`hover:bg-gray-50 cursor-pointer ${selected?.lr_no===s.lr_no?'bg-purple-50':''}`}>
                      <td className="px-2 py-1.5 font-bold text-purple-700">{s.lr_no}</td>
                      <td className="px-2 py-1.5">{s.origin}</td>
                      <td className="px-2 py-1.5">{s.destination}</td>
                      <td className="px-2 py-1.5">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${STATUS_COLORS[s.status]}`}>{s.status}</span>
                      </td>
                      <td className="px-2 py-1.5 text-[11px]">{s.eta}</td>
                      <td className="px-2 py-1.5 text-[11px]">{s.vehicle_no}</td>
                      <td className="px-2 py-1.5 text-[11px]">{s.driver}</td>
                      <td className="px-2 py-1.5">{s.weight_kg.toLocaleString('en-IN')} kg</td>
                      <td className="px-2 py-1.5 text-green-700 font-medium">₹{s.amount_rs.toLocaleString('en-IN')}</td>
                      <td className="px-2 py-1.5 text-center">
                        {s.pod_ready ? <span className="text-green-600 font-bold">✓</span> : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-2 py-1.5">
                        <button onClick={e => { e.stopPropagation(); toast.success('Invoice downloading…'); }}
                          className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded font-bold">
                          PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        <div className="bg-white rounded shadow-sm p-3">
          <h2 className="text-[13px] font-bold text-gray-700 border-b pb-1 mb-2">Shipment Detail</h2>
          {selected ? (
            <div className="space-y-2 text-[12px]">
              <div className="bg-purple-50 rounded p-2 text-center">
                <p className="text-lg font-bold text-purple-700">{selected.lr_no}</p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[selected.status]}`}>{selected.status}</span>
              </div>
              {/* Progress Steps */}
              <div className="flex items-center justify-between mt-2">
                {['Booked','In Transit','Out for Delivery','Delivered'].map((step, i) => {
                  const steps = ['Booked','In Transit','Out for Delivery','Delivered'];
                  const current = steps.indexOf(selected.status);
                  const done = i <= current;
                  return (
                    <div key={step} className="flex flex-col items-center flex-1">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${done ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                        {done ? '✓' : i+1}
                      </div>
                      {i < 3 && <div className="h-0.5 w-full mt-2.5" style={{ background: i < current ? '#8b5cf6' : '#e5e7eb' }} />}
                      <p className="text-[8px] text-center mt-1 text-gray-500">{step.split(' ')[0]}</p>
                    </div>
                  );
                })}
              </div>
              {[
                ['Origin',       selected.origin],
                ['Destination',  selected.destination],
                ['Vehicle',      selected.vehicle_no],
                ['Driver',       selected.driver],
                ['Driver Phone', selected.driver_phone],
                ['ETA',          selected.eta],
                ['Weight',       `${selected.weight_kg.toLocaleString('en-IN')} kg`],
                ['Amount',       `₹${selected.amount_rs.toLocaleString('en-IN')}`],
                ['Invoice',      selected.invoice_no],
              ].map(([k,v]) => (
                <div key={k} className="flex justify-between border-b pb-1">
                  <span className="text-gray-500">{k}</span>
                  <span className="font-medium text-gray-800">{v}</span>
                </div>
              ))}
              <div className="flex flex-col gap-2 pt-1">
                <button className="text-[11px] font-bold py-1.5 bg-[#8b5cf6] text-white rounded">🔗 Customer Tracking Link</button>
                <button onClick={() => toast.success('Invoice sent!')} className="text-[11px] font-bold py-1.5 bg-green-600 text-white rounded">📧 Email Invoice</button>
                {selected.pod_ready && <button className="text-[11px] font-bold py-1.5 bg-blue-600 text-white rounded">📄 Download POD</button>}
                <button className="text-[11px] font-bold py-1.5 bg-orange-500 text-white rounded">🔔 Send Notification</button>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8">
              <p className="text-3xl mb-2">🌐</p>
              <p className="text-[12px]">Select a shipment to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
