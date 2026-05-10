import prisma from './server/prismaClient.js';

const departamentos = [
  'Compras', 'Calidad', 'Contabilidad', 'Operaciones',
  'Gerencia', 'Gestión Administrativa', 'Gestión Humana', 'Bodega Compras'
];

for (const nombre of departamentos) {
  const dep = await prisma.departamento.upsert({
    where: { nombre },
    update: {},
    create: { nombre },
  });
  console.log(`✅ Departamento: ${dep.nombre}`);
}

await prisma.$disconnect();
console.log('\n✅ Departamentos sembrados correctamente.');
