import {
  Controller,
  Get,
  Post,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Res,
  HttpCode,
  HttpStatus,
  UseGuards,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import type { Response } from 'express';
import { ArchivosService } from './archivos.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { extname, resolve } from 'path';
import { v4 as uuidv4 } from 'uuid';

@Controller('archivos')
export class ArchivosController {
  constructor(private readonly archivosService: ArchivosService) {}

  /**
   * Sube un archivo asociado a un caso
   */
  @Post('upload/:casoId')
  @Public() // Permitir subida de archivos desde formulario público
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          // Generar nombre único para el archivo
          const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
      limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB por defecto
      },
      fileFilter: (req, file, cb) => {
        // Validar tipos de archivo permitidos
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

        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Tipo de archivo no permitido. Solo se permiten PDF, imágenes (JPG, PNG) y documentos de Office.',
            ),
            false,
          );
        }
      },
    }),
  )
  async uploadFile(
    @Param('casoId') casoId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('categoria') categoria?: string,
    @Body('seguimientoId') seguimientoId?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No se ha proporcionado ningún archivo');
    }

    // Pass the categoria and seguimientoId to the service
    return this.archivosService.create(casoId, file, categoria, seguimientoId);
  }

  /**
   * Sube un archivo para publicaciones (sin validar caso)
   */
  @Post('upload-publicacion')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
      limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'),
      },
      fileFilter: (req, file, cb) => {
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

        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Tipo de archivo no permitido. Solo se permiten PDF, imágenes (JPG, PNG) y documentos de Office.',
            ),
            false,
          );
        }
      },
    }),
  )
  async uploadPublicacionFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('categoria') categoria: string,
  ) {
    if (!file) {
      throw new BadRequestException('No se ha proporcionado ningún archivo');
    }

    if (!categoria) {
      throw new BadRequestException('La categoría es requerida');
    }

    return this.archivosService.createPublicacionArchivo(file, categoria);
  }

  /**
   * Obtiene todos los archivos de un caso
   */
  @Get('caso/:casoId')
  @UseGuards(JwtAuthGuard)
  findByCaso(@Param('casoId') casoId: string) {
    return this.archivosService.findByCaso(casoId);
  }

  /**
   * Descarga un archivo
   */
  @Get(':id/download')
  @Public() // Permitir descarga pública de archivos para consulta de casos
  async downloadFile(@Param('id') id: string, @Res() res: Response) {
    const archivoInfo = await this.archivosService.findOne(id);
    const filePath = await this.archivosService.getFilePath(id);

    // Obtener la ruta absoluta
    const absolutePath = resolve(filePath);

    res.setHeader('Content-Type', archivoInfo.data.tipo);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(archivoInfo.data.nombre)}"`,
    );

    return res.sendFile(absolutePath);
  }

  /**
   * Obtiene información de un archivo
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.archivosService.findOne(id);
  }

  /**
   * Elimina un archivo
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.archivosService.remove(id);
  }
}
