import prisma from './server/prismaClient.js';

// Obtener departamento de Gerencia
const gerenciaDep = await prisma.departamento.findUnique({ where: { nombre: 'Gerencia' } });

// Crear usuario gerente (solo lectura)
await prisma.user.upsert({
  where: { id: 'ADC001' },
  update: {},
  create: {
    id: 'ADC001',
    nombre: 'Adriana Carvajal',
    email: 'gerencia@administracionesgj.com',
    rol: 'gerente',
    cargo: 'Gerenta General',
    departamentoId: gerenciaDep?.id || null,
    activo: true,
  },
});

console.log('✅ Usuario gerente creado/verificado: C.C. ADC001 — Adriana Carvajal');
await prisma.$disconnect();
