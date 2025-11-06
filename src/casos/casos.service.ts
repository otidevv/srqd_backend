import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCasoDto, CasoTipo } from './dto/create-caso.dto';
import { UpdateCasoDto, CasoEstado } from './dto/update-caso.dto';
import { AddSeguimientoDto } from './dto/add-seguimiento.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class CasosService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  /**
   * Genera el código único para el caso según el tipo
   * Formato: {TIPO}-{AÑO}-{SECUENCIA}
   * Ejemplos: REC-2025-0001, QUE-2025-0002, DEN-2025-0003
   */
  private async generarCodigo(tipo: CasoTipo): Promise<string> {
    const year = new Date().getFullYear();
    const prefijos = {
      [CasoTipo.RECLAMO]: 'REC',
      [CasoTipo.QUEJA]: 'QUE',
      [CasoTipo.DENUNCIA]: 'DEN',
    };

    const prefijo = prefijos[tipo];
    const patron = `${prefijo}-${year}-%`;

    // Buscar el último caso del mismo tipo y año
    const ultimoCaso = await this.prisma.caso.findFirst({
      where: {
        codigo: {
          startsWith: `${prefijo}-${year}-`,
        },
      },
      orderBy: {
        codigo: 'desc',
      },
    });

    let secuencia = 1;
    if (ultimoCaso) {
      // Extraer el número de secuencia del último código
      const match = ultimoCaso.codigo.match(/(\d+)$/);
      if (match) {
        secuencia = parseInt(match[1], 10) + 1;
      }
    }

    // Formatear con padding de 4 dígitos
    const secuenciaFormateada = secuencia.toString().padStart(4, '0');
    return `${prefijo}-${year}-${secuenciaFormateada}`;
  }

  /**
   * Calcula la fecha límite considerando 20 días hábiles (aproximadamente 28 días calendario)
   */
  private calcularFechaLimite(): Date {
    const hoy = new Date();
    const diasCalendario = 28; // Aproximadamente 20 días hábiles
    const fechaLimite = new Date(hoy);
    fechaLimite.setDate(hoy.getDate() + diasCalendario);
    return fechaLimite;
  }

  /**
   * Crea un nuevo caso con reclamante y opcionalmente reclamado
   */
  async create(createCasoDto: CreateCasoDto, usuarioId?: string, usuarioNombre?: string) {
    // Generar código único
    const codigo = await this.generarCodigo(createCasoDto.tipo);

    // Calcular fecha límite
    const fechaLimite = this.calcularFechaLimite();

    // Preparar datos del caso
    const casoData: any = {
      codigo,
      tipo: createCasoDto.tipo,
      prioridad: createCasoDto.prioridad || 'MEDIA',
      descripcionHechos: createCasoDto.descripcionHechos,
      derechosAfectados: createCasoDto.derechosAfectados,
      fechaLimite,
      esAnonimo: createCasoDto.esAnonimo || false,
      requiereMediacion: createCasoDto.requiereMediacion || false,
      esConfidencial: createCasoDto.esConfidencial || false,
      etiquetas: createCasoDto.etiquetas || [],
    };

    // Crear reclamante si se proporciona
    if (createCasoDto.reclamante) {
      casoData.reclamante = {
        create: createCasoDto.reclamante,
      };
    }

    // Crear reclamado si se proporciona
    if (createCasoDto.reclamado) {
      casoData.reclamado = {
        create: createCasoDto.reclamado,
      };
    }

    // Crear el caso
    const caso = await this.prisma.caso.create({
      data: casoData,
      include: {
        reclamante: true,
        reclamado: true,
        asignado: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Crear seguimiento inicial
    if (usuarioId && usuarioNombre) {
      await this.prisma.seguimiento.create({
        data: {
          casoId: caso.id,
          usuarioId,
          usuarioNombre,
          accion: 'Caso creado',
          comentario: `Caso ${codigo} registrado en el sistema`,
          estadoNuevo: CasoEstado.PENDIENTE,
          esVisible: true,
        },
      });
    }

    // Nota: El correo con la constancia se enviará después de que el frontend
    // suba el PDF generado, usando el endpoint /casos/:id/enviar-constancia

    return {
      success: true,
      data: caso,
      message: `Caso ${codigo} creado exitosamente`,
    };
  }

  /**
   * Obtiene todos los casos con filtros opcionales
   */
  async findAll(filters?: {
    tipo?: CasoTipo;
    estado?: CasoEstado;
    prioridad?: string;
    asignadoA?: string;
    fechaDesde?: string;
    fechaHasta?: string;
    busqueda?: string;
  }) {
    const where: any = {};

    if (filters) {
      if (filters.tipo) where.tipo = filters.tipo;
      if (filters.estado) where.estado = filters.estado;
      if (filters.prioridad) where.prioridad = filters.prioridad;
      if (filters.asignadoA) where.asignadoA = filters.asignadoA;

      if (filters.fechaDesde || filters.fechaHasta) {
        where.fechaCreacion = {};
        if (filters.fechaDesde) {
          where.fechaCreacion.gte = new Date(filters.fechaDesde);
        }
        if (filters.fechaHasta) {
          where.fechaCreacion.lte = new Date(filters.fechaHasta);
        }
      }

      if (filters.busqueda) {
        where.OR = [
          { codigo: { contains: filters.busqueda, mode: 'insensitive' } },
          { descripcionHechos: { contains: filters.busqueda, mode: 'insensitive' } },
          { derechosAfectados: { contains: filters.busqueda, mode: 'insensitive' } },
        ];
      }
    }

    const casos = await this.prisma.caso.findMany({
      where,
      include: {
        reclamante: true,
        reclamado: true,
        asignado: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        _count: {
          select: {
            seguimientos: true,
            archivos: true,
          },
        },
      },
      orderBy: {
        fechaCreacion: 'desc',
      },
    });

    return {
      success: true,
      data: casos,
      total: casos.length,
    };
  }

  /**
   * Busca un caso por su ID
   */
  async findOne(id: string) {
    const caso = await this.prisma.caso.findUnique({
      where: { id },
      include: {
        reclamante: true,
        reclamado: true,
        asignado: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        seguimientos: {
          orderBy: { fecha: 'desc' },
          include: {
            usuario: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            archivos: true, // Incluir archivos del seguimiento
          },
        },
        archivos: {
          orderBy: { fechaSubida: 'desc' },
        },
      },
    });

    if (!caso) {
      throw new NotFoundException('Caso no encontrado');
    }

    return {
      success: true,
      data: caso,
    };
  }

  /**
   * Busca un caso por su código
   */
  async findByCodigo(codigo: string) {
    const caso = await this.prisma.caso.findUnique({
      where: { codigo },
      include: {
        reclamante: true,
        reclamado: true,
        asignado: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        seguimientos: {
          orderBy: { fecha: 'desc' },
          include: {
            archivos: true, // Incluir archivos del seguimiento
          },
        },
        archivos: {
          orderBy: { fechaSubida: 'desc' },
        },
      },
    });

    if (!caso) {
      throw new NotFoundException('Caso no encontrado');
    }

    return {
      success: true,
      data: caso,
    };
  }

  /**
   * Actualiza un caso
   */
  async update(
    id: string,
    updateCasoDto: UpdateCasoDto,
    usuarioId?: string,
    usuarioNombre?: string,
  ) {
    const casoExistente = await this.prisma.caso.findUnique({
      where: { id },
    });

    if (!casoExistente) {
      throw new NotFoundException('Caso no encontrado');
    }

    // Si se está actualizando el estado, crear seguimiento
    let seguimientoData: any = null;
    if (updateCasoDto.estado && updateCasoDto.estado !== casoExistente.estado) {
      seguimientoData = {
        casoId: id,
        usuarioId: usuarioId || 'SYSTEM',
        usuarioNombre: usuarioNombre || 'Sistema',
        accion: 'Cambio de estado',
        comentario: `Estado cambiado de ${casoExistente.estado} a ${updateCasoDto.estado}`,
        estadoAnterior: casoExistente.estado,
        estadoNuevo: updateCasoDto.estado,
        esVisible: true,
      };

      // Si el caso se marca como resuelto, actualizar fechaResolucion
      if (updateCasoDto.estado === CasoEstado.RESUELTO && !updateCasoDto.fechaResolucion) {
        updateCasoDto.fechaResolucion = new Date().toISOString();
      }
    }

    // Si se está asignando el caso, crear seguimiento
    if (updateCasoDto.asignadoA && updateCasoDto.asignadoA !== casoExistente.asignadoA) {
      if (usuarioId && usuarioNombre) {
        await this.prisma.seguimiento.create({
          data: {
            casoId: id,
            usuarioId,
            usuarioNombre,
            accion: 'Caso asignado',
            comentario: `Caso asignado a ${updateCasoDto.asignadoNombre || updateCasoDto.asignadoA}`,
            esVisible: true,
          },
        });
      }
    }

    // Actualizar el caso
    const caso = await this.prisma.caso.update({
      where: { id },
      data: updateCasoDto,
      include: {
        reclamante: true,
        reclamado: true,
        asignado: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Crear seguimiento de cambio de estado si corresponde
    if (seguimientoData) {
      await this.prisma.seguimiento.create({
        data: seguimientoData,
      });
    }

    return {
      success: true,
      data: caso,
      message: 'Caso actualizado exitosamente',
    };
  }

  /**
   * Asigna un caso a un usuario
   */
  async asignarCaso(
    id: string,
    asignadoA: string,
    usuarioId: string,
    usuarioNombre: string,
  ) {
    // Verificar que el usuario asignado existe
    const usuarioAsignado = await this.prisma.user.findUnique({
      where: { id: asignadoA },
    });

    if (!usuarioAsignado) {
      throw new NotFoundException('Usuario asignado no encontrado');
    }

    return this.update(
      id,
      {
        asignadoA,
        asignadoNombre: usuarioAsignado.name,
        estado: CasoEstado.EN_REVISION,
      },
      usuarioId,
      usuarioNombre,
    );
  }

  /**
   * Agrega un seguimiento a un caso
   */
  async addSeguimiento(
    casoId: string,
    addSeguimientoDto: AddSeguimientoDto,
    usuarioId?: string,
    usuarioNombre?: string,
  ) {
    const caso = await this.prisma.caso.findUnique({
      where: { id: casoId },
    });

    if (!caso) {
      throw new NotFoundException('Caso no encontrado');
    }

    // Datos del seguimiento
    const seguimientoData: any = {
      casoId,
      usuarioNombre: usuarioNombre || 'Sistema',
      accion: addSeguimientoDto.accion,
      comentario: addSeguimientoDto.comentario,
      esVisible: addSeguimientoDto.esVisible ?? true,
    };

    // Solo agregar usuarioId si está definido
    if (usuarioId) {
      seguimientoData.usuarioId = usuarioId;
    }

    const seguimiento = await this.prisma.seguimiento.create({
      data: seguimientoData,
      include: {
        usuario: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Si se proporcionaron IDs de archivos, asociarlos al seguimiento
    if (addSeguimientoDto.archivosIds && addSeguimientoDto.archivosIds.length > 0) {
      await this.prisma.archivo.updateMany({
        where: {
          id: { in: addSeguimientoDto.archivosIds },
          casoId, // Verificar que los archivos pertenecen al mismo caso
        },
        data: {
          seguimientoId: seguimiento.id,
        },
      });
    }

    // Obtener el seguimiento con archivos
    const seguimientoConArchivos = await this.prisma.seguimiento.findUnique({
      where: { id: seguimiento.id },
      include: {
        usuario: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        archivos: true,
      },
    });

    return {
      success: true,
      data: seguimientoConArchivos,
      message: 'Seguimiento agregado exitosamente',
    };
  }

  /**
   * Elimina un caso (soft delete - cambiar a estado ARCHIVADO)
   */
  async remove(id: string, usuarioId?: string, usuarioNombre?: string) {
    const caso = await this.prisma.caso.findUnique({
      where: { id },
    });

    if (!caso) {
      throw new NotFoundException('Caso no encontrado');
    }

    // En lugar de eliminar, archivar el caso
    await this.update(
      id,
      { estado: CasoEstado.ARCHIVADO },
      usuarioId,
      usuarioNombre,
    );

    return {
      success: true,
      message: 'Caso archivado exitosamente',
    };
  }

  /**
   * Obtiene estadísticas de casos
   */
  async getEstadisticas() {
    // Calcular fecha de hace 12 meses
    const fecha12MesesAtras = new Date();
    fecha12MesesAtras.setMonth(fecha12MesesAtras.getMonth() - 12);

    const [total, porTipo, porEstado, porPrioridad, casosResueltos] = await Promise.all([
      this.prisma.caso.count(),
      this.prisma.caso.groupBy({
        by: ['tipo'],
        _count: true,
      }),
      this.prisma.caso.groupBy({
        by: ['estado'],
        _count: true,
      }),
      this.prisma.caso.groupBy({
        by: ['prioridad'],
        _count: true,
      }),
      this.prisma.caso.count({
        where: { estado: 'RESUELTO' },
      }),
    ]);

    // Obtener casos de los últimos 12 meses para estadísticas mensuales
    const casosUltimos12Meses = await this.prisma.caso.findMany({
      where: {
        fechaCreacion: {
          gte: fecha12MesesAtras,
        },
      },
      select: {
        fechaCreacion: true,
        estado: true,
      },
    });

    // Agrupar por mes
    const datosMensuales = this.calcularDatosMensuales(casosUltimos12Meses);

    // Calcular tasa de resolución
    const tasaResolucion = total > 0 ? ((casosResueltos / total) * 100).toFixed(2) : '0.00';

    return {
      success: true,
      data: {
        total,
        porTipo,
        porEstado,
        porPrioridad,
        casosResueltos,
        tasaResolucion: parseFloat(tasaResolucion),
        datosMensuales,
      },
    };
  }

  /**
   * Calcula datos mensuales de casos
   */
  private calcularDatosMensuales(casos: Array<{ fechaCreacion: Date; estado: string }>) {
    const meses: { [key: string]: { mes: string; registrados: number; resueltos: number; pendientes: number } } = {};

    // Inicializar últimos 12 meses
    for (let i = 11; i >= 0; i--) {
      const fecha = new Date();
      fecha.setMonth(fecha.getMonth() - i);
      const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      const mesNombre = fecha.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });

      meses[mesKey] = {
        mes: mesNombre.charAt(0).toUpperCase() + mesNombre.slice(1),
        registrados: 0,
        resueltos: 0,
        pendientes: 0,
      };
    }

    // Contar casos por mes
    casos.forEach((caso) => {
      const fecha = new Date(caso.fechaCreacion);
      const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;

      if (meses[mesKey]) {
        meses[mesKey].registrados++;

        if (caso.estado === 'RESUELTO') {
          meses[mesKey].resueltos++;
        } else if (caso.estado === 'PENDIENTE' || caso.estado === 'EN_REVISION' || caso.estado === 'EN_PROCESO') {
          meses[mesKey].pendientes++;
        }
      }
    });

    // Convertir a array ordenado
    return Object.keys(meses)
      .sort()
      .map((key) => meses[key]);
  }

  /**
   * Envía la constancia por correo usando el PDF que ya fue subido
   */
  async enviarConstanciaPorCorreo(casoId: string, pdfBuffer: Buffer) {
    // Buscar el caso con su reclamante
    const caso = await this.prisma.caso.findUnique({
      where: { id: casoId },
      include: {
        reclamante: true,
      },
    });

    if (!caso) {
      throw new NotFoundException('Caso no encontrado');
    }

    if (!caso.reclamante) {
      throw new BadRequestException('El caso no tiene reclamante asociado');
    }

    if (!caso.reclamante.correo) {
      throw new BadRequestException('El reclamante no tiene correo electrónico');
    }

    if (!caso.reclamante.autorizacionCorreo) {
      throw new BadRequestException('El reclamante no autorizó recibir correos');
    }

    // Enviar el correo con el PDF
    const nombreCompleto = `${caso.reclamante.nombres} ${caso.reclamante.apellidoPaterno} ${caso.reclamante.apellidoMaterno}`;

    await this.mailService.enviarConstancia(
      caso.reclamante.correo,
      nombreCompleto,
      caso.codigo,
      pdfBuffer,
    );

    return {
      success: true,
      message: `Constancia enviada a ${caso.reclamante.correo}`,
    };
  }
}
