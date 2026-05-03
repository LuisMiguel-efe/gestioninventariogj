import prisma from './prisma.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const movements = await prisma.movement.findMany();
      return res.json(movements);
    }

    if (req.method === 'POST') {
      const data = req.body;

      const movement = await prisma.movement.create({
        data: {
          assetId: Number(data.assetId),
          userId: data.userId,
          registradoPorId: data.registradoPorId,
          tipo: data.tipo,
          fecha: new Date(data.fecha),
          notas: data.notas || null,
          assetAnteriorId: data.assetAnteriorId ? Number(data.assetAnteriorId) : null,
        },
      });

      return res.json({ id: movement.id });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}