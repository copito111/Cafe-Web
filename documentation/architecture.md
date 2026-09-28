# Arquitectura de Cafe Web

## Contexto y limites

Cafe Web se plantea como SaaS multi-tenant: una cuenta de cafeteria opera su
catalogo, personal, clientes, pedidos y datos comerciales sin acceso a los de
otras cafeterias. El identificador de cafeteria es parte del contexto de cada
solicitud autenticada y de las consultas de negocio.

```text
Navegador
  | HTTPS / JSON
  v
React + Vite (Vercel)
  | API REST versionada; URL via VITE_API_BASE_URL
  v
PHP 8.2+ (hosting compatible con PHP)
  | PDO sobre TLS, credenciales solo del servidor
  v
MySQL administrado
```

Vercel no ofrece PHP como runtime nativo para esta arquitectura. Por eso el
frontend se despliega en Vercel y la API en un servicio PHP independiente;
ambos despliegues se conectan mediante HTTPS, CORS restringido y variables de
entorno. MySQL no se expone al navegador.

## Responsabilidades

- `frontend/`: interfaz React responsive, rutas/pantallas, componentes y
  clientes HTTP. Solo `VITE_*` es publicable en el bundle; nunca secretos.
- `backend/`: API REST y reglas de negocio. Controllers manejan HTTP, services
  aplican reglas y transacciones, models encapsulan persistencia.
- `database/`: migraciones SQL reproducibles, indices y restricciones.
- `documentation/`: decisiones, guias de operacion, instalacion y QA.

## Dominios y relaciones previstas

La Fase 2 concretara el ERD y las migraciones. Relaciones de alto nivel:

- `cafeterias` 1:N `usuarios`, `categorias`, `productos`, `pedidos`,
  `inventario` y `configuracion`.
- `clientes` 1:N `pedidos` y `opiniones`; un cliente puede vincularse a una
  cuenta de usuario sin que ambas identidades sean obligatoriamente iguales.
- `pedidos` 1:N `detalle_pedidos` y 1:N `pagos`; cada detalle referencia un
  producto y conserva nombre/precio al momento de la compra.
- `ventas` se genera desde el pedido segun la regla de pago/entrega que se
  defina; se evitara duplicar importes calculables sin necesidad.
- `inventario` se asocia a producto y cafeteria. Se evaluara registrar
  movimientos para auditar entradas, salidas y ajustes, no solo existencias.

Las entidades solicitadas (usuarios, clientes, productos, categorias,
pedidos, detalle_pedidos, pagos, inventario, ventas, opiniones y configuracion)
se mantienen. `cafeterias` es una entidad adicional necesaria para que el
producto SaaS aisle tenants desde el modelo de datos. El esquema inicial y el
ERD versionado estan en `database/migrations/001_initial_schema.sql` y
`database/README.md`.

## Seguridad base

- PDO con prepared statements y credenciales MySQL de minimo privilegio.
- Validacion en servidor, codificacion contextual al renderizar y errores sin
  detalles internos. El frontend no sustituye validaciones del backend.
- Autorizacion por rol (`administrador`, `empleado`, `cliente`) y alcance de
  cafeteria en cada recurso; no confiar en un `cafe_id` enviado por el cliente.
- Sesiones seguras con cookies `HttpOnly`, `Secure` en produccion y `SameSite`
  apropiado; CSRF si se autentica con cookies.
- HTTPS, CORS de origen permitido, rate limiting y secretos fuera de Git.
- Contraseñas con `password_hash`/`password_verify`; nunca guardar datos de
  tarjeta. Integrar pagos con proveedor compatible cuando se defina el alcance.

## Despliegue

Vercel construye `frontend/` desde la raiz del repositorio usando `vercel.json`.
Configurar `VITE_API_BASE_URL` en el proyecto Vercel. Desplegar `backend/` en
hosting PHP con PHP 8.2+, extensiones PDO MySQL y HTTPS; configurar alli las
variables privadas de `.env.example`. Crear MySQL administrado, aplicar
migraciones y permitir conexiones solo desde el backend cuando el proveedor lo
permita. La guia operativa completa corresponde a la Fase 8.

## Secuencia y criterios

1. Arquitectura y estructura.
2. ERD, esquema y migraciones MySQL.
3. API PHP, autenticacion, permisos y validacion.
4. Experiencia de cliente y catalogo responsive.
5. Chatbot con recomendaciones acotadas a catalogo y promociones vigentes.
6. Operacion administrativa, metricas y visualizaciones.
7. Pruebas de contratos, flujos, permisos, aislamiento multi-tenant y QA.
8. Guia de despliegue, variables y verificacion de produccion.

Antes de produccion deben existir pruebas automatizadas, revision de controles
de acceso entre cafeterias, respaldo/restauracion de base de datos, observabilidad
y una politica de retencion de datos. Esta fase solo establece la estructura;
no declara implementados esos controles.

## Runtime y licenciamiento SaaS

La API oficial se implementa en `backend/laravel/` con Laravel 12 y PHP 8.4+.
Laravel concentra routing, validacion, middleware, transacciones, colas y
pruebas; MySQL continua siendo la persistencia compartida por tenant.

El licenciamiento se incorporara con planes, suscripciones, licencias y
contadores de uso asociados a `cafeteria_id`. Policies y middleware limitaran
funcionalidades y cuotas. La validacion de licencia se cacheara por un periodo
corto y tendra periodo de gracia para no bloquear pedidos ante una interrupcion
temporal del proveedor de pagos.