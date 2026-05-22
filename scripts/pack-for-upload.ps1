param(
    [switch]$IncludeNext
)

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$zip = Join-Path $root "tasky-upload-$stamp.zip"
$temp = Join-Path $env:TEMP "tasky-pack-$stamp"

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

function Write-PanelCompatibleZip {
    param(
        [string]$SourceDir,
        [string]$DestinationPath
    )

    $sourceFull = (Resolve-Path $SourceDir).Path.TrimEnd('\')
    if (Test-Path $DestinationPath) {
        Remove-Item $DestinationPath -Force
    }

    $archive = [System.IO.Compression.ZipFile]::Open(
        $DestinationPath,
        [System.IO.Compression.ZipArchiveMode]::Create
    )

    try {
        Get-ChildItem -Path $sourceFull -Recurse -File | ForEach-Object {
            $relative = $_.FullName.Substring($sourceFull.Length + 1)
            # Linux / Pterodactyl panels expect forward slashes, not Windows backslashes
            $entryName = $relative.Replace('\', '/')
            if ([string]::IsNullOrWhiteSpace($entryName)) {
                return
            }

            [void][System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
                $archive,
                $_.FullName,
                $entryName,
                [System.IO.Compression.CompressionLevel]::Optimal
            )
        }
    }
    finally {
        $archive.Dispose()
    }
}

if (Test-Path $temp) {
    Remove-Item $temp -Recurse -Force
}
New-Item -ItemType Directory -Path $temp -Force | Out-Null
# Zip contains a single `app/` folder — extract over /home/container/app on the panel
$staging = Join-Path $temp "app"
New-Item -ItemType Directory -Path $staging -Force | Out-Null

$excludeDirs = @(
    "node_modules",
    ".git",
    "out",
    "coverage",
    ".vercel",
    "docs",
    "pterodactyl",
    "data",
    ".npm",
    ".cache"
)
if (-not $IncludeNext) {
    $excludeDirs += ".next"
}

$excludeFiles = @(
    ".gitignore",
    "README.md",
    ".env",
    ".env.example",
    ".env.local",
    "next-env.d.ts",
    "tsconfig.tsbuildinfo",
    "eslint.config.mjs",
    "pack-for-upload.bat",
    "Thumbs.db",
    ".DS_Store",
    "tasky.db",
    "tasky.db-journal",
    "cloudflared",
    "cloudflared.exe"
)

$robocopyArgs = @(
    $root,
    $staging,
    "/E",
    "/NFL", "/NDL", "/NJH", "/NJS"
)
foreach ($dir in $excludeDirs) {
    $robocopyArgs += "/XD"
    $robocopyArgs += $dir
}
foreach ($file in $excludeFiles) {
    $robocopyArgs += "/XF"
    $robocopyArgs += $file
}
$robocopyArgs += "/XF"
$robocopyArgs += "tasky-upload-*.zip"

& robocopy @robocopyArgs | Out-Null
if ($LASTEXITCODE -ge 8) {
    throw "Robocopy failed with exit code $LASTEXITCODE"
}

Get-ChildItem -Path $root -Filter "tasky-upload-*.zip" -File -ErrorAction SilentlyContinue | ForEach-Object {
    $inStaging = Join-Path $staging $_.Name
    if (Test-Path $inStaging) {
        Remove-Item $inStaging -Force
    }
}

Get-ChildItem -Path $staging -Include "*.db", "*.db-journal" -Recurse -File -ErrorAction SilentlyContinue |
    Remove-Item -Force

# Shell scripts must use LF on Linux (CRLF breaks `set -e` under /bin/sh)
Get-ChildItem -Path $staging -Recurse -Filter "*.sh" -File | ForEach-Object {
    $text = [System.IO.File]::ReadAllText($_.FullName)
    if ($text.Contains("`r")) {
        $normalized = $text -replace "`r`n", "`n" -replace "`r", "`n"
        $utf8NoBom = New-Object System.Text.UTF8Encoding $false
        [System.IO.File]::WriteAllText($_.FullName, $normalized, $utf8NoBom)
    }
}

Write-PanelCompatibleZip -SourceDir $temp -DestinationPath $zip
Remove-Item $temp -Recurse -Force

# Quick sanity check: no backslashes in entry paths
$bad = [System.IO.Compression.ZipFile]::OpenRead($zip).Entries |
    Where-Object { $_.FullName -match '\\' }
if ($bad) {
    throw "Zip contains Windows-style paths; panel extract may fail."
}

Write-Host ""
Write-Host "Created: $zip" -ForegroundColor Green
Write-Host "Extract so files land in: /home/container/app/" -ForegroundColor DarkGray
Write-Host "Keep on the server: .env, data/, cloudflared (container root)." -ForegroundColor DarkGray
Write-Host "Entry paths use forward slashes (Linux/Pterodactyl compatible)." -ForegroundColor DarkGray
Write-Host ""
