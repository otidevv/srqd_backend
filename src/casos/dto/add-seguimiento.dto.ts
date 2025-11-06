import { IsString, MinLength, IsOptional, IsArray, IsBoolean } from 'class-validator';

export class AddSeguimientoDto {
  @IsString()
  @MinLength(10, { message: 'El comentario debe tener al menos 10 caracteres' })
  comentario: string;

  @IsString()
  accion: string;

  @IsOptional()
  @IsBoolean()
  esVisible?: boolean; // Si el seguimiento es visible para el usuario

  @IsOptional()
  @IsArray()
  archivosIds?: string[]; // IDs de archivos ya subidos que se asociarán a este seguimiento
}
