# Cafe Web

Cafe Web es una plataforma SaaS open source para la operación diaria de cafeterías: catálogo, pedidos, clientes, ventas, inventario y analítica.

Es una base útil para cafeterías pequeñas, food trucks, locales con servicio rápido o proyectos educativos que quieran aprender arquitectura moderna de producto con React + Laravel + MySQL.

## Estado

Frontend React funcional y API REST Laravel 12 para catálogo, pedidos y operación. El esquema MySQL inicial y los datos de demostración están en `database/`.

## Arquitectura

- `frontend/`: React y Vite; cliente web responsive, desplegado en Vercel.
- `backend/`: API REST en PHP 8.2+, organizada por responsabilidad; desplegada en un proveedor que ejecute PHP.
- `database/`: migraciones y esquema MySQL, versionados con el backend.
- `documentation/`: decisiones de arquitectura, instalación y QA.
- MySQL administrado: persistencia transaccional. El frontend solo se comunica con la API; nunca recibe credenciales de base de datos.

Vercel no ejecuta esta API PHP como runtime nativo. El despliegue usa dos servicios: Vercel para el frontend y un hosting PHP para la API. Configura `VITE_API_BASE_URL` con la URL pública de esa API.

## Licencia

Este proyecto está disponible bajo la licencia MIT. Puedes usarlo, modificarlo y compartirlo libremente con atribución.

## Inicio local

Requisitos: Docker Desktop y Node.js LTS. Desde la raíz del repositorio, levanta MySQL y la API PHP/Laravel:

```powershell
.\scripts\start-local-stack.ps1
```

El script genera `.env.docker` con credenciales aleatorias locales; el archivo está excluido de Git. El acceso demo usa `admin@cafeaurora.local`; consulta `CAFE_ADMIN_PASSWORD` en ese archivo para iniciar sesión. La API queda en `http://localhost:8000` y permite el origen local `http://127.0.0.1:5173`.

En otra terminal, instala y levanta el frontend:

```powershell
npm install --prefix frontend
npm run dev --prefix frontend
```

Para ejecutar las pruebas backend de forma aislada, usa una tercera terminal:

```powershell
.\scripts\test-backend.ps1
```

La URL del backend puede cambiarse con `VITE_API_BASE_URL`. Configura `VITE_WHATSAPP_PHONE` con el número real en formato internacional (solo dígitos) si la ficha de cafetería no tiene teléfono. Sin un número configurado, el asistente guía por el catálogo y los pedidos, pero no muestra un enlace WhatsApp ficticio. Para apagar el stack: `docker compose --env-file .env.docker down`. Para conservar la base, no uses `-v` al apagarlo. Consulta [la arquitectura y las decisiones](documentation/architecture.md) para el modelo de dominios y las decisiones de despliegue.

El asistente también funciona sin IA generativa con recomendaciones locales del catálogo. Para activar respuestas generativas, agrega `OPENAI_API_KEY` a `.env.docker` y, opcionalmente, cambia `OPENAI_MODEL`; después reinicia la API:

```powershell
docker compose --env-file .env.docker up --build -d api
```

La clave se usa exclusivamente en Laravel y nunca se publica como variable `VITE_*`. Las respuestas se limitan al catálogo disponible; si el proveedor no está configurado o no responde, la guía local sigue activa.

## Fases

1. Arquitectura y estructura (actual).
2. Modelo relacional y esquema MySQL.
3. API REST PHP y seguridad.
4. Experiencia de cliente y catálogo web.
5. CafeBot y recomendaciones.
6. Panel de operación y analítica.
7. Pruebas funcionales, seguridad y QA.
8. Preparación y guía de despliegue.

## ¿Para quién sirve?

- Cafeterías pequeñas o emergentes que quieren una primera versión digital.
- Proyectos de práctica o portafolio.
- Equipos que quieran reutilizar una base de SaaS para operación diaria.
- Personas que buscan un ejemplo claro de monorepo con frontend, backend y base de datos.

## Contribuciones

Las contribuciones son bienvenidas. Si quieres mejorar el proyecto, haz un fork, crea tu rama y abre un pull request con tus cambios.