import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreatePublicacionDto } from './create-publicacion.dto';

export class UpdatePublicacionDto extends PartialType(CreatePublicacionDto) {
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
