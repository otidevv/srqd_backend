import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UpdateRolePermissionsDto } from './dto/update-role-permissions.dto';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async create(createRoleDto: CreateRoleDto) {
    const existingRole = await this.prisma.role.findUnique({
      where: { name: createRoleDto.name },
    });

    if (existingRole) {
      throw new ConflictException('El rol ya existe');
    }

    const role = await this.prisma.role.create({
      data: createRoleDto,
    });

    return { success: true, data: role, message: 'Rol creado exitosamente' };
  }

  async findAll() {
    const roles = await this.prisma.role.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, data: roles, total: roles.length };
  }

  async findOne(id: string) {
    const role = await this.prisma.role.findUnique({ where: { id } });

    if (!role) {
      throw new NotFoundException('Rol no encontrado');
    }

    return { success: true, data: role };
  }

  async update(id: string, updateRoleDto: UpdateRoleDto) {
    const existingRole = await this.prisma.role.findUnique({ where: { id } });

    if (!existingRole) {
      throw new NotFoundException('Rol no encontrado');
    }

    if (updateRoleDto.name && updateRoleDto.name !== existingRole.name) {
      const nameInUse = await this.prisma.role.findUnique({
        where: { name: updateRoleDto.name },
      });

      if (nameInUse) {
        throw new ConflictException('El nombre del rol ya está en uso');
      }
    }

    const role = await this.prisma.role.update({
      where: { id },
      data: updateRoleDto,
    });

    return { success: true, data: role, message: 'Rol actualizado exitosamente' };
  }

  async remove(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: { users: true },
    });

    if (!role) {
      throw new NotFoundException('Rol no encontrado');
    }

    // Prevenir eliminación de roles de sistema
    if (role.isSystem) {
      throw new BadRequestException(
        'No se puede eliminar un rol del sistema',
      );
    }

    // Prevenir eliminación si hay usuarios asignados
    if (role.users && role.users.length > 0) {
      throw new BadRequestException(
        `No se puede eliminar el rol. Hay ${role.users.length} usuario(s) asignado(s) a este rol`,
      );
    }

    await this.prisma.role.delete({ where: { id } });

    return { success: true, message: 'Rol eliminado exitosamente' };
  }

  async updatePermissions(
    id: string,
    updatePermissionsDto: UpdateRolePermissionsDto,
  ) {
    const role = await this.prisma.role.findUnique({ where: { id } });

    if (!role) {
      throw new NotFoundException('Rol no encontrado');
    }

    const updatedRole = await this.prisma.role.update({
      where: { id },
      data: { permissions: updatePermissionsDto.permissions },
    });

    return {
      success: true,
      data: updatedRole,
      message: 'Permisos actualizados exitosamente',
    };
  }

  async getRoleWithUsers(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException('Rol no encontrado');
    }

    return { success: true, data: role };
  }

  async updateUsersCount(roleId: string) {
    const count = await this.prisma.user.count({
      where: { roleId: roleId },
    });

    await this.prisma.role.update({
      where: { id: roleId },
      data: { usersCount: count },
    });

    return count;
  }
}
