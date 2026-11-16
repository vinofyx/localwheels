const express = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const POD = require('../models/POD');
const Shipment = require('../models/Shipment');
const { authenticate, requireBranchAccess, requireRole } = require('../middleware/auth');

const mongoose = require('mongoose');
const router = express.Router();
const isValidId = id => id && mongoose.Types.ObjectId.isValid(id);

function fmtDate(d) {
  if (!d) return null;
  const dt = new Date(d);
  if (isNaN(dt)) return null;
  return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`;
}

const fs = require('fs');
const uploadDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeShipmentId = String(req.params.shipmentId || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '');
    const rand = crypto.randomBytes(6).toString('hex');
    cb(null, `pod_${safeShipmentId}_${Date.now()}_${rand}${ext}`);
  },
});
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.pdf']);
const ALLOWED_MIMETYPES  = new Set(['image/jpeg', 'image/png', 'application/pdf']);

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype.toLowerCase();
    if (ALLOWED_EXTENSIONS.has(ext) && ALLOWED_MIMETYPES.has(mime)) {
      return cb(null, true);
    }
    cb(new Error(`Invalid file type. Allowed: JPG, PNG, PDF`));
  },
});

// ── GET /api/pod ──────────────────────────────────────────────────────────────
router.get('/', authenticate, requireBranchAccess, async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    // Get shipment IDs scoped to this branch
    const shipments = await Shipment.find({
      company_id: req.user.company_id,
      branch_id:  req.branchId,
    }).select('_id').lean();
    const shipmentIds = shipments.map(s => s._id);

    const podFilter = { shipment_id: { $in: shipmentIds } };
    if (status) podFilter.status = status;

    const total = await POD.countDocuments(podFilter);
    const pods = await POD.find(podFilter)
      .populate('shipment_id', 'lr_number sender_name receiver_name destination booking_date')
      .sort({ _id: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .lean();

    const data = pods.map(p => ({
      ...p,
      id:            p._id.toString(),                        // ← normalised id
      shipment_id:   p.shipment_id?._id?.toString() || p.shipment_id?.toString(), // ← always string
      lr_number:     p.shipment_id?.lr_number,
      sender_name:   p.shipment_id?.sender_name,
      receiver_name: p.shipment_id?.receiver_name,
      destination:   p.shipment_id?.destination,
      booking_date:  fmtDate(p.shipment_id?.booking_date),
      delivery_date: fmtDate(p.delivery_date),
      uploaded_at:   fmtDate(p.uploaded_at),
    }));

    res.json({ data, pagination: { total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/pod ─────────────────────────────────────────────────────────────
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { shipment_id, receiver_name, delivery_date, remarks, delivery_status } = req.body;
    if (!shipment_id || !isValidId(shipment_id)) {
      return res.status(400).json({ error: 'Valid shipment_id required' });
    }

    // Verify shipment belongs to user's company
    const shipment = await Shipment.findOne({ _id: shipment_id, company_id: req.user.company_id });
    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    const pod = await POD.findOneAndUpdate(
      { shipment_id, company_id: req.user.company_id },
      {
        company_id:    req.user.company_id,
        shipment_id,
        status:        delivery_status === 'delivered' ? 'verified' : 'pending',
        receiver_name,
        delivery_date: delivery_date ? new Date(delivery_date) : new Date(),
        remarks,
        uploaded_by:   req.user.id,
        uploaded_at:   new Date(),
      },
      { upsert: true, new: true }
    );

    if (delivery_status === 'delivered') {
      await Shipment.findOneAndUpdate(
        { _id: shipment_id, company_id: req.user.company_id },
        { status: 'delivered' }
      );
    }

    res.status(201).json({ id: pod._id.toString(), _id: pod._id.toString(), pod });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/pod/:shipmentId/upload ─────────────────────────────────────────
router.post('/:shipmentId/upload', authenticate, upload.single('file'), async (req, res, next) => {
  try {
    if (!isValidId(req.params.shipmentId)) return res.status(400).json({ error: 'Invalid shipment ID' });

    // Validate that the shipment belongs to user's company
    const shipment = await Shipment.findOne({ _id: req.params.shipmentId, company_id: req.user.company_id });
    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    const { receiver_name, delivery_date } = req.body;
    const filePath = req.file ? `/uploads/${req.file.filename}` : null;

    await POD.findOneAndUpdate(
      { shipment_id: req.params.shipmentId, company_id: req.user.company_id },
      {
        company_id:    req.user.company_id,
        shipment_id:   req.params.shipmentId,
        status:        'uploaded',
        uploaded_file: filePath,
        receiver_name,
        delivery_date: delivery_date ? new Date(delivery_date) : null,
        uploaded_by:   req.user.id,
        uploaded_at:   new Date(),
      },
      { upsert: true }
    );

    res.json({ success: true, file: filePath });
  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/pod/:shipmentId/verify ────────────────────────────────────────
router.patch('/:shipmentId/verify', authenticate, requireRole('admin', 'superadmin', 'manager'), async (req, res, next) => {
  try {
    if (!isValidId(req.params.shipmentId)) return res.status(400).json({ error: 'Invalid shipment ID' });

    // Validate shipment ownership
    const shipment = await Shipment.findOne({ _id: req.params.shipmentId, company_id: req.user.company_id });
    if (!shipment) return res.status(404).json({ error: 'Shipment not found' });

    const pod = await POD.findOneAndUpdate(
      { shipment_id: req.params.shipmentId, company_id: req.user.company_id },
      { status: 'verified' },
      { new: true }
    );
    if (!pod) return res.status(404).json({ error: 'POD not found' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
