# Verification script for separated frontend and backend Hostinger deployment packages
$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.IO.Compression.FileSystem

function Verify-FrontendZip {
    param([string]$Path)
    Write-Host "================================================================================"
    Write-Host "VERIFYING FRONTEND PACKAGE: $Path"
    Write-Host "================================================================================"
    
    if (-not (Test-Path $Path)) { throw "Frontend zip not found: $Path" }
    $fileInfo = Get-Item $Path
    Write-Host "Archive Size: $([math]::Round($fileInfo.Length / 1MB, 2)) MB ($($fileInfo.Length) bytes)"

    $zip = [System.IO.Compression.ZipFile]::OpenRead($Path)
    $entries = $zip.Entries
    Write-Host "Total entries: $($entries.Count)"

    $entryNames = @()
    $seen = @{}
    $duplicates = @()
    $secrets = @()
    $nodeModules = @()

    foreach ($e in $entries) {
        $name = $e.FullName
        $entryNames += $name
        if ($seen.ContainsKey($name)) { $duplicates += $name } else { $seen[$name] = $true }
        if ($name -match "(^|/)node_modules/") { $nodeModules += $name }
        if ($name -match "(^|/)\.env$" -or $name -match "(^|/)\.env\.(local|production|development)$") { $secrets += $name }
    }
    $zip.Dispose()

    # Checks
    if ($duplicates.Count -gt 0) { throw "Duplicates found: $($duplicates -join ', ')" }
    if ($nodeModules.Count -gt 0) { throw "node_modules found in frontend zip" }
    if ($secrets.Count -gt 0) { throw "Secrets found in frontend zip" }

    $req = @("index.html", ".htaccess", "favicon.svg")
    foreach ($r in $req) {
        if (-not ($entryNames -contains $r)) { throw "Missing required file: $r" }
        Write-Host "  [FOUND] $r"
    }

    $assets = $entryNames | Where-Object { $_ -match "^assets/.+\.(js|css|svg)$" }
    Write-Host "  [FOUND] $($assets.Count) compiled assets in assets/"
    if ($assets.Count -lt 50) { throw "Expected at least 50 asset files, found $($assets.Count)" }

    # Extraction test
    $tmp = [System.IO.Path]::Combine([System.IO.Path]::GetTempPath(), "lw_fe_test_" + [System.Guid]::NewGuid().ToString("N"))
    try {
        [System.IO.Compression.ZipFile]::ExtractToDirectory($Path, $tmp)
        $extractedCount = (Get-ChildItem -Path $tmp -Recurse -File).Count
        Write-Host "✅ Test extraction verified: $extractedCount files successfully extracted."
    } finally {
        if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue }
    }

    Write-Host "VERDICT: FRONTEND PACKAGE PASS ✅`n"
}

function Verify-BackendZip {
    param([string]$Path)
    Write-Host "================================================================================"
    Write-Host "VERIFYING BACKEND PACKAGE: $Path"
    Write-Host "================================================================================"
    
    if (-not (Test-Path $Path)) { throw "Backend zip not found: $Path" }
    $fileInfo = Get-Item $Path
    Write-Host "Archive Size: $([math]::Round($fileInfo.Length / 1MB, 2)) MB ($($fileInfo.Length) bytes)"

    $zip = [System.IO.Compression.ZipFile]::OpenRead($Path)
    $entries = $zip.Entries
    Write-Host "Total entries: $($entries.Count)"

    $entryNames = @()
    $seen = @{}
    $duplicates = @()
    $secrets = @()
    $nodeModules = @()
    $routesCount = 0
    $modelsCount = 0
    $middlewareCount = 0

    foreach ($e in $entries) {
        $name = $e.FullName
        $entryNames += $name
        if ($seen.ContainsKey($name)) { $duplicates += $name } else { $seen[$name] = $true }
        if ($name -match "(^|/)node_modules/") { $nodeModules += $name }
        if ($name -match "(^|/)\.env$" -or $name -match "(^|/)\.env\.(local|production|development)$") { $secrets += $name }
        if ($name -match "^src/routes/[^/]+\.js$") { $routesCount++ }
        if ($name -match "^src/models/[^/]+\.js$") { $modelsCount++ }
        if ($name -match "^src/middleware/[^/]+\.js$") { $middlewareCount++ }
    }
    $zip.Dispose()

    # Checks
    if ($duplicates.Count -gt 0) { throw "Duplicates found: $($duplicates -join ', ')" }
    if ($nodeModules.Count -gt 0) { throw "node_modules found in backend zip" }
    if ($secrets.Count -gt 0) { throw "Secrets found in backend zip" }

    $req = @("package.json", "package-lock.json", ".env.example", "src/index.js")
    foreach ($r in $req) {
        if (-not ($entryNames -contains $r)) { throw "Missing required file: $r" }
        Write-Host "  [FOUND] $r"
    }

    Write-Host "  [FOUND] Route modules: $routesCount (expected: 127)"
    if ($routesCount -ne 127) { throw "Expected 127 route modules in src/routes/, found $routesCount" }

    Write-Host "  [FOUND] Models: $modelsCount"
    Write-Host "  [FOUND] Middleware: $middlewareCount"

    # Check uploads directory structure
    if (-not ($entryNames -contains "uploads/.gitkeep")) { throw "Missing uploads/.gitkeep placeholder" }
    Write-Host "  [FOUND] uploads/ directory structure initialized"

    # Extraction test
    $tmp = [System.IO.Path]::Combine([System.IO.Path]::GetTempPath(), "lw_be_test_" + [System.Guid]::NewGuid().ToString("N"))
    try {
        [System.IO.Compression.ZipFile]::ExtractToDirectory($Path, $tmp)
        $extractedCount = (Get-ChildItem -Path $tmp -Recurse -File).Count
        Write-Host "✅ Test extraction verified: $extractedCount files successfully extracted."
    } finally {
        if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue }
    }

    Write-Host "VERDICT: BACKEND PACKAGE PASS ✅`n"
}

Verify-FrontendZip -Path "D:\Localwheels\localwheels-frontend-hostinger.zip"
Verify-BackendZip -Path "D:\Localwheels\localwheels-backend-hostinger.zip"
Write-Host "================================================================================"
Write-Host "ALL SEPARATE PACKAGES VERIFIED SUCCESSFULLY WITH ZERO ERRORS"
Write-Host "================================================================================"

