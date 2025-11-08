import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Servir archivos estáticos desde la carpeta uploads
  // Usar process.cwd() para que funcione tanto en desarrollo como producción
  const uploadsPath = join(process.cwd(), 'uploads');
  console.log('📁 Serving static files from:', uploadsPath);
  app.use('/uploads', express.static(uploadsPath));

  // Configurar límite de body para JSON y URL-encoded
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Configurar CORS - permitir múltiples orígenes
  const allowedOrigins = [
    'http://localhost:5173',  // Vite dev
    'http://localhost:4173',  // Vite preview
    'http://localhost:3001',  // Otro puerto común
  ];

  // Si existe CORS_ORIGIN en env, agregarlo a la lista
  if (process.env.CORS_ORIGIN) {
    allowedOrigins.push(process.env.CORS_ORIGIN);
  }

  app.enableCors({
    origin: (origin, callback) => {
      // Permitir requests sin origin (como Postman, curl, etc)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.warn('⚠️  CORS blocked origin:', origin);
        callback(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Prefijo global para todas las rutas
  app.setGlobalPrefix('api');

  // Validación global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log('');
  console.log('🚀 Backend SRQD Sistema is running!');
  console.log(`📡 Server: http://localhost:${port}`);
  console.log(`🔗 API: http://localhost:${port}/api`);
  console.log(`🔐 Auth: http://localhost:${port}/api/auth/login`);
  console.log('');
}
bootstrap();
