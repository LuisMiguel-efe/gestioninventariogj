# MIGRACIÓN A POSTGRESQL

Esta guía describe el estado actual del proyecto Inventario GJ como aplicación web con PostgreSQL.

## Resumen

- El proyecto ya no depende de Electron.
- El proyecto ya no requiere Docker para desarrollo local.
- La base de datos ahora usa PostgreSQL, conectada mediante `DATABASE_URL`.
- Prisma es el ORM usado para el backend.

## Configuración del entorno

1. Clona el repositorio.
2. Copia el archivo de entorno:
   ```bash
   cp .env.example .env
   ```
3. Edita `.env` y configura tu conexión PostgreSQL:
   ```bash
   DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"
   ```

## Pasos para ejecutar en desarrollo

1. Instala dependencias:
   ```bash
   npm install
   ```
2. Genera el cliente Prisma:
   ```bash
   npm run prisma:generate
   ```
3. Inicia la aplicación:
   ```bash
   npm run dev
   ```
4. Abre el frontend en:
   ```
   http://localhost:5173
   ```

## Validación del backend

El backend expone:

- `GET /health`
- `GET /api/users`
- `POST /api/users`
- `GET /api/assets`
- `POST /api/assets`
- `PUT /api/assets/:id`
- `DELETE /api/assets/:id`
- `GET /api/movements`
- `POST /api/movements`

## Notas importantes

- `server/index.js` es el servidor principal que arranca en el puerto 3000.
- `prisma/schema.prisma` define el modelo de datos para PostgreSQL.
- `prisma/postgres-init.sql` contiene un script de referencia para crear las tablas.
- `src/api.ts` consume `http://localhost:3000/api` en desarrollo.

## Eliminado

Se eliminaron las integraciones de Electron y las dependencias de Docker antiguas para mantener el proyecto enfocado en la aplicación web con PostgreSQL.
