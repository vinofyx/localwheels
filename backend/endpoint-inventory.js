const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'src/index.js');
const indexContent = fs.readFileSync(indexPath, 'utf8');

// Map of route filename -> mount path
const mountMap = {};
const mountRegex = /app\.use\(\s*['"]([^'"]+)['"]\s*,\s*(?:[a-zA-Z0-9_]+,\s*)?require\(['"]\.\/routes\/([^'"]+)['"]\)/g;
let m;
while ((m = mountRegex.exec(indexContent)) !== null) {
  mountMap[m[2]] = m[1];
}
// Handle authRouter
mountMap['auth'] = '/api/auth';

const routesDir = path.join(__dirname, 'src/routes');
const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));

const endpoints = [];
const publicAllowlist = new Set([
  'GET /api/health',
  'POST /api/auth/login',
  'GET /api/auth/bootstrap-status',
  'POST /api/auth/bootstrap-superadmin',
  'POST /api/auth/clerk-exchange',
  'GET /api/shipments/track/:lr',
  'GET /api/tracking/public/:tracking_number',
  'GET /api/tracking/eta/:tracking_number',
  'GET /api/tracking/history/:tracking_number',
  'GET /api/tracking/share/:tracking_number',
  'GET /api/tracking/verify/:tracking_number',
  'POST /api/chat',
  'POST /api/chat/feedback',
  'GET /api/chat/status',
  'GET /api/chat/faq-suggest',
  'GET /api/faq/public',
  'POST /api/webhooks/clerk',
  'POST /api/webhooks/incoming',
]);

for (const file of files) {
  const baseName = file.replace(/\.js$/, '');
  const mount = mountMap[baseName] || `/api/${baseName}`;
  const filePath = path.join(routesDir, file);
  const content = fs.readFileSync(filePath, 'utf8');

  // Check router-level middleware
  const hasRouterAuth = /router\.use\s*\(\s*(authenticate|auth)/.test(content);
  const routerRoleMatch = content.match(/router\.use\s*\(\s*requireRole\(([^)]+)\)/);
  const routerRoles = routerRoleMatch ? routerRoleMatch[1].replace(/['"\s]/g, '') : null;

  // Find all route declarations
  const routeRegex = /router\.(get|post|put|patch|delete)\s*\(\s*['"]([^'"]+)['"]\s*,([\s\S]*?)(?=\n\s*(?:router\.(?:get|post|put|patch|delete)|module\.exports|\/\/[─\s]))/g;
  let match;
  while ((match = routeRegex.exec(content)) !== null) {
    const method = match[1].toUpperCase();
    const subPath = match[2];
    const rest = match[3];

    // Combine mount + subPath
    let fullPath = (mount + (subPath === '/' ? '' : subPath)).replace(/\/+/g, '/');
    if (fullPath.length > 1 && fullPath.endsWith('/')) {
      fullPath = fullPath.slice(0, -1);
    }

    const endpointKey = `${method} ${fullPath}`;
    const isExplicitPublic = publicAllowlist.has(endpointKey) || subPath.includes('public') || subPath.includes('track/:lr');

    // Check handler chain for auth
    const hasEndpointAuth = /\b(auth|authenticate)\b/.test(rest);
    const isAuthenticated = hasRouterAuth || hasEndpointAuth || (!isExplicitPublic && !subPath.startsWith('/public'));

    // Check role restrictions
    const roleMatch = rest.match(/requireRole\(([^)]+)\)/);
    const roles = roleMatch ? roleMatch[1].replace(/['"\s]/g, '') : routerRoles;

    // Check branch restrictions
    const hasBranchCheck = /\brequireBranchAccess\b/.test(rest) || /req\.branchId/.test(rest) || /branch_id/.test(rest);

    // Check company scoping
    const hasCompanyScoping = /company_id:\s*req\.user\.company_id/.test(rest) || 
                              /company_id\s*=\s*req\.user\.company_id/.test(rest) ||
                              /company_id:\s*cid/.test(rest) ||
                              /cid\s*=\s*req\.user\.company_id/.test(rest) ||
                              /req\.user\.company_id/.test(rest) ||
                              roles?.includes('superadmin');

    endpoints.push({
      file,
      method,
      path: fullPath,
      auth: isExplicitPublic ? 'Public (Unauthenticated)' : (hasRouterAuth || hasEndpointAuth ? 'Authenticated' : 'Implicit/Inherited'),
      roles: roles || (isExplicitPublic ? 'None' : 'All Authenticated Roles (Staff+)'),
      branch_scoped: hasBranchCheck ? 'Yes' : 'No',
      company_scoped: isExplicitPublic ? 'N/A' : (hasCompanyScoping ? 'Yes' : 'Partial / Evaluated in Handler'),
    });
  }
}

// Generate summary statistics
const totalEndpoints = endpoints.length;
const publicCount = endpoints.filter(e => e.auth.includes('Public')).length;
const authCount = totalEndpoints - publicCount;
const roleRestrictedCount = endpoints.filter(e => e.roles !== 'All Authenticated Roles (Staff+)' && e.roles !== 'None').length;

console.log(`TOTAL ENDPOINTS: ${totalEndpoints}`);
console.log(`AUTHENTICATED ENDPOINTS: ${authCount}`);
console.log(`PUBLIC ENDPOINTS: ${publicCount}`);
console.log(`ROLE-RESTRICTED ENDPOINTS: ${roleRestrictedCount}`);

fs.writeFileSync(
  path.join(__dirname, 'endpoint-inventory.json'),
  JSON.stringify({ totalEndpoints, publicCount, authCount, roleRestrictedCount, endpoints }, null, 2)
);
console.log('Saved endpoint-inventory.json');

