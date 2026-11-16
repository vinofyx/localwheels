const fs = require('fs');
const path = require('path');
const express = require('express');

const routesDir = path.join(__dirname, 'src/routes');
const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));

// Read index.js to find mounts
const indexContent = fs.readFileSync(path.join(__dirname, 'src/index.js'), 'utf8');
const mountMap = {};
const mountRegex = /app\.use\(\s*['"]([^'"]+)['"]\s*,\s*(?:[a-zA-Z0-9_]+,\s*)?require\(['"]\.\/routes\/([^'"]+)['"]\)/g;
let m;
while ((m = mountRegex.exec(indexContent)) !== null) {
  mountMap[m[2]] = m[1];
}
mountMap['auth'] = '/api/auth';

const runtimeEndpoints = [];
const errors = [];

for (const file of files) {
  const baseName = file.replace(/\.js$/, '');
  const mount = mountMap[baseName] || `/api/${baseName}`;
  const filePath = path.join(routesDir, file);

  try {
    const router = require(filePath);
    if (!router || !router.stack) {
      errors.push({ file, error: 'Not an Express router or empty export' });
      continue;
    }

    // Inspect stack
    for (const layer of router.stack) {
      if (layer.route) {
        const routePath = layer.route.path;
        const methods = Object.keys(layer.route.methods).map(m => m.toUpperCase());
        const fullPath = (mount + (routePath === '/' ? '' : routePath)).replace(/\/+/g, '/');
        
        // Inspect handlers in layer.route.stack
        const handlerNames = layer.route.stack.map(s => s.name || 'anonymous');
        
        for (const method of methods) {
          runtimeEndpoints.push({
            file,
            method,
            path: fullPath,
            handlers: handlerNames,
            routePath,
          });
        }
      }
    }
  } catch (err) {
    errors.push({ file, error: err.message });
  }
}

console.log('Total files inspected:', files.length);
console.log('Total runtime endpoints loaded from router stacks:', runtimeEndpoints.length);
console.log('Files with errors loading:', errors.length);
if (errors.length) {
  console.log('Errors:', JSON.stringify(errors, null, 2));
}

fs.writeFileSync(
  path.join(__dirname, 'runtime-routes.json'),
  JSON.stringify({ count: runtimeEndpoints.length, endpoints: runtimeEndpoints, errors }, null, 2)
);
console.log('Saved runtime-routes.json');

