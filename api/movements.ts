import { prisma } from '../lib/prisma';

export default async function handler(req: any, res: any) {
  try {
    if (req.method === 'GET') {
      const movements = await prisma.movement.findMany();
      return res.status(200).json(movements);
    }

    if (req.method === 'POST') {
      const movement = await prisma.movement.create({
        data: req.body,
      });
      return res.status(201).json(movement);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
}