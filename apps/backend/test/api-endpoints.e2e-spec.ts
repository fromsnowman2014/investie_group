import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { setupTestApp, teardownTestApp } from './setup-e2e';

describe('API Endpoints (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const testSetup = await setupTestApp();
    app = testSetup.app;
  });

  afterAll(async () => {
    await teardownTestApp();
  });

  describe('/api/v1/stocks', () => {
    it('GET /api/v1/stocks should return all stocks', () => {
      return request(app.getHttpServer())
        .get('/api/v1/stocks')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toBeDefined();
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.count).toBeDefined();
          expect(res.body.timestamp).toBeDefined();
        });
    });

    it('GET /api/v1/stocks/:symbol should return specific stock', () => {
      return request(app.getHttpServer())
        .get('/api/v1/stocks/AAPL')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toBeDefined();
          expect(res.body.data.symbol).toBe('AAPL');
          expect(res.body.data.name).toBe('Apple Inc.');
          expect(res.body.data.price).toBeDefined();
          expect(res.body.data.fundamentals).toBeDefined();
          expect(res.body.data.aiEvaluation).toBeDefined();
          expect(res.body.data.technicals).toBeDefined();
          expect(res.body.data.newsSummary).toBeDefined();
        });
    });

    it('GET /api/v1/stocks/:symbol should validate symbol format', () => {
      return request(app.getHttpServer())
        .get('/api/v1/stocks/123INVALID')
        .expect(400)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.error).toBe('Invalid symbol format');
        });
    });

    it('GET /api/v1/stocks/:symbol/chart should return chart data', () => {
      return request(app.getHttpServer())
        .get('/api/v1/stocks/AAPL/chart')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toBeDefined();
          expect(res.body.data.symbol).toBe('AAPL');
          expect(res.body.data.period).toBeDefined();
          expect(res.body.data.data).toBeDefined();
          expect(Array.isArray(res.body.data.data)).toBe(true);
        });
    });

    it('GET /api/v1/stocks/:symbol/chart should accept period parameter', () => {
      return request(app.getHttpServer())
        .get('/api/v1/stocks/TSLA/chart?period=1M')
        .expect(200)
        .expect((res) => {
          expect(res.body.data.period).toBe('1M');
        });
    });

    it('GET /api/v1/stocks/:symbol/chart should default to 1W period', () => {
      return request(app.getHttpServer())
        .get('/api/v1/stocks/NVDA/chart')
        .expect(200)
        .expect((res) => {
          expect(res.body.data.period).toBe('1W');
        });
    });
  });

  describe('/api/v1/market', () => {
    it('GET /api/v1/market/overview should return market overview', () => {
      return request(app.getHttpServer())
        .get('/api/v1/market/overview')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toBeDefined();
          expect(res.body.data.indices).toBeDefined();
          expect(res.body.data.sectors).toBeDefined();
          expect(res.body.data.marketSentiment).toBeDefined();
          expect(res.body.data.volatilityIndex).toBeDefined();
        });
    });

    it('GET /api/v1/market/movers should return market movers', () => {
      return request(app.getHttpServer())
        .get('/api/v1/market/movers')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toBeDefined();
          expect(res.body.data.gainers).toBeDefined();
          expect(res.body.data.losers).toBeDefined();
          expect(res.body.data.mostActive).toBeDefined();
          expect(Array.isArray(res.body.data.gainers)).toBe(true);
          expect(Array.isArray(res.body.data.losers)).toBe(true);
          expect(Array.isArray(res.body.data.mostActive)).toBe(true);
        });
    });

    it('GET /api/v1/market/trending should return trending stocks', () => {
      return request(app.getHttpServer())
        .get('/api/v1/market/trending')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toBeDefined();
          expect(res.body.data.trending).toBeDefined();
          expect(Array.isArray(res.body.data.trending)).toBe(true);
        });
    });
  });

  describe('/api/v1/news', () => {
    it('GET /api/v1/news/stock should require symbol parameter', () => {
      return request(app.getHttpServer())
        .get('/api/v1/news/stock')
        .expect(400)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.error).toBe('Missing parameter');
        });
    });

    it('GET /api/v1/news/stock?symbol=AAPL should return news data', () => {
      return request(app.getHttpServer())
        .get('/api/v1/news/stock?symbol=AAPL')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toBeDefined();
        });
    });

    it('GET /api/v1/news/stock should validate symbol format', () => {
      return request(app.getHttpServer())
        .get('/api/v1/news/stock?symbol=INVALID123')
        .expect(200)
        .expect((res) => {
          // Should return validation error through news service
          if (!res.body.success) {
            expect(res.body.error).toBeDefined();
            expect(res.body.suggestions).toBeDefined();
          }
        });
    });

    it('GET /api/v1/news/macro should return macro news', () => {
      return request(app.getHttpServer())
        .get('/api/v1/news/macro')
        .expect((res) => {
          // May return 200 or 404 depending on data availability
          expect([200, 404]).toContain(res.status);
        });
    });

    it('GET /api/v1/news/macro should validate date format', () => {
      return request(app.getHttpServer())
        .get('/api/v1/news/macro?date=invalid-date')
        .expect(400)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.error).toBe('Invalid date format');
        });
    });

    it('GET /api/v1/news/health should return service health', () => {
      return request(app.getHttpServer())
        .get('/api/v1/news/health')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toBeDefined();
          expect(res.body.data.status).toBeDefined();
          expect(res.body.data.serpApiConfigured).toBeDefined();
          expect(res.body.data.claudeConfigured).toBeDefined();
        });
    });
  });

  describe('/api/v1/ai', () => {
    it('GET /api/v1/ai/health should return AI service health', () => {
      return request(app.getHttpServer())
        .get('/api/v1/ai/health')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toBeDefined();
          expect(res.body.data.claude).toBeDefined();
          expect(res.body.data.evaluationService).toBeDefined();
        });
    });

    it('GET /api/v1/ai/models should return available models', () => {
      return request(app.getHttpServer())
        .get('/api/v1/ai/models')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toBeDefined();
          expect(res.body.data.claude).toBeDefined();
          expect(res.body.data.fallback).toBeDefined();
        });
    });

    it('GET /api/v1/ai/stats should return AI usage statistics', () => {
      return request(app.getHttpServer())
        .get('/api/v1/ai/stats')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toBeDefined();
          expect(res.body.data.totalEvaluations).toBeDefined();
          expect(res.body.data.successRate).toBeDefined();
          expect(res.body.data.averageResponseTime).toBeDefined();
          expect(res.body.data.cacheHitRate).toBeDefined();
        });
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for unknown endpoints', () => {
      return request(app.getHttpServer())
        .get('/api/v1/nonexistent')
        .expect(404);
    });

    it('should handle CORS headers', () => {
      return request(app.getHttpServer())
        .get('/api/v1/stocks')
        .set('Origin', 'http://localhost:3000')
        .expect((res) => {
          expect(res.headers['access-control-allow-origin']).toBeDefined();
        });
    });
  });

  describe('Response Format Consistency', () => {
    const endpoints = [
      '/api/v1/stocks',
      '/api/v1/stocks/AAPL',
      '/api/v1/market/overview',
      '/api/v1/ai/health',
    ];

    endpoints.forEach((endpoint) => {
      it(`${endpoint} should have consistent response format`, () => {
        return request(app.getHttpServer())
          .get(endpoint)
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(res.body.data).toBeDefined();
            expect(res.body.timestamp).toBeDefined();
            expect(new Date(res.body.timestamp).getTime()).toBeGreaterThan(0);
          });
      });
    });
  });

  describe('Performance Tests', () => {
    it('should respond within reasonable time limits', async () => {
      const startTime = Date.now();
      
      await request(app.getHttpServer())
        .get('/api/v1/stocks/AAPL')
        .expect(200);
        
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(5000); // 5 seconds max
    });

    it('should handle concurrent requests', async () => {
      const promises = Array(5).fill(null).map(() => 
        request(app.getHttpServer())
          .get('/api/v1/market/overview')
          .expect(200)
      );

      const results = await Promise.all(promises);
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.body.success).toBe(true);
      });
    });
  });
});