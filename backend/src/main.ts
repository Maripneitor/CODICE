import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Register global interceptors & filters
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  // Set global prefix
  app.setGlobalPrefix('api');

  // Hardening perimetral with Helmet (configure to avoid blocking Swagger assets if needed, or default helmet)
  // Let's modify helmet configuration to allow Swagger UI scripts/styles if needed, or default
  app.use(helmet({
    contentSecurityPolicy: false, // Turn off CSP temporarily for local Swagger visualization to load resources properly
  }));

  // Parse cookies
  app.use(cookieParser(process.env.COOKIE_SECRET || 'codice-cookie-secret-key-987654321'));

  // Enable CORS for frontend credentials exchange
  app.enableCors({
    origin: true, // In production, replace with specific domains (e.g. process.env.FRONTEND_URL)
    credentials: true,
  });

  // Strict Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger Setup
  const config = new DocumentBuilder()
    .setTitle('Códice API - Panel de Control de Almacén')
    .setDescription('Sistema de control y flujo para tu almacén - Endpoints CRUD')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`Backend server successfully running on port ${port}`);
}
bootstrap();
