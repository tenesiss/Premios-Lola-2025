param([switch]$SkipBuild)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$localDir = Join-Path $projectRoot '.local'
$mysqlBin = Join-Path $localDir 'mysql-8.4.11-winx64/bin'
$mysqlConfig = Join-Path $localDir 'my.ini'
$clientConfig = Join-Path $localDir 'root-client.ini'
$backendDir = Join-Path $projectRoot 'backend'
$frontendDir = Join-Path $projectRoot 'frontend'
$nodeExe = (Get-Command node.exe).Source
$processFile = Join-Path $localDir 'processes.json'
$ownedProcesses = @{}
if (Test-Path -LiteralPath $processFile) {
    $saved = Get-Content -LiteralPath $processFile -Raw | ConvertFrom-Json
    foreach ($property in $saved.PSObject.Properties) { $ownedProcesses[$property.Name] = $property.Value }
}
function Save-Processes {
    $ownedProcesses | ConvertTo-Json | Set-Content -LiteralPath $processFile -Encoding UTF8
}
function Wait-Url([string]$Url) {
    for ($attempt = 0; $attempt -lt 60; $attempt++) {
        try {
            $response = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec 1
            if ($response.StatusCode -eq 200) { return }
        } catch { }
        Start-Sleep -Milliseconds 500
    }
    throw "Timed out waiting for $Url. See .local/logs."
}

if (!(Test-Path -LiteralPath (Join-Path $mysqlBin 'mysqld.exe'))) {
    throw 'Local MySQL installation is missing. See LOCAL-DEVELOPMENT.md.'
}
if (!(Test-Path -LiteralPath (Join-Path $backendDir '.env.local'))) {
    throw 'backend/.env.local is missing. See backend/.env.example.'
}
New-Item -ItemType Directory -Force (Join-Path $localDir 'logs') | Out-Null

$mysqlListener = Get-NetTCPConnection -State Listen -LocalPort 3306 -ErrorAction SilentlyContinue
if (!$mysqlListener) {
    $mysqlProcess = Start-Process -FilePath (Join-Path $mysqlBin 'mysqld.exe') `
        -ArgumentList "--defaults-file=`"$mysqlConfig`"" -WorkingDirectory $localDir `
        -WindowStyle Hidden -PassThru
    $ownedProcesses.mysql = $mysqlProcess.Id
    Save-Processes
}
$mysqlReady = $false
for ($attempt = 0; $attempt -lt 60; $attempt++) {
    try {
        & (Join-Path $mysqlBin 'mysql.exe') "--defaults-extra-file=$clientConfig" --connect-timeout=1 --batch --execute='SELECT 1' 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) { $mysqlReady = $true; break }
    } catch { }
    Start-Sleep -Milliseconds 500
}
if (!$mysqlReady) { throw 'MySQL did not become ready. See .local/logs/mysql.log.' }

$apiListener = Get-NetTCPConnection -State Listen -LocalPort 8000 -ErrorAction SilentlyContinue
if (!$apiListener) {
    if (!$SkipBuild) {
        Push-Location $backendDir
        try {
            & npm.cmd run build
            if ($LASTEXITCODE -ne 0) { throw 'Backend build failed.' }
        } finally { Pop-Location }
    }
    $apiEntry = Join-Path $backendDir 'dist/server.js'
    $apiProcess = Start-Process -FilePath $nodeExe -ArgumentList "`"$apiEntry`"" `
        -WorkingDirectory $backendDir -WindowStyle Hidden -PassThru `
        -RedirectStandardOutput (Join-Path $localDir 'logs/backend.log') `
        -RedirectStandardError (Join-Path $localDir 'logs/backend.error.log')
    $ownedProcesses.backend = $apiProcess.Id
    Save-Processes
}
Wait-Url 'http://127.0.0.1:8000/health'

$webListener = Get-NetTCPConnection -State Listen -LocalPort 5173 -ErrorAction SilentlyContinue
if (!$webListener) {
    $viteEntry = Join-Path $frontendDir 'node_modules/vite/bin/vite.js'
    $webProcess = Start-Process -FilePath $nodeExe `
        -ArgumentList "`"$viteEntry`" --host 127.0.0.1 --port 5173 --strictPort" `
        -WorkingDirectory $frontendDir -WindowStyle Hidden -PassThru `
        -RedirectStandardOutput (Join-Path $localDir 'logs/frontend.log') `
        -RedirectStandardError (Join-Path $localDir 'logs/frontend.error.log')
    $ownedProcesses.frontend = $webProcess.Id
    Save-Processes
}
Wait-Url 'http://127.0.0.1:5173'
Write-Host 'Frontend: http://localhost:5173 (use localhost for Google sign-in)'
Write-Host 'API:      http://127.0.0.1:8000/health'
Write-Host 'MySQL:    127.0.0.1:3306 / premios_lola_local'
Write-Host 'Logs:     .local/logs'
