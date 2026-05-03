import { prisma } from '../lib/prisma';

export default async function handler(req: any, res: any) {
  try {
    if (req.method === 'GET') {
      const assets = await prisma.asset.findMany();
      return res.status(200).json(assets);
    }

    if (req.method === 'POST') {
      const asset = await prisma.asset.create({
        data: req.body,
      });
      return res.status(201).json(asset);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
}