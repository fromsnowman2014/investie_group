import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
const portfinder = require('portfinder');

let testApp: INestApplication;
let testPort: number;

/**
 * Setup E2E testing environment with dynamic port allocation
 * Prevents conflicts with running dev server
 */
export async function setupTestApp(): Promise<{ app: INestApplication; port: number }> {
  if (testApp) {
    return { app: testApp, port: testPort };
  }

  // Find available port dynamically (starting from 3002)
  testPort = await portfinder.getPortPromise({ port: 3002 });
  
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  testApp = moduleFixture.createNestApplication();
  
  // Apply same configuration as main.ts
  testApp.enableCors({
    origin: ['http://localhost:3000', `http://localhost:${testPort}`],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
  });
  
  testApp.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );
  
  // Listen on dynamic port
  await testApp.init();
  await testApp.listen(testPort);
  
  console.log(`📋 E2E Test Server started on port ${testPort}`);
  
  return { app: testApp, port: testPort };
}

export async function teardownTestApp(): Promise<void> {
  if (testApp) {
    await testApp.close();
    testApp = null;
    testPort = null;
    console.log('📋 E2E Test Server stopped');
  }
}

// Global test timeout
jest.setTimeout(30000);