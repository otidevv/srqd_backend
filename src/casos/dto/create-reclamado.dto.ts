import { IsString, IsEnum, IsOptional, IsEmail, MinLength, MaxLength } from 'class-validator';
import { RolUsuario, Sexo } from './create-reclamante.dto';

export class CreateReclamadoDto {
  @IsEnum(RolUsuario)
  rolReclamado: RolUsuario;

  @IsString()
  @MinLength(2)
  nombres: string;

  @IsString()
  @MinLength(2)
  apellidoPaterno: string;

  @IsString()
  @MinLength(2)
  apellidoMaterno: string;

  @IsEnum(Sexo)
  @IsOptional()
  sexo?: Sexo;

  @IsEmail()
  @IsOptional()
  correo?: string;

  @IsString()
  @MinLength(9)
  @MaxLength(15)
  @IsOptional()
  celular?: string;

  // Campos condicionales para estudiantes/egresados
  @IsString()
  @IsOptional()
  carreraProfesional?: string;

  @IsString()
  @IsOptional()
  codigoUniversitario?: string;

  // Campos para docentes/administrativos
  @IsString()
  @IsOptional()
  departamentoAcademico?: string;

  @IsString()
  @IsOptional()
  oficinaAdministrativa?: string;

  @IsString()
  @IsOptional()
  cargo?: string;
}
