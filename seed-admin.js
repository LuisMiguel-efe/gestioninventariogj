import prisma from './server/prismaClient.js';

// Obtener departamento de Compras
const comprasDep = await prisma.departamento.findUnique({ where: { nombre: 'Compras' } });

// Crear usuario admin
await prisma.user.upsert({
  where: { id: '94152348' },
  update: {},
  create: {
    id: '94152348',
    nombre: 'Gustavo Adolfo Franco',
    email: 'compras@administracionesgj.com',
    rol: 'administrador',
    cargo: 'Jefe de Compras',
    departamentoId: comprasDep?.id || null,
    activo: true,
  },
});

console.log('✅ Usuario administrador creado/verificado: C.C. 94152348 — Gustavo Adolfo Franco');
await prisma.$disconnect();
