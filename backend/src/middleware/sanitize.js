/**
 * NoSQL Injection & MongoDB Operator Protection Middleware
 *
 * Recursively inspects and sanitizes request bodies, query parameters,
 * and route parameters to strip any keys beginning with '$' (MongoDB query operators)
 * or containing '.' (field-traversal / prototype pollution injection).
 */

function sanitizeInput(target) {
  if (!target || typeof target !== 'object') {
    return target;
  }

  if (Array.isArray(target)) {
    for (let i = 0; i < target.length; i++) {
      target[i] = sanitizeInput(target[i]);
    }
    return target;
  }

  for (const key of Object.keys(target)) {
    if (key.startsWith('$') || key.includes('.')) {
      // Eliminate dangerous operator / injection keys
      delete target[key];
    } else {
      target[key] = sanitizeInput(target[key]);
    }
  }

  return target;
}

function mongoSanitize(req, res, next) {
  try {
    if (req.body) sanitizeInput(req.body);
    if (req.query) sanitizeInput(req.query);
    if (req.params) sanitizeInput(req.params);
  } catch (err) {
    console.error('⚠️ [mongoSanitize] Error sanitizing input:', err.message);
  }
  next();
}

module.exports = {
  sanitizeInput,
  mongoSanitize,
};
