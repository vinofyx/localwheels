import { useState, useEffect } from 'react';

const _BASE = import.meta.env.VITE_API_URL || '/api';
const h = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}`, 'Content-Type': 'application/json' });

export default function VendorManagement() {
  const [vendors, setVendors]     = useState([]);
  const [contracts, setContracts] = useState([]);
  const [summary, setSummary]     = useState(null);
  const [tab, setTab]             = useState('vendors');
  const [selected, setSelected]   = useState(null);
  const [showContract, setShowContract] = useState(false);
  const [contractForm, setContractForm] = useState({ title: '', type: 'service', start_date: '', end_date: '', value: '', payment_terms: '' });
  const [loading, setLoading]     = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [v, c, s] = await Promise.all([
        fetch(`${_BASE}/vendors-p15?limit=50`, { headers: h() }).then(r => r.json()),
        fetch(`${_BASE}/vendors-p15/contracts/all`, { headers: h() }).then(r => r.json()),
        fetch(`${_BASE}/vendors-p15/analytics/summary`, { headers: h() }).then(r => r.json()),
      ]);
      setVendors(v.data?.vendors || []);
      setContracts(c.data?.contracts || []);
      setSummary(s.data || s);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const loadDetail = async (id) => {
    const r = await fetch(`${_BASE}/vendors-p15/${id}`, { headers: h() }).then(r => r.json());
    setSelected(r.data || r);
    setTab('detail');
  };

  const addContract = async () => {
    await fetch(`${_BASE}/vendors-p15/${selected?.vendor?._id}/contracts`, {
      method: 'POST', headers: h(), body: JSON.stringify(contractForm),
    });
    setShowContract(false);
    loadDetail(selected?.vendor?._id);
  };

  const STATUS_COLOR = { draft: 'bg-gray-100 text-gray-700', active: 'bg-green-100 text-green-700', expiring_soon: 'bg-yellow-100 text-yellow-700', expired: 'bg-red-100 text-red-700', terminated: 'bg-red-200 text-red-800' };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendor Management</h1>
          <p className="text-sm text-gray-500 mt-1">Vendor portal, contracts and compliance</p>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[['Total Vendors', summary.total], ['Preferred', summary.preferred], ['Active Contracts', summary.active_contracts], ['Total Spend', `KES ${(summary.total_spend || 0).toLocaleString()}`]].map(([l, v]) => (
            <div key={l} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-gray-500 uppercase">{l}</p>
              <p className="text-xl font-bold mt-1">{v ?? 0}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 border-b border-gray-200">
        {['vendors','contracts', selected ? 'detail' : null].filter(Boolean).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t === 'detail' ? selected?.vendor?.name || 'Detail' : t}
          </button>
        ))}
      </div>

      {loading && <div className="text-center py-12 text-gray-400">Loading…</div>}

      {!loading && tab === 'vendors' && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{['Name','Type','City','Rating','Preferred','Actions'].map(c => <th key={c} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{c}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {vendors.map(v => (
                <tr key={v._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{v.name}</td>
                  <td className="px-4 py-3 text-gray-500 capitalize">{v.type?.replace('_',' ')}</td>
                  <td className="px-4 py-3 text-gray-500">{v.city || '—'}</td>
                  <td className="px-4 py-3">{'⭐'.repeat(Math.round(v.rating || 0))}<span className="text-xs text-gray-400 ml-1">{(v.rating || 0).toFixed(1)}</span></td>
                  <td className="px-4 py-3">{v.is_preferred ? <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">Preferred</span> : '—'}</td>
                  <td className="px-4 py-3"><button onClick={() => loadDetail(v._id)} className="text-indigo-600 hover:underline text-xs">View</button></td>
                </tr>
              ))}
              {vendors.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-gray-400">No vendors found</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {!loading && tab === 'contracts' && (
        <div className="space-y-3">
          {contracts.map(c => (
            <div key={c._id} className="bg-white rounded-lg border border-gray-100 p-4 flex items-center gap-4 shadow-sm">
              <div className="flex-1">
                <p className="font-medium text-gray-900">{c.title}</p>
                <p className="text-xs text-gray-500">{c.vendor_id?.name || 'Vendor'} · {c.type} · Ref: {c.contract_ref}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">KES {(c.value || 0).toLocaleString()}</p>
                <p className="text-xs text-gray-400">Expires {new Date(c.end_date).toLocaleDateString()}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[c.status] || 'bg-gray-100 text-gray-700'}`}>{c.status?.replace('_',' ')}</span>
            </div>
          ))}
          {contracts.length === 0 && <div className="text-center py-10 text-gray-400">No contracts found</div>}
        </div>
      )}

      {!loading && tab === 'detail' && selected && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selected.vendor?.name}</h3>
                <p className="text-sm text-gray-500 capitalize">{selected.vendor?.type?.replace('_',' ')}</p>
              </div>
              <div className="flex gap-2">
                {selected.vendor?.is_preferred && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">Preferred</span>}
                <button onClick={() => setShowContract(true)} className="bg-indigo-600 text-white px-3 py-1 rounded text-xs">+ Contract</button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[['Contact', selected.vendor?.contact_person],['Email', selected.vendor?.email],['Phone', selected.vendor?.phone],['City', selected.vendor?.city],['Rating', `${(selected.vendor?.rating || 0).toFixed(1)} / 5`],['Total Spend', `KES ${(selected.vendor?.total_spend || 0).toLocaleString()}`]].map(([l,v]) => (
                <div key={l}><p className="text-xs text-gray-400">{l}</p><p className="text-sm font-medium text-gray-800">{v || '—'}</p></div>
              ))}
            </div>
          </div>

          {selected.contracts?.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
              <h4 className="font-semibold text-gray-800 mb-3">Contracts ({selected.contracts.length})</h4>
              <div className="space-y-2">
                {selected.contracts.map(c => (
                  <div key={c._id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{c.title}</p>
                      <p className="text-xs text-gray-400">{c.contract_ref} · {new Date(c.start_date).toLocaleDateString()} – {new Date(c.end_date).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[c.status] || 'bg-gray-100 text-gray-700'}`}>{c.status?.replace('_',' ')}</span>
                      <p className="text-xs text-gray-500 mt-0.5">KES {(c.value || 0).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {showContract && (
            <div className="bg-white rounded-xl border border-indigo-100 p-6 shadow-sm">
              <h4 className="font-semibold text-gray-800 mb-4">Add Contract</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[['title','Title','text'],['start_date','Start Date','date'],['end_date','End Date','date'],['value','Value (KES)','number'],['payment_terms','Payment Terms','text']].map(([k,l,t]) => (
                  <div key={k}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{l}</label>
                    <input type={t} value={contractForm[k]} onChange={e => setContractForm(p => ({...p,[k]:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                  <select value={contractForm.type} onChange={e => setContractForm(p => ({...p,type:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                    {['service','supply','maintenance','lease','partnership','other'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={addContract} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm">Save Contract</button>
                <button onClick={() => setShowContract(false)} className="border border-gray-200 px-4 py-2 rounded-lg text-sm text-gray-600">Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
