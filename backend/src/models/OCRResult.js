const mongoose = require('mongoose');

const ocrResultSchema = new mongoose.Schema({
  document_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true, index: true },
  company_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  job_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'OCRJob' },

  raw_text:    { type: String },
  confidence:  { type: Number, default: 0 },
  page_count:  { type: Number, default: 1 },

  detected_doc_type: String,
  doc_type_confidence: { type: Number, default: 0 },

  extracted_fields: {
    document_type:    String,
    document_number:  String,
    invoice_number:   String,
    shipment_number:  String,
    lr_number:        String,
    awb_number:       String,
    gst_number:       String,
    customer_name:    String,
    customer_phone:   String,
    origin:           String,
    destination:      String,
    vehicle_number:   String,
    driver_name:      String,
    driver_license:   String,
    weight:           String,
    packages:         String,
    freight:          String,
    insurance:        String,
    tax:              String,
    total_amount:     String,
    issue_date:       String,
    expiry_date:      String,
    extra:            { type: mongoose.Schema.Types.Mixed },
  },

  tables:          [{ type: mongoose.Schema.Types.Mixed }],
  barcodes:        [String],
  qr_codes:        [String],
  has_signature:   { type: Boolean, default: false },
  has_stamp:       { type: Boolean, default: false },
  is_handwritten:  { type: Boolean, default: false },

  processing_time_ms: Number,
  model_used:         { type: String, default: 'claude-haiku-4-5-20251001' },
  provider:           { type: String, default: 'anthropic' },
  error:              String,

}, { timestamps: true });

module.exports = mongoose.model('OCRResult', ocrResultSchema);
