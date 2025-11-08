import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const unlinkAsync = promisify(fs.unlink);
const mkdirAsync = promisify(fs.mkdir);
const readFileAsync = promisify(fs.readFile);

@Injectable()
export class ArchivosService {
  private readonly uploadPath = './uploads';

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {
    this.ensureUploadDirectory();
  }

  /**
   * Asegura que el directorio de uploads existe
   */
  private async ensureUploadDirectory() {
    try {
      if (!fs.existsSync(this.uploadPath)) {
        await mkdirAsync(this.uploadPath, { recursive: true });
      }
    } catch (error) {
      console.error('Error creating upload directory:', error);
    }
  }

  /**
   * Guarda información del archivo en la base de datos
   */
  async create(casoId: string, file: Express.Multer.File, categoria?: string, seguimientoId?: string) {
    // Verificar que el caso existe y obtener datos del reclamante
    const caso = await this.prisma.caso.findUnique({
      where: { id: casoId },
      include: {
        reclamante: true,
      },
    });

    if (!caso) {
      // Si el caso no existe, eliminar el archivo subido
      await this.deleteFileFromDisk(file.filename);
      throw new NotFoundException('Caso no encontrado');
    }

    // Use the provided categoria or default to PRUEBA_DOCUMENTAL
    const categoriaArchivo = categoria || 'PRUEBA_DOCUMENTAL';

    // Crear registro en la base de datos
    const archivo = await this.prisma.archivo.create({
      data: {
        casoId,
        seguimientoId, // Asociar a seguimiento si se proporciona
        nombre: file.originalname,
        url: `/uploads/${file.filename}`,
        tipo: file.mimetype,
        tamano: file.size,
        categoria: categoriaArchivo as any,
      },
    });

    // Si es la CONSTANCIA (PDF con código del caso en el nombre) y el usuario autorizó correo, enviarlo automáticamente
    const esConstancia = file.mimetype === 'application/pdf' &&
                         (file.originalname.includes(caso.codigo) ||
                          file.originalname.startsWith('RECLAMO-') ||
                          file.originalname.startsWith('QUEJA-') ||
                          file.originalname.startsWith('DENUNCIA-'));

    // Enviar correo de forma asíncrona (no bloquear respuesta HTTP)
    if (
      esConstancia &&
      caso.reclamante?.correo &&
      caso.reclamante?.autorizacionCorreo
    ) {
      // Fire-and-forget: no esperar el envío de correo
      this.enviarConstanciaAsync(file.filename, caso)
        .catch(error => console.error('Error al enviar correo:', error));
    }

    return {
      success: true,
      data: archivo,
      message: 'Archivo subido exitosamente',
    };
  }

  /**
   * Envía la constancia por correo de forma asíncrona (background)
   * Este método no bloquea la respuesta HTTP del upload
   */
  private async enviarConstanciaAsync(filename: string, caso: any): Promise<void> {
    try {
      const filePath = path.join(this.uploadPath, filename);
      const pdfBuffer = await readFileAsync(filePath);

      const nombreCompleto = `${caso.reclamante.nombres} ${caso.reclamante.apellidoPaterno} ${caso.reclamante.apellidoMaterno}`;

      await this.mailService.enviarConstancia(
        caso.reclamante.correo,
        nombreCompleto,
        caso.codigo,
        pdfBuffer,
      );
    } catch (error) {
      // Los errores ya se manejan en el .catch() del llamador
      throw error;
    }
  }

  /**
   * Obtiene todos los archivos de un caso
   */
  async findByCaso(casoId: string) {
    const archivos = await this.prisma.archivo.findMany({
      where: { casoId },
      orderBy: { fechaSubida: 'desc' },
    });

    return {
      success: true,
      data: archivos,
      total: archivos.length,
    };
  }

  /**
   * Obtiene información de un archivo por ID
   */
  async findOne(id: string) {
    const archivo = await this.prisma.archivo.findUnique({
      where: { id },
    });

    if (!archivo) {
      throw new NotFoundException('Archivo no encontrado');
    }

    return {
      success: true,
      data: archivo,
    };
  }

  /**
   * Obtiene la ruta física del archivo
   */
  async getFilePath(id: string): Promise<string> {
    const archivo = await this.prisma.archivo.findUnique({
      where: { id },
    });

    if (!archivo) {
      throw new NotFoundException('Archivo no encontrado');
    }

    const fileName = archivo.url.split('/').pop();
    if (!fileName) {
      throw new NotFoundException('Nombre de archivo inválido');
    }

    const filePath = path.join(this.uploadPath, fileName);

    // Verificar que el archivo existe en el filesystem
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Archivo no encontrado en el sistema de archivos');
    }

    return filePath;
  }

  /**
   * Elimina un archivo (tanto del filesystem como de la base de datos)
   */
  async remove(id: string) {
    const archivo = await this.prisma.archivo.findUnique({
      where: { id },
    });

    if (!archivo) {
      throw new NotFoundException('Archivo no encontrado');
    }

    // Extraer nombre del archivo de la URL
    const fileName = archivo.url.split('/').pop();
    if (!fileName) {
      throw new NotFoundException('Nombre de archivo inválido');
    }

    // Eliminar de la base de datos
    await this.prisma.archivo.delete({
      where: { id },
    });

    // Eliminar del filesystem
    try {
      await this.deleteFileFromDisk(fileName);
    } catch (error) {
      console.error('Error deleting file from disk:', error);
      // No lanzar error aquí, ya que el registro fue eliminado de la BD
    }

    return {
      success: true,
      message: 'Archivo eliminado exitosamente',
    };
  }

  /**
   * Elimina un archivo del disco
   */
  private async deleteFileFromDisk(fileName: string): Promise<void> {
    const filePath = path.join(this.uploadPath, fileName);
    if (fs.existsSync(filePath)) {
      await unlinkAsync(filePath);
    }
  }

  /**
   * Guarda archivo de publicación (sin validar caso)
   */
  async createPublicacionArchivo(file: Express.Multer.File, categoria: string) {
    // Crear registro en la base de datos sin asociar a un caso
    const archivo = await this.prisma.archivo.create({
      data: {
        nombre: file.originalname,
        url: `/uploads/${file.filename}`,
        tipo: file.mimetype,
        tamano: file.size,
        categoria: categoria as any,
      },
    });

    return {
      success: true,
      data: archivo,
      message: 'Archivo subido exitosamente',
    };
  }

  /**
   * Valida el tipo de archivo
   */
  validateFileType(mimetype: string): boolean {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    return allowedTypes.includes(mimetype);
  }

  /**
   * Valida el tamaño del archivo
   */
  validateFileSize(size: number): boolean {
    const maxSize = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB por defecto
    return size <= maxSize;
  }
}
