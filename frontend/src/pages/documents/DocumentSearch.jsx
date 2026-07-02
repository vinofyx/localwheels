import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../api/client';

const _BASE = import.meta.env.VITE_API_URL || '/api';

const DOC_TYPES = ['invoice','lr','awb','pod','delivery_challan','packing_list','gst_invoice','eway_bill','driver_license','vehicle_rc','insurance','permit','fitness','puc','fastag','other'];

export default function DocumentSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [expiring, setExpiring] = useState([]);

  const q = searchParams.get('q') || '';
  const docType = searchParams.get('doc_type') || '';
  const customerName = searchParams.get('customer_name') || '';
  const vehicleNumber = searchParams.get('vehicle_number') || '';
  const lrNumber = searchParams.get('lr_number') || '';
  const dateFrom = searchParams.get('date_from') || '';
  const dateTo = searchParams.get('date_to') || '';

  const [form, setForm] = useState({ q, docType, customerName, vehicleNumber, lrNumber, dateFrom, dateTo });

  const search = (override = {}) => {
    const merged = { ...form, ...override };
    const params = new URLSearchParams();
    if (merged.q) params.set('q', merged.q);
    if (merged.docType) params.set('doc_type', merged.docType);
    if (merged.customerName) params.set('customer_name', merged.customerName);
    if (merged.vehicleNumber) params.set('vehicle_number', merged.vehicleNumber);
    if (merged.lrNumber) params.set('lr_number', merged.lrNumber);
    if (merged.dateFrom) params.set('date_from', merged.dateFrom);
    if (merged.dateTo) params.set('date_to', merged.dateTo);
    setSearchParams(params);
  };

  useEffect(() => {
    api.get(`${_BASE}/document-search/expiry-alerts?days=30`)
      .then(r => setExpiring(r.data.alerts || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!q && !docType && !customerName && !vehicleNumber && !lrNumber) {
      setResults([]); setTotal(0); return;
    }
    setLoading(true);
    const params = new URLSearchParams(searchParams);
    api.get(`${_BASE}/document-search?${params}`)
      .then(r => { setResults(r.data.results || []); setTotal(r.data.total || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [searchParams.toString()]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Document Search</h1>

      {/* Search Form */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        {/* Full text */}
        <div className="flex gap-3">
          <input
            value={form.q}
            onChange={e => setForm(f => ({ ...f, q: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && search()}
            placeholder="Search in OCR text, document names..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm"
          />
          <button onClick={() => search()} className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">Search</button>
        </div>

        {/* Advanced Filters */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Document Type</label>
            <select value={form.docType} onChange={e => setForm(f => ({ ...f, docType: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
              <option value="">Any</option>
              {DOC_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Customer Name</label>
            <input value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} placeholder="Partial match" className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Vehicle Number</label>
            <input value={form.vehicleNumber} onChange={e => setForm(f => ({ ...f, vehicleNumber: e.target.value }))} placeholder="MH12AB1234" className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">LR Number</label>
            <input value={form.lrNumber} onChange={e => setForm(f => ({ ...f, lrNumber: e.target.value }))} placeholder="LR-XXXX" className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">From Date</label>
            <input type="date" value={form.dateFrom} onChange={e => setForm(f => ({ ...f, dateFrom: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">To Date</label>
            <input type="date" value={form.dateTo} onChange={e => setForm(f => ({ ...f, dateTo: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
          </div>
        </div>
        <button onClick={() => { setForm({ q:'',docType:'',customerName:'',vehicleNumber:'',lrNumber:'',dateFrom:'',dateTo:'' }); setSearchParams({}); }} className="text-xs text-gray-400 hover:text-gray-600">Clear filters</button>
      </div>

      {/* Expiry Alerts */}
      {expiring.length > 0 && !q && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-orange-800 mb-2">⚠️ {expiring.length} Document{expiring.length !== 1 ? 's' : ''} Expiring Within 30 Days</h2>
          <div className="space-y-1">
            {expiring.slice(0, 5).map(d => (
              <div key={d._id} className="flex items-center justify-between text-xs">
                <Link to={`/documents/ocr/${d._id}`} className="text-orange-700 hover:underline">{d.name}</Link>
                <span className="text-orange-500">{new Date(d.expiry_date).toLocaleDateString()}</span>
              </div>
            ))}
            {expiring.length > 5 && <div className="text-xs text-orange-500">+{expiring.length - 5} more</div>}
          </div>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="text-center text-gray-400 py-8">Searching...</div>
      ) : results.length > 0 ? (
        <div className="space-y-3">
          <div className="text-sm text-gray-500">{total} result{total !== 1 ? 's' : ''} found{q ? ` for "${q}"` : ''}</div>
          {results.map(doc => (
            <Link key={doc._id} to={`/documents/ocr/${doc._id}`} className="block bg-white border border-gray-200 rounded-xl p-4 hover:border-indigo-300 hover:shadow-sm transition-all">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-800 truncate">{doc.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5 flex gap-3">
                    <span className="capitalize">{doc.doc_type?.replace(/_/g,' ')}</span>
                    <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                    {doc.ocr_confidence && <span>OCR: {Math.round(doc.ocr_confidence * 100)}%</span>}
                  </div>
                  {doc.extracted_fields && Object.values(doc.extracted_fields).filter(Boolean).length > 0 && (
                    <div className="text-xs text-gray-500 mt-1 truncate">
                      {Object.entries(doc.extracted_fields).filter(([,v]) => v).slice(0,4).map(([k,v]) => `${k.replace(/_/g,' ')}: ${v}`).join(' · ')}
                    </div>
                  )}
                </div>
                <span className={`ml-3 text-xs px-2 py-0.5 rounded-full shrink-0 ${
                  doc.approval_status === 'approved' ? 'bg-green-100 text-green-700' :
                  doc.approval_status === 'rejected' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>{doc.approval_status || 'pending'}</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (q || docType || customerName || vehicleNumber || lrNumber) ? (
        <div className="text-center text-gray-400 py-8">No documents found</div>
      ) : (
        <div className="text-center text-gray-300 py-12">
          <div className="text-4xl mb-2">🔍</div>
          <div className="text-sm">Enter a search term or use filters above</div>
        </div>
      )}
    </div>
  );
}
