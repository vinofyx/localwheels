const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, 'src', 'routes');
const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));

console.log(`Auditing ${files.length} route files in ${routesDir}...`);

const findings = [];

files.forEach(file => {
  const filePath = path.join(routesDir, file);
  const code = fs.readFileSync(filePath, 'utf8');

  // 1. Check for raw $set: req.body
  if (code.includes('$set: req.body') || code.includes('$set:req.body')) {
    findings.push({ file, type: 'MASS_ASSIGNMENT', detail: '$set: req.body detected without filtering' });
  }

  // 2. Check for findOneAndUpdate / updateOne with direct req.body
  const updateMatches = code.match(/findOneAndUpdate\s*\([^)]*\)/g) || [];
  updateMatches.forEach(match => {
    if (match.includes('req.body') && !match.includes('allowed') && !match.includes('updates') && !match.includes('$set')) {
      findings.push({ file, type: 'MASS_ASSIGNMENT', detail: match });
    }
  });

  // 3. Check for routes modifying or querying records by params.id without company_id
  const lines = code.split('\n');
  lines.forEach((line, idx) => {
    if ((line.includes('.findById(') || line.includes('.findByIdAndUpdate(') || line.includes('.findByIdAndDelete(')) &&
        !file.includes('Company.js') && !file.includes('companies.js') && !file.includes('auth.js') && !file.includes('superadmin')) {
      findings.push({ file, line: idx + 1, type: 'POTENTIAL_IDOR', detail: line.trim() });
    }
  });
});

console.log(`\nFound ${findings.length} potential security items:`);
findings.forEach(f => console.log(`[${f.type}] ${f.file}${f.line ? ':' + f.line : ''} -> ${f.detail}`));

