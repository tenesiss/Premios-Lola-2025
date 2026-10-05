$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$localDir = Join-Path $projectRoot '.local'
$processFile = Join-Path $localDir 'processes.json'
if (Test-Path -LiteralPath $processFile) {
    $owned = Get-Content -LiteralPath $processFile -Raw | ConvertFrom-Json
    foreach ($name in @('frontend', 'backend')) {
        $processId = $owned.$name
        if (!$processId) { continue }
        $process = Get-CimInstance Win32_Process -Filter "ProcessId=$processId" -ErrorAction SilentlyContinue
        # Only stop this project's Node process, even if Windows reused the PID.
        $expected = if ($name -eq 'frontend') { Join-Path $projectRoot 'frontend/node_modules/vite/bin/vite.js' } else { Join-Path $projectRoot 'backend/dist/server.js' }
        if ($process -and $process.Name -eq 'node.exe' -and $process.CommandLine.Contains($expected)) {
            $listener = Get-NetTCPConnection -State Listen -OwningProcess $processId -ErrorAction SilentlyContinue
            $port = if ($name -eq 'frontend') { 5173 } else { 8000 }
            if ($listener.LocalPort -contains $port) { Stop-Process -Id $processId }
        }
    }
}

$mysqlAdmin = Join-Path $localDir 'mysql-8.4.11-winx64/bin/mysqladmin.exe'
$clientConfig = Join-Path $localDir 'root-client.ini'
$mysqlProcess = Get-CimInstance Win32_Process -Filter "Name='mysqld.exe'" |
    Where-Object { $_.CommandLine -and $_.CommandLine.Contains((Join-Path $localDir 'my.ini')) }
if ($mysqlProcess) {
    & $mysqlAdmin "--defaults-extra-file=$clientConfig" shutdown
    if ($LASTEXITCODE -ne 0) { throw 'MySQL shutdown failed; data was left intact.' }
}
Write-Host 'Stopped local services. Database contents are preserved.'
