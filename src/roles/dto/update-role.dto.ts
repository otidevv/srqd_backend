import { IsString, IsOptional, IsBoolean, IsObject } from 'class-validator';

export class UpdateRoleDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsObject()
  @IsOptional()
  permissions?: any;

  @IsBoolean()
  @IsOptional()
  isSystem?: boolean;
}
