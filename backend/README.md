# Backend Laravel

API REST versionada bajo `/api/v1`, construida con Laravel 12, PHP 8.4+ y
MySQL. Laravel aporta routing, validacion, autenticacion, middleware,
transacciones, colas y pruebas automatizadas.

Estructura actual:

- `laravel/app/Http/Controllers/Api/`: endpoints JSON.
- `laravel/routes/api.php`: rutas versionadas.
- `laravel/config/`: configuracion de entorno y servicios.
- `laravel/database/`: migraciones nativas futuras.
- `laravel/tests/`: pruebas de contrato y dominio.

La API debe desplegarse en hosting compatible con PHP; Vercel alojara el
frontend, no este backend.

## Desarrollo local

Requiere Docker Desktop y MySQL accesible desde el host. Desde la raiz del
proyecto, construye la imagen y levanta la API:

```powershell
$env:CAFE_DB_PASSWORD = Read-Host 'Contraseña MySQL'
docker build -t cafe-web-api-laravel ./backend/laravel
docker run --rm -p 8000:8000 --add-host=host.docker.internal:host-gateway `
	-e APP_ENV=local `
	-e FRONTEND_URL=http://localhost:5173 `
	-e DB_HOST=host.docker.internal `
	-e DB_PORT=3306 `
	-e DB_DATABASE=cafe_web `
	-e DB_USERNAME=cafe_web `
	-e DB_PASSWORD=$env:CAFE_DB_PASSWORD `
	cafe-web-api-laravel

Remove-Item Env:CAFE_DB_PASSWORD
```

Comprueba la conexion con `http://localhost:8000/api/v1/health`.

## Licenciamiento SaaS

El producto sera multi-tenant: cada solicitud autenticada tendra un
`cafeteria_id` y todas las consultas de negocio se limitaran a ese tenant.
El licenciamiento debe usar estas entidades en una migracion posterior:

- `planes`: nombre, precio, moneda, periodicidad y limites.
- `suscripciones`: cafeteria, plan, estado, periodo actual y proveedor.
- `licencias`: clave publica, estado, fechas y ultima validacion.
- `uso_cafeteria`: contadores mensuales de pedidos, usuarios y productos.

La autorizacion de funcionalidades se implementara con middleware y policies;
los limites se validaran en servicios transaccionales. La licencia se cacheara
por un periodo corto y existira un periodo de gracia para que una demora del
proveedor de pagos no bloquee pedidos ni acceso administrativo de inmediato.