import prisma from './server/prismaClient.js';

async function migratePhoneLinesToPlans() {
  try {
    console.log('🔄 Iniciando migración de planes móviles...');

    // Obtener todas las líneas móviles actuales
    const phoneLines = await prisma.phoneLine.findMany({
      select: { id: true, operador: true, planNombre: true, precioMensual: true },
    });

    console.log(`📱 Encontradas ${phoneLines.length} líneas móviles.`);

    // Crear un mapa de planes únicos
    const plansMap = new Map();
    
    for (const line of phoneLines) {
      if (line.planNombre && line.precioMensual) {
        const key = `${line.operador}|${line.planNombre}|${line.precioMensual}`;
        if (!plansMap.has(key)) {
          plansMap.set(key, {
            operador: line.operador,
            plan: line.planNombre,
            precio: line.precioMensual,
          });
        }
      }
    }

    console.log(`📋 Se crearán ${plansMap.size} planes únicos.`);

    // Crear los planes en la BD
    const createdPlans = {};
    for (const [key, planData] of plansMap) {
      try {
        const plan = await prisma.planMovil.upsert({
          where: {
            operador_plan: {
              operador: planData.operador,
              plan: planData.plan,
            },
          },
          update: { precio: planData.precio },
          create: planData,
        });
        createdPlans[key] = plan.id;
        console.log(`✅ Plan creado: ${planData.operador} - ${planData.plan} ($${planData.precio})`);
      } catch (err) {
        console.error(`❌ Error al crear plan: ${err.message}`);
      }
    }

    // Asociar las líneas móviles a los planes
    let updated = 0;
    for (const line of phoneLines) {
      if (line.planNombre && line.precioMensual) {
        const key = `${line.operador}|${line.planNombre}|${line.precioMensual}`;
        const planeId = createdPlans[key];
        
        if (planeId) {
          await prisma.phoneLine.update({
            where: { id: line.id },
            data: { planeId },
          });
          updated++;
        }
      }
    }

    console.log(`✅ Migración completada: ${updated} líneas asociadas a planes.`);
    console.log('💡 Puedes comenzar a usar la nueva funcionalidad de planes corporativos.');
    
  } catch (err) {
    console.error('❌ Error en migración:', err);
  } finally {
    await prisma.$disconnect();
  }
}

migratePhoneLinesToPlans();
