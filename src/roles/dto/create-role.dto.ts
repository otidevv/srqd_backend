import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsObject } from 'class-validator';

export class CreateRoleDto {
  @IsString({ message: 'El nombre debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  name: string;

  @IsString({ message: 'La descripción debe ser un texto' })
  @IsOptional()
  description?: string;

  @IsObject({ message: 'Los permisos deben ser un objeto' })
  @IsOptional()
  permissions?: any;

  @IsBoolean({ message: 'isSystem debe ser un booleano' })
  @IsOptional()
  isSystem?: boolean;
}
