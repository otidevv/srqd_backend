import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { TipoDocumento } from '@prisma/client';

export class UpdateProfileDto {
  @IsString({ message: 'El nombre debe ser un texto' })
  @IsOptional()
  name?: string;

  @IsString({ message: 'El teléfono debe ser un texto' })
  @IsOptional()
  phone?: string;

  // Información de perfil personal
  @IsEnum(TipoDocumento, { message: 'Tipo de documento inválido' })
  @IsOptional()
  tipoDocumento?: TipoDocumento;

  @IsString({ message: 'El número de documento debe ser un texto' })
  @IsOptional()
  numeroDocumento?: string;

  @IsDateString({}, { message: 'Fecha de nacimiento inválida' })
  @IsOptional()
  fechaNacimiento?: string;

  @IsString({ message: 'La dirección debe ser un texto' })
  @IsOptional()
  direccion?: string;

  // Información profesional/laboral
  @IsString({ message: 'El cargo debe ser un texto' })
  @IsOptional()
  cargo?: string;

  @IsUUID('4', { message: 'ID de sede inválido' })
  @IsOptional()
  sedeId?: string;

  @IsUUID('4', { message: 'ID de dependencia inválido' })
  @IsOptional()
  dependenciaId?: string;
}
