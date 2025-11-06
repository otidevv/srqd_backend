import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsUUID } from 'class-validator';

export class CreateDependenciaDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsString()
  @IsOptional()
  jefe?: string;

  @IsUUID()
  @IsNotEmpty()
  sedeId: string;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
