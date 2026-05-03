import prisma from './prisma.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const assets = await prisma.asset.findMany();
      return res.json(assets);
    }

    if (req.method === 'POST') {
      const data = req.body;

      const asset = await prisma.asset.create({
        data: {
          ...data,
          propietarioId: data.propietarioId || null,
          fechaAdquisicion: data.fechaAdquisicion ? new Date(data.fechaAdquisicion) : null,
        },
      });

      return res.json({ id: asset.id });
    }

    if (req.method === 'PUT') {
      const { id, ...data } = req.body;

      await prisma.asset.update({
        where: { id: Number(id) },
        data: {
          ...data,
          propietarioId: data.propietarioId || null,
          fechaAdquisicion: data.fechaAdquisicion ? new Date(data.fechaAdquisicion) : null,
        },
      });

      return res.json({ success: true });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;

      await prisma.asset.delete({
        where: { id: Number(id) },
      });

      return res.json({ success: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}