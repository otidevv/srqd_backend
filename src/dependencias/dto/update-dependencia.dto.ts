import { IsString, IsOptional, IsBoolean, IsUUID } from 'class-validator';

export class UpdateDependenciaDto {
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsString()
  @IsOptional()
  jefe?: string;

  @IsUUID()
  @IsOptional()
  sedeId?: string;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
