import {
  IsString,
  IsEnum,
  IsBoolean,
  IsOptional,
  IsArray,
  ValidateNested,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateReclamanteDto } from './create-reclamante.dto';
import { CreateReclamadoDto } from './create-reclamado.dto';

export enum CasoTipo {
  RECLAMO = 'RECLAMO',
  QUEJA = 'QUEJA',
  DENUNCIA = 'DENUNCIA',
}

export enum CasoPrioridad {
  BAJA = 'BAJA',
  MEDIA = 'MEDIA',
  ALTA = 'ALTA',
  URGENTE = 'URGENTE',
}

export class CreateCasoDto {
  @IsEnum(CasoTipo)
  tipo: CasoTipo;

  @IsEnum(CasoPrioridad)
  @IsOptional()
  prioridad?: CasoPrioridad;

  @IsString()
  @MinLength(20, { message: 'La descripción de hechos debe tener al menos 20 caracteres' })
  descripcionHechos: string;

  @IsString()
  @MinLength(20, { message: 'Los derechos afectados deben tener al menos 20 caracteres' })
  derechosAfectados: string;

  @IsBoolean()
  @IsOptional()
  esAnonimo?: boolean;

  @IsBoolean()
  @IsOptional()
  requiereMediacion?: boolean;

  @IsBoolean()
  @IsOptional()
  esConfidencial?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  etiquetas?: string[];

  @ValidateNested()
  @Type(() => CreateReclamanteDto)
  @IsOptional()
  reclamante?: CreateReclamanteDto;

  @ValidateNested()
  @Type(() => CreateReclamadoDto)
  @IsOptional()
  reclamado?: CreateReclamadoDto;
}
