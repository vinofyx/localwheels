import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/client';

const _BASE = import.meta.env.VITE_API_URL || '/api';

export default function VersionHistory() {
  const { id } = useParams();
  const [doc, setDoc] = useState(null);
  const [versions, setVersions] = useState([]);
  const [audit, setAudit] = useState([]);
  const [tab, setTab] = useState('versions');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`${_BASE}/documents/${id}`),
      api.get(`${_BASE}/documents/${id}/versions`),
      api.get(`${_BASE}/documents/${id}/audit`),
    ])
      .then(([d, v, a]) => {
        setDoc(d.data.document || d.data);
        setVersions(v.data.versions || []);
        setAudit(a.data.audit || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8 text-center text-gray-400">Loading...</div>;

  return (
    <div className="p-6 space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Link to={`/documents/ocr/${id}`} className="text-gray-400 hover:text-gray-600 text-sm">← OCR Viewer</Link>
        <h1 className="text-xl font-bold text-gray-900 truncate">{doc?.name}</h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {['versions','audit'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium capitalize ${tab === t ? 'border-b-2 border-indigo-600 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}>
            {t} {t === 'versions' ? `(${versions.length})` : `(${audit.length})`}
          </button>
        ))}
      </div>

      {/* Versions */}
      {tab === 'versions' && (
        <div className="space-y-3">
          {/* Current Version */}
          {doc && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full">Current</span>
                  <div className="mt-1 font-medium text-gray-800">{doc.name}</div>
                  <div className="text-xs text-gray-500">
                    v{doc.version || 1} · {doc.size_bytes ? (doc.size_bytes/1024).toFixed(0)+' KB' : ''} · {new Date(doc.updatedAt).toLocaleString()}
                  </div>
                </div>
                <a href={`${_BASE}/documents/${id}/download`} className="text-xs text-indigo-600 hover:underline">Download</a>
              </div>
            </div>
          )}

          {versions.length === 0 ? (
            <div className="text-center text-gray-400 py-8 text-sm">No previous versions</div>
          ) : (
            versions.map(v => (
              <div key={v._id} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-gray-500">v{v.version}</span>
                    <div className="text-sm font-medium text-gray-700 mt-0.5">
                      {v.size_bytes ? (v.size_bytes/1024).toFixed(0)+' KB' : 'Size unknown'}
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(v.createdAt).toLocaleString()}
                      {v.change_notes && ` · ${v.change_notes}`}
                    </div>
                  </div>
                  {v.file_path && (
                    <a href={`/uploads/documents/${v.file_path?.split(/[/\\]/).pop()}`} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline">Download</a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Audit Trail */}
      {tab === 'audit' && (
        <div className="space-y-2">
          {audit.length === 0 ? (
            <div className="text-center text-gray-400 py-8 text-sm">No audit events</div>
          ) : (
            <div className="relative pl-6">
              <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gray-200" />
              {audit.map((a, i) => (
                <div key={a._id || i} className="relative mb-4">
                  <div className="absolute -left-4 top-1 w-3 h-3 rounded-full bg-indigo-200 border-2 border-indigo-500" />
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs font-semibold text-gray-700 capitalize">{a.action?.replace(/_/g,' ')}</span>
                        <div className="text-xs text-gray-400 mt-0.5">{a.actor_name || 'System'}</div>
                      </div>
                      <span className="text-xs text-gray-400">{new Date(a.createdAt).toLocaleString()}</span>
                    </div>
                    {a.metadata && Object.keys(a.metadata).length > 0 && (
                      <div className="mt-1 text-xs text-gray-500">{JSON.stringify(a.metadata)}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
