import { IsString, IsEnum, IsOptional, IsDateString, IsArray } from 'class-validator';
import { CasoPrioridad } from './create-caso.dto';

export enum CasoEstado {
  PENDIENTE = 'PENDIENTE',
  EN_REVISION = 'EN_REVISION',
  EN_PROCESO = 'EN_PROCESO',
  RESUELTO = 'RESUELTO',
  ARCHIVADO = 'ARCHIVADO',
  RECHAZADO = 'RECHAZADO',
}

export class UpdateCasoDto {
  @IsEnum(CasoEstado)
  @IsOptional()
  estado?: CasoEstado;

  @IsEnum(CasoPrioridad)
  @IsOptional()
  prioridad?: CasoPrioridad;

  @IsString()
  @IsOptional()
  asignadoA?: string;

  @IsString()
  @IsOptional()
  asignadoNombre?: string;

  @IsString()
  @IsOptional()
  resolucion?: string;

  @IsString()
  @IsOptional()
  recomendaciones?: string;

  @IsDateString()
  @IsOptional()
  fechaResolucion?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  etiquetas?: string[];
}
