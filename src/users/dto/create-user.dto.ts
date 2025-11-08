import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MinLength, IsDateString } from 'class-validator';
import { UserStatus, TipoDocumento } from '@prisma/client';

export class CreateUserDto {
  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  email: string;

  @IsString({ message: 'La contraseña debe ser un texto' })
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @IsString({ message: 'El nombre debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  name: string;

  @IsUUID('4', { message: 'ID de rol inválido' })
  @IsNotEmpty({ message: 'El rol es requerido' })
  roleId: string;

  @IsEnum(UserStatus, { message: 'Estado inválido' })
  @IsOptional()
  status?: UserStatus;

  @IsString({ message: 'El teléfono debe ser un texto' })
  @IsOptional()
  phone?: string;

  @IsString({ message: 'El avatar debe ser una URL' })
  @IsOptional()
  avatar?: string;

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
