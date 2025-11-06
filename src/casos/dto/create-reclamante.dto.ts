import {
  IsString,
  IsEnum,
  IsBoolean,
  IsOptional,
  IsEmail,
  MinLength,
  MaxLength,
} from 'class-validator';

export enum RolUsuario {
  ESTUDIANTE = 'ESTUDIANTE',
  EGRESADO = 'EGRESADO',
  DOCENTE = 'DOCENTE',
  ADMINISTRATIVO = 'ADMINISTRATIVO',
  EXTERNO = 'EXTERNO',
}

export enum TipoDocumento {
  DNI = 'DNI',
  CARNET_EXTRANJERIA = 'CARNET_EXTRANJERIA',
  PASAPORTE = 'PASAPORTE',
}

export enum Sexo {
  MASCULINO = 'MASCULINO',
  FEMENINO = 'FEMENINO',
}

export class CreateReclamanteDto {
  @IsEnum(RolUsuario)
  rolReclamante: RolUsuario;

  @IsEnum(TipoDocumento)
  tipoDocumento: TipoDocumento;

  @IsString()
  @MinLength(8)
  @MaxLength(20)
  numeroDocumento: string;

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
  sexo: Sexo;

  @IsString()
  @MinLength(9)
  @MaxLength(15)
  celular: string;

  @IsString()
  @MinLength(10)
  domicilio: string;

  @IsEmail()
  correo: string;

  @IsBoolean()
  autorizacionCorreo: boolean;

  @IsString()
  @IsOptional()
  documentoIdentidadUrl?: string;

  // Campos condicionales para estudiantes/egresados
  @IsString()
  @IsOptional()
  carreraProfesional?: string;

  @IsString()
  @IsOptional()
  codigoUniversitario?: string;

  @IsString()
  @IsOptional()
  semestreEgreso?: string;

  @IsString()
  @IsOptional()
  facultad?: string;

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
