# Arranca el API en Release (http://localhost:5016) y lo expone por ngrok en el dominio estatico (D-18).
# Uso, desde la raiz del repo:
#   powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start-api.ps1
# Requiere: ngrok instalado y autenticado (ngrok config add-authtoken <token>) y $env:NGROK_DOMAIN sin https://.
# El API corre en Production: Swagger solo existe en Development, asi que no queda expuesto por el tunel.

$ErrorActionPreference = 'Stop'

if (-not $env:NGROK_DOMAIN) {
    Write-Host 'Falta la variable NGROK_DOMAIN (dominio estatico de ngrok, sin https://).'
    exit 1
}

$repo = Split-Path -Parent $PSScriptRoot
# --no-launch-profile: si no, launchSettings.json impone Development y Swagger quedaria publico.
$env:ASPNETCORE_ENVIRONMENT = 'Production'
$api = Start-Process -FilePath 'dotnet' -NoNewWindow -PassThru -WorkingDirectory $repo `
    -ArgumentList 'run', '--project', 'apps/api/AlertaYA.Api', '-c', 'Release', '--no-launch-profile', '--urls', 'http://localhost:5016'

try {
    $listo = $false
    for ($i = 0; $i -lt 60 -and -not $listo; $i++) {
        Start-Sleep -Seconds 1
        try { $listo = (Invoke-WebRequest -UseBasicParsing 'http://localhost:5016/health').StatusCode -eq 200 } catch { }
    }
    if (-not $listo) {
        Write-Host 'El API no respondio en /health despues de 60 s.'
        exit 1
    }

    # ngrok v3 reciente usa --url; si la version instalada no lo reconoce, cambiar por --domain=$env:NGROK_DOMAIN.
    ngrok http 5016 --url="https://$env:NGROK_DOMAIN"
}
finally {
    # dotnet run deja el API como proceso hijo: se detienen los dos.
    if (-not $api.HasExited) { Stop-Process -Id $api.Id -Force }
    Get-Process 'AlertaYA.Api' -ErrorAction SilentlyContinue | Stop-Process -Force
}
