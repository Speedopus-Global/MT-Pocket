import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser = require('cookie-parser');
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.use(cookieParser());

  app.enableCors({
    origin: process.env.FRONTEND_URL! || 'http://localhost:5173',
    credentials: true, // required so the browser sends/receives the refresh-token cookie
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,       // strips unknown fields but does NOT reject requests
      forbidNonWhitelisted: false, // don't throw 400 for undecorated body fields
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  await app.listen(process.env.PORT || 3000);
}
bootstrap();