import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getApiInfo() {
    return {
      name: 'Investie API',
      version: '1.0.0',
      description: 'AI-powered investment analysis platform with Supabase Edge Functions',
      endpoints: {
        stocks: '/api/v1/stocks',
        news: '/api/v1/news',
        market: '/api/v1/market',
        ai: '/api/v1/ai',
      },
      edgeFunctions: {
        marketOverview: 'https://fwnmnjwtbggasmunsfyk.supabase.co/functions/v1/market-overview',
        stockData: 'https://fwnmnjwtbggasmunsfyk.supabase.co/functions/v1/stock-data',
        aiAnalysis: 'https://fwnmnjwtbggasmunsfyk.supabase.co/functions/v1/ai-analysis',
        newsAnalysis: 'https://fwnmnjwtbggasmunsfyk.supabase.co/functions/v1/news-analysis',
      },
      documentation: 'https://api.investie.com/docs',
      status: 'operational',
      platform: 'supabase',
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
      platform: 'supabase',
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
      edgeFunctions: {
        marketOverview: 'https://fwnmnjwtbggasmunsfyk.supabase.co/functions/v1/market-overview',
        stockData: 'https://fwnmnjwtbggasmunsfyk.supabase.co/functions/v1/stock-data',
        aiAnalysis: 'https://fwnmnjwtbggasmunsfyk.supabase.co/functions/v1/ai-analysis',
        newsAnalysis: 'https://fwnmnjwtbggasmunsfyk.supabase.co/functions/v1/news-analysis',
      },
      timestamp: new Date().toISOString(),
    };
  }
}
