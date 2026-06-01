import prisma from './prisma.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const plans = await prisma.planMovil.findMany({
        orderBy: [{ operador: 'asc' }, { plan: 'asc' }],
      });
      return res.json(plans);
    }

    if (req.method === 'POST') {
      const { operador, plan, precio } = req.body;
      const planMovil = await prisma.planMovil.create({
        data: {
          operador,
          plan,
          precio: Number(precio),
        },
      });
      return res.json(planMovil);
    }

    if (req.method === 'PUT') {
      const { id, operador, plan, precio } = req.body;
      const planMovil = await prisma.planMovil.update({
        where: { id: Number(id) },
        data: {
          operador,
          plan,
          precio: Number(precio),
        },
      });
      return res.json(planMovil);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      await prisma.planMovil.delete({
        where: { id: Number(id) },
      });
      return res.json({ success: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
