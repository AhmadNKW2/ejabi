import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { ensureUploadDirs, UPLOADS_ROOT } from './upload-paths';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
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
  const webOrigin = process.env.WEB_ORIGIN || 'http://localhost:3000';
  const adminOrigin = process.env.ADMIN_ORIGIN || 'http://localhost:3002';
  app.enableCors({
    origin: [webOrigin, adminOrigin],
    credentials: true,
  });
  const port = Number(process.env.PORT || 3001);
  await app.listen(port);
  console.log(`API listening on http://localhost:${port}`);
}

bootstrap();
