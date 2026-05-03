# 🔐 Sistema de Autenticación - Documentación

## ✅ Implementación Completada

Se ha implementado un sistema de login seguro con autenticación basada en credenciales estáticas. El sistema incluye:

### 📁 Nuevos Archivos Creados

1. **`src/contexts/AuthContext.tsx`**
   - Context global para manejar el estado de autenticación
   - Funciones: `login()`, `logout()`
   - Hook personalizado: `useAuth()`
   - Validación de credenciales estáticas
   - Persistencia de sesión en localStorage con token

2. **`src/pages/Login.tsx`**
   - Página de login con UI profesional
   - Validación de campos
   - Mostrar/ocultar contraseña
   - Indicador de carga
   - Mensajes de error amigables

3. **`src/pages/Login.css`**
   - Estilos modernos con gradiente
   - Animaciones suaves
   - Diseño responsive
   - Efectos de hover y focus

4. **`src/components/ProtectedRoute.tsx`**
   - Componente para proteger rutas
   - Redirige a login si no está autenticado
   - Permite acceso solo a usuarios autenticados

### 🔧 Archivos Modificados

1. **`src/App.tsx`**
   - Añadido `AuthProvider` wrapper
   - Ruta pública `/login`
   - Rutas protegidas con `ProtectedRoute`
   - Redirección automática

2. **`src/components/Layout.tsx`**
   - Importación de `useAuth` hook
   - Botón de logout con icono
   - Muestra usuario actual
   - Redirección a login al desconectarse

### 🔐 Credenciales

```
Usuario: adminGJ
Contraseña: adminGJ?2026
```

### 🛡️ Características de Seguridad

✓ **Token Basado**: Generación de token con Base64 (mejorable con JWT en producción)
✓ **Validación**: Las credenciales se validan contra valores estáticos
✓ **Persistencia Segura**: Token guardado en localStorage (solo lectura en cliente)
✓ **Verificación de Sesión**: Valida token al recargar la página
✓ **Logout Seguro**: Limpia localStorage y estado al cerrar sesión
✓ **Rutas Protegidas**: No se puede acceder a las páginas sin autenticarse

### 🔄 Flujo de Autenticación

1. **Usuario no autenticado** → Redirige a `/login`
2. **Ingresa credenciales** → Validación en AuthContext
3. **Login exitoso** → Token guardado + Redirige a Dashboard
4. **Recarga de página** → Valida token y mantiene sesión
5. **Logout** → Limpia datos + Redirige a login

### 📱 Interfaz de Usuario

- ✨ Diseño moderno con gradiente
- 🎨 Animaciones fluidas
- 📱 Totalmente responsive
- 👁️ Toggle para mostrar/ocultar contraseña
- ⚠️ Mensajes de error claros
- ⏳ Indicador de carga

### 🚀 Cómo Usar

1. **Instala dependencias** (si no las has hecho):
   ```bash
   npm install
   ```

2. **Inicia la aplicación**:
   ```bash
   npm run dev
   ```

3. **Accede a**: `http://localhost:5173`

4. **Login con**:
   - Usuario: `adminGJ`
   - Contraseña: `adminGJ?2026`

### 🔧 Mejoras Futuras

Para producción, considera:

- [ ] Implementar JWT (JSON Web Tokens)
- [ ] Conectar a base de datos real
- [ ] Hash de contraseñas (bcrypt)
- [ ] Refresh tokens
- [ ] 2FA (Autenticación de dos factores)
- [ ] Rate limiting en login
- [ ] Auditoría de intentos fallidos
- [ ] Sesiones con expiración

### 📝 Notas

- El token se valida automáticamente al recargar la página
- La sesión persiste mientras no se limpie localStorage
- Se puede cerrar sesión desde el botón en la barra lateral
- Las rutas internas están protegidas y redirigen a login si faltan credenciales
