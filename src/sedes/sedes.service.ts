import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSedeDto } from './dto/create-sede.dto';
import { UpdateSedeDto } from './dto/update-sede.dto';

@Injectable()
export class SedesService {
  constructor(private prisma: PrismaService) {}

  async create(createSedeDto: CreateSedeDto) {
    const sede = await this.prisma.sede.create({
      data: createSedeDto,
    });

    return { success: true, data: sede, message: 'Sede creada exitosamente' };
  }

  async findAll() {
    const sedes = await this.prisma.sede.findMany({
      include: {
        dependencias: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, data: sedes, total: sedes.length };
  }

  async findOne(id: string) {
    const sede = await this.prisma.sede.findUnique({
      where: { id },
      include: {
        dependencias: true,
      },
    });

    if (!sede) {
      throw new NotFoundException('Sede no encontrada');
    }

    return { success: true, data: sede };
  }

  async update(id: string, updateSedeDto: UpdateSedeDto) {
    const existingSede = await this.prisma.sede.findUnique({ where: { id } });

    if (!existingSede) {
      throw new NotFoundException('Sede no encontrada');
    }

    const sede = await this.prisma.sede.update({
      where: { id },
      data: updateSedeDto,
    });

    return { success: true, data: sede, message: 'Sede actualizada exitosamente' };
  }

  async remove(id: string) {
    const sede = await this.prisma.sede.findUnique({
      where: { id },
      include: { dependencias: true },
    });

    if (!sede) {
      throw new NotFoundException('Sede no encontrada');
    }

    if (sede.dependencias.length > 0) {
      throw new BadRequestException(
        `No se puede eliminar la sede porque tiene ${sede.dependencias.length} dependencia(s) asociada(s)`,
      );
    }

    await this.prisma.sede.delete({ where: { id } });

    return { success: true, message: 'Sede eliminada exitosamente' };
  }
}
