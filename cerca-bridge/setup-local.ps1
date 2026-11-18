# CERCA Bridge for Windows — create secrets only on this PC.
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
if (Test-Path '.env.local') {
    Write-Host 'CERCA: ya existe .env.local; no se modifican las claves.'
    exit 0
}
function New-HexSecret {
    $bytes = New-Object byte[] 32
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
    return ([BitConverter]::ToString($bytes)).Replace('-', '').ToLowerInvariant()
}
$settings = @(
    '# SOLO CERCA. No compartir este archivo, ni subirlo a GitHub.',
    'EVOLUTION_HOST=bridge.localhost',
    ('EVOLUTION_API_KEY=' + (New-HexSecret)),
    ('BRIDGE_POSTGRES_PASSWORD=' + (New-HexSecret)),
    ('BRIDGE_REDIS_PASSWORD=' + (New-HexSecret)),
    ('CERCA_BRIDGE_WEBHOOK_SECRET=' + (New-HexSecret))
)
Set-Content -Path '.env.local' -Value $settings -Encoding Ascii
Write-Host 'CERCA: claves independientes creadas en .env.local (no se muestran).'
Write-Host 'Guardá ese archivo de forma privada. No lo subas ni lo compartas.'