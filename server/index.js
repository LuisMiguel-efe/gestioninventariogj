import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from './prismaClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// ─── HEALTH ───────────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── DEPARTAMENTOS ────────────────────────────────────────────────────────────
app.get('/api/departamentos', async (req, res) => {
  try {
    const deps = await prisma.departamento.findMany({ orderBy: { nombre: 'asc' } });
    res.json(deps);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/departamentos', async (req, res) => {
  const { nombre } = req.body;
  try {
    const dep = await prisma.departamento.create({ data: { nombre } });
    res.json(dep);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/departamentos/:id', async (req, res) => {
  const { nombre } = req.body;
  try {
    const dep = await prisma.departamento.update({
      where: { id: Number(req.params.id) },
      data: { nombre },
    });
    res.json(dep);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/departamentos/:id', async (req, res) => {
  try {
    await prisma.departamento.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── USUARIOS ─────────────────────────────────────────────────────────────────
app.get('/api/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        departamento: true,
        ownedAssets: { select: { id: true, identificador: true, tipo: true, codigo: true, disponibilidad: true } },
      },
      orderBy: { nombre: 'asc' },
    });
    res.json(users);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/users', async (req, res) => {
  const { id, nombre, email, rol, departamentoId, cargo, activo } = req.body;
  try {
    const user = await prisma.user.create({
      data: {
        id,
        nombre,
        email: email || null,
        rol,
        departamentoId: departamentoId ? Number(departamentoId) : null,
        cargo: cargo || null,
        activo: activo ?? true,
      },
    });
    res.json({ id: user.id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/users/:id', async (req, res) => {
  const { nombre, email, rol, departamentoId, cargo, activo } = req.body;
  try {
    await prisma.user.update({
      where: { id: req.params.id },
      data: {
        nombre,
        email: email || null,
        rol,
        departamentoId: departamentoId ? Number(departamentoId) : null,
        cargo: cargo || null,
        activo: activo ?? true,
      },
    });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── ACTIVOS ──────────────────────────────────────────────────────────────────
app.get('/api/assets', async (req, res) => {
  try {
    const { tipo, disponibilidad } = req.query;
    const where = {};
    if (tipo) where.tipo = tipo;
    if (disponibilidad) where.disponibilidad = disponibilidad;

    const assets = await prisma.asset.findMany({
      where,
      include: {
        propietario: { select: { id: true, nombre: true, cargo: true, departamento: true } },
        cellphoneDetail: { include: { phoneLine: true } },
        printerDetail: true,
        departamentoRef: true,
      },
      orderBy: { id: 'asc' },
    });
    res.json(assets);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/assets', async (req, res) => {
  const {
    codigo, identificador, tipo, subTipo, marca, modelo, procesador,
    condicion, estado, disponibilidad, ubicacion, departamentoId,
    propietarioId, fechaAdquisicion, valorAdquisicion, notas, detallesAdicionales,
    // Celular
    imei, imei2, phoneLineId,
    // Impresora
    referenciaEquipo, precioToner, costoPromImpresion, tipoImpresion,
  } = req.body;
  try {
    const asset = await prisma.asset.create({
      data: {
        codigo,
        identificador: identificador || null,
        tipo,
        subTipo: subTipo || null,
        marca,
        modelo,
        procesador: procesador || null,
        condicion: condicion || 'bueno',
        estado: estado || 'activo',
        disponibilidad: disponibilidad || 'disponible',
        ubicacion: ubicacion || null,
        departamentoId: departamentoId ? Number(departamentoId) : null,
        propietarioId: propietarioId || null,
        fechaAdquisicion: fechaAdquisicion ? new Date(fechaAdquisicion) : null,
        valorAdquisicion: valorAdquisicion ? Number(valorAdquisicion) : null,
        notas: notas || null,
        detallesAdicionales: detallesAdicionales || null,
        // Detalle celular
        ...(tipo === 'celular' && {
          cellphoneDetail: {
            create: {
              imei: imei || null,
              imei2: imei2 || null,
              phoneLineId: phoneLineId ? Number(phoneLineId) : null,
            },
          },
        }),
        // Detalle impresora
        ...(tipo === 'impresora' && {
          printerDetail: {
            create: {
              referenciaEquipo: referenciaEquipo || null,
              precioToner: precioToner ? Number(precioToner) : null,
              costoPromImpresion: costoPromImpresion ? Number(costoPromImpresion) : null,
              tipoImpresion: tipoImpresion || null,
            },
          },
        }),
      },
    });
    res.json({ id: asset.id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/assets/:id', async (req, res) => {
  const {
    codigo, identificador, tipo, subTipo, marca, modelo, procesador,
    condicion, estado, disponibilidad, ubicacion, departamentoId,
    propietarioId, fechaAdquisicion, valorAdquisicion, notas, detallesAdicionales,
    imei, imei2, phoneLineId,
    referenciaEquipo, precioToner, costoPromImpresion, tipoImpresion,
  } = req.body;
  const id = Number(req.params.id);
  try {
    await prisma.asset.update({
      where: { id },
      data: {
        codigo,
        identificador: identificador || null,
        tipo,
        subTipo: subTipo || null,
        marca,
        modelo,
        procesador: procesador || null,
        condicion: condicion || 'bueno',
        estado: estado || 'activo',
        disponibilidad: disponibilidad || 'disponible',
        ubicacion: ubicacion || null,
        departamentoId: departamentoId ? Number(departamentoId) : null,
        propietarioId: propietarioId || null,
        fechaAdquisicion: fechaAdquisicion ? new Date(fechaAdquisicion) : null,
        valorAdquisicion: valorAdquisicion ? Number(valorAdquisicion) : null,
        notas: notas || null,
        detallesAdicionales: detallesAdicionales || null,
      },
    });

    // Actualizar o crear detalle celular
    if (tipo === 'celular') {
      await prisma.cellphoneDetail.upsert({
        where: { assetId: id },
        update: {
          imei: imei || null,
          imei2: imei2 || null,
          phoneLineId: phoneLineId ? Number(phoneLineId) : null,
        },
        create: {
          assetId: id,
          imei: imei || null,
          imei2: imei2 || null,
          phoneLineId: phoneLineId ? Number(phoneLineId) : null,
        },
      });
    }

    // Actualizar o crear detalle impresora
    if (tipo === 'impresora') {
      await prisma.printerDetail.upsert({
        where: { assetId: id },
        update: {
          referenciaEquipo: referenciaEquipo || null,
          precioToner: precioToner ? Number(precioToner) : null,
          costoPromImpresion: costoPromImpresion ? Number(costoPromImpresion) : null,
          tipoImpresion: tipoImpresion || null,
        },
        create: {
          assetId: id,
          referenciaEquipo: referenciaEquipo || null,
          precioToner: precioToner ? Number(precioToner) : null,
          costoPromImpresion: costoPromImpresion ? Number(costoPromImpresion) : null,
          tipoImpresion: tipoImpresion || null,
        },
      });
    }

    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/assets/:id', async (req, res) => {
  try {
    await prisma.asset.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── HERRAMIENTAS ─────────────────────────────────────────────────────────────
app.get('/api/herramientas', async (req, res) => {
  try {
    const { categoria, disponibilidad } = req.query;
    const where = {};
    if (categoria) where.categoria = categoria;
    if (disponibilidad) where.disponibilidad = disponibilidad;

    const herramientas = await prisma.herramienta.findMany({
      where,
      include: {
        propietario: { select: { id: true, nombre: true, cargo: true, departamento: true } },
        departamentoRef: true,
      },
      orderBy: { id: 'asc' },
    });
    res.json(herramientas);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/herramientas', async (req, res) => {
  const {
    codigo, identificador, nombre, categoria, marca, modelo,
    condicion, estado, disponibilidad, cantidad, ubicacion, departamentoId,
    propietarioId, fechaAdquisicion, valorAdquisicion, notas, detallesAdicionales,
  } = req.body;
  try {
    const herramienta = await prisma.herramienta.create({
      data: {
        codigo,
        identificador: identificador || null,
        nombre,
        categoria,
        marca,
        modelo,
        condicion: condicion || 'bueno',
        estado: estado || 'activo',
        disponibilidad: disponibilidad || 'disponible',
        cantidad: cantidad ? Number(cantidad) : 1,
        ubicacion: ubicacion || null,
        departamentoId: departamentoId ? Number(departamentoId) : null,
        propietarioId: propietarioId || null,
        fechaAdquisicion: fechaAdquisicion ? new Date(fechaAdquisicion) : null,
        valorAdquisicion: valorAdquisicion ? Number(valorAdquisicion) : null,
        notas: notas || null,
        detallesAdicionales: detallesAdicionales || null,
      },
    });
    res.json({ id: herramienta.id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/herramientas/:id', async (req, res) => {
  const {
    codigo, identificador, nombre, categoria, marca, modelo,
    condicion, estado, disponibilidad, cantidad, ubicacion, departamentoId,
    propietarioId, fechaAdquisicion, valorAdquisicion, notas, detallesAdicionales,
  } = req.body;
  const id = Number(req.params.id);
  try {
    await prisma.herramienta.update({
      where: { id },
      data: {
        codigo,
        identificador: identificador || null,
        nombre,
        categoria,
        marca,
        modelo,
        condicion: condicion || 'bueno',
        estado: estado || 'activo',
        disponibilidad: disponibilidad || 'disponible',
        cantidad: cantidad ? Number(cantidad) : 1,
        ubicacion: ubicacion || null,
        departamentoId: departamentoId ? Number(departamentoId) : null,
        propietarioId: propietarioId || null,
        fechaAdquisicion: fechaAdquisicion ? new Date(fechaAdquisicion) : null,
        valorAdquisicion: valorAdquisicion ? Number(valorAdquisicion) : null,
        notas: notas || null,
        detallesAdicionales: detallesAdicionales || null,
      },
    });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/herramientas/:id', async (req, res) => {
  try {
    await prisma.herramienta.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── MOVIMIENTOS DE HERRAMIENTAS ───────────────────────────────────────────────
app.get('/api/herramienta-movements', async (req, res) => {
  try {
    const { herramientaId, userId } = req.query;
    const where = {};
    if (herramientaId) where.OR = [{ herramientaId: Number(herramientaId) }, { secondaryHerramientaId: Number(herramientaId) }];
    if (userId) where.userId = userId;

    const movements = await prisma.herramientaMovement.findMany({
      where,
      include: {
        herramienta: { select: { id: true, identificador: true, codigo: true, nombre: true, categoria: true, marca: true, modelo: true } },
        secondaryHerramienta: { select: { id: true, identificador: true, codigo: true, nombre: true, categoria: true, marca: true, modelo: true } },
        user: { select: { id: true, nombre: true, cargo: true, email: true, departamento: true } },
        registradoPor: { select: { id: true, nombre: true, cargo: true, email: true } },
      },
      orderBy: { fecha: 'desc' },
    });
    res.json(movements);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/herramienta-movements', async (req, res) => {
  const {
    herramientaId, secondaryHerramientaId, userId, registradoPorId, tipo, fecha,
    fechaRetornoPrevista, condicionEntrega, condicionRecepcion, notas,
  } = req.body;
  try {
    const movement = await prisma.herramientaMovement.create({
      data: {
        herramientaId: Number(herramientaId),
        secondaryHerramientaId: secondaryHerramientaId ? Number(secondaryHerramientaId) : null,
        userId: String(userId),
        registradoPorId: String(registradoPorId),
        tipo,
        fecha: fecha ? new Date(fecha) : new Date(),
        fechaRetornoPrevista: fechaRetornoPrevista ? new Date(fechaRetornoPrevista) : null,
        condicionEntrega: condicionEntrega || null,
        condicionRecepcion: condicionRecepcion || null,
        notas: notas || null,
      },
    });
    res.json({ id: movement.id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── MOVIMIENTOS ──────────────────────────────────────────────────────────────
app.get('/api/movements', async (req, res) => {
  try {
    const { assetId, userId } = req.query;
    const where = {};
    if (assetId) where.OR = [{ assetId: Number(assetId) }, { secondaryAssetId: Number(assetId) }];
    if (userId) where.userId = userId;

    const movements = await prisma.movement.findMany({
      where,
      include: {
        asset: { select: { id: true, identificador: true, codigo: true, tipo: true, marca: true, modelo: true } },
        secondaryAsset: { select: { id: true, identificador: true, codigo: true, tipo: true, marca: true, modelo: true } },
        user: { select: { id: true, nombre: true, cargo: true, email: true, departamento: true } },
        registradoPor: { select: { id: true, nombre: true, cargo: true, email: true } },
      },
      orderBy: { fecha: 'desc' },
    });
    res.json(movements);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/movements', async (req, res) => {
  const {
    assetId, secondaryAssetId, userId, registradoPorId, tipo, fecha,
    fechaRetornoPrevista, condicionEntrega, condicionRecepcion, notas,
  } = req.body;
  try {
    const movement = await prisma.movement.create({
      data: {
        assetId: Number(assetId),
        secondaryAssetId: secondaryAssetId ? Number(secondaryAssetId) : null,
        userId: String(userId),
        registradoPorId: String(registradoPorId),
        tipo,
        fecha: fecha ? new Date(fecha) : new Date(),
        fechaRetornoPrevista: fechaRetornoPrevista ? new Date(fechaRetornoPrevista) : null,
        condicionEntrega: condicionEntrega || null,
        condicionRecepcion: condicionRecepcion || null,
        notas: notas || null,
      },
    });
    res.json({ id: movement.id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── LÍNEAS MÓVILES ───────────────────────────────────────────────────────────
app.get('/api/phonelines', async (req, res) => {
  try {
    const lines = await prisma.phoneLine.findMany({
      include: { cellphones: { include: { asset: { select: { id: true, identificador: true, codigo: true } } } } },
      orderBy: { numero: 'asc' },
    });
    res.json(lines);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/phonelines', async (req, res) => {
  const { numero, operador, planNombre, precioMensual, fechaActivacion, notas, activa } = req.body;
  try {
    const line = await prisma.phoneLine.create({
      data: {
        numero,
        operador,
        planNombre: planNombre || null,
        precioMensual: precioMensual ? Number(precioMensual) : null,
        fechaActivacion: fechaActivacion ? new Date(fechaActivacion) : null,
        notas: notas || null,
        activa: activa ?? true,
      },
    });
    res.json(line);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/phonelines/:id', async (req, res) => {
  const { numero, operador, planNombre, precioMensual, fechaActivacion, notas, activa } = req.body;
  try {
    const line = await prisma.phoneLine.update({
      where: { id: Number(req.params.id) },
      data: {
        numero,
        operador,
        planNombre: planNombre || null,
        precioMensual: precioMensual ? Number(precioMensual) : null,
        fechaActivacion: fechaActivacion ? new Date(fechaActivacion) : null,
        notas: notas || null,
        activa: activa ?? true,
      },
    });
    res.json(line);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/phonelines/:id', async (req, res) => {
  try {
    await prisma.phoneLine.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── SERVIDOR ─────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

const distPath = path.resolve(__dirname, '../dist');
app.use(express.static(distPath));

app.use((req, res) => {
  if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/health')) {
    res.sendFile(path.join(distPath, 'index.html'));
  } else {
    res.status(404).json({ error: 'Not Found' });
  }
});

console.log(`[backend] Starting server on ${HOST}:${PORT}`);
console.log(`[backend] DATABASE_URL: ${process.env.DATABASE_URL ? 'set' : 'missing'}`);

try {
  await prisma.$connect();
  const server = app.listen(PORT, HOST, () => {
    console.log(`[backend] Server running on http://${HOST}:${PORT}`);
  });

  const shutdown = (signal) => {
    server.close(() => {
      prisma.$disconnect().finally(() => process.exit(0));
    });
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('uncaughtException', (err) => { console.error(err); process.exit(1); });
  process.on('unhandledRejection', (reason) => { console.error(reason); process.exit(1); });
} catch (err) {
  console.error('[backend] Prisma connection failed:', err);
  process.exit(1);
}
