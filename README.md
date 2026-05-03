# Inventario GJ - Web Application

Inventario GJ es una aplicación web de inventario construida con React, Vite, Express y PostgreSQL.

## 🚀 Características

- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Express.js + Node.js
- **Base de datos**: PostgreSQL con Prisma
- **API REST**: Activos, usuarios y movimientos
- **Deployment**: Vercel / Supabase / Neon mediante `DATABASE_URL`
- **Eliminado**: Electron y Docker no son necesarios para el flujo actual

## 📋 Requisitos Previos

### Para desarrollo local

- Node.js 18+ 
- npm 9+
- PostgreSQL o proveedor compatible (Supabase, Neon, etc.)

## 🛠️ Configuración Rápida

### Desarrollo Local

1. **Instalar dependencias**
   ```bash
   npm install
   ```

2. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   ```

3. **Ejecutar en desarrollo**
   ```bash
   npm run dev
   ```

- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- API: http://localhost:3000/api

## 📁 Estructura del Proyecto

```
inventario_gj/
├── src/                    # Frontend (React + TypeScript)
├── server/                 # Backend (Express + Prisma)
│   ├── index.js            # Servidor principal
│   └── prismaClient.js     # Cliente Prisma compartido
├── prisma/                 # Esquema Prisma y scripts SQL
├── public/                 # Archivos estáticos
├── .env.example            # Variables de entorno
├── package.json            # Dependencias y scripts
└── README.md               # Documentación del proyecto
```

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Inicia Vite + servidor (concurrently)

# Producción
npm run start            # Inicia solo el servidor
npm run build            # Construye el frontend
npm run preview          # Vista previa de build

# Prisma
npm run prisma:generate   # Genera el cliente Prisma
npm run prisma:migrate    # Crea migraciones locales
npm run prisma:migrate:deploy  # Ejecuta migraciones en producción

# Validación
npm run lint             # ESLint
```

## 🌐 Variables de Entorno

Ver [.env.example](.env.example):

- `NODE_ENV`: Modo de ejecución (production/development)
- `PORT`: Puerto del servidor (default: 3000)
- `HOST`: Host de escucha (default: 0.0.0.0)
- `DATABASE_URL`: Cadena de conexión PostgreSQL
- `VITE_API_URL`: URL base para llamadas API del frontend

## 🔌 API REST

### Endpoints Disponibles

```
GET     /health                     # Health check
GET     /api/users                  # Listar usuarios
POST    /api/users                  # Crear usuario
PUT     /api/users/:id              # Actualizar usuario
DELETE  /api/users/:id              # Eliminar usuario

GET     /api/assets                 # Listar activos
POST    /api/assets                 # Crear activo
PUT     /api/assets/:id             # Actualizar activo
DELETE  /api/assets/:id             # Eliminar activo

GET     /api/movements              # Listar movimientos
POST    /api/movements              # Registrar movimiento
```

## 🗄️ Base de Datos SQLite

### Tablas

- **users**: Usuarios del sistema
- **assets**: Activos/equipos
- **movements**: Historial de movimientos

### Ubicaciones

- **Desarrollo**: Configurable vía `DB_PATH`
- **Docker**: `/app/data/inventario.db` (volumen persistente)

### Inicialización Automática

La BD se crea automáticamente en el primer inicio si no existe.

## 🐛 Troubleshooting

### Docker

```bash
# Ver logs en tiempo real
docker-compose logs -f app

# Acceder a la shell del contenedor
docker-compose exec app sh

# Verificar que el volumen está montado
docker-compose exec app ls -la /app/data

# Reconstruir la imagen
docker-compose down
docker-compose up --build --force-recreate
```

### Desarrollo Local

```bash
# Limpiar caché
rm -rf node_modules dist
npm install

# Puerto en uso
# Si el puerto 3000 está ocupado, cambiar en .env.local
PORT=3001 npm run dev

# Base de datos corrupta
rm -f server/database.sqlite
npm run dev
```

## 📝 Cambios Recientes (Refactorización)

### ✅ Eliminado

- Electron y todas sus dependencias
- electron-builder y herramientas de empaquetado
- Scripts de build específicos de Windows
- Rutas hardcodeadas de Windows
- Almacenamiento temporal en %APPDATA%

### ✅ Agregado

- Dockerfile optimizado (multi-stage build)
- docker-compose.yml para orquestación
- Endpoint `/health` para health checks
- Soporte completo para Linux/Docker
- Variables de entorno centralizadas
- Inicialización automática de BD
- Servicio de archivos estáticos en el servidor

### ✅ Modificado

- package.json: removidas dependencias de Electron
- server/db.js: rutas compatibles con Docker
- server/index.js: HOST 0.0.0.0, estaticos servidos, graceful shutdown mejorado
- Configuración de CORS para producción

## 🚀 Deploy

### En servidor Linux

1. Clonar el repositorio
2. Crear archivo `.env` con variables necesarias
3. Ejecutar: `docker-compose up -d --build`

### Usando reverse proxy (Nginx)

```nginx
server {
    listen 80;
    server_name mi-inventario.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📄 Licencia

Grupo Jacafran (GJ) - 2026

## 🤝 Contribuciones

Para cambios importantes:
1. Fork del repositorio
2. Create tu feature branch
3. Commit tus cambios
4. Push a la rama
5. Open Pull Request

---

**Nota**: Este proyecto ya no depende de Electron. Es una aplicación web pura ejecutada en contenedor Docker.

