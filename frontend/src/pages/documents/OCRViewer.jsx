import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/client';

const _BASE = import.meta.env.VITE_API_URL || '/api';

const FIELD_LABELS = {
  document_number: 'Document No.',
  invoice_number: 'Invoice No.',
  shipment_number: 'Shipment No.',
  lr_number: 'LR Number',
  awb_number: 'AWB Number',
  gst_number: 'GST Number',
  customer_name: 'Customer Name',
  customer_phone: 'Customer Phone',
  origin: 'Origin',
  destination: 'Destination',
  vehicle_number: 'Vehicle No.',
  driver_name: 'Driver Name',
  driver_license: 'Driver License',
  weight: 'Weight',
  packages: 'Packages',
  freight: 'Freight',
  insurance: 'Insurance',
  tax: 'Tax',
  total_amount: 'Total Amount',
  issue_date: 'Issue Date',
  expiry_date: 'Expiry Date',
};

export default function OCRViewer() {
  const { id } = useParams();
  const [doc, setDoc] = useState(null);
  const [ocr, setOcr] = useState(null);
  const [validation, setValidation] = useState(null);
  const [approval, setApproval] = useState(null);
  const [tab, setTab] = useState('fields');
  const [loading, setLoading] = useState(true);
  const [reprocessing, setReprocessing] = useState(false);
  const [validating, setValidating] = useState(false);
  const [aiReviewing, setAiReviewing] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get(`${_BASE}/documents/${id}`),
      api.get(`${_BASE}/ocr/${id}/result`).catch(() => ({ data: { result: null } })),
      api.get(`${_BASE}/document-validation/${id}`).catch(() => ({ data: { validation: null } })),
      api.get(`${_BASE}/document-approval/${id}`).catch(() => ({ data: { approval: null } })),
    ])
      .then(([d, o, v, a]) => {
        setDoc(d.data.document || d.data);
        setOcr(o.data.result);
        setValidation(v.data.validation);
        setApproval(a.data.approval);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const reprocess = async () => {
    setReprocessing(true);
    await api.post(`${_BASE}/ocr/${id}/reprocess`).catch(() => {});
    setTimeout(load, 3000);
    setReprocessing(false);
  };

  const validate = async () => {
    setValidating(true);
    await api.post(`${_BASE}/document-validation/${id}`).catch(() => {});
    load();
    setValidating(false);
  };

  const aiReview = async () => {
    setAiReviewing(true);
    await api.post(`${_BASE}/document-approval/${id}/ai-review`).catch(() => {});
    load();
    setAiReviewing(false);
  };

  const approve = async () => {
    await api.post(`${_BASE}/document-approval/${id}/approve`, { notes: 'Manually approved' });
    load();
  };

  const reject = async () => {
    const reason = prompt('Rejection reason:');
    if (!reason) return;
    await api.post(`${_BASE}/document-approval/${id}/reject`, { reason });
    load();
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Loading...</div>;
  if (!doc) return <div className="p-8 text-center text-red-500">Document not found</div>;

  const fields = ocr || doc.extracted_fields || {};
  const confidence = ocr?.confidence ?? doc.ocr_confidence ?? null;

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/documents/repository" className="text-gray-400 hover:text-gray-600 text-sm">← Repository</Link>
        <h1 className="text-xl font-bold text-gray-900 flex-1 truncate">{doc.name}</h1>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
          doc.approval_status === 'approved' ? 'bg-green-100 text-green-700' :
          doc.approval_status === 'rejected' ? 'bg-red-100 text-red-700' :
          'bg-yellow-100 text-yellow-700'
        }`}>{doc.approval_status || 'pending'}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Document Preview */}
        <div className="lg:col-span-2 space-y-4">
          {/* Preview */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700">Document Preview</h2>
              <a href={`${_BASE}/documents/${id}/download`} className="text-xs text-indigo-600 hover:underline">Download</a>
            </div>
            {doc.file_url || doc.file_path ? (
              ['.jpg','.jpeg','.png','.webp','.gif','.bmp'].some(ext => (doc.file_path||'').toLowerCase().endsWith(ext)) ? (
                <img src={`/uploads/documents/${doc.file_path?.split(/[/\\]/).pop()}`} alt={doc.name} className="max-h-96 rounded-lg object-contain mx-auto" />
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <div className="text-5xl mb-2">📄</div>
                  <p className="text-sm">{doc.mime_type || 'PDF document'}</p>
                  <a href={`/uploads/documents/${doc.file_path?.split(/[/\\]/).pop()}`} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline mt-2 block">Open File</a>
                </div>
              )
            ) : (
              <div className="text-center py-12 text-gray-300 text-sm">No preview available</div>
            )}
          </div>

          {/* OCR Raw Text */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-2">OCR Raw Text</h2>
            {doc.ocr_text ? (
              <pre className="text-xs text-gray-600 whitespace-pre-wrap max-h-48 overflow-y-auto bg-gray-50 rounded-lg p-3">{doc.ocr_text}</pre>
            ) : (
              <div className="text-center py-6 text-gray-400 text-sm">
                {doc.status === 'ocr_processing' ? '⏳ OCR in progress...' : 'No OCR text yet'}
              </div>
            )}
          </div>
        </div>

        {/* Right: Panels */}
        <div className="space-y-4">
          {/* Tabs */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex border-b border-gray-200">
              {['fields','validation','approval','audit'].map(t => (
                <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2 text-xs font-medium capitalize ${tab === t ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>
                  {t}
                </button>
              ))}
            </div>

            <div className="p-4">
              {/* Fields Tab */}
              {tab === 'fields' && (
                <div className="space-y-3">
                  {confidence !== null && (
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs text-gray-500">OCR Confidence</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2">
                        <div className={`h-2 rounded-full ${confidence >= 0.8 ? 'bg-green-500' : confidence >= 0.5 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${Math.round(confidence * 100)}%` }} />
                      </div>
                      <span className={`text-xs font-bold ${confidence >= 0.8 ? 'text-green-600' : confidence >= 0.5 ? 'text-yellow-600' : 'text-red-600'}`}>{Math.round(confidence * 100)}%</span>
                    </div>
                  )}
                  {Object.entries(FIELD_LABELS).map(([key, label]) => {
                    const val = fields[key];
                    if (!val) return null;
                    return (
                      <div key={key} className="flex items-start gap-2">
                        <span className="text-xs text-gray-400 w-28 shrink-0">{label}</span>
                        <span className="text-xs font-medium text-gray-800 break-all">{val}</span>
                      </div>
                    );
                  })}
                  {Object.values(fields).filter(Boolean).length === 0 && (
                    <div className="text-center text-gray-400 text-xs py-4">No fields extracted yet</div>
                  )}

                  {/* Auto-links */}
                  {(doc.linked_shipment_id || doc.linked_vehicle_id || doc.linked_driver_id || doc.linked_customer_id) && (
                    <div className="border-t border-gray-100 pt-3 mt-3">
                      <div className="text-xs font-semibold text-gray-500 mb-2">Auto-linked</div>
                      {doc.linked_shipment_id && <div className="text-xs text-indigo-600">Shipment: {doc.linked_lr || doc.linked_shipment_id}</div>}
                      {doc.linked_vehicle_id && <div className="text-xs text-indigo-600">Vehicle: {doc.linked_vehicle_id}</div>}
                      {doc.linked_driver_id && <div className="text-xs text-indigo-600">Driver: {doc.linked_driver_id}</div>}
                      {doc.linked_customer_id && <div className="text-xs text-indigo-600">Customer: {doc.linked_customer_id}</div>}
                    </div>
                  )}
                </div>
              )}

              {/* Validation Tab */}
              {tab === 'validation' && (
                <div className="space-y-2">
                  {validation ? (
                    <>
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`text-sm font-bold ${validation.is_valid ? 'text-green-600' : 'text-red-600'}`}>
                          {validation.is_valid ? '✅ Valid' : '❌ Invalid'}
                        </span>
                        <span className="text-xs text-gray-500">Score: {validation.score}%</span>
                        <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${validation.fraud_risk === 'high' ? 'bg-red-100 text-red-700' : validation.fraud_risk === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                          Fraud: {validation.fraud_risk}
                        </span>
                      </div>
                      {validation.checks?.map((c, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          <span>{c.passed ? '✅' : '❌'}</span>
                          <span className="text-gray-700">{c.message}</span>
                        </div>
                      ))}
                      {validation.validation_errors?.length > 0 && (
                        <div className="mt-2 bg-red-50 rounded-lg p-2">
                          {validation.validation_errors.map((e, i) => <div key={i} className="text-xs text-red-700">• {e.message}</div>)}
                        </div>
                      )}
                      {validation.warnings?.length > 0 && (
                        <div className="mt-2 bg-yellow-50 rounded-lg p-2">
                          {validation.warnings.map((w, i) => <div key={i} className="text-xs text-yellow-700">⚠ {w.message}</div>)}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-4 text-gray-400 text-sm">Not validated yet</div>
                  )}
                </div>
              )}

              {/* Approval Tab */}
              {tab === 'approval' && (
                <div className="space-y-3">
                  {approval ? (
                    <>
                      <div className="text-sm font-semibold text-gray-700 capitalize">Stage: {approval.current_stage?.replace(/_/g,' ')}</div>
                      {approval.ai_decision && <div className="text-xs text-gray-600">AI Decision: <strong>{approval.ai_decision}</strong> — {approval.ai_notes}</div>}
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {approval.history?.map((h, i) => (
                          <div key={i} className="text-xs border-l-2 border-indigo-200 pl-2">
                            <div className="font-medium text-gray-700">{h.stage} — {h.action}</div>
                            <div className="text-gray-400">{h.actor_name} · {new Date(h.timestamp).toLocaleString()}</div>
                            {h.notes && <div className="text-gray-500">{h.notes}</div>}
                          </div>
                        ))}
                      </div>
                    </>
                  ) : <div className="text-center py-4 text-gray-400 text-sm">No approval record</div>}
                </div>
              )}

              {/* Audit Tab */}
              {tab === 'audit' && (
                <div className="text-xs text-center text-gray-400 py-4">
                  <Link to={`/documents/repository`} className="text-indigo-600">View full audit trail in repository</Link>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
            <h2 className="text-xs font-semibold text-gray-500 uppercase mb-3">Actions</h2>
            <button onClick={reprocess} disabled={reprocessing} className="w-full py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-sm hover:bg-indigo-100 disabled:opacity-50">
              {reprocessing ? 'Reprocessing...' : '🔍 Reprocess OCR'}
            </button>
            <button onClick={validate} disabled={validating} className="w-full py-2 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg text-sm hover:bg-yellow-100 disabled:opacity-50">
              {validating ? 'Validating...' : '✔️ Validate'}
            </button>
            <button onClick={aiReview} disabled={aiReviewing} className="w-full py-2 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-sm hover:bg-purple-100 disabled:opacity-50">
              {aiReviewing ? 'Reviewing...' : '🤖 AI Review'}
            </button>
            {doc.approval_status !== 'approved' && (
              <button onClick={approve} className="w-full py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm hover:bg-green-100">
                ✅ Approve
              </button>
            )}
            {doc.approval_status !== 'rejected' && (
              <button onClick={reject} className="w-full py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm hover:bg-red-100">
                ❌ Reject
              </button>
            )}
          </div>

          {/* Doc Info */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2 text-xs">
            <div className="flex justify-between"><span className="text-gray-400">Type</span><span className="font-medium capitalize">{doc.doc_type?.replace(/_/g,' ')}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Status</span><span className="font-medium">{doc.status}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Size</span><span>{doc.size_bytes ? (doc.size_bytes/1024).toFixed(0)+' KB' : '—'}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Uploaded</span><span>{new Date(doc.createdAt).toLocaleDateString()}</span></div>
            {doc.is_duplicate && <div className="text-orange-600 font-medium">⚠ Duplicate document</div>}
            {doc.fraud_risk === 'high' && <div className="text-red-600 font-medium">🚨 High fraud risk</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
