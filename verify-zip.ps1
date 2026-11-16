# Strict ZIP verification script for LocalWheels Hostinger deployment packages
param(
  [string]$ZipPath
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -Path $ZipPath)) {
  Write-Error "File not found: $ZipPath"
  exit 1
}

$fileInfo = Get-Item -Path $ZipPath
Write-Host "================================================================================"
Write-Host "INSPECTING ARCHIVE: $($fileInfo.FullName)"
Write-Host "Size: $([math]::Round($fileInfo.Length / 1MB, 2)) MB ($($fileInfo.Length) bytes)"
Write-Host "Last Modified: $($fileInfo.LastWriteTime)"
Write-Host "================================================================================"

Add-Type -AssemblyName System.IO.Compression.FileSystem

$zip = $null
$corrupt = $false
$entriesList = @()
$duplicates = @()
$seen = @{}

try {
  $zip = [System.IO.Compression.ZipFile]::OpenRead($fileInfo.FullName)
  Write-Host "✅ ZIP header valid. Archive opened successfully."
} catch {
  Write-Error "❌ ZIP Corruption Detected: Unable to read zip archive: $_"
  exit 1
}

$totalEntries = $zip.Entries.Count
Write-Host "Total entries in archive: $totalEntries"

$prohibitedFiles = @()
$secretFiles = @()
$nodeModulesFiles = @()
$devFiles = @()
$routesFound = 0
$modelsFound = 0
$middlewareFound = 0

foreach ($entry in $zip.Entries) {
  $fullName = $entry.FullName
  $entriesList += $fullName

  # Duplicate check
  if ($seen.ContainsKey($fullName)) {
    $duplicates += $fullName
  } else {
    $seen[$fullName] = $true
  }

  # Prohibited files checks
  if ($fullName -match "(^|/)node_modules/") {
    $nodeModulesFiles += $fullName
  }
  if ($fullName -match "(^|/)\.env$" -or $fullName -match "(^|/)\.env\.(local|production|development)$") {
    $secretFiles += $fullName
  }
  if ($fullName -match "(^|/)\.(git|github|vscode|idea)/") {
    $devFiles += $fullName
  }
  if ($fullName -match "\.log$" -or $fullName -match "\.sqlite$" -or $fullName -match "\.db$") {
    $prohibitedFiles += $fullName
  }

  # Route inspection
  if ($fullName -match "^backend/src/routes/[^/]+\.js$") {
    $routesFound++
  }
  if ($fullName -match "^backend/src/models/[^/]+\.js$") {
    $modelsFound++
  }
  if ($fullName -match "^backend/src/middleware/[^/]+\.js$") {
    $middlewareFound++
  }
}

$zip.Dispose()

Write-Host "`n--- INTEGRITY CHECKS ---"
Write-Host "Duplicate entries found: $($duplicates.Count)"
if ($duplicates.Count -gt 0) {
  Write-Host "❌ Duplicates: $($duplicates -join ', ')"
} else {
  Write-Host "✅ No duplicate file entries."
}

Write-Host "Node modules included: $($nodeModulesFiles.Count)"
if ($nodeModulesFiles.Count -gt 0) {
  Write-Host "❌ node_modules should not be in zip! Found: $($nodeModulesFiles.Count) files"
} else {
  Write-Host "✅ Zero node_modules included."
}

Write-Host "Secret/Live .env files included: $($secretFiles.Count)"
if ($secretFiles.Count -gt 0) {
  Write-Host "❌ FATAL: Secrets / .env files found: $($secretFiles -join ', ')"
} else {
  Write-Host "✅ Zero secrets / .env files included (only safe templates allowed)."
}

Write-Host "Dev/IDE directories included: $($devFiles.Count)"
if ($devFiles.Count -gt 0) {
  Write-Host "❌ Dev files found: $($devFiles -join ', ')"
} else {
  Write-Host "✅ Clean of Git/IDE metadata."
}

Write-Host "Log / database binary files: $($prohibitedFiles.Count)"
if ($prohibitedFiles.Count -gt 0) {
  Write-Host "❌ Unwanted files found: $($prohibitedFiles -join ', ')"
} else {
  Write-Host "✅ Zero logs or database dumps included."
}

Write-Host "`n--- REQUIRED CORE FILES AUDIT ---"
$requiredFiles = @(
  "index.html",
  ".htaccess",
  "favicon.svg",
  "backend/package.json",
  "backend/package-lock.json",
  "backend/src/index.js",
  "backend/.env.example"
)

$missingCore = @()
foreach ($req in $requiredFiles) {
  if ($entriesList -contains $req) {
    Write-Host "  [FOUND] $req"
  } else {
    Write-Host "  [MISSING] $req"
    $missingCore += $req
  }
}

# Assets check
$assets = $entriesList | Where-Object { $_ -match "^assets/.+\.(js|css)$" }
Write-Host "Compiled frontend assets found: $($assets.Count) files"
if ($assets.Count -gt 0) {
  Write-Host "✅ Frontend assets verified."
} else {
  Write-Host "❌ Missing frontend assets in assets/!"
  $missingCore += "assets/*"
}

Write-Host "`n--- BACKEND ROUTE & MODULE COVERAGE ---"
Write-Host "Route modules in backend/src/routes/: $routesFound (expected: 127)"
Write-Host "Models in backend/src/models/: $modelsFound"
Write-Host "Middleware in backend/src/middleware/: $middlewareFound"

if ($routesFound -eq 127) {
  Write-Host "✅ All 127 backend route modules are present in the archive!"
} else {
  Write-Host "❌ Incomplete route modules! Found $routesFound, expected 127."
  $missingCore += "routes"
}

Write-Host "`n--- TEST UNCOMPRESSED EXTRACTION & CRC32 ---"
$testExtractDir = [System.IO.Path]::Combine([System.IO.Path]::GetTempPath(), "lw_zip_test_" + [System.Guid]::NewGuid().ToString("N"))
try {
  [System.IO.Compression.ZipFile]::ExtractToDirectory($fileInfo.FullName, $testExtractDir)
  Write-Host "✅ Test extraction completed cleanly without CRC or decompression errors."
  
  # Check test extracted files
  $extractedCount = (Get-ChildItem -Path $testExtractDir -Recurse -File).Count
  Write-Host "Extracted files on disk: $extractedCount"
} catch {
  Write-Host "❌ Extraction failure: $_"
  $missingCore += "extraction_error"
} finally {
  if (Test-Path $testExtractDir) {
    Remove-Item -Path $testExtractDir -Recurse -Force -ErrorAction SilentlyContinue
  }
}

Write-Host "`n================================================================================"
if ($missingCore.Count -eq 0 -and $secretFiles.Count -eq 0 -and $duplicates.Count -eq 0) {
  Write-Host "RESULT FOR $($fileInfo.Name): PASS (ARCHIVE IS VERIFIED & VALID)"
  Write-Host "================================================================================"
  exit 0
} else {
  Write-Host "RESULT FOR $($fileInfo.Name): FAIL (ISSUES DETECTED)"
  Write-Host "Missing or failing items: $($missingCore -join ', ')"
  Write-Host "================================================================================"
  exit 1
}

