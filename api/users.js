import prisma from '../lib/prisma.js';

export default async function handler(req, res) {
  try {
    // GET
    if (req.method === 'GET') {
      const users = await prisma.user.findMany();
      return res.status(200).json(users);
    }

    // POST
    if (req.method === 'POST') {
      const { id, nombre, email, rol, departamento, activo } = req.body;

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

      return res.status(201).json({ id: user.id });
    }

    // PUT
    if (req.method === 'PUT') {
      const { id, nombre, email, rol, departamento, activo } = req.body;

      await prisma.user.update({
        where: { id },
        data: {
          nombre,
          email: email || null,
          rol,
          departamento,
          activo: activo ?? true,
        },
      });

      return res.json({ success: true });
    }

    // DELETE
    if (req.method === 'DELETE') {
      const { id } = req.query;

      await prisma.user.delete({
        where: { id },
      });

      return res.json({ success: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}