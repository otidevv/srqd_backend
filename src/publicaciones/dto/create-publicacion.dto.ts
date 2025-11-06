import { IsString, IsOptional, IsInt, IsEnum, IsDateString, MinLength } from 'class-validator';

export enum TipoPublicacion {
  ANUNCIO = 'ANUNCIO',
  COMUNICADO = 'COMUNICADO',
  EVENTO = 'EVENTO',
  NOTICIA = 'NOTICIA',
}

export class CreatePublicacionDto {
  @IsString()
  @MinLength(5, { message: 'El título debe tener al menos 5 caracteres' })
  titulo: string;

  @IsString()
  @MinLength(10, { message: 'La descripción debe tener al menos 10 caracteres' })
  descripcion: string;

  @IsOptional()
  @IsString()
  imagenUrl?: string;

  @IsOptional()
  @IsString()
  documentoUrl?: string;

  @IsOptional()
  @IsDateString()
  fechaExpiracion?: string;

  @IsOptional()
  @IsInt()
  prioridad?: number;

  @IsOptional()
  @IsEnum(TipoPublicacion)
  tipo?: TipoPublicacion;
}
