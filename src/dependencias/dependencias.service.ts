import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDependenciaDto } from './dto/create-dependencia.dto';
import { UpdateDependenciaDto } from './dto/update-dependencia.dto';

@Injectable()
export class DependenciasService {
  constructor(private prisma: PrismaService) {}

  async create(createDependenciaDto: CreateDependenciaDto) {
    // Verificar que la sede existe
    const sede = await this.prisma.sede.findUnique({
      where: { id: createDependenciaDto.sedeId },
    });

    if (!sede) {
      throw new NotFoundException('Sede no encontrada');
    }

    const dependencia = await this.prisma.dependencia.create({
      data: createDependenciaDto,
      include: { sede: true },
    });

    return { success: true, data: dependencia, message: 'Dependencia creada exitosamente' };
  }

  async findAll() {
    const dependencias = await this.prisma.dependencia.findMany({
      include: { sede: true },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, data: dependencias, total: dependencias.length };
  }

  async findOne(id: string) {
    const dependencia = await this.prisma.dependencia.findUnique({
      where: { id },
      include: { sede: true },
    });

    if (!dependencia) {
      throw new NotFoundException('Dependencia no encontrada');
    }

    return { success: true, data: dependencia };
  }

  async update(id: string, updateDependenciaDto: UpdateDependenciaDto) {
    const existingDependencia = await this.prisma.dependencia.findUnique({
      where: { id },
    });

    if (!existingDependencia) {
      throw new NotFoundException('Dependencia no encontrada');
    }

    // Si se está actualizando la sede, verificar que existe
    if (updateDependenciaDto.sedeId) {
      const sede = await this.prisma.sede.findUnique({
        where: { id: updateDependenciaDto.sedeId },
      });

      if (!sede) {
        throw new NotFoundException('Sede no encontrada');
      }
    }

    const dependencia = await this.prisma.dependencia.update({
      where: { id },
      data: updateDependenciaDto,
      include: { sede: true },
    });

    return { success: true, data: dependencia, message: 'Dependencia actualizada exitosamente' };
  }

  async remove(id: string) {
    const dependencia = await this.prisma.dependencia.findUnique({
      where: { id },
    });

    if (!dependencia) {
      throw new NotFoundException('Dependencia no encontrada');
    }

    await this.prisma.dependencia.delete({ where: { id } });

    return { success: true, message: 'Dependencia eliminada exitosamente' };
  }
}
