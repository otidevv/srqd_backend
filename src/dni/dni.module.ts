import { Module } from '@nestjs/common';
import { DniController } from './dni.controller';

@Module({
  controllers: [DniController],
})
export class DniModule {}
