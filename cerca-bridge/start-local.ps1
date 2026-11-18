# CERCA Bridge para prototipo en Windows. No configura Render ni envía mensajes.
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
if (-not (Test-Path '.env.local')) { & "$PSScriptRoot\setup-local.ps1" }
if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne $null) { throw 'Falló la preparación de CERCA.' }
try { & docker info --format '{{.ServerVersion}}' | Out-Null } catch { throw 'Instalá y abrí Docker Desktop (Linux / WSL2) primero.' }
if ($LASTEXITCODE -ne 0) { throw 'Docker Desktop no está iniciado. Abrilo y volvé a ejecutar.' }
$dc = @('compose', '-f', 'compose.local.yaml', '--env-file', '.env.local')
& docker @dc config --quiet
if ($LASTEXITCODE -ne 0) { throw 'La configuración Docker no pasó la validación.' }
Write-Host 'Iniciando CERCA Bridge. La primera vez Docker debe descargar las imágenes.'
& docker @dc up -d
if ($LASTEXITCODE -ne 0) { throw 'Docker no pudo iniciar los contenedores.' }
$address = $null
for ($i = 0; $i -lt 30; $i++) {
    $logs = (& docker @dc logs --no-color --tail 100 cloudflared 2>&1) -join "`n"
    $match = [regex]::Match($logs, 'https://[a-z0-9-]+\.trycloudflare\.com')
    if ($match.Success) { $address = $match.Value; break }
    Start-Sleep -Seconds 2
}
if (-not $address) { throw 'Cloudflare aún no devolvió un enlace. Revisá: docker compose -f compose.local.yaml logs cloudflared' }
$hostName = ([Uri]$address).Host
$content = Get-Content '.env.local' -Raw
$content = [regex]::Replace($content, '(?m)^EVOLUTION_HOST=.*$', "EVOLUTION_HOST=$hostName")
Set-Content -Path '.env.local' -Value $content -Encoding Ascii
Set-Content -Path 'local-link.txt' -Value $address -Encoding Ascii
# Recreate ONLY the Evolution and monitor containers with the current ephemeral hostname.
& docker @dc up -d --no-deps --force-recreate evolution monitor
if ($LASTEXITCODE -ne 0) { throw 'Falló el inicio de Evolution.' }
$prepared = $false
for ($i = 0; $i -lt 8; $i++) {
    & docker @dc run --rm monitor node configure.mjs
    if ($LASTEXITCODE -eq 0) { $prepared = $true; break }
    Start-Sleep -Seconds 5
}
if (-not $prepared) { throw 'No se pudo configurar Evolution. Consultá: docker compose -f compose.local.yaml logs evolution' }
Write-Host ''
Write-Host 'CERCA Bridge local: INICIADO. WhatsApp NO vinculado, envíos DESACTIVADOS.'
Write-Host ('URL temporal (para EVOLUTION_API_URL en Render): ' + $address + '/')
Write-Host 'En Render se necesitan las claves de .env.local; configuralas directamente allí, nunca por chat.'
Write-Host 'El QR se solicita desde el panel privado /internal/bridge de CERCA, después de completar Render.'
Write-Host 'Recordá: cada reinicio del túnel puede cambiar la URL y requerir actualizar Render.'