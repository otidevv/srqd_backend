import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { CasosService } from './casos.service';
import { CreateCasoDto, CasoTipo } from './dto/create-caso.dto';
import { UpdateCasoDto, CasoEstado } from './dto/update-caso.dto';
import { AddSeguimientoDto } from './dto/add-seguimiento.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

@Controller('casos')
export class CasosController {
  constructor(private readonly casosService: CasosService) {}

  @Post()
  @Public() // Permitir creación pública de casos (por ejemplo, desde un formulario público)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createCasoDto: CreateCasoDto, @GetUser() user?: any) {
    return this.casosService.create(
      createCasoDto,
      user?.sub,
      user?.name || 'Usuario Anónimo',
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(
    @Query('tipo') tipo?: CasoTipo,
    @Query('estado') estado?: CasoEstado,
    @Query('prioridad') prioridad?: string,
    @Query('asignadoA') asignadoA?: string,
    @Query('fechaDesde') fechaDesde?: string,
    @Query('fechaHasta') fechaHasta?: string,
    @Query('busqueda') busqueda?: string,
  ) {
    return this.casosService.findAll({
      tipo,
      estado,
      prioridad,
      asignadoA,
      fechaDesde,
      fechaHasta,
      busqueda,
    });
  }

  @Get('estadisticas')
  @UseGuards(JwtAuthGuard)
  getEstadisticas() {
    return this.casosService.getEstadisticas();
  }

  @Get('codigo/:codigo')
  @Public() // Permitir consulta pública por código para demandantes
  findByCodigo(@Param('codigo') codigo: string) {
    return this.casosService.findByCodigo(codigo);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.casosService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateCasoDto: UpdateCasoDto,
    @GetUser() user: any,
  ) {
    return this.casosService.update(id, updateCasoDto, user?.id, user?.name);
  }

  @Post(':id/asignar')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  asignarCaso(
    @Param('id') id: string,
    @Body('asignadoA') asignadoA: string,
    @GetUser() user: any,
  ) {
    return this.casosService.asignarCaso(id, asignadoA, user?.id, user?.name);
  }

  @Post(':id/seguimientos')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  addSeguimiento(
    @Param('id') id: string,
    @Body() addSeguimientoDto: AddSeguimientoDto,
    @GetUser() user: any,
  ) {
    return this.casosService.addSeguimiento(id, addSeguimientoDto, user?.id, user?.name);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @GetUser() user: any) {
    return this.casosService.remove(id, user?.id, user?.name);
  }

  @Post(':id/enviar-constancia')
  @Public() // Permitir envío público de constancia
  @HttpCode(HttpStatus.OK)
  async enviarConstancia(
    @Param('id') id: string,
    @Body('pdfBase64') pdfBase64: string,
  ) {
    // Convertir el PDF de base64 a Buffer
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');
    return this.casosService.enviarConstanciaPorCorreo(id, pdfBuffer);
  }
}
