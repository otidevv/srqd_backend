import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Limpiar datos existentes (en orden para respetar foreign keys)
  console.log('🧹 Cleaning existing data...');
  await prisma.seguimiento.deleteMany();
  await prisma.archivo.deleteMany();
  await prisma.reclamado.deleteMany();
  await prisma.reclamante.deleteMany();
  await prisma.caso.deleteMany();
  await prisma.dependencia.deleteMany();
  await prisma.sede.deleteMany();
  await prisma.role.deleteMany();
  await prisma.user.deleteMany();

  // ============================================================================
  // USUARIOS (con passwords hasheados)
  // ============================================================================
  console.log('👥 Creating users...');

  const usuarios = [
    {
      email: 'defensoria@unamad.edu.pe',
      password: await bcrypt.hash('defensoria123', 10),
      name: 'Defensoría Universitaria',
      role: 'ADMIN' as const,
      status: 'ACTIVE' as const,
      phone: '+51 986 092 679',
    },
    {
      email: 'admin@unamad.edu.pe',
      password: await bcrypt.hash('admin123', 10),
      name: 'Administrador del Sistema',
      role: 'ADMIN' as const,
      status: 'ACTIVE' as const,
      phone: '+51 999 888 777',
    },
    {
      email: 'supervisor@unamad.edu.pe',
      password: await bcrypt.hash('supervisor123', 10),
      name: 'Supervisor SRQD',
      role: 'SUPERVISOR' as const,
      status: 'ACTIVE' as const,
      phone: '+51 999 888 666',
    },
    {
      email: 'operador1@unamad.edu.pe',
      password: await bcrypt.hash('operador123', 10),
      name: 'María González',
      role: 'OPERATOR' as const,
      status: 'ACTIVE' as const,
      phone: '+51 999 888 555',
    },
    {
      email: 'operador2@unamad.edu.pe',
      password: await bcrypt.hash('operador123', 10),
      name: 'Juan Pérez',
      role: 'OPERATOR' as const,
      status: 'ACTIVE' as const,
      phone: '+51 999 888 444',
    },
    {
      email: 'demo@unamad.edu.pe',
      password: await bcrypt.hash('demo123', 10),
      name: 'Usuario Demo',
      role: 'ADMIN' as const,
      status: 'ACTIVE' as const,
      phone: '+51 999 888 333',
    },
  ];

  for (const usuario of usuarios) {
    await prisma.user.create({ data: usuario });
  }

  console.log(`✅ Created ${usuarios.length} users`);

  // ============================================================================
  // ROLES DEL SISTEMA
  // ============================================================================
  console.log('🎭 Creating roles...');

  const roles = [
    {
      name: 'Administrador',
      description: 'Control total del sistema',
      permissions: JSON.parse(
        JSON.stringify({
          casos: ['create', 'read', 'update', 'delete'],
          users: ['create', 'read', 'update', 'delete'],
          roles: ['create', 'read', 'update', 'delete'],
          sedes: ['create', 'read', 'update', 'delete'],
          dependencias: ['create', 'read', 'update', 'delete'],
        }),
      ),
      isSystem: true,
      usersCount: 3,
    },
    {
      name: 'Supervisor',
      description: 'Supervisa y gestiona casos SRQD',
      permissions: JSON.parse(
        JSON.stringify({
          casos: ['create', 'read', 'update'],
          users: ['read'],
          roles: ['read'],
          sedes: ['read'],
          dependencias: ['read'],
        }),
      ),
      isSystem: true,
      usersCount: 1,
    },
    {
      name: 'Operador',
      description: 'Gestión básica de casos',
      permissions: JSON.parse(
        JSON.stringify({
          casos: ['create', 'read', 'update'],
          users: ['read'],
        }),
      ),
      isSystem: true,
      usersCount: 2,
    },
  ];

  for (const role of roles) {
    await prisma.role.create({ data: role });
  }

  console.log(`✅ Created ${roles.length} roles`);

  // ============================================================================
  // SEDES UNIVERSITARIAS
  // ============================================================================
  console.log('🏫 Creating sedes...');

  const sedes = [
    {
      nombre: 'Sede Central - Puerto Maldonado',
      direccion: 'Av. Jorge Chávez 1160, Puerto Maldonado',
      telefono: '+51 82 571080',
      email: 'informes@unamad.edu.pe',
      activo: true,
    },
    {
      nombre: 'Sede Iberia',
      direccion: 'Jr. San Martín s/n, Iberia',
      telefono: '+51 82 581234',
      email: 'iberia@unamad.edu.pe',
      activo: true,
    },
    {
      nombre: 'Sede Iñapari',
      direccion: 'Jr. Bolognesi s/n, Iñapari',
      telefono: '+51 82 582345',
      email: 'inapari@unamad.edu.pe',
      activo: true,
    },
  ];

  const sedeCentral = await prisma.sede.create({ data: sedes[0] });
  await prisma.sede.create({ data: sedes[1] });
  await prisma.sede.create({ data: sedes[2] });

  console.log(`✅ Created ${sedes.length} sedes`);

  // ============================================================================
  // DEPENDENCIAS
  // ============================================================================
  console.log('🏢 Creating dependencias...');

  const dependencias = [
    {
      nombre: 'Defensoría Universitaria',
      descripcion: 'Protección de derechos de la comunidad universitaria',
      jefe: 'Defensor Universitario',
      sedeId: sedeCentral.id,
      activo: true,
    },
    {
      nombre: 'Facultad de Ingeniería',
      descripcion: 'Facultad de Ingeniería y Ciencias Ambientales',
      jefe: 'Decano de Ingeniería',
      sedeId: sedeCentral.id,
      activo: true,
    },
    {
      nombre: 'Facultad de Educación',
      descripcion: 'Facultad de Educación',
      jefe: 'Decano de Educación',
      sedeId: sedeCentral.id,
      activo: true,
    },
    {
      nombre: 'Facultad de Derecho',
      descripcion: 'Facultad de Derecho y Ciencias Políticas',
      jefe: 'Decano de Derecho',
      sedeId: sedeCentral.id,
      activo: true,
    },
    {
      nombre: 'Facultad de Enfermería',
      descripcion: 'Facultad de Ciencias de la Salud',
      jefe: 'Decano de Salud',
      sedeId: sedeCentral.id,
      activo: true,
    },
    {
      nombre: 'Oficina de Recursos Humanos',
      descripcion: 'Gestión del personal universitario',
      jefe: 'Director de RR.HH.',
      sedeId: sedeCentral.id,
      activo: true,
    },
    {
      nombre: 'Oficina de Bienestar Universitario',
      descripcion: 'Bienestar estudiantil y servicios sociales',
      jefe: 'Director de Bienestar',
      sedeId: sedeCentral.id,
      activo: true,
    },
  ];

  for (const dependencia of dependencias) {
    await prisma.dependencia.create({ data: dependencia });
  }

  console.log(`✅ Created ${dependencias.length} dependencias`);

  // ============================================================================
  // RESUMEN
  // ============================================================================
  console.log('\n✨ Seeding completed successfully!\n');
  console.log('📊 Summary:');
  console.log(`   - ${usuarios.length} users created`);
  console.log(`   - ${roles.length} roles created`);
  console.log(`   - ${sedes.length} sedes created`);
  console.log(`   - ${dependencias.length} dependencias created`);
  console.log('\n🔐 Login credentials:');
  console.log('   - defensoria@unamad.edu.pe / defensoria123 (Admin)');
  console.log('   - admin@unamad.edu.pe / admin123 (Admin)');
  console.log('   - supervisor@unamad.edu.pe / supervisor123 (Supervisor)');
  console.log('   - operador1@unamad.edu.pe / operador123 (Operator)');
  console.log('   - demo@unamad.edu.pe / demo123 (Admin)');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
