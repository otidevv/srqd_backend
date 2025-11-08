import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Creando roles del sistema...');

  // Roles del sistema con permisos predefinidos
  const systemRoles = [
    {
      name: 'Administrador',
      description: 'Acceso completo al sistema SRQD',
      isSystem: true,
      permissions: {
        casos: ['read', 'create', 'edit', 'delete', 'export'],
        users: ['read', 'create', 'edit', 'delete'],
        publicaciones: ['read', 'create', 'edit', 'delete'],
        estadisticas: ['read', 'export'],
        roles: ['read', 'create', 'edit', 'delete'],
        sedes: ['read', 'create', 'edit', 'delete'],
        dependencias: ['read', 'create', 'edit', 'delete'],
      },
    },
    {
      name: 'Supervisor',
      description: 'Gestión y supervisión de casos SRQD',
      isSystem: true,
      permissions: {
        casos: ['read', 'create', 'edit', 'export'],
        users: ['read'],
        publicaciones: ['read', 'create', 'edit'],
        estadisticas: ['read', 'export'],
        roles: ['read'],
        sedes: ['read'],
        dependencias: ['read'],
      },
    },
    {
      name: 'Operador',
      description: 'Operación básica del sistema SRQD',
      isSystem: true,
      permissions: {
        casos: ['read', 'create', 'edit'],
        users: [],
        publicaciones: ['read'],
        estadisticas: ['read'],
        roles: [],
        sedes: ['read'],
        dependencias: ['read'],
      },
    },
  ];

  for (const roleData of systemRoles) {
    const role = await prisma.role.upsert({
      where: { name: roleData.name },
      update: {
        description: roleData.description,
        permissions: roleData.permissions,
        isSystem: roleData.isSystem,
      },
      create: {
        name: roleData.name,
        description: roleData.description,
        permissions: roleData.permissions,
        isSystem: roleData.isSystem,
        usersCount: 0,
      },
    });

    console.log(`✅ Rol creado/actualizado: ${role.name}`);
  }

  console.log('✨ Roles del sistema creados exitosamente');
}

main()
  .catch((e) => {
    console.error('❌ Error al crear roles del sistema:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
