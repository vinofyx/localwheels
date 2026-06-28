import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import toast from 'react-hot-toast';

const STATUS_COLORS = { Pending: 'bg-yellow-100 text-yellow-700', Uploaded: 'bg-blue-100 text-blue-700', Approved: 'bg-green-100 text-green-700', Rejected: 'bg-red-100 text-red-700' };

function CheckIcon({ ok }) {
  return ok
    ? <span className="text-green-600 font-bold">✓</span>
    : <span className="text-red-400">✗</span>;
}

export default function DigitalPOD() {
  const [pods, setPods]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState('All');
  const [selected, setSel]    = useState(null);

  useEffect(() => {
    api.get('/ai/pods')
      .then(r => setPods(r.data))
      .catch(() => toast.error('Failed to load PODs'))
      .finally(() => setLoading(false));
  }, []);

  function approve(id) {
    setPods(p => p.map(x => x.id === id ? { ...x, status: 'Approved' } : x));
    toast.success('POD approved');
    setSel(null);
  }
  function reject(id) {
    setPods(p => p.map(x => x.id === id ? { ...x, status: 'Rejected' } : x));
    toast.error('POD rejected');
    setSel(null);
  }

  const filtered = pods.filter(p => {
    const ms = !search || p.lr_no.includes(search.toUpperCase()) || p.consignee.toLowerCase().includes(search.toLowerCase());
    const mf = filter === 'All' || p.status === filter;
    return ms && mf;
  });

  return (
    <div className="p-3 space-y-3">
      <div className="bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] rounded shadow text-white px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold">✅ Digital POD Management</h1>
          <p className="text-purple-100 text-[12px]">E-signature, photo, QR/GPS verification, PDF generation, auto-approval</p>
        </div>
        <div className="text-right text-[12px] text-purple-100">
          <p>Approved: <b className="text-white">{pods.filter(p=>p.status==='Approved').length}</b></p>
          <p>Pending: <b className="text-white">{pods.filter(p=>p.status==='Pending').length}</b></p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: 'Total PODs',  val: pods.length,                                        color: '#8b5cf6' },
          { label: 'Approved',    val: pods.filter(p => p.status === 'Approved').length,    color: '#22c55e' },
          { label: 'Pending',     val: pods.filter(p => p.status === 'Pending').length,     color: '#f59e0b' },
          { label: 'Rejected',    val: pods.filter(p => p.status === 'Rejected').length,    color: '#ef4444' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded shadow-sm p-3 border-l-4" style={{ borderColor: s.color }}>
            <p className="text-xl font-bold text-gray-800">{s.val}</p>
            <p className="text-[10px] font-semibold text-gray-500 uppercase mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Table */}
        <div className="bg-white rounded shadow-sm lg:col-span-2">
          <div className="px-3 py-2 border-b flex items-center justify-between gap-2 flex-wrap">
            <h2 className="text-[13px] font-bold text-gray-700">POD Register ({filtered.length})</h2>
            <div className="flex gap-2 flex-wrap items-center">
              <input className="border border-gray-300 rounded px-2 py-1 text-[11px] w-32" placeholder="LR / Consignee…"
                value={search} onChange={e => setSearch(e.target.value)} />
              {['All','Pending','Uploaded','Approved','Rejected'].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${filter===f ? 'bg-[#8b5cf6] text-white border-[#8b5cf6]' : 'text-gray-600 border-gray-300'}`}>{f}</button>
              ))}
              <button className="text-[11px] font-bold px-3 py-1.5 bg-green-600 text-white rounded">Export</button>
            </div>
          </div>
          {loading ? <div className="p-6 text-center text-gray-400">Loading…</div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {['LR No','Vehicle','Driver','Consignee','Delivery Date','Sign','Photo','QR','GPS','Status','Action'].map(h => (
                      <th key={h} className="text-left px-2 py-2 font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map(p => (
                    <tr key={p.id} className={`hover:bg-gray-50 cursor-pointer ${selected?.id===p.id?'bg-purple-50':''}`} onClick={() => setSel(p)}>
                      <td className="px-2 py-1.5 font-bold text-purple-700">{p.lr_no}</td>
                      <td className="px-2 py-1.5">{p.vehicle_no}</td>
                      <td className="px-2 py-1.5">{p.driver}</td>
                      <td className="px-2 py-1.5 text-[11px]">{p.consignee}</td>
                      <td className="px-2 py-1.5">{p.delivery_date}</td>
                      <td className="px-2 py-1.5 text-center"><CheckIcon ok={p.signature} /></td>
                      <td className="px-2 py-1.5 text-center"><CheckIcon ok={p.photo} /></td>
                      <td className="px-2 py-1.5 text-center"><CheckIcon ok={p.qr_verified} /></td>
                      <td className="px-2 py-1.5 text-center"><CheckIcon ok={p.gps_verified} /></td>
                      <td className="px-2 py-1.5">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${STATUS_COLORS[p.status]}`}>{p.status}</span>
                      </td>
                      <td className="px-2 py-1.5">
                        {p.status === 'Uploaded' && (
                          <div className="flex gap-1">
                            <button onClick={e => { e.stopPropagation(); approve(p.id); }}
                              className="text-[10px] px-2 py-0.5 bg-green-600 text-white rounded font-bold">Approve</button>
                            <button onClick={e => { e.stopPropagation(); reject(p.id); }}
                              className="text-[10px] px-2 py-0.5 bg-red-500 text-white rounded font-bold">Reject</button>
                          </div>
                        )}
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
          <h2 className="text-[13px] font-bold text-gray-700 border-b pb-1 mb-2">POD Detail</h2>
          {selected ? (
            <div className="space-y-2 text-[12px]">
              <div className="bg-purple-50 rounded p-2 text-center">
                <p className="text-lg font-bold text-purple-700">{selected.lr_no}</p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[selected.status]}`}>{selected.status}</span>
              </div>
              {[
                ['Vehicle',      selected.vehicle_no],
                ['Driver',       selected.driver],
                ['Consignee',    selected.consignee],
                ['Delivery Date',selected.delivery_date],
                ['Timestamp',    new Date(selected.timestamp).toLocaleString('en-IN')],
              ].map(([k,v]) => (
                <div key={k} className="flex justify-between border-b pb-1">
                  <span className="text-gray-500">{k}</span>
                  <span className="font-medium text-gray-800">{v}</span>
                </div>
              ))}
              <div className="mt-2 space-y-1">
                <p className="font-semibold text-gray-600 text-[11px] uppercase">Verification Status</p>
                {[['Signature',selected.signature],['Photo Captured',selected.photo],['QR Verified',selected.qr_verified],['GPS Verified',selected.gps_verified]].map(([k,v]) => (
                  <div key={k} className="flex justify-between text-[11px]">
                    <span className="text-gray-500">{k}</span>
                    <CheckIcon ok={v} />
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-2 pt-1">
                <button className="text-[11px] font-bold py-1.5 bg-[#0b8fd3] text-white rounded">📄 Generate PDF</button>
                <button className="text-[11px] font-bold py-1.5 bg-green-600 text-white rounded">📧 Email to Customer</button>
                {selected.status === 'Uploaded' && (
                  <>
                    <button onClick={() => approve(selected.id)} className="text-[11px] font-bold py-1.5 bg-green-700 text-white rounded">✅ Approve POD</button>
                    <button onClick={() => reject(selected.id)} className="text-[11px] font-bold py-1.5 bg-red-500 text-white rounded">❌ Reject POD</button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8">
              <p className="text-3xl mb-2">📋</p>
              <p className="text-[12px]">Select a POD to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
