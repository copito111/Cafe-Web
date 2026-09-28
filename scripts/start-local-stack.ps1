$ErrorActionPreference = 'Stop'

$repositoryRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$environmentFile = Join-Path $repositoryRoot '.env.docker'

function New-RandomHex([int]$byteCount) {
    $bytes = New-Object byte[] $byteCount
    $generator = [System.Security.Cryptography.RandomNumberGenerator]::Create()

    try {
        $generator.GetBytes($bytes)
    } finally {
        $generator.Dispose()
    }

    return [System.BitConverter]::ToString($bytes).Replace('-', '').ToLowerInvariant()
}

function New-RandomBase64([int]$byteCount) {
    $bytes = New-Object byte[] $byteCount
    $generator = [System.Security.Cryptography.RandomNumberGenerator]::Create()

    try {
        $generator.GetBytes($bytes)
    } finally {
        $generator.Dispose()
    }

    return [System.Convert]::ToBase64String($bytes)
}

if (-not (Test-Path $environmentFile)) {
    $environment = @(
        'MYSQL_DATABASE=cafe_web',
        'MYSQL_USER=cafe_web',
        "MYSQL_PASSWORD=$(New-RandomHex 24)",
        "MYSQL_ROOT_PASSWORD=$(New-RandomHex 24)",
        "APP_KEY=base64:$(New-RandomBase64 32)",
        "CAFE_ADMIN_PASSWORD=$(New-RandomHex 24)",
        'OPENAI_API_KEY=',
        'OPENAI_MODEL=gpt-4o-mini',
        'FRONTEND_URL=http://localhost:5173'
    )

    [System.IO.File]::WriteAllLines($environmentFile, $environment, [System.Text.UTF8Encoding]::new($false))
    Write-Host 'Se generó .env.docker con credenciales locales (archivo ignorado por Git).'
}

$environmentContent = Get-Content $environmentFile
$environmentChanged = $false

if (-not ($environmentContent -match '^OPENAI_API_KEY=')) {
    Add-Content -Path $environmentFile -Value 'OPENAI_API_KEY='
    $environmentChanged = $true
}

if (-not ($environmentContent -match '^OPENAI_MODEL=')) {
    Add-Content -Path $environmentFile -Value 'OPENAI_MODEL=gpt-4o-mini'
    $environmentChanged = $true
}

if ($environmentChanged) {
    Write-Host 'Se añadieron variables opcionales para el asistente generativo a .env.docker.'
}

Push-Location $repositoryRoot

try {
    docker compose --env-file $environmentFile up --build -d

    if ($LASTEXITCODE -ne 0) {
        throw 'No fue posible iniciar el stack local de Cafe Web.'
    }

    docker compose --env-file $environmentFile ps
} finally {
    Pop-Location
}