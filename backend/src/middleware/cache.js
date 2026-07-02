let _client = null;

async function initRedis() {
  const url = process.env.REDIS_URL;
  if (!url) {
    console.log('[Cache] REDIS_URL not set — cache disabled');
    return;
  }
  try {
    // redis package is optional — install if present
    const { createClient } = require('redis');
    const c = createClient({ url, socket: { connectTimeout: 3000 } });
    c.on('error', e => console.warn('[Redis]', e.message));
    await c.connect();
    _client = c;
    console.log('✅ Redis cache connected');
  } catch (e) {
    console.warn('[Cache] Redis unavailable, proceeding without cache:', e.message);
  }
}

function cache(ttlSeconds = 60) {
  return async (req, res, next) => {
    if (!_client || req.method !== 'GET') return next();
    const key = `lw:${req.user?.company_id || 'pub'}:${req.originalUrl}`;
    try {
      const cached = await _client.get(key);
      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        return res.json(JSON.parse(cached));
      }
      const origJson = res.json.bind(res);
      res.json = function(body) {
        if (res.statusCode === 200 && body?.status === true) {
          _client.setEx(key, ttlSeconds, JSON.stringify(body)).catch(() => {});
        }
        res.setHeader('X-Cache', 'MISS');
        return origJson.call(this, body);
      };
    } catch (e) {
      // cache errors never break the request
    }
    next();
  };
}

async function invalidate(companyId, pathPattern) {
  if (!_client) return;
  try {
    const keys = await _client.keys(`lw:${companyId}:*${pathPattern}*`);
    if (keys.length) await _client.del(keys);
  } catch (_) {}
}

async function cacheGet(key) {
  if (!_client) return null;
  try { return JSON.parse(await _client.get(key)); } catch { return null; }
}

async function cacheSet(key, value, ttlSeconds = 300) {
  if (!_client) return;
  try { await _client.setEx(key, ttlSeconds, JSON.stringify(value)); } catch (_) {}
}

module.exports = { initRedis, cache, invalidate, cacheGet, cacheSet };
