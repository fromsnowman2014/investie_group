// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

interface NewsAnalysisResponse {
  symbol: string;
  overview: string;
  recommendation: 'BUY' | 'HOLD' | 'SELL';
  confidence: number;
  keyFactors: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  timeHorizon: string;
  source: string;
  timestamp: string;
  stockNews?: {
    headline: string;
    source: string;
    articles: NewsArticle[];
  };
  macroNews?: {
    topHeadline: string;
    articles: NewsArticle[];
  };
}

interface NewsArticle {
  title: string;
  link: string;
  snippet: string;
  date: string;
  source: string;
}

interface CompanyMapping {
  [key: string]: string;
}

const VALID_SYMBOLS = [
  'AAPL', 'TSLA', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 
  'META', 'NFLX', 'AVGO', 'AMD', 'JPM', 'BAC', 
  'JNJ', 'PFE', 'SPY', 'QQQ', 'VTI'
];

const COMPANY_MAPPING: CompanyMapping = {
  AAPL: 'Apple Inc',
  TSLA: 'Tesla Inc',
  MSFT: 'Microsoft Corporation',
  GOOGL: 'Alphabet Inc',
  AMZN: 'Amazon.com Inc',
  NVDA: 'NVIDIA Corporation',
  META: 'Meta Platforms Inc',
  NFLX: 'Netflix Inc',
  AVGO: 'Broadcom Inc',
  AMD: 'Advanced Micro Devices Inc',
  JPM: 'JPMorgan Chase & Co',
  BAC: 'Bank of America Corp',
  JNJ: 'Johnson & Johnson',
  PFE: 'Pfizer Inc',
  SPY: 'SPDR S&P 500 ETF',
  QQQ: 'Invesco QQQ Trust',
  VTI: 'Vanguard Total Stock Market ETF'
};

function validateSymbol(symbol: string): boolean {
  return VALID_SYMBOLS.includes(symbol.toUpperCase());
}

function getCompanyName(symbol: string): string {
  return COMPANY_MAPPING[symbol] || symbol;
}

async function fetchNewsFromSerpApi(query: string, serpApiKey: string): Promise<NewsArticle[]> {
  try {
    const response = await fetch('https://serpapi.com/search?' + new URLSearchParams({
      engine: 'google_news',
      q: query,
      gl: 'us',
      hl: 'en',
      num: '25',
      api_key: serpApiKey
    }));

    if (!response.ok) {
      console.warn(`SerpAPI error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const newsResults = data.news_results || [];

    // Filter articles from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return newsResults.filter((article: any) => {
      if (!article.date) return true;
      
      try {
        const articleDate = new Date(article.date);
        return articleDate >= thirtyDaysAgo;
      } catch {
        return true;
      }
    }).map((article: any) => ({
      title: article.title || '',
      link: article.link || '',
      snippet: article.snippet || '',
      date: article.date || new Date().toISOString(),
      source: article.source || 'Unknown'
    }));

  } catch (error) {
    console.error(`SerpAPI fetch error for "${query}":`, error.message);
    return [];
  }
}

async function fetchStockNews(symbol: string, serpApiKey: string): Promise<NewsArticle[]> {
  const companyName = getCompanyName(symbol);
  const searchQueries = [
    `${symbol} news`,
    `${companyName} stock`,
    `${symbol} earnings`,
    `${companyName} today`
  ];

  for (const query of searchQueries) {
    console.log(`Trying stock news query: "${query}"`);
    
    const articles = await fetchNewsFromSerpApi(query, serpApiKey);
    if (articles.length >= 5) {
      console.log(`Found ${articles.length} articles for ${symbol}`);
      return articles;
    }
  }

  // Final fallback
  const fallbackQuery = `"${companyName}" ${symbol}`;
  return await fetchNewsFromSerpApi(fallbackQuery, serpApiKey);
}

async function fetchMacroNews(serpApiKey: string): Promise<NewsArticle[]> {
  const macroQuery = 'stock market economy finance business';
  return await fetchNewsFromSerpApi(macroQuery, serpApiKey);
}

async function generateClaudeNewsAnalysis(
  symbol: string,
  stockArticles: NewsArticle[],
  macroArticles: NewsArticle[],
  claudeApiKey: string
): Promise<NewsAnalysisResponse | null> {
  try {
    const companyName = getCompanyName(symbol);
    const currentDate = new Date().toISOString().split('T')[0];
    
    let prompt = `Analyze ${symbol} (${companyName}) stock for investment recommendation based on comprehensive news data (Analysis Date: ${currentDate}):\n\n`;

    if (stockArticles.length > 0) {
      prompt += `COMPANY-SPECIFIC NEWS (${stockArticles.length} articles):\n`;
      stockArticles.slice(0, 10).forEach((article, index) => {
        const articleDate = new Date(article.date);
        const daysDiff = Math.floor((Date.now() - articleDate.getTime()) / (1000 * 60 * 60 * 24));
        const recencyText = daysDiff === 0 ? 'Today' : daysDiff === 1 ? '1 day ago' : `${daysDiff} days ago`;
        
        prompt += `${index + 1}. "${article.title}" (${recencyText})\n`;
        if (article.snippet) {
          prompt += `   Content: ${article.snippet}\n`;
        }
        prompt += `   Source: ${article.source}\n\n`;
      });
    }

    if (macroArticles.length > 0) {
      prompt += `MARKET & ECONOMIC NEWS (${macroArticles.length} articles):\n`;
      macroArticles.slice(0, 5).forEach((article, index) => {
        const articleDate = new Date(article.date);
        const daysDiff = Math.floor((Date.now() - articleDate.getTime()) / (1000 * 60 * 60 * 24));
        const recencyText = daysDiff === 0 ? 'Today' : daysDiff === 1 ? '1 day ago' : `${daysDiff} days ago`;
        
        prompt += `${index + 1}. "${article.title}" (${recencyText})\n`;
        if (article.snippet) {
          prompt += `   Content: ${article.snippet}\n`;
        }
        prompt += `   Source: ${article.source}\n\n`;
      });
    }

    prompt += `
Based on this comprehensive news analysis, provide an investment assessment for ${symbol} in JSON format:

ANALYSIS REQUIREMENTS:
- Consider the recency of news (today's news vs older articles)
- Analyze sentiment trends over time
- Weight recent developments more heavily
- Identify momentum and frequency patterns
- Consider company-specific vs market-wide factors

Respond with JSON matching this schema:
{
  "overview": "2-3 sentence analysis of the stock's outlook based on the news",
  "recommendation": "BUY|HOLD|SELL", 
  "confidence": 85,
  "keyFactors": ["factor1", "factor2", "factor3"],
  "riskLevel": "LOW|MEDIUM|HIGH",
  "timeHorizon": "1-3 months|3-6 months|6-12 months"
}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      console.warn(`Claude API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const content = data.content?.[0]?.text;
    
    if (!content) {
      console.warn('No content returned from Claude API');
      return null;
    }

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const analysisData = JSON.parse(jsonMatch[0]);
      
      return {
        symbol,
        overview: analysisData.overview || `Analysis for ${symbol} based on news data`,
        recommendation: analysisData.recommendation || 'HOLD',
        confidence: analysisData.confidence || 70,
        keyFactors: analysisData.keyFactors || ['News analysis', 'Market conditions'],
        riskLevel: analysisData.riskLevel || 'MEDIUM',
        timeHorizon: analysisData.timeHorizon || '3-6 months',
        source: 'claude_news_analysis',
        timestamp: new Date().toISOString(),
        stockNews: stockArticles.length > 0 ? {
          headline: stockArticles[0]?.title || 'No specific news',
          source: 'serpapi_google_news',
          articles: stockArticles.slice(0, 10)
        } : undefined,
        macroNews: macroArticles.length > 0 ? {
          topHeadline: macroArticles[0]?.title || 'Market news',
          articles: macroArticles.slice(0, 5)
        } : undefined
      };
    }

    return null;

  } catch (error) {
    console.error(`Claude news analysis error for ${symbol}:`, error.message);
    return null;
  }
}

function getFallbackNewsAnalysis(symbol: string, stockArticles: NewsArticle[], macroArticles: NewsArticle[]): NewsAnalysisResponse {
  const fallbackRatings = ['bullish', 'neutral', 'bearish'] as const;
  const fallbackRecommendations = ['BUY', 'HOLD', 'SELL'] as const;
  
  const index = symbol.charCodeAt(0) % 3;
  
  return {
    symbol,
    overview: `News analysis for ${symbol} requires Claude API configuration. Found ${stockArticles.length} company articles and ${macroArticles.length} market articles. Configure CLAUDE_API_KEY for AI-powered sentiment analysis.`,
    recommendation: fallbackRecommendations[index],
    confidence: 50,
    keyFactors: [
      `${stockArticles.length} company news articles available`,
      `${macroArticles.length} market news articles available`,
      'AI analysis requires API configuration'
    ],
    riskLevel: 'MEDIUM',
    timeHorizon: '3-6 months',
    source: 'fallback_news_analysis',
    timestamp: new Date().toISOString(),
    stockNews: stockArticles.length > 0 ? {
      headline: stockArticles[0]?.title || 'No specific news',
      source: 'serpapi_google_news',
      articles: stockArticles.slice(0, 10)
    } : undefined,
    macroNews: macroArticles.length > 0 ? {
      topHeadline: macroArticles[0]?.title || 'Market news',
      articles: macroArticles.slice(0, 5)
    } : undefined
  };
}

function getMockNewsAnalysis(symbol: string): NewsAnalysisResponse {
  const mockStockNews: Record<string, string> = {
    AAPL: 'Apple reports strong quarterly earnings with Services growth',
    TSLA: 'Tesla expands charging network amid EV competition',
    NVDA: 'NVIDIA sees continued AI chip demand growth',
    GOOGL: 'Google Cloud revenue acceleration continues',
    MSFT: 'Microsoft Azure gains market share in cloud computing'
  };

  return {
    symbol,
    overview: `Mock analysis for ${symbol} - SerpAPI key not configured. Using fallback news data for demonstration purposes.`,
    recommendation: 'HOLD',
    confidence: 50,
    keyFactors: [
      'SerpAPI configuration required',
      'Mock news data active',
      'Limited analysis available'
    ],
    riskLevel: 'MEDIUM',
    timeHorizon: '3-6 months',
    source: 'mock_news_analysis',
    timestamp: new Date().toISOString(),
    stockNews: {
      headline: mockStockNews[symbol] || `${symbol} company updates`,
      source: 'mock_data',
      articles: [{
        title: mockStockNews[symbol] || `${symbol} company updates`,
        link: 'https://example.com/mock-news',
        snippet: 'Mock news content for demonstration',
        date: new Date().toISOString(),
        source: 'MockNews'
      }]
    },
    macroNews: {
      topHeadline: 'Markets show mixed signals amid economic uncertainty',
      articles: [{
        title: 'Markets show mixed signals amid economic uncertainty',
        link: 'https://example.com/mock-macro',
        snippet: 'Economic indicators suggest cautious optimism',
        date: new Date().toISOString(),
        source: 'MockNews'
      }]
    }
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  try {
    const { symbol } = await req.json();

    if (!symbol) {
      return new Response(JSON.stringify({ error: 'Symbol parameter is required' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    const upperSymbol = symbol.toUpperCase();
    
    if (!validateSymbol(upperSymbol)) {
      return new Response(JSON.stringify({ error: `Invalid stock symbol: ${symbol}` }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    const serpApiKey = Deno.env.get('SERPAPI_API_KEY');
    
    if (!serpApiKey) {
      console.warn('SerpAPI key not configured, using mock data');
      const mockAnalysis = getMockNewsAnalysis(upperSymbol);
      
      return new Response(JSON.stringify(mockAnalysis), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Fetch news data in parallel
    console.log(`Fetching news data for ${upperSymbol}`);
    const [stockArticles, macroArticles] = await Promise.allSettled([
      fetchStockNews(upperSymbol, serpApiKey),
      fetchMacroNews(serpApiKey)
    ]);

    const stockNews = stockArticles.status === 'fulfilled' ? stockArticles.value : [];
    const macroNews = macroArticles.status === 'fulfilled' ? macroArticles.value : [];

    console.log(`Found ${stockNews.length} stock articles and ${macroNews.length} macro articles`);

    // Try Claude analysis first
    const claudeApiKey = Deno.env.get('CLAUDE_API_KEY');
    if (claudeApiKey) {
      const claudeAnalysis = await generateClaudeNewsAnalysis(upperSymbol, stockNews, macroNews, claudeApiKey);
      if (claudeAnalysis) {
        console.log(`Generated Claude news analysis for ${upperSymbol}`);
        return new Response(JSON.stringify(claudeAnalysis), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    }

    // Fallback analysis with real news data
    console.warn(`Claude API not available for ${upperSymbol}, using fallback analysis with real news data`);
    const fallbackAnalysis = getFallbackNewsAnalysis(upperSymbol, stockNews, macroNews);
    
    return new Response(JSON.stringify(fallbackAnalysis), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('News analysis function error:', error.message);
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
});
