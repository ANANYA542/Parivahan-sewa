import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { Express, Request, Response } from 'express';
import { AppModule } from '../src/app.module.js';

const server: Express = express();
let isReady = false;

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

async function bootstrapServerless() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
  app.setGlobalPrefix('v1');
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
  await app.init();
  isReady = true;
}

export default async function handler(req: Request, res: Response) {
  if (!isReady) {
    await bootstrapServerless();
  }
  server(req, res);
}
