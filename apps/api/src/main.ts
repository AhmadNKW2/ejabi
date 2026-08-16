import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { ensureUploadDirs, UPLOADS_ROOT } from './upload-paths';

function normalizeOrigin(origin: string) {
  return origin.trim().replace(/\/+$/, '');
}

function parseOrigins(...values: (string | undefined)[]) {
  const origins = values
    .flatMap((value) => (value ?? '').split(','))
    .map(normalizeOrigin)
    .filter(Boolean);
  return origins.length > 0 ? origins : ['http://localhost:3000', 'http://localhost:3002'];
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.set('trust proxy', 1);
  ensureUploadDirs();
  app.useStaticAssets(UPLOADS_ROOT, { prefix: '/uploads/' });
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  const allowed = parseOrigins(process.env.WEB_ORIGIN, process.env.ADMIN_ORIGIN, process.env.CORS_ORIGINS);
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowed.includes(normalizeOrigin(origin))) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
  });
  const port = Number(process.env.PORT || 3001);
  await app.listen(port, '0.0.0.0');
  console.log(`API listening on 0.0.0.0:${port}`);
}

bootstrap();
