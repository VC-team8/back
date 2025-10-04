import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { appConfig } from './config/app.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // CORS configuration
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('OnboardAI API')
    .setDescription('API for AI-powered employee onboarding platform')
    .setVersion('1.0')
    .addTag('Companies', 'Company management endpoints')
    .addTag('Resources', 'Resource management endpoints')
    .addTag('Conversations', 'Conversation management endpoints')
    .addTag('Messages', 'Message management endpoints')
    .addTag('AI', 'AI processing endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Global prefix
  app.setGlobalPrefix('api');

  await app.listen(appConfig.port);
  console.log(`🚀 Application is running on: http://localhost:${appConfig.port}`);
  console.log(`📚 Swagger documentation: http://localhost:${appConfig.port}/api/docs`);
}

bootstrap();

