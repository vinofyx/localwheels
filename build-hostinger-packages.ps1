# Build script for LocalWheels Hostinger deployment packages
# Uses .NET ZipArchive to guarantee 100% POSIX forward-slash standard entry names

$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$rootDir = "D:\Localwheels"
$frontendDist = Join-Path $rootDir "frontend\dist"
$backendDir = Join-Path $rootDir "backend"

if (-not (Test-Path $frontendDist)) {
    Write-Error "frontend/dist not found. Run npm run build first."
    exit 1
}

function Create-CleanZip {
    param(
        [string]$ZipFilePath,
        [scriptblock]$PopulateAction
    )

    if (Test-Path $ZipFilePath) {
        Remove-Item -Path $ZipFilePath -Force
    }

    $fileStream = [System.IO.File]::Create($ZipFilePath)
    $archive = New-Object System.IO.Compression.ZipArchive($fileStream, [System.IO.Compression.ZipArchiveMode]::Create)

    try {
        & $PopulateAction $archive
    } finally {
        $archive.Dispose()
        $fileStream.Dispose()
    }

    $fi = Get-Item $ZipFilePath
    Write-Host "Created: $($fi.Name) ($([math]::Round($fi.Length / 1MB, 2)) MB)"
}

function Add-FileToZip {
    param(
        [System.IO.Compression.ZipArchive]$Archive,
        [string]$SourceFile,
        [string]$EntryName
    )
    # Enforce POSIX forward slashes
    $posixName = $EntryName.Replace("\", "/")
    
    # Check for forbidden files & development-only files
    if ($posixName -match "(^|/)node_modules/" -or
        $posixName -match "(^|/)\.env$" -or
        $posixName -match "(^|/)\.env\.(local|production|development)$" -or
        $posixName -match "(^|/)\.git(/|$)" -or
        $posixName -match "(^|/)\.github(/|$)" -or
        $posixName -match "(^|/)\.claude(/|$)" -or
        $posixName -match "\.log$" -or
        $posixName -match "\.sqlite$" -or
        $posixName -match "results\.json$" -or
        ($posixName -match "(^|/)src/scripts/" -and $posixName -notmatch "bootstrap-admin\.js$")) {
        Write-Warning "Skipping forbidden or dev-only file: $posixName"
        return
    }

    # Verify zero exposed credentials in packaged file content
    if (-not ($posixName -match "\.(png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$")) {
        $content = [System.IO.File]::ReadAllText($SourceFile)
        if ($content -match "RCS@Admin" -or $content -match "LW@SuperAdmin") {
            throw "FATAL CREDENTIAL LEAK: Forbidden credential pattern detected in $posixName ($SourceFile)!"
        }
    }

    $entry = $Archive.CreateEntry($posixName, [System.IO.Compression.CompressionLevel]::Optimal)
    $entryStream = $entry.Open()
    $fileBytes = [System.IO.File]::ReadAllBytes($SourceFile)
    $entryStream.Write($fileBytes, 0, $fileBytes.Length)
    $entryStream.Dispose()
}

function Add-DirectoryToZip {
    param(
        [System.IO.Compression.ZipArchive]$Archive,
        [string]$SourceDirectory,
        [string]$Prefix = ""
    )

    $files = Get-ChildItem -Path $SourceDirectory -Recurse -File
    foreach ($file in $files) {
        $relPath = $file.FullName.Substring($SourceDirectory.Length).TrimStart("\", "/")
        $entryName = if ($Prefix) { "$Prefix/$relPath" } else { $relPath }
        Add-FileToZip -Archive $Archive -SourceFile $file.FullName -EntryName $entryName
    }
}

Write-Host "================================================================================"
Write-Host "1. CREATING FRONTEND PACKAGE: localwheels-frontend-hostinger.zip"
Write-Host "================================================================================"
$frontendZip = Join-Path $rootDir "localwheels-frontend-hostinger.zip"
Create-CleanZip -ZipFilePath $frontendZip -PopulateAction {
    param($arch)
    Add-DirectoryToZip -Archive $arch -SourceDirectory $frontendDist -Prefix ""
}

Write-Host "`n================================================================================"
Write-Host "2. CREATING BACKEND PACKAGE: localwheels-backend-hostinger.zip"
Write-Host "================================================================================"
$backendZip = Join-Path $rootDir "localwheels-backend-hostinger.zip"
Create-CleanZip -ZipFilePath $backendZip -PopulateAction {
    param($arch)
    # Add root files
    Add-FileToZip -Archive $arch -SourceFile (Join-Path $backendDir "package.json") -EntryName "package.json"
    Add-FileToZip -Archive $arch -SourceFile (Join-Path $backendDir "package-lock.json") -EntryName "package-lock.json"
    Add-FileToZip -Archive $arch -SourceFile (Join-Path $backendDir ".env.production.example") -EntryName ".env.example"
    
    # Add src/
    Add-DirectoryToZip -Archive $arch -SourceDirectory (Join-Path $backendDir "src") -Prefix "src"
    
    # Add uploads/ directory placeholders
    $gitkeepPath = [System.IO.Path]::GetTempFileName()
    [System.IO.File]::WriteAllText($gitkeepPath, "")
    try {
        Add-FileToZip -Archive $arch -SourceFile $gitkeepPath -EntryName "uploads/.gitkeep"
        Add-FileToZip -Archive $arch -SourceFile $gitkeepPath -EntryName "uploads/documents/.gitkeep"
    } finally {
        Remove-Item $gitkeepPath -Force -ErrorAction SilentlyContinue
    }
}

Write-Host "`n================================================================================"
Write-Host "3. REBUILDING MONOLITHIC PACKAGES WITH POSIX FORWARD SLASHES"
Write-Host "   - localwheels-vinofyx-deployment.zip"
Write-Host "   - public_html.zip"
Write-Host "================================================================================"
$monolithicZip = Join-Path $rootDir "localwheels-vinofyx-deployment.zip"
$publicHtmlZip = Join-Path $rootDir "public_html.zip"

Create-CleanZip -ZipFilePath $monolithicZip -PopulateAction {
    param($arch)
    # Add frontend files at root
    Add-DirectoryToZip -Archive $arch -SourceDirectory $frontendDist -Prefix ""
    
    # Add backend under backend/
    Add-FileToZip -Archive $arch -SourceFile (Join-Path $backendDir "package.json") -EntryName "backend/package.json"
    Add-FileToZip -Archive $arch -SourceFile (Join-Path $backendDir "package-lock.json") -EntryName "backend/package-lock.json"
    Add-FileToZip -Archive $arch -SourceFile (Join-Path $backendDir ".env.production.example") -EntryName "backend/.env.example"
    Add-DirectoryToZip -Archive $arch -SourceDirectory (Join-Path $backendDir "src") -Prefix "backend/src"
    
    # Add uploads placeholders
    $gitkeepPath = [System.IO.Path]::GetTempFileName()
    [System.IO.File]::WriteAllText($gitkeepPath, "")
    try {
        Add-FileToZip -Archive $arch -SourceFile $gitkeepPath -EntryName "backend/uploads/.gitkeep"
        Add-FileToZip -Archive $arch -SourceFile $gitkeepPath -EntryName "backend/uploads/documents/.gitkeep"
    } finally {
        Remove-Item $gitkeepPath -Force -ErrorAction SilentlyContinue
    }

    # Add instructions
    $instructionsPath = Join-Path $rootDir "package-hostinger\HOSTINGER_README.txt"
    if (Test-Path $instructionsPath) {
        Add-FileToZip -Archive $arch -SourceFile $instructionsPath -EntryName "HOSTINGER_README.txt"
    }
}

# Duplicate monolithic as public_html.zip
Copy-Item -Path $monolithicZip -Destination $publicHtmlZip -Force
Write-Host "Duplicated monolithic package to: public_html.zip"
Write-Host "`nAll packages built successfully with strict POSIX forward slashes."
