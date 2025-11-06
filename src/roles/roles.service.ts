import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

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
    const role = await this.prisma.role.findUnique({ where: { id } });

    if (!role) {
      throw new NotFoundException('Rol no encontrado');
    }

    await this.prisma.role.delete({ where: { id } });

    return { success: true, message: 'Rol eliminado exitosamente' };
  }
}
