import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Iniciando migración de usuarios al sistema de roles...');

  // Step 1: Get role IDs
  const adminRole = await prisma.role.findUnique({ where: { name: 'Administrador' } });
  const supervisorRole = await prisma.role.findUnique({ where: { name: 'Supervisor' } });
  const operatorRole = await prisma.role.findUnique({ where: { name: 'Operador' } });

  if (!adminRole || !supervisorRole || !operatorRole) {
    throw new Error('Los roles del sistema no existen. Ejecuta seed-roles.ts primero.');
  }

  console.log('\n📋 Roles encontrados:');
  console.log(`  - Administrador: ${adminRole.id}`);
  console.log(`  - Supervisor: ${supervisorRole.id}`);
  console.log(`  - Operador: ${operatorRole.id}`);

  // Step 2: Get all users
  const users = await prisma.$queryRaw<Array<{
    id: string;
    email: string;
    name: string;
    role: string;
    custom_role_id: string | null;
  }>>`SELECT id, email, name, role, custom_role_id FROM users`;

  console.log(`\n👥 Encontrados ${users.length} usuarios para migrar`);

  // Step 3: Migrate each user
  let migratedCount = 0;
  for (const user of users) {
    let newRoleId: string;

    // If user has a custom role, use it
    if (user.custom_role_id) {
      newRoleId = user.custom_role_id;
      console.log(`  ✓ ${user.email}: Manteniendo rol personalizado`);
    } else {
      // Map from old enum to new role table
      switch (user.role) {
        case 'ADMIN':
          newRoleId = adminRole.id;
          break;
        case 'SUPERVISOR':
          newRoleId = supervisorRole.id;
          break;
        case 'OPERATOR':
          newRoleId = operatorRole.id;
          break;
        default:
          console.warn(`  ⚠️  ${user.email}: Rol desconocido "${user.role}", usando Operador por defecto`);
          newRoleId = operatorRole.id;
      }
      console.log(`  ✓ ${user.email}: ${user.role} → ${newRoleId}`);
    }

    // Update user with new role_id
    await prisma.$executeRaw`
      UPDATE users
      SET role_id = ${newRoleId}
      WHERE id = ${user.id}
    `;

    migratedCount++;
  }

  console.log(`\n✅ ${migratedCount} usuarios migrados exitosamente`);

  // Step 4: Update users count in roles
  console.log('\n📊 Actualizando contadores de usuarios en roles...');

  const roles = await prisma.role.findMany();
  for (const role of roles) {
    const count = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM users
      WHERE role_id = ${role.id}
    `;

    const usersCount = Number(count[0].count);
    await prisma.role.update({
      where: { id: role.id },
      data: { usersCount },
    });

    console.log(`  ✓ ${role.name}: ${usersCount} usuarios`);
  }

  // Step 5: Verify migration
  console.log('\n🔍 Verificando migración...');
  const usersWithoutRole = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count
    FROM users
    WHERE role_id IS NULL
  `;

  const nullCount = Number(usersWithoutRole[0].count);
  if (nullCount > 0) {
    console.error(`\n❌ ERROR: ${nullCount} usuarios no tienen role_id asignado`);
    process.exit(1);
  }

  console.log('  ✓ Todos los usuarios tienen role_id asignado');
  console.log('\n✨ Migración completada exitosamente');
  console.log('\n⚠️  SIGUIENTE PASO:');
  console.log('   Ahora puedes eliminar las columnas "role" y "custom_role_id" del schema');
  console.log('   y hacer role_id NOT NULL.');
}

main()
  .catch((e) => {
    console.error('\n❌ Error durante la migración:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
