import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
    appService = app.get<AppService>(AppService);
  });

  describe('getApiInfo', () => {
    it('should return API information object', () => {
      const result = appController.getApiInfo();
      
      expect(result).toBeDefined();
      expect(result.name).toBe('Investie API');
      expect(result.version).toBe('1.0.0');
      expect(result.status).toBe('operational');
      expect(result.endpoints).toBeDefined();
      expect(result.endpoints.stocks).toBe('/api/v1/stocks');
      expect(result.endpoints.news).toBe('/api/v1/news');
      expect(result.endpoints.market).toBe('/api/v1/market');
      expect(result.endpoints.ai).toBe('/api/v1/ai');
    });
  });

  describe('getHealth', () => {
    it('should return health status', () => {
      const result = appController.getHealth();
      
      expect(result).toBeDefined();
      expect(result.status).toBe('healthy');
      expect(result.version).toBe('1.0.0');
      expect(typeof result.uptime).toBe('number');
      expect(result.memory).toBeDefined();
      expect(result.memory.used).toBeDefined();
      expect(result.memory.total).toBeDefined();
    });
  });
});
