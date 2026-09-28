$ErrorActionPreference = 'Stop'

$repositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path.Replace('\', '/')
$environmentFile = Join-Path $repositoryRoot '.env.docker'

if (-not (Test-Path $environmentFile)) {
    throw 'Primero inicia el entorno local con .\scripts\start-local-stack.ps1.'
}

docker compose --env-file $environmentFile run --rm `
    -e DB_CONNECTION=sqlite `
    -e DB_DATABASE=:memory: `
    -e CACHE_STORE=array `
    -v "${repositoryRoot}/backend/laravel:/app" `
    api php artisan test

if ($LASTEXITCODE -ne 0) {
    throw 'Fallaron las pruebas de la API.'
}