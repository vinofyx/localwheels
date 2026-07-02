import { useState, useEffect } from 'react';
import api from '../../api/client';

const _BASE = import.meta.env.VITE_API_URL || '/api';

export default function BarcodeCenter() {
  const [tab, setTab] = useState('generate');
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWH, setSelectedWH] = useState('');
  const [genType, setGenType] = useState('sku');
  const [genData, setGenData] = useState({ sku: '', product_name: '' });
  const [generated, setGenerated] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [scanCode, setScanCode] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [bulkTarget, setBulkTarget] = useState('bins');
  const [bulking, setBulking] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);
  const [lookup, setLookup] = useState('');
  const [lookupResult, setLookupResult] = useState(null);

  useEffect(() => {
    api.get(`${_BASE}/warehouses`).then(r => {
      const whs = r.data?.data?.warehouses || [];
      setWarehouses(whs);
      if (whs.length) setSelectedWH(whs[0]._id);
    }).catch(() => {});
  }, []);

  const generate = async () => {
    setGenerating(true);
    try {
      const r = await api.post(`${_BASE}/barcode/generate`, { type: genType, data: genData });
      setGenerated(r.data);
    } catch (e) { alert(e.response?.data?.error || 'Error'); }
    setGenerating(false);
  };

  const scan = async () => {
    if (!scanCode) return;
    setScanning(true);
    try {
      const r = await api.post(`${_BASE}/barcode/scan`, { barcode: scanCode });
      setScanResult(r.data);
    } catch (e) {
      setScanResult({ error: e.response?.data?.error || 'Barcode not found' });
    }
    setScanning(false);
  };

  const bulkGenerate = async () => {
    if (!selectedWH) return;
    setBulking(true);
    try {
      const r = await api.post(`${_BASE}/barcode/bulk-generate`, { warehouse_id: selectedWH, target: bulkTarget });
      setBulkResult(r.data);
    } catch (e) { alert(e.response?.data?.error || 'Error'); }
    setBulking(false);
  };

  const doLookup = async () => {
    if (!lookup) return;
    try {
      const r = await api.get(`${_BASE}/barcode/lookup/${lookup}`);
      setLookupResult(r.data);
    } catch (e) { setLookupResult({ found: false }); }
  };

  // Simple visual barcode renderer using bars
  const BarcodeDisplay = ({ code }) => (
    <div className="bg-white border border-gray-200 rounded-xl p-6 text-center space-y-3">
      <div className="flex justify-center gap-0.5 h-16">
        {code.split('').map((c, i) => {
          const width = (parseInt(c, 16) % 3) + 1;
          return <div key={i} className="bg-gray-900" style={{ width: `${width * 3}px`, height: '100%' }} />;
        })}
      </div>
      <div className="font-mono text-sm font-bold tracking-widest text-gray-800">{code}</div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Barcode Center</h1><p className="text-sm text-gray-500 mt-0.5">Generate, scan, and lookup barcodes & QR codes</p></div>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {['generate','scan','bulk','lookup'].map(t => <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize ${tab === t ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500'}`}>{t}</button>)}
      </div>

      {tab === 'generate' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-800">Generate Barcode / QR</h3>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Type</label>
              <div className="flex gap-2">
                {['sku','bin','inventory'].map(t => <button key={t} onClick={() => setGenType(t)} className={`px-3 py-1.5 rounded-lg text-sm ${genType === t ? 'bg-indigo-600 text-white' : 'border border-gray-300 text-gray-600'}`}>{t.toUpperCase()}</button>)}
              </div>
            </div>
            {genType === 'sku' && (
              <>
                <div><label className="text-xs text-gray-500 mb-1 block">SKU *</label><input value={genData.sku || ''} onChange={e => setGenData(p => ({ ...p, sku: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="text-xs text-gray-500 mb-1 block">Product Name</label><input value={genData.product_name || ''} onChange={e => setGenData(p => ({ ...p, product_name: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
              </>
            )}
            {(genType === 'bin' || genType === 'inventory') && (
              <div><label className="text-xs text-gray-500 mb-1 block">Record ID</label><input value={genData.reference_id || ''} onChange={e => setGenData({ reference_id: e.target.value })} placeholder="MongoDB _id" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono" /></div>
            )}
            <button onClick={generate} disabled={generating} className="w-full py-2 bg-indigo-600 text-white text-sm rounded-lg disabled:opacity-50">{generating ? 'Generating...' : '📊 Generate'}</button>
          </div>

          {generated && (
            <div className="space-y-4">
              <BarcodeDisplay code={generated.barcode} />
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <div className="text-xs font-semibold text-gray-600 mb-2">Label Data</div>
                {generated.label_data && Object.entries(generated.label_data).filter(([k]) => !['barcode','qr_data'].includes(k) && k).map(([k, v]) => (
                  <div key={k} className="flex text-xs py-0.5"><span className="text-gray-400 w-28">{k}</span><span className="text-gray-800 font-medium">{String(v)}</span></div>
                ))}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">QR Data (base64)</div>
                  <div className="font-mono text-xs text-gray-700 break-all bg-white rounded p-2">{generated.qr_data?.substring(0, 80)}...</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'scan' && (
        <div className="max-w-md space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-gray-800">Scan Barcode</h3>
            <div className="flex gap-2">
              <input value={scanCode} onChange={e => setScanCode(e.target.value)} onKeyDown={e => e.key === 'Enter' && scan()} placeholder="Enter or scan barcode..." className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-indigo-400" autoFocus />
              <button onClick={scan} disabled={scanning} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg disabled:opacity-50">{scanning ? '...' : 'Scan'}</button>
            </div>
            <p className="text-xs text-gray-400">Press Enter to scan. In a physical warehouse, connect a USB barcode scanner.</p>
          </div>
          {scanResult && (
            <div className={`bg-white border rounded-xl p-5 ${scanResult.error ? 'border-red-300' : 'border-green-300'}`}>
              {scanResult.error ? (
                <div className="text-red-600 text-sm">❌ {scanResult.error}</div>
              ) : (
                <div>
                  <div className="text-green-700 font-medium mb-2">✅ Found: {scanResult.type}</div>
                  {scanResult.inventory && (<>
                    <div className="text-sm font-bold text-gray-800">{scanResult.inventory.sku} — {scanResult.inventory.product_name}</div>
                    <div className="text-xs text-gray-500">Qty: {scanResult.inventory.quantity} · Status: {scanResult.inventory.status}</div>
                  </>)}
                  {scanResult.bin && (<>
                    <div className="text-sm font-bold text-gray-800">Bin: {scanResult.bin.bin_code}</div>
                    <div className="text-xs text-gray-500">Status: {scanResult.bin.status} · SKU: {scanResult.bin.sku || '—'}</div>
                  </>)}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {tab === 'bulk' && (
        <div className="max-w-md space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-gray-800">Bulk Barcode Generation</h3>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Warehouse</label>
              <select value={selectedWH} onChange={e => setSelectedWH(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Target</label>
              <div className="flex gap-2">
                {['bins','inventory'].map(t => <button key={t} onClick={() => setBulkTarget(t)} className={`px-4 py-1.5 rounded-lg text-sm ${bulkTarget === t ? 'bg-indigo-600 text-white' : 'border border-gray-300 text-gray-600'}`}>{t}</button>)}
              </div>
            </div>
            <button onClick={bulkGenerate} disabled={bulking || !selectedWH} className="w-full py-2 bg-indigo-600 text-white text-sm rounded-lg disabled:opacity-50">{bulking ? 'Generating...' : `Generate for all ${bulkTarget}`}</button>
          </div>
          {bulkResult && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="font-medium text-green-800">✅ {bulkResult.message}</div>
              <div className="text-sm text-green-700 mt-1">{bulkResult.updated} barcodes generated</div>
            </div>
          )}
        </div>
      )}

      {tab === 'lookup' && (
        <div className="max-w-md space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-semibold">Quick Lookup</h3>
            <div className="flex gap-2">
              <input value={lookup} onChange={e => setLookup(e.target.value)} onKeyDown={e => e.key === 'Enter' && doLookup()} placeholder="Enter barcode or SKU..." className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none" />
              <button onClick={doLookup} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg">Search</button>
            </div>
          </div>
          {lookupResult && (
            <div className={`bg-white border rounded-xl p-5 ${lookupResult.found ? 'border-indigo-300' : 'border-gray-200'}`}>
              {lookupResult.found ? (
                <div>
                  <div className="font-medium text-indigo-800 mb-2">Found: {lookupResult.type}</div>
                  <pre className="text-xs text-gray-700 overflow-auto">{JSON.stringify(lookupResult.data, null, 2)}</pre>
                </div>
              ) : <div className="text-gray-400 text-sm">Nothing found for "{lookup}"</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
