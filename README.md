# Cafe Web

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev/)
[![Laravel](https://img.shields.io/badge/Laravel-12-FF2D20?logo=laravel)](https://laravel.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.4-4479A1?logo=mysql)](https://www.mysql.com/)

Cafe Web es una plataforma SaaS open source para la operación diaria de cafeterías. Incluye catálogo digital, carrito de compras, pedidos, seguimiento, panel de operación y asistente de recomendaciones para clientes.

Es una base útil para cafeterías pequeñas, locales de especialidad, food trucks, proyectos de portafolio o equipos que quieren aprender una arquitectura moderna con React, Laravel y MySQL.

## Características

- Catálogo de productos con categorías y búsqueda
- Carrito de compra y flujo de checkout
- Seguimiento de pedidos por código y teléfono
- Panel de administración para cambiar estados y disponibilidad
- Asistente de cafe con recomendaciones locales
- Base de datos y datos demo listos para ejecutar en Docker
- Arquitectura con frontend, backend y API separadas

## Stack tecnológico

- Frontend: React + Vite
- Backend: Laravel 12 + PHP 8.2+
- Base de datos: MySQL 8.4
- Contenedores: Docker Compose
- Despliegue: Vercel para frontend y hosting PHP para API

## Estructura del proyecto

- frontend/: aplicación web del cliente
- backend/laravel/: API REST y lógica de negocio
- database/: esquema y datos demo
- documentation/: arquitectura y decisiones técnicas
- scripts/: automatización local de entorno

## Estado del proyecto

Este repositorio está pensado como una base práctica y funcional para una cafetería digital. Ya incluye flujo principal operativo, así como una API REST preparada para continuar ampliando funcionalidades.

## Inicio rápido

Requisitos:

- Docker Desktop
- Node.js LTS

Desde la raíz del proyecto:

```powershell
.\scripts\start-local-stack.ps1
```

Esto levanta MySQL y la API Laravel en Docker. Luego inicia el frontend en otra terminal:

```powershell
npm install --prefix frontend
npm run dev --prefix frontend
```

## Variables de entorno

El proyecto genera automaticamente un archivo local .env.docker para entorno de desarrollo. No se sube a Git por seguridad.

Para activar respuestas generativas del asistente, agrega tu API key de OpenAI en .env.docker y reinicia la API.

## Arquitectura

La aplicación separa claramente:

- Frontend para experiencia de cliente
- API para catálogo, pedidos y administración
- MySQL para persistencia transaccional
- Docker para entorno local reproducible

## Licencia

Este proyecto se distribuye bajo la licencia MIT. Puedes usarlo, modificarlo, aprender de él y compartirlo con atribución.

## ¿Para quién sirve?

- Cafeterías pequeñas o emergentes
- Proyectos de portafolio y aprendizaje
- Equipos que quieran una base realista de SaaS para operación diaria
- Desarrolladores que buscan un ejemplo claro de monorepo con frontend, backend y base de datos

## Contribuciones

Las contribuciones son bienvenidas. Haz un fork, crea tu rama y abre un pull request con mejoras, correcciones o nuevas funcionalidades.

## Autor

Cafe Web

## Contacto

Puedes usar este repositorio como base para tu proyecto, un portafolio o una solución real para una cafetería.