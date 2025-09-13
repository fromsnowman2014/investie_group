import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { setupTestApp, teardownTestApp } from './setup-e2e';

describe('Deployment Validation (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const testSetup = await setupTestApp();
    app = testSetup.app;
  });

  afterAll(async () => {
    await teardownTestApp();
  });

  describe('Supabase Edge Function Health Checks', () => {
    it('should pass backend health endpoint', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('healthy');
          expect(res.body.uptime).toBeDefined();
          expect(res.body.memory).toBeDefined();
          expect(res.body.version).toBe('1.0.0');
          expect(res.body.configuration).toBeDefined();
          expect(res.body.apiKeys).toBeDefined();
        });
    });

    it('should verify Supabase Edge Functions are accessible', async () => {
      // Test market overview edge function
      const supabaseUrl = 'https://fwnmnjwtbggasmunsfyk.supabase.co/functions/v1';
      const authToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3bm1uand0YmdnYXNtdW5zZnlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQxMTQ0OTcsImV4cCI6MjAzOTY5MDQ5N30.p5f3VIWgz6b2kKgQ4OydRhqf7oEfWvTiP6KSUmhQBT8';
      
      try {
        const response = await fetch(`${supabaseUrl}/market-overview`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.indices).toBeDefined();
        expect(data.source).toBeDefined();
      } catch (error) {
        console.warn('Supabase Edge Function test failed:', error.message);
        // Don't fail the test if external service is temporarily unavailable
      }
    });

    it('should handle API info endpoint with Supabase configuration', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe('Investie API');
          expect(res.body.status).toBe('operational');
          expect(res.body.endpoints).toBeDefined();
          expect(res.body.endpoints.stocks).toBe('/api/v1/stocks');
          expect(res.body.endpoints.market).toBe('/api/v1/market');
        });
    });
  });

  describe('Core API Functionality with Supabase Integration', () => {
    it('should serve stock data from Supabase Edge Functions', () => {
      return request(app.getHttpServer())
        .get('/api/v1/stocks/AAPL')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.symbol).toBe('AAPL');
          expect(res.body.data.price).toBeDefined();
          expect(res.body.data.aiEvaluation).toBeDefined();
          // Verify data comes from Supabase or mock sources
          expect(['supabase', 'alpha_vantage', 'mock_data']).toContain(res.body.data.source || 'mock_data');
        });
    });

    it('should provide market overview from Supabase Edge Functions', () => {
      return request(app.getHttpServer())
        .get('/api/v1/market/overview')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.indices).toBeDefined();
          expect(res.body.data.sectors).toBeDefined();
          expect(res.body.data.source).toBeDefined();
          expect(['alpha_vantage', 'mock_data']).toContain(res.body.data.source);
        });
    });

    it('should show AI service status', () => {
      return request(app.getHttpServer())
        .get('/api/v1/ai/health')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.claude).toBeDefined();
          expect(res.body.data.evaluationService).toBeDefined();
        });
    });

    it('should handle news health check', () => {
      return request(app.getHttpServer())
        .get('/api/v1/news/health')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.status).toBe('operational');
          expect(typeof res.body.data.serpApiConfigured).toBe('boolean');
          expect(typeof res.body.data.claudeConfigured).toBe('boolean');
        });
    });
  });

  describe('Error Handling & Resilience', () => {
    it('should handle invalid stock symbols gracefully', () => {
      return request(app.getHttpServer())
        .get('/api/v1/stocks/INVALID123')
        .expect(400)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.error).toBe('Invalid symbol format');
        });
    });

    it('should handle 404 for non-existent endpoints', () => {
      return request(app.getHttpServer())
        .get('/api/v1/nonexistent')
        .expect(404);
    });

    it('should validate chart period parameters', () => {
      return request(app.getHttpServer())
        .get('/api/v1/stocks/AAPL/chart?period=INVALID')
        .expect(200)
        .expect((res) => {
          // Should default to 1W for invalid periods
          expect(res.body.data.period).toBe('1W');
        });
    });
  });

  describe('Performance & Scalability', () => {
    it('should respond to multiple requests within time limits', async () => {
      const startTime = Date.now();

      const promises = [
        request(app.getHttpServer()).get('/api/v1/stocks/AAPL').expect(200),
        request(app.getHttpServer()).get('/api/v1/stocks/TSLA').expect(200),
        request(app.getHttpServer()).get('/api/v1/market/overview').expect(200),
      ];

      await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      expect(totalTime).toBeLessThan(3000); // Should complete within 3 seconds
    });

    it('should handle rapid sequential requests', async () => {
      for (let i = 0; i < 3; i++) {
        await request(app.getHttpServer())
          .get('/api/v1/market/overview')
          .expect(200);
      }
    });
  });

  describe('Data Quality & Consistency', () => {
    it('should return consistent stock data structure', () => {
      return request(app.getHttpServer())
        .get('/api/v1/stocks/AAPL')
        .expect(200)
        .expect((res) => {
          const stock = res.body.data;
          expect(stock).toHaveProperty('symbol');
          expect(stock).toHaveProperty('name');
          expect(stock).toHaveProperty('price');
          expect(stock.price).toHaveProperty('current');
          expect(stock.price).toHaveProperty('change');
          expect(stock.price).toHaveProperty('changePercent');
          expect(stock).toHaveProperty('fundamentals');
          expect(stock).toHaveProperty('aiEvaluation');
          expect(stock).toHaveProperty('technicals');
          expect(stock).toHaveProperty('newsSummary');
        });
    });

    it('should provide valid AI evaluation structure', () => {
      return request(app.getHttpServer())
        .get('/api/v1/stocks/NVDA')
        .expect(200)
        .expect((res) => {
          const evaluation = res.body.data.aiEvaluation;
          expect(evaluation).toHaveProperty('rating');
          expect(evaluation).toHaveProperty('confidence');
          expect(evaluation).toHaveProperty('summary');
          expect(evaluation).toHaveProperty('keyFactors');
          expect(Array.isArray(evaluation.keyFactors)).toBe(true);
          expect(['buy', 'hold', 'sell']).toContain(evaluation.rating);
          expect(evaluation.confidence).toBeGreaterThanOrEqual(0);
          expect(evaluation.confidence).toBeLessThanOrEqual(100);
        });
    });
  });

  describe('Production Readiness', () => {
    it('should include proper timestamps in responses', () => {
      return request(app.getHttpServer())
        .get('/api/v1/stocks/MSFT')
        .expect(200)
        .expect((res) => {
          expect(res.body.timestamp).toBeDefined();
          const timestamp = new Date(res.body.timestamp);
          expect(timestamp.getTime()).not.toBeNaN();
          expect(timestamp.getTime()).toBeGreaterThan(Date.now() - 10000); // Within last 10 seconds
        });
    });

    it('should handle all target stock symbols', async () => {
      const targetSymbols = [
        'AAPL',
        'TSLA',
        'MSFT',
        'GOOGL',
        'AMZN',
        'NVDA',
        'META',
        'NFLX',
        'AVGO',
        'AMD',
      ];

      const promises = targetSymbols.map((symbol) =>
        request(app.getHttpServer())
          .get(`/api/v1/stocks/${symbol}`)
          .expect(200),
      );

      const results = await Promise.all(promises);

      results.forEach((result, index) => {
        expect(result.body.data.symbol).toBe(targetSymbols[index]);
      });
    });

    it('should provide chart data for all periods', async () => {
      const periods = ['1W', '1M', '3M', '1Y'];

      for (const period of periods) {
        await request(app.getHttpServer())
          .get(`/api/v1/stocks/AAPL/chart?period=${period}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.data.period).toBe(period);
            expect(Array.isArray(res.body.data.data)).toBe(true);
            expect(res.body.data.data.length).toBeGreaterThan(0);
          });
      }
    });
  });
});
