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

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- USERS ---
app.get('/api/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', async (req, res) => {
  const { id, nombre, email, rol, departamento, activo } = req.body;
  try {
    const user = await prisma.user.create({
      data: {
        id,
        nombre,
        email: email || null,
        rol,
        departamento,
        activo: activo ?? true,
      },
    });
    res.json({ id: user.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  const { nombre, email, rol, departamento, activo } = req.body;
  try {
    await prisma.user.update({
      where: { id: req.params.id },
      data: {
        nombre,
        email: email || null,
        rol,
        departamento,
        activo: activo ?? true,
      },
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ASSETS ---
app.get('/api/assets', async (req, res) => {
  try {
    const assets = await prisma.asset.findMany();
    res.json(assets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/assets', async (req, res) => {
  const {
    codigo,
    tipo,
    marca,
    modelo,
    estado,
    disponibilidad,
    ubicacion,
    propietarioId,
    fechaAdquisicion,
    notas,
    identificador,
    procesador,
    detallesAdicionales,
  } = req.body;
  try {
    const asset = await prisma.asset.create({
      data: {
        codigo,
        tipo,
        marca,
        modelo,
        estado,
        disponibilidad,
        ubicacion,
        propietarioId: propietarioId || null,
        fechaAdquisicion: fechaAdquisicion ? new Date(fechaAdquisicion) : null,
        notas: notas || null,
        identificador: identificador || null,
        procesador: procesador || null,
        detallesAdicionales: detallesAdicionales || null,
      },
    });
    res.json({ id: asset.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/assets/:id', async (req, res) => {
  const {
    codigo,
    tipo,
    marca,
    modelo,
    estado,
    disponibilidad,
    ubicacion,
    propietarioId,
    fechaAdquisicion,
    notas,
    identificador,
    procesador,
    detallesAdicionales,
  } = req.body;
  try {
    await prisma.asset.update({
      where: { id: Number(req.params.id) },
      data: {
        codigo,
        tipo,
        marca,
        modelo,
        estado,
        disponibilidad,
        ubicacion,
        propietarioId: propietarioId || null,
        fechaAdquisicion: fechaAdquisicion ? new Date(fechaAdquisicion) : null,
        notas: notas || null,
        identificador: identificador || null,
        procesador: procesador || null,
        detallesAdicionales: detallesAdicionales || null,
      },
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/assets/:id', async (req, res) => {
  try {
    await prisma.asset.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- MOVEMENTS ---
app.get('/api/movements', async (req, res) => {
  try {
    const movements = await prisma.movement.findMany();
    res.json(movements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/movements', async (req, res) => {
  const { assetId, userId, registradoPorId, tipo, fecha, notas, assetAnteriorId } = req.body;
  try {
    const movement = await prisma.movement.create({
      data: {
        assetId: Number(assetId),
        userId,
        registradoPorId,
        tipo,
        fecha: new Date(fecha),
        notas: notas || null,
        assetAnteriorId: assetAnteriorId ? Number(assetAnteriorId) : null,
      },
    });
    res.json({ id: movement.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Serve static files from Vite dist folder
const distPath = path.resolve(__dirname, '../dist');
app.use(express.static(distPath));

// SPA fallback - serve index.html for unmatched routes
app.use((req, res) => {
  if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/health')) {
    res.sendFile(path.join(distPath, 'index.html'));
  } else {
    res.status(404).json({ error: 'Not Found' });
  }
});

console.log(`[backend] Starting server on ${HOST}:${PORT}`);
console.log(`[backend] DATABASE_URL: ${process.env.DATABASE_URL ? 'set' : 'missing'}`);
console.log(`[backend] Serving static files from: ${distPath}`);

try {
  await prisma.$connect();
  const server = app.listen(PORT, HOST, () => {
    console.log(`[backend] Server running on http://${HOST}:${PORT}`);
  });

  const shutdown = (signal) => {
    console.log(`[backend] Received ${signal}, shutting down server...`);
    server.close(() => {
      console.log('[backend] Server closed');
      prisma.$disconnect().finally(() => process.exit(0));
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  process.on('exit', (code) => {
    console.log(`[backend] Process exiting with code: ${code}`);
  });

  process.on('uncaughtException', (err) => {
    console.error('[backend] Uncaught exception:', err);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('[backend] Unhandled rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });
} catch (err) {
  console.error('[backend] Prisma connection failed:', err);
  process.exit(1);
}
