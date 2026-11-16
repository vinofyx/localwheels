const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = __dirname;
const stagingDir = path.join(rootDir, 'package-hostinger');
const zipOutput = path.join(rootDir, 'localwheels-vinofyx-deployment.zip');
const publicHtmlZip = path.join(rootDir, 'public_html.zip');

console.log('--- 1. PREPARING STAGING DIRECTORY ---');
if (fs.existsSync(stagingDir)) {
  fs.rmSync(stagingDir, { recursive: true, force: true });
}
fs.mkdirSync(stagingDir, { recursive: true });

console.log('--- 2. COPYING FRONTEND BUILD ASSETS ---');
const frontendDist = path.join(rootDir, 'frontend/dist');
if (!fs.existsSync(frontendDist)) {
  console.error('Error: frontend/dist does not exist! Run npm run build first.');
  process.exit(1);
}

// Copy dist contents to staging root (public_html root)
function copyRecursive(src, dest) {
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const child of fs.readdirSync(src)) {
      copyRecursive(path.join(src, child), path.join(dest, child));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

copyRecursive(frontendDist, stagingDir);
console.log('✅ Frontend build assets copied.');

// Ensure .htaccess exists in staging root
const htaccessPath = path.join(rootDir, 'frontend/public/.htaccess');
if (fs.existsSync(htaccessPath)) {
  fs.copyFileSync(htaccessPath, path.join(stagingDir, '.htaccess'));
  console.log('✅ .htaccess copied to root.');
}

console.log('--- 3. PREPARING BACKEND APPLICATION ROOT ---');
const backendDest = path.join(stagingDir, 'backend');
fs.mkdirSync(backendDest, { recursive: true });

// Copy package.json and package-lock.json
fs.copyFileSync(path.join(rootDir, 'backend/package.json'), path.join(backendDest, 'package.json'));
fs.copyFileSync(path.join(rootDir, 'backend/package-lock.json'), path.join(backendDest, 'package-lock.json'));
fs.copyFileSync(path.join(rootDir, 'backend/.env.production.example'), path.join(backendDest, '.env.example'));
console.log('✅ Backend package.json, package-lock.json, and .env.example copied.');

// Copy backend/src recursively
copyRecursive(path.join(rootDir, 'backend/src'), path.join(backendDest, 'src'));
console.log('✅ Hardened backend/src directory copied.');

// Ensure uploads directory exists
const uploadsDir = path.join(backendDest, 'uploads/documents');
fs.mkdirSync(uploadsDir, { recursive: true });
fs.writeFileSync(path.join(backendDest, 'uploads/.gitkeep'), '');
console.log('✅ Clean uploads/ directory structure initialized.');

// Add quick Hostinger instruction file
const instructions = `================================================================================
LOCALWHEELS — HOSTINGER DEPLOYMENT INSTRUCTIONS (localwheels.vinofyx.com)
================================================================================

1. UPLOAD & EXTRACT:
   - In Hostinger hPanel, open File Manager.
   - Navigate to domains/localwheels.vinofyx.com/public_html (or public_html).
   - Upload this zip file and click "Extract".
   - Ensure the files reside directly in public_html:
       public_html/
       ├── index.html
       ├── assets/
       ├── .htaccess
       └── backend/
           ├── package.json
           ├── src/
           │   └── index.js
           └── uploads/

2. CONFIGURE NODE.JS IN HPANEL:
   - Go to hPanel → Web Hosting → Node.js (or Advanced → Node.js).
   - Click "Create Application" (or edit existing):
       Node.js version:         20.x or 22.x LTS
       Application mode:        Production
       Application root:        public_html/backend
       Application URL:         /
       Application startup file: src/index.js
   - Click "Create" or "Save".

3. SET ENVIRONMENT VARIABLES (in hPanel Node.js → Environment Variables tab):
   NODE_ENV=production
   PORT=<Port assigned by Hostinger, or 3000 / 5000>
   MONGODB_URI=<Your MongoDB Atlas connection string>
   JWT_SECRET=<Your 64-byte random hex secret>
   JWT_EXPIRES_IN=7d
   ALLOWED_ORIGINS=https://localwheels.vinofyx.com,https://www.localwheels.vinofyx.com
   FRONTEND_URL=https://localwheels.vinofyx.com
   ANTHROPIC_API_KEY=<Optional Anthropic Claude API key>
   CLERK_SECRET_KEY=
   CLERK_PUBLISHABLE_KEY=

4. INSTALL DEPENDENCIES:
   - In hPanel Node.js dashboard, click "Run NPM Install" (or "Install Dependencies").

5. RESTART & VERIFY:
   - Click "Restart" in the Node.js dashboard.
   - Visit https://localwheels.vinofyx.com/api/health
   - Expected response: {"status":"ok","db":{"connected":true},...}
================================================================================
`;
fs.writeFileSync(path.join(stagingDir, 'HOSTINGER_README.txt'), instructions);

console.log('--- 4. CREATING ZIP ARCHIVES ---');
if (fs.existsSync(zipOutput)) fs.unlinkSync(zipOutput);
if (fs.existsSync(publicHtmlZip)) fs.unlinkSync(publicHtmlZip);

// Execute PowerShell Compress-Archive
console.log('Compressing files into zip archive...');
const psCommand = `powershell -Command "Compress-Archive -Path '${stagingDir}\\*' -DestinationPath '${zipOutput}' -CompressionLevel Optimal"`;
execSync(psCommand, { stdio: 'inherit' });

// Create public_html.zip copy for convenience
fs.copyFileSync(zipOutput, publicHtmlZip);

const zipStats = fs.statSync(zipOutput);
const sizeMb = (zipStats.size / (1024 * 1024)).toFixed(2);
console.log(`\n🎉 Deployment zip created successfully!`);
console.log(`📦 Primary Archive: ${zipOutput} (${sizeMb} MB)`);
console.log(`📦 Alias Archive:   ${publicHtmlZip} (${sizeMb} MB)`);

