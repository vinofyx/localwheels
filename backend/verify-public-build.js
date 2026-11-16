/**
 * LocalWheels Hostinger Deployment Verification Script
 * Validates that backend/public contains a valid, production-ready React SPA build.
 */

const fs = require('fs');
const path = require('path');

function verifyPublicBuild(targetDir) {
  const publicDir = targetDir || path.resolve(__dirname, 'public');
  console.log('================================================================');
  console.log('LOCALWHEELS HOSTINGER DEPLOYMENT ASSET VERIFICATION');
  console.log(`Target directory: ${publicDir}`);
  console.log('================================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  // 1. Directory exists
  assert(fs.existsSync(publicDir), `backend/public directory exists: ${publicDir}`);
  if (!fs.existsSync(publicDir)) {
    console.error('\n❌ Verification failed: backend/public directory does not exist.');
    if (require.main === module) process.exit(1);
    return false;
  }

  // 2. index.html exists and is non-empty
  const indexPath = path.join(publicDir, 'index.html');
  assert(fs.existsSync(indexPath), 'index.html exists in backend/public');
  if (fs.existsSync(indexPath)) {
    const stats = fs.statSync(indexPath);
    assert(stats.size > 200, `index.html is valid size (${stats.size} bytes > 200 bytes)`);
    const content = fs.readFileSync(indexPath, 'utf8');
    assert(content.includes('id="root"'), 'index.html contains React mounting element (<div id="root">)');
    assert(content.includes('/assets/'), 'index.html references compiled assets in /assets/');
  }

  // 3. Assets directory exists and has bundles
  const assetsDir = path.join(publicDir, 'assets');
  assert(fs.existsSync(assetsDir), 'assets directory exists in backend/public');
  if (fs.existsSync(assetsDir)) {
    const assets = fs.readdirSync(assetsDir);
    const jsFiles = assets.filter(f => f.endsWith('.js'));
    const cssFiles = assets.filter(f => f.endsWith('.css'));

    assert(jsFiles.length >= 1, `Compiled JavaScript assets present (${jsFiles.length} .js files found)`);
    assert(cssFiles.length >= 1, `Compiled CSS stylesheet assets present (${cssFiles.length} .css files found)`);
  }

  // 4. Hygiene checks: Ensure no source code or credentials leaked into generated output
  function scanDir(dir) {
    let files = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files = files.concat(scanDir(fullPath));
      } else {
        files.push(fullPath);
      }
    }
    return files;
  }

  const allFiles = scanDir(publicDir);
  const leakedSources = allFiles.filter(f => /\.(jsx|tsx|ts)$/i.test(f));
  const leakedEnvs = allFiles.filter(f => /(^|[\\/])\.env/i.test(f));
  const leakedGit = allFiles.filter(f => /[\\/]\.git/i.test(f));

  assert(leakedSources.length === 0, `Zero raw React source files in output (${leakedSources.length} found)`);
  assert(leakedEnvs.length === 0, `Zero .env files or credentials in output (${leakedEnvs.length} found)`);
  assert(leakedGit.length === 0, `Zero .git metadata in output (${leakedGit.length} found)`);

  console.log('================================================================');
  console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    console.error('❌ Verification failed.');
    if (require.main === module) process.exit(1);
    return false;
  }

  console.log('✅ Deployment verification passed: backend/public is valid and ready.');
  return true;
}

if (require.main === module) {
  const target = process.argv[2] ? path.resolve(process.argv[2]) : undefined;
  verifyPublicBuild(target);
}

module.exports = { verifyPublicBuild };
