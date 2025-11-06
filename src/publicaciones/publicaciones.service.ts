import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePublicacionDto } from './dto/create-publicacion.dto';
import { UpdatePublicacionDto } from './dto/update-publicacion.dto';

@Injectable()
export class PublicacionesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Crear nueva publicación
   */
  async create(createPublicacionDto: CreatePublicacionDto, usuarioId: string) {
    try {
      const publicacion = await this.prisma.publicacion.create({
        data: {
          titulo: createPublicacionDto.titulo,
          descripcion: createPublicacionDto.descripcion,
          imagenUrl: createPublicacionDto.imagenUrl,
          documentoUrl: createPublicacionDto.documentoUrl,
          fechaExpiracion: createPublicacionDto.fechaExpiracion
            ? new Date(createPublicacionDto.fechaExpiracion)
            : null,
          prioridad: createPublicacionDto.prioridad ?? 0,
          tipo: createPublicacionDto.tipo ?? 'ANUNCIO',
          creadoPor: usuarioId,
        },
        include: {
          creador: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return {
        success: true,
        data: publicacion,
        message: 'Publicación creada exitosamente',
      };
    } catch (error) {
      throw new BadRequestException('Error al crear la publicación');
    }
  }

  /**
   * Obtener todas las publicaciones (admin)
   */
  async findAll() {
    const publicaciones = await this.prisma.publicacion.findMany({
      include: {
        creador: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { prioridad: 'desc' },
        { fechaPublicacion: 'desc' },
      ],
    });

    return {
      success: true,
      data: publicaciones,
    };
  }

  /**
   * Obtener publicaciones activas (público)
   */
  async findActivas() {
    const now = new Date();

    const publicaciones = await this.prisma.publicacion.findMany({
      where: {
        activo: true,
        OR: [
          { fechaExpiracion: null },
          { fechaExpiracion: { gte: now } },
        ],
      },
      include: {
        creador: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { prioridad: 'desc' },
        { fechaPublicacion: 'desc' },
      ],
    });

    return {
      success: true,
      data: publicaciones,
    };
  }

  /**
   * Obtener una publicación por ID
   */
  async findOne(id: string) {
    const publicacion = await this.prisma.publicacion.findUnique({
      where: { id },
      include: {
        creador: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!publicacion) {
      throw new NotFoundException('Publicación no encontrada');
    }

    return {
      success: true,
      data: publicacion,
    };
  }

  /**
   * Actualizar publicación
   */
  async update(id: string, updatePublicacionDto: UpdatePublicacionDto) {
    // Verificar que existe
    await this.findOne(id);

    try {
      const dataToUpdate: any = { ...updatePublicacionDto };

      // Convertir fechaExpiracion a Date si viene como string
      if (updatePublicacionDto.fechaExpiracion) {
        dataToUpdate.fechaExpiracion = new Date(updatePublicacionDto.fechaExpiracion);
      }

      const publicacion = await this.prisma.publicacion.update({
        where: { id },
        data: dataToUpdate,
        include: {
          creador: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return {
        success: true,
        data: publicacion,
        message: 'Publicación actualizada exitosamente',
      };
    } catch (error) {
      throw new BadRequestException('Error al actualizar la publicación');
    }
  }

  /**
   * Activar/Desactivar publicación
   */
  async toggleActivo(id: string) {
    const { data: publicacion } = await this.findOne(id);

    const updated = await this.prisma.publicacion.update({
      where: { id },
      data: {
        activo: !publicacion.activo,
      },
    });

    return {
      success: true,
      data: updated,
      message: `Publicación ${updated.activo ? 'activada' : 'desactivada'} exitosamente`,
    };
  }

  /**
   * Eliminar publicación
   */
  async remove(id: string) {
    // Verificar que existe
    await this.findOne(id);

    await this.prisma.publicacion.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Publicación eliminada exitosamente',
    };
  }
}
