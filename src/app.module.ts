import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { SedesModule } from './sedes/sedes.module';
import { DependenciasModule } from './dependencias/dependencias.module';
import { CasosModule } from './casos/casos.module';
import { ArchivosModule } from './archivos/archivos.module';
import { DniModule } from './dni/dni.module';
import { MailModule } from './mail/mail.module';
import { PublicacionesModule } from './publicaciones/publicaciones.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    RolesModule,
    SedesModule,
    DependenciasModule,
    CasosModule,
    ArchivosModule,
    DniModule,
    MailModule,
    PublicacionesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
