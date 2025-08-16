import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Enable CORS for frontend integration
  app.enableCors({
    origin: [
      'http://localhost:3000', // Local development
      'https://investie-frontend.vercel.app', // Production frontend
      /\.vercel\.app$/, // All Vercel preview deployments
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // Global prefix for all routes
  app.setGlobalPrefix('');

  const port = process.env.PORT ?? 3001;
  const host = process.env.HOST ?? '0.0.0.0';

  await app.listen(port, host);
  
  logger.log(`🚀 Investie Backend API is running on: http://${host}:${port}`);
  logger.log(`📊 Health check: http://${host}:${port}/health`);
  logger.log(`📈 Stocks API: http://${host}:${port}/api/v1/stocks`);
  logger.log(`📰 News API: http://${host}:${port}/api/v1/news`);
  logger.log(`🏢 Market API: http://${host}:${port}/api/v1/market`);
  logger.log(`🤖 AI API: http://${host}:${port}/api/v1/ai`);
}

bootstrap().catch((error) => {
  console.error('Failed to start the application:', error);
  process.exit(1);
});
