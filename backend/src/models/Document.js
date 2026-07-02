const mongoose = require('mongoose');

const DOC_TYPES = [
  'invoice','lr','awb','pod','delivery_challan','packing_list','gst_invoice',
  'eway_bill','driver_license','vehicle_rc','insurance','permit','fitness',
  'puc','fastag','customer_doc','vendor_doc','purchase_bill','fuel_bill','other'
];

const documentSchema = new mongoose.Schema({
  company_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  branch_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', index: true },
  folder_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'DocumentFolder' },
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'DocumentCategory' },

  name:          { type: String, required: true },
  original_name: { type: String, required: true },
  file_path:     { type: String },
  file_url:      { type: String },
  mime_type:     { type: String },
  size_bytes:    { type: Number, default: 0 },
  thumbnail_url: { type: String },

  doc_type:   { type: String, enum: DOC_TYPES, default: 'other' },
  status:     {
    type: String,
    enum: ['uploading','processing','ocr_pending','ocr_processing','ocr_done',
           'validation_pending','validation_done','approval_pending',
           'approved','rejected','correction_required','archived','deleted'],
    default: 'ocr_pending',
    index: true,
  },

  tags:        [{ type: String }],
  is_favorite: { type: Boolean, default: false },
  is_deleted:  { type: Boolean, default: false, index: true },
  deleted_at:  Date,
  deleted_by:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  is_archived: { type: Boolean, default: false },
  archived_at: Date,

  version:       { type: Number, default: 1 },
  parent_doc_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },

  // OCR
  ocr_text:         { type: String },
  ocr_confidence:   { type: Number, default: 0 },
  extracted_fields: { type: mongoose.Schema.Types.Mixed, default: {} },
  ocr_job_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'OCRJob' },
  ocr_processed_at: Date,

  // Auto-links
  linked_shipment_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment' },
  linked_lr:           { type: String, index: true },
  linked_awb:          { type: String, index: true },
  linked_vehicle_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
  linked_driver_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  linked_customer_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  linked_complaint_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint' },
  linked_quote_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Quote' },

  // Validation
  validation_status:   { type: String, enum: ['pending','pass','fail','warning'], default: 'pending' },
  validation_errors:   [String],
  validation_warnings: [String],

  // Approval
  approval_status:  { type: String, enum: ['pending','ai_reviewed','supervisor_review','approved','rejected','correction_required'], default: 'pending' },
  approved_by:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approved_at:      Date,
  rejection_reason: String,

  // Fraud / security
  is_duplicate:  { type: Boolean, default: false },
  duplicate_of:  { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
  fraud_risk:    { type: String, enum: ['low','medium','high'], default: 'low' },
  checksum:      String,

  // Expiry tracking
  expiry_date:       Date,
  expiry_alert_sent: { type: Boolean, default: false },

  // Access stats
  view_count:     { type: Number, default: 0 },
  download_count: { type: Number, default: 0 },
  last_accessed:  Date,

  uploaded_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes:       String,

}, { timestamps: true });

documentSchema.index({ company_id: 1, doc_type: 1 });
documentSchema.index({ company_id: 1, is_deleted: 1, status: 1 });
documentSchema.index({ company_id: 1, folder_id: 1, is_deleted: 1 });
documentSchema.index({ company_id: 1, approval_status: 1 });
documentSchema.index({ company_id: 1, expiry_date: 1 });
documentSchema.index({ ocr_text: 'text', name: 'text' });

module.exports = mongoose.model('Document', documentSchema);
