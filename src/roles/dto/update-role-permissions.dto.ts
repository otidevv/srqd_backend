import { IsObject, IsNotEmpty } from 'class-validator';

export class UpdateRolePermissionsDto {
  @IsObject({ message: 'Los permisos deben ser un objeto' })
  @IsNotEmpty({ message: 'Los permisos son requeridos' })
  permissions: Record<string, string[]>;
}
