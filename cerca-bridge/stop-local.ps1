# Detiene CERCA Bridge sin borrar sesiones, conversaciones ni volúmenes.
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
if (-not (Test-Path '.env.local')) { throw 'Falta .env.local.' }
& docker compose -f compose.local.yaml --env-file .env.local down
if ($LASTEXITCODE -ne 0) { throw 'No se pudo detener CERCA Bridge.' }
Write-Host 'CERCA detenido. Los volúmenes persistentes NO fueron eliminados.'