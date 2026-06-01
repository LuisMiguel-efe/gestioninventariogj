# Integración de Planes Móviles Corporativos

## Descripción

Se ha añadido una nueva tabla `PlanesMoviles` que permite gestionar planes corporativos centralizados. Esto facilita:

- Seleccionar planes corporativos predefinidos al crear líneas móviles
- Actualizar automáticamente el precio y nombre del plan
- Cambiar el precio de un plan una sola vez y que se refleje en todas las líneas asociadas

## Cambios en la Base de Datos

### Nueva Tabla: `PlanesMoviles`

```sql
CREATE TABLE "PlanMovil" (
  id SERIAL PRIMARY KEY,
  operador TEXT NOT NULL,
  plan TEXT NOT NULL,
  precio DOUBLE PRECISION NOT NULL,
  UNIQUE(operador, plan)
);
```

### Cambios en la Tabla: `PhoneLine`

Se agregaron dos columnas:
- `planeId` (INT, nullable, FK a PlanMovil)
- `plane` (relación Prisma a PlanMovil)

Los campos existentes `planNombre` y `precioMensual` se mantienen para compatibilidad hacia atrás.

## Uso en la Aplicación

### Para Crear una Línea Móvil

1. **Con Plan Corporativo** (Recomendado):
   - Seleccionar un plan del desplegable "Plan Corporativo"
   - Los campos "Nombre del Plan" y "Precio Mensual" se llenarán automáticamente
   - El operador también se actualizará según el plan seleccionado

2. **Sin Plan Corporativo**:
   - Dejar "Plan Corporativo" vacío
   - Completar manualmente "Nombre del Plan" y "Precio Mensual"

### Cambiar Precio de un Plan

Los precios se cambian desde los endpoints `/api/plans` (o en futuro desde una interfaz de administración).

Si se actualiza el precio de un plan, las líneas que referenencien ese plan mostrarán el nuevo precio.

## Migración de Datos Existentes

Si ya tienes líneas móviles registradas, puedes migrar automáticamente a la nueva estructura:

```bash
npm run migrate:plans
```

Esto:
1. Identifica todas las combinaciones únicas de (operador, plan, precio)
2. Crea un registro en `PlanesMoviles` para cada combinación
3. Asocia cada línea existente al plan correspondiente

**Nota**: Los datos originales en `planNombre` y `precioMensual` se preservan.

## API Endpoints

### Planes Móviles

- `GET /api/plans` - Obtener todos los planes
- `POST /api/plans` - Crear nuevo plan
  ```json
  { "operador": "Claro", "plan": "Plan Empresarial", "precio": 25000 }
  ```
- `PUT /api/plans/:id` - Actualizar plan
- `DELETE /api/plans/:id` - Eliminar plan

### Líneas Móviles (Actualizado)

Los endpoints existentes ahora soportan `planeId`:

- `POST /api/phonelines` - Crear línea (incluir `planeId` opcional)
- `PUT /api/phonelines/:id` - Actualizar línea (incluir `planeId` opcional)

## Consultas a la BD

### Obtener líneas móviles con sus planes

```sql
SELECT 
  pl.id, 
  pl.numero, 
  pl.operador,
  pl."planNombre",
  pl."precioMensual",
  pm.id as "planeId",
  pm.plan as "planNombre_actual",
  pm.precio as "precio_actual"
FROM "PhoneLine" pl
LEFT JOIN "PlanMovil" pm ON pl."planeId" = pm.id
ORDER BY pl.numero;
```

### Líneas sin plan corporativo asociado

```sql
SELECT id, numero, operador, "planNombre", "precioMensual"
FROM "PhoneLine"
WHERE "planeId" IS NULL;
```

## Notas de Compatibilidad

- **Sin datos perdidos**: Todos los datos existentes se preservan
- **Migración opcional**: Puedes usar solo la nueva funcionalidad sin migrar los datos antiguos
- **Flexibilidad**: Las líneas pueden tener plan corporativo O datos manuales, o ambos
- **Actualización progresiva**: Puedes migrar líneas individuales sin afectar al resto
