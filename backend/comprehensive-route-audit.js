const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, 'src/routes');
const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));

const knownPublicEndpoints = [
  '/login',
  '/health',
  '/track/:lr',
  '/public',
  '/clerk-exchange',
  '/bootstrap-status',
  '/bootstrap-superadmin',
  '/:id/feedback',
  '/template/:entity',
  '/webhook',
];

const results = {
  totalFiles: files.length,
  missingAuth: [],
  massAssignment: [],
  companyIdOverride: [],
  unscopedFindByIdAndUpdate: [],
};

for (const file of files) {
  const content = fs.readFileSync(path.join(routesDir, file), 'utf8');

  // Check if router uses authenticate or auth
  const hasRouterLevelAuth = /router\.use\s*\(\s*(authenticate|auth)/.test(content);
  const importsAuth = /require\(['"].*middleware\/auth['"]\)/.test(content) || /const\s+auth\s*=/.test(content);

  // Search for mass assignment: $set: req.body or { ...req.body } in updates
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (/\$set:\s*req\.body\b/.test(line)) {
      results.massAssignment.push({ file, line: idx + 1, snippet: line.trim() });
    }
    if (/findOneAndUpdate\([^,]+,\s*req\.body\b/.test(line)) {
      results.massAssignment.push({ file, line: idx + 1, snippet: line.trim() });
    }
    if (/req\.body\.company_id/.test(line) && !line.includes('===') && !line.includes('!==') && !line.includes('delete')) {
      // Check if it's reading req.body.company_id as authority
      if (/company_id:\s*req\.body\.company_id/.test(line) || /company_id\s*=\s*req\.body\.company_id/.test(line)) {
        results.companyIdOverride.push({ file, line: idx + 1, snippet: line.trim() });
      }
    }
  });

  // Check endpoint methods without auth if file doesn't have router.use(auth)
  if (!hasRouterLevelAuth && !file.includes('faq') && !file.includes('tracking')) {
    const endpointMatches = content.matchAll(/router\.(get|post|put|patch|delete)\s*\(\s*['"]([^'"]+)['"]\s*,\s*([^,)]+)/g);
    for (const match of endpointMatches) {
      const method = match[1].toUpperCase();
      const routePath = match[2];
      const firstHandler = match[3].trim();

      const isPublic = knownPublicEndpoints.some(p => routePath.includes(p));
      const hasAuthHandler = /auth|authenticate|requireRole|requireBranchAccess/.test(firstHandler);

      if (!isPublic && !hasAuthHandler && !importsAuth) {
        results.missingAuth.push({ file, method, routePath, handler: firstHandler });
      }
    }
  }
}

console.log(JSON.stringify(results, null, 2));

