import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getApiInfo() {
    return {
      name: 'Investie API',
      version: '1.0.0',
      description: 'AI-powered investment analysis platform',
      endpoints: {
        stocks: '/api/v1/stocks',
        news: '/api/v1/news',
        market: '/api/v1/market',
        ai: '/api/v1/ai',
      },
      documentation: 'https://api.investie.com/docs',
      status: 'operational',
      timestamp: new Date().toISOString(),
    };
  }

  getHealth() {
    const alphaVantageKey = process.env.ALPHA_VANTAGE_API_KEY;
    const claudeKey = process.env.CLAUDE_API_KEY;
    const serpApiKey = process.env.SERPAPI_API_KEY;
    
    return {
      status: 'healthy',
      uptime: process.uptime(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        total:
          Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
      },
      apiKeys: {
        alphaVantage: alphaVantageKey ? 'CONFIGURED' : 'MISSING',
        claude: claudeKey ? 'CONFIGURED' : 'MISSING',
        serpApi: serpApiKey ? 'CONFIGURED' : 'MISSING',
      },
      configuration: {
        port: process.env.PORT || '3001',
        supabaseUrl: process.env.SUPABASE_URL ? 'CONFIGURED' : 'MISSING',
        supabaseKey: process.env.SUPABASE_ANON_KEY ? 'CONFIGURED' : 'MISSING',
      },
      timestamp: new Date().toISOString(),
    };
  }
}
