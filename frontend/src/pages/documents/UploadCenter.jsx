import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';

const _BASE = import.meta.env.VITE_API_URL || '/api';

const DOC_TYPES = ['invoice','lr','awb','pod','delivery_challan','packing_list','gst_invoice','eway_bill','driver_license','vehicle_rc','insurance','permit','fitness','puc','fastag','customer_doc','vendor_doc','purchase_bill','fuel_bill','other'];

const ACCEPT = '.pdf,.jpg,.jpeg,.png,.gif,.webp,.bmp,.tiff,.heic';

function FileItem({ file, status, progress, result, error }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${
      status === 'done' ? 'border-green-200 bg-green-50' :
      status === 'error' ? 'border-red-200 bg-red-50' :
      status === 'uploading' ? 'border-blue-200 bg-blue-50' :
      'border-gray-200 bg-gray-50'
    }`}>
      <span className="text-xl">
        {status === 'done' ? '✅' : status === 'error' ? '❌' : status === 'uploading' ? '⏳' : '📄'}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-800 truncate">{file.name}</div>
        <div className="text-xs text-gray-500">{(file.size / 1024).toFixed(0)} KB</div>
        {status === 'uploading' && (
          <div className="mt-1 bg-blue-100 rounded-full h-1">
            <div className="bg-blue-500 h-1 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}
        {status === 'done' && result && (
          <div className="text-xs text-green-700 mt-0.5">
            Detected: {result.document?.doc_type || 'unknown'} · OCR queued
            {result.is_duplicate && <span className="ml-2 text-orange-600 font-medium">⚠ Duplicate</span>}
          </div>
        )}
        {error && <div className="text-xs text-red-600 mt-0.5">{error}</div>}
      </div>
      {status === 'done' && result?.document?._id && (
        <Link to={`/documents/ocr/${result.document._id}`} className="text-xs text-indigo-600 hover:underline shrink-0">View</Link>
      )}
    </div>
  );
}

export default function UploadCenter() {
  const [files, setFiles] = useState([]);
  const [docType, setDocType] = useState('');
  const [folderId, setFolderId] = useState('');
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef();

  const addFiles = (newFiles) => {
    const items = Array.from(newFiles).map(f => ({
      file: f,
      id: Math.random().toString(36).slice(2),
      status: 'pending',
      progress: 0,
      result: null,
      error: null,
    }));
    setFiles(prev => [...prev, ...items]);
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  }, []);

  const uploadFile = async (item) => {
    const formData = new FormData();
    formData.append('file', item.file);
    if (docType) formData.append('doc_type', docType);
    if (folderId) formData.append('folder_id', folderId);
    formData.append('name', item.file.name);

    setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'uploading', progress: 10 } : f));

    try {
      const res = await api.post(`${_BASE}/documents/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          const pct = Math.round((e.loaded / e.total) * 90);
          setFiles(prev => prev.map(f => f.id === item.id ? { ...f, progress: pct } : f));
        },
      });
      setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'done', progress: 100, result: res.data } : f));
    } catch (err) {
      setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'error', error: err.response?.data?.error || 'Upload failed' } : f));
    }
  };

  const uploadAll = async () => {
    const pending = files.filter(f => f.status === 'pending');
    if (pending.length === 0) return;
    setUploading(true);
    for (const item of pending) {
      await uploadFile(item);
    }
    setUploading(false);
  };

  const removeFile = (id) => setFiles(prev => prev.filter(f => f.id !== id));
  const clearDone = () => setFiles(prev => prev.filter(f => f.status !== 'done'));

  const pendingCount = files.filter(f => f.status === 'pending').length;
  const doneCount = files.filter(f => f.status === 'done').length;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/documents" className="text-gray-400 hover:text-gray-600">← Dashboard</Link>
        <h1 className="text-2xl font-bold text-gray-900">Upload Center</h1>
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Document Type (optional)</label>
          <select value={docType} onChange={e => setDocType(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">Auto-detect</option>
            {DOC_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Folder (optional)</label>
          <input value={folderId} onChange={e => setFolderId(e.target.value)} placeholder="Folder ID" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
          dragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
        }`}
      >
        <div className="text-4xl mb-3">📤</div>
        <p className="text-gray-700 font-medium">Drag & drop files here</p>
        <p className="text-sm text-gray-400 mt-1">or click to browse</p>
        <p className="text-xs text-gray-400 mt-2">PDF, JPG, PNG, WEBP, TIFF · Max 50MB per file · Up to 20 files</p>
        <input ref={inputRef} type="file" multiple accept={ACCEPT} className="hidden" onChange={e => addFiles(e.target.files)} />
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">{files.length} file(s) · {doneCount} uploaded</span>
            <div className="flex gap-2">
              {doneCount > 0 && <button onClick={clearDone} className="text-xs text-gray-500 hover:text-gray-700">Clear Done</button>}
              <button onClick={() => setFiles([])} className="text-xs text-red-500 hover:text-red-700">Clear All</button>
            </div>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {files.map(item => (
              <div key={item.id} className="relative">
                <FileItem {...item} />
                {item.status === 'pending' && (
                  <button onClick={() => removeFile(item.id)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-xs">✕</button>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button
              onClick={uploadAll}
              disabled={uploading || pendingCount === 0}
              className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : `Upload ${pendingCount} File${pendingCount !== 1 ? 's' : ''}`}
            </button>
            <Link to="/documents/repository" className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
              View Repository
            </Link>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
        <strong>After upload:</strong> AI will automatically detect document type, extract all fields via OCR, check for duplicates, and link to existing shipments, drivers, vehicles and customers.
      </div>
    </div>
  );
}
