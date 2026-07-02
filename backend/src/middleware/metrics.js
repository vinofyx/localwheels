const os = require('os');

const counters = {};
const histograms = {};

function inc(name, labels = {}) {
  const key = `${name}{${Object.entries(labels).map(([k,v])=>`${k}="${v}"`).join(',')}}`;
  counters[key] = (counters[key] || 0) + 1;
}

function observe(name, value, labels = {}) {
  const key = `${name}{${Object.entries(labels).map(([k,v])=>`${k}="${v}"`).join(',')}}`;
  if (!histograms[key]) histograms[key] = { sum: 0, count: 0 };
  histograms[key].sum += value;
  histograms[key].count += 1;
}

// Express middleware: records per-route metrics
function metricsMiddleware(req, res, next) {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    const route = req.route?.path || req.path || 'unknown';
    inc('http_requests_total', { method: req.method, route, status: res.statusCode });
    observe('http_request_duration_ms', ms, { method: req.method, route });
  });
  next();
}

// GET /api/metrics — returns Prometheus text format
function metricsHandler(_req, res) {
  const mongoose = require('mongoose');
  const mem = process.memoryUsage();
  const lines = [];

  // System metrics
  lines.push(`# HELP process_uptime_seconds Node.js process uptime`);
  lines.push(`# TYPE process_uptime_seconds gauge`);
  lines.push(`process_uptime_seconds ${Math.round(process.uptime())}`);

  lines.push(`# HELP process_heap_used_bytes Heap used`);
  lines.push(`# TYPE process_heap_used_bytes gauge`);
  lines.push(`process_heap_used_bytes ${mem.heapUsed}`);

  lines.push(`# HELP process_heap_total_bytes Heap total`);
  lines.push(`# TYPE process_heap_total_bytes gauge`);
  lines.push(`process_heap_total_bytes ${mem.heapTotal}`);

  lines.push(`# HELP process_rss_bytes RSS memory`);
  lines.push(`# TYPE process_rss_bytes gauge`);
  lines.push(`process_rss_bytes ${mem.rss}`);

  lines.push(`# HELP nodejs_version_info Node.js version`);
  lines.push(`# TYPE nodejs_version_info gauge`);
  lines.push(`nodejs_version_info{version="${process.version}"} 1`);

  // MongoDB
  const dbReady = mongoose.connection.readyState === 1 ? 1 : 0;
  lines.push(`# HELP mongodb_connected MongoDB connection state`);
  lines.push(`# TYPE mongodb_connected gauge`);
  lines.push(`mongodb_connected ${dbReady}`);

  // HTTP counters
  lines.push(`# HELP http_requests_total Total HTTP requests`);
  lines.push(`# TYPE http_requests_total counter`);
  for (const [k, v] of Object.entries(counters)) {
    if (k.startsWith('http_requests_total')) lines.push(`${k} ${v}`);
  }

  // Response time histograms (simplified as summary)
  lines.push(`# HELP http_request_duration_ms Request duration in ms`);
  lines.push(`# TYPE http_request_duration_ms summary`);
  for (const [k, v] of Object.entries(histograms)) {
    if (k.startsWith('http_request_duration_ms')) {
      lines.push(`${k.replace('}', '_sum}')} ${v.sum.toFixed(2)}`);
      lines.push(`${k.replace('}', '_count}')} ${v.count}`);
    }
  }

  // Load average
  const load = os.loadavg();
  lines.push(`# HELP system_load_1m System load average 1m`);
  lines.push(`# TYPE system_load_1m gauge`);
  lines.push(`system_load_1m ${load[0].toFixed(4)}`);

  res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
  res.send(lines.join('\n') + '\n');
}

module.exports = { metricsMiddleware, metricsHandler, inc, observe };
