/**
 * LocalWheels Hostinger Production Build Script
 * Builds the frontend from ../frontend and prepares backend/public for production serving.
 * Fully cross-platform compatible (Windows and Linux / Hostinger).
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { verifyPublicBuild } = require('./verify-public-build');

console.log('================================================================');
console.log('LOCALWHEELS HOSTINGER PRODUCTION BUILD');
console.log('================================================================');

const backendDir = __dirname;
const repoDir = path.resolve(backendDir, '..');
const frontendDir = path.resolve(repoDir, 'frontend');
const frontendDist = path.resolve(frontendDir, 'dist');
const backendPublic = path.resolve(backendDir, 'public');

console.log(`Backend directory : ${backendDir}`);
console.log(`Frontend directory: ${frontendDir}`);
console.log(`Target public dir : ${backendPublic}`);

function run(cmd, args, cwd) {
  const displayCmd = `${cmd} ${args.join(' ')}`;
  console.log(`\n==> [RUN] ${displayCmd} (in ${cwd})`);
  const result = spawnSync(cmd, args, {
    cwd,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env },
  });
  if (result.error) {
    console.error(`❌ Execution failed for ${displayCmd}: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`❌ Command failed with exit code ${result.status}: ${displayCmd}`);
    process.exit(result.status || 1);
  }
}

// Check if frontend source exists
if (fs.existsSync(frontendDir) && fs.existsSync(path.join(frontendDir, 'package.json'))) {
  console.log('\n--- STEP 1: INSTALLING FRONTEND DEPENDENCIES ---');
  // Pass --include=dev so that vite and plugins are installed even if NODE_ENV=production is set in Hostinger
  run('npm', ['install', '--include=dev'], frontendDir);

  console.log('\n--- STEP 2: COMPILING REACT SPA VIA VITE ---');
  run('npm', ['run', 'build'], frontendDir);

  if (!fs.existsSync(frontendDist) || !fs.existsSync(path.join(frontendDist, 'index.html'))) {
    console.error(`❌ Vite build did not generate index.html in: ${frontendDist}`);
    process.exit(1);
  }

  console.log('\n--- STEP 3: COPYING ASSETS TO BACKEND/PUBLIC ---');
  if (fs.existsSync(backendPublic)) {
    fs.rmSync(backendPublic, { recursive: true, force: true });
  }
  fs.mkdirSync(backendPublic, { recursive: true });

  // Copy dist contents recursively into backend/public
  fs.cpSync(frontendDist, backendPublic, { recursive: true });
  console.log(`Copied ${frontendDist} -> ${backendPublic}`);
} else if (fs.existsSync(backendPublic) && fs.existsSync(path.join(backendPublic, 'index.html'))) {
  console.log('\n⚠️  Frontend source directory not found; using existing backend/public build.');
} else {
  console.error(`❌ Neither frontend source (${frontendDir}) nor backend/public build exists.`);
  process.exit(1);
}

console.log('\n--- STEP 4: VERIFYING ASSET INTEGRITY ---');
const ok = verifyPublicBuild(backendPublic);
if (!ok) {
  console.error('❌ Post-build verification failed.');
  process.exit(1);
}

console.log('\n================================================================');
console.log('✅ LocalWheels production build completed successfully!');
console.log('================================================================');
