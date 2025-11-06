import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { PublicacionesService } from './publicaciones.service';
import { CreatePublicacionDto } from './dto/create-publicacion.dto';
import { UpdatePublicacionDto } from './dto/update-publicacion.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

@Controller('publicaciones')
@UseGuards(JwtAuthGuard)
export class PublicacionesController {
  constructor(private readonly publicacionesService: PublicacionesService) {}

  /**
   * Crear nueva publicación (Autenticado)
   */
  @Post()
  create(
    @Body() createPublicacionDto: CreatePublicacionDto,
    @GetUser() user: any,
  ) {
    return this.publicacionesService.create(createPublicacionDto, user?.id);
  }

  /**
   * Obtener todas las publicaciones (Autenticado)
   */
  @Get()
  findAll() {
    return this.publicacionesService.findAll();
  }

  /**
   * Obtener publicaciones activas (Público)
   */
  @Get('activas')
  @Public()
  findActivas() {
    return this.publicacionesService.findActivas();
  }

  /**
   * Obtener una publicación por ID (Autenticado)
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.publicacionesService.findOne(id);
  }

  /**
   * Actualizar publicación (Autenticado)
   */
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePublicacionDto: UpdatePublicacionDto,
  ) {
    return this.publicacionesService.update(id, updatePublicacionDto);
  }

  /**
   * Activar/Desactivar publicación (Autenticado)
   */
  @Patch(':id/toggle')
  toggleActivo(@Param('id') id: string) {
    return this.publicacionesService.toggleActivo(id);
  }

  /**
   * Eliminar publicación (Autenticado)
   */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.publicacionesService.remove(id);
  }
}
