const crypto = require('crypto');

const ALLOWED_MIME = {
  image:    ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
  video:    ['video/mp4', 'video/quicktime', 'video/webm'],
  document: ['application/pdf', 'application/msword',
             'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  audio:    ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/ogg'],
};

const ALL_ALLOWED_MIME = Object.values(ALLOWED_MIME).flat();

const MAX_SIZE_KB = {
  image: 8192, video: 51200, document: 10240, audio: 15360,
};

// ─── Filename sanitization ─────────────────────────────────────────────────────
function sanitizeFilename(name) {
  const base = (name || 'file').split(/[\\/]/).pop();
  return base
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .slice(-150);
}

function categoryForMime(mime) {
  for (const [cat, list] of Object.entries(ALLOWED_MIME)) {
    if (list.includes(mime)) return cat;
  }
  return null;
}

// ─── Validate a single attachment before persisting ───────────────────────────
// fileBuffer is optional — when provided, a content hash is computed for
// duplicate detection. Caller is responsible for actual storage/encryption.
function validateAttachment({ file_name, mime_type, file_size_kb, fileBuffer }) {
  const errors = [];

  const category = categoryForMime(mime_type);
  if (!category) {
    errors.push(`MIME type "${mime_type}" is not allowed`);
  } else if (file_size_kb > MAX_SIZE_KB[category]) {
    errors.push(`File exceeds maximum size of ${MAX_SIZE_KB[category]}KB for ${category} uploads`);
  }

  const safe_name = sanitizeFilename(file_name);
  if (!safe_name || safe_name === '_') errors.push('Invalid filename');

  // Basic image header check (magic bytes) when buffer is available
  if (fileBuffer && category === 'image') {
    const isValidImage = checkImageMagicBytes(fileBuffer, mime_type);
    if (!isValidImage) errors.push('File content does not match declared image type');
  }

  const content_hash = fileBuffer ? crypto.createHash('sha256').update(fileBuffer).digest('hex') : null;

  return {
    valid:        errors.length === 0,
    errors,
    category,
    safe_name,
    content_hash,
    // Placeholder for future AV integration — currently always "clean" until wired up
    virus_scan_status: 'not_scanned',
  };
}

function checkImageMagicBytes(buf, mime) {
  if (!buf || buf.length < 4) return false;
  const sig = buf.subarray(0, 4).toString('hex');
  if (mime === 'image/jpeg') return sig.startsWith('ffd8');
  if (mime === 'image/png')  return sig === '89504e47';
  if (mime === 'image/webp') return buf.subarray(8, 12).toString() === 'WEBP';
  return true; // heic/others: skip strict check
}

module.exports = { validateAttachment, sanitizeFilename, ALLOWED_MIME, ALL_ALLOWED_MIME, MAX_SIZE_KB };
