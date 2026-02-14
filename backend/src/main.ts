import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configure CORS
  // If CORS_ORIGINS is set, use it; otherwise allow all origins (for Tailscale/local flexibility)
  const corsOrigins = process.env.CORS_ORIGINS;
  const corsConfig = corsOrigins
    ? {
      origin: corsOrigins.split(',').map((origin) => origin.trim()),
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    }
    : {
      origin: true, // Allow all origins (useful for Tailscale/local network access)
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    };

  app.enableCors(corsConfig);

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Enable global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  const port = process.env.PORT ?? 3005;
  await app.listen(port, '0.0.0.0');

  console.log(` Goal Tracker API server running on http://0.0.0.0:${port}`);
}
bootstrap();
