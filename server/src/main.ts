import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';

function getAllowedOrigins(): (string | RegExp)[] | boolean {
  const clientOriginEnv = process.env.CLIENT_ORIGIN;
  if (!clientOriginEnv || clientOriginEnv.trim() === '*' || clientOriginEnv.trim() === '') {
    return true;
  }
  
  const origins = clientOriginEnv
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return origins.length > 0 ? origins : true;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('v1', {
    exclude: ['/', 'health']
  });
  
  app.enableCors({
    origin: getAllowedOrigins(),
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
    credentials: true,
    exposedHeaders: ['Content-Disposition']
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true
    })
  );

  const port = Number(process.env.PORT ?? process.env.API_PORT ?? 4000);
  await app.listen(port);
  console.log(`🚀 Server listening on port ${port}`);
}

void bootstrap();
