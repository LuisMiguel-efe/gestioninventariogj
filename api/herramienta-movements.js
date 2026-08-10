import prisma from './prisma.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { herramientaId, userId } = req.query;
      const where = {};
      if (herramientaId) {
        where.OR = [
          { herramientaId: Number(herramientaId) },
          { secondaryHerramientaId: Number(herramientaId) },
        ];
      }
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
      return res.json(movements);
    }

    if (req.method === 'POST') {
      const data = req.body;

      const movement = await prisma.herramientaMovement.create({
        data: {
          herramientaId: Number(data.herramientaId),
          secondaryHerramientaId: data.secondaryHerramientaId ? Number(data.secondaryHerramientaId) : null,
          userId: String(data.userId),
          registradoPorId: String(data.registradoPorId),
          tipo: data.tipo,
          fecha: data.fecha ? new Date(data.fecha) : new Date(),
          fechaRetornoPrevista: data.fechaRetornoPrevista ? new Date(data.fechaRetornoPrevista) : null,
          condicionEntrega: data.condicionEntrega || null,
          condicionRecepcion: data.condicionRecepcion || null,
          notas: data.notas || null,
        },
      });

      return res.json({ id: movement.id });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}