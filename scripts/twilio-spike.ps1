# Spike de Twilio en Colombia (plan 01-01): envia el texto real de D-05 a cada numero verificado y sondea
# el estado final, num_segments, precio y codigo de error. Credenciales solo por variables de entorno.
# Uso, desde la raiz del repo:
#   powershell -NoProfile -ExecutionPolicy Bypass -File scripts/twilio-spike.ps1
# Requiere: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM, TWILIO_SPIKE_TO (E.164 separados por coma).
# Opcional: WEB_BASE_URL (por defecto https://alertaya.vercel.app).
# Sale con 0 aunque un mensaje falle (es un hallazgo); con 1 si falta configuracion o Twilio rechaza todo.

$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

foreach ($v in 'TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_FROM', 'TWILIO_SPIKE_TO') {
    if (-not [Environment]::GetEnvironmentVariable($v)) {
        Write-Host "Falta la variable $v."
        exit 1
    }
}

$sid = $env:TWILIO_ACCOUNT_SID
$base = "https://api.twilio.com/2010-04-01/Accounts/$sid"
$auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${sid}:$($env:TWILIO_AUTH_TOKEN)"))
$headers = @{ Authorization = "Basic $auth" }
$web = if ($env:WEB_BASE_URL) { $env:WEB_BASE_URL.TrimEnd('/') } else { 'https://alertaya.vercel.app' }

# Token de 128 bits en base64url: 22 caracteres, igual que el link real (Pattern 4).
$bytes = New-Object byte[] 16
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
$token = [Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_')

# Nombre de 30 caracteres ASCII: el maximo que deja SmsTextBuilder.
$nombre = 'Maria Fernanda Gutierrez Perez'
$body = "AlertaYA: $nombre activo una alerta de emergencia. Ubicacion en vivo: $web/t/$token. Si no responde, llama al 123."

$destinos = $env:TWILIO_SPIKE_TO.Split(',') | ForEach-Object { $_.Trim() } | Where-Object { $_ }
$enviados = @()
$rechazos = 0
foreach ($to in $destinos) {
    $mask = '***' + $to.Substring([Math]::Max(0, $to.Length - 4))
    try {
        $msg = Invoke-RestMethod -Method Post -Uri "$base/Messages.json" -Headers $headers `
            -Body @{ From = $env:TWILIO_FROM; To = $to; Body = $body }
        $enviados += [pscustomobject]@{ Mask = $mask; Sid = $msg.sid }
    }
    catch {
        $rechazos++
        $codigo = $_.Exception.Response.StatusCode.value__
        Write-Host "to=$mask status=rechazado_http_$codigo num_segments=- price=- error_code=-"
    }
}

if ($destinos.Count -gt 0 -and $rechazos -eq $destinos.Count) {
    Write-Host 'Twilio rechazo todos los envios: revisar credenciales, TWILIO_FROM y Geo permissions.'
    exit 1
}

$terminales = 'delivered', 'undelivered', 'failed'
foreach ($e in $enviados) {
    $limite = (Get-Date).AddMinutes(5)
    do {
        Start-Sleep -Seconds 10
        $m = Invoke-RestMethod -Uri "$base/Messages/$($e.Sid).json" -Headers $headers
    } while ($terminales -notcontains $m.status -and (Get-Date) -lt $limite)

    # El precio puede llegar vacio unos minutos despues del estado final.
    Write-Host "to=$($e.Mask) status=$($m.status) num_segments=$($m.num_segments) price=$($m.price) $($m.price_unit) error_code=$($m.error_code)"
}

exit 0
