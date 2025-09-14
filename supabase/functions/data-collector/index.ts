// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

interface StockDataRecord {
  symbol: string;
  price: number;
  change_amount: number;
  change_percent: number;
  market_cap?: number;
  volume?: number;
  pe_ratio?: number;
  fifty_two_week_high?: number;
  fifty_two_week_low?: number;
  data_source: string;
}

interface AIAnalysisRecord {
  symbol: string;
  rating: 'bullish' | 'neutral' | 'bearish';
  confidence: number;
  recommendation: 'BUY' | 'HOLD' | 'SELL';
  summary: string;
  key_factors: string[];
  analysis_date: string;
  ai_source: string;
}

const VALID_SYMBOLS = [
  'AAPL', 'TSLA', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 
  'META', 'NFLX', 'AVGO', 'AMD', 'JPM', 'BAC'
];

// Initialize Supabase client with service role key
const supabaseUrl = 'https://fwnmnjwtbggasmunsfyk.supabase.co'
const supabaseServiceKey = Deno.env.get('SERVICE_ROLE_KEY') || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fetchStockDataFromAlphaVantage(symbol: string): Promise<StockDataRecord | null> {
  try {
    const apiKey = Deno.env.get('ALPHA_VANTAGE_API_KEY');
    if (!apiKey) {
      console.warn('Alpha Vantage API key not found');
      return null;
    }

    console.log(`📊 Fetching Alpha Vantage data for ${symbol}...`);

    // Fetch quote data
    const quoteUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
    const quoteResponse = await fetch(quoteUrl);
    
    if (!quoteResponse.ok) {
      console.error(`Alpha Vantage quote API error: ${quoteResponse.status}`);
      return null;
    }

    const quoteData = await quoteResponse.json();
    const quote = quoteData['Global Quote'];

    if (!quote || Object.keys(quote).length === 0) {
      console.warn(`No quote data returned for ${symbol}`);
      return null;
    }

    // Fetch overview data 
    const overviewUrl = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${apiKey}`;
    const overviewResponse = await fetch(overviewUrl);
    
    if (!overviewResponse.ok) {
      console.error(`Alpha Vantage overview API error: ${overviewResponse.status}`);
      return null;
    }

    const overview = await overviewResponse.json();

    if (!overview.Symbol) {
      console.warn(`No overview data returned for ${symbol}`);
      return null;
    }

    // Parse market cap
    const parseMarketCap = (marketCapString: string): number | null => {
      if (!marketCapString || marketCapString === 'None') return null;
      const cleanString = marketCapString.replace(/[^0-9.]/g, '');
      const value = parseFloat(cleanString);
      if (marketCapString.includes('T')) return value * 1e12;
      if (marketCapString.includes('B')) return value * 1e9;
      if (marketCapString.includes('M')) return value * 1e6;
      return value;
    };

    const stockData: StockDataRecord = {
      symbol: symbol,
      price: parseFloat(quote['05. price']) || 0,
      change_amount: parseFloat(quote['09. change']) || 0,
      change_percent: parseFloat(quote['10. change percent'].replace('%', '')) || 0,
      market_cap: parseMarketCap(overview.MarketCapitalization),
      volume: parseInt(quote['06. volume']) || null,
      pe_ratio: parseFloat(overview.PERatio) || null,
      fifty_two_week_high: parseFloat(overview['52WeekHigh']) || null,
      fifty_two_week_low: parseFloat(overview['52WeekLow']) || null,
      data_source: 'alpha_vantage'
    };

    console.log(`✅ Stock data fetched for ${symbol}: $${stockData.price}`);
    return stockData;

  } catch (error) {
    console.error(`Error fetching stock data for ${symbol}:`, error.message);
    return null;
  }
}

async function generateAIAnalysisWithClaude(symbol: string): Promise<AIAnalysisRecord | null> {
  try {
    const claudeApiKey = Deno.env.get('CLAUDE_API_KEY');
    if (!claudeApiKey) {
      console.warn('Claude API key not found');
      return null;
    }

    console.log(`🤖 Generating AI analysis for ${symbol}...`);

    const prompt = `As a senior investment analyst, provide a comprehensive evaluation of ${symbol} stock. 
    Consider recent market conditions, company fundamentals, industry trends, and macroeconomic factors.
    Rate the stock as bullish, neutral, or bearish with a confidence level (0-100).
    Provide specific key factors that support your analysis.
    Give a clear BUY/HOLD/SELL recommendation based on current conditions.`;

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
          content: `${prompt}\\n\\nRespond with valid JSON matching this schema:
          {
            "rating": "bullish|neutral|bearish",
            "confidence": 85,
            "summary": "2-3 sentence analysis",
            "keyFactors": ["factor1", "factor2", "factor3"],
            "recommendation": "BUY|HOLD|SELL"
          }`
        }]
      })
    });

    if (!response.ok) {
      console.error(`Claude API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const content = data.content?.[0]?.text;
    
    if (!content) {
      console.warn('No content returned from Claude API');
      return null;
    }

    // Extract JSON from response
    const jsonMatch = content.match(/\\{[\\s\\S]*\\}/);
    if (jsonMatch) {
      const analysisData = JSON.parse(jsonMatch[0]);
      
      const aiAnalysis: AIAnalysisRecord = {
        symbol: symbol,
        rating: analysisData.rating,
        confidence: analysisData.confidence,
        recommendation: analysisData.recommendation,
        summary: analysisData.summary,
        key_factors: analysisData.keyFactors,
        analysis_date: new Date().toISOString(),
        ai_source: 'claude'
      };

      console.log(`✅ AI analysis generated for ${symbol}: ${aiAnalysis.rating} (${aiAnalysis.confidence}%)`);
      return aiAnalysis;
    }

    return null;

  } catch (error) {
    console.error(`Error generating AI analysis for ${symbol}:`, error.message);
    return null;
  }
}

async function saveStockDataToDatabase(stockData: StockDataRecord): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('stock_data')
      .insert(stockData);

    if (error) {
      console.error(`Database insert error for stock_data:`, error.message);
      return false;
    }

    console.log(`✅ Stock data saved to database: ${stockData.symbol}`);
    return true;

  } catch (error) {
    console.error(`Database save error for stock_data:`, error.message);
    return false;
  }
}

async function saveAIAnalysisToDatabase(aiAnalysis: AIAnalysisRecord): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('ai_analysis')
      .insert(aiAnalysis);

    if (error) {
      console.error(`Database insert error for ai_analysis:`, error.message);
      return false;
    }

    console.log(`✅ AI analysis saved to database: ${aiAnalysis.symbol}`);
    return true;

  } catch (error) {
    console.error(`Database save error for ai_analysis:`, error.message);
    return false;
  }
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
    const { action, symbols } = await req.json();

    if (action === 'collect') {
      const symbolList = symbols || VALID_SYMBOLS.slice(0, 2); // Limit to 2 for testing
      const results = [];

      console.log(`🚀 Starting data collection for symbols: ${symbolList.join(', ')}`);

      for (const symbol of symbolList) {
        console.log(`🔄 Processing ${symbol}...`);
        
        // Fetch and save stock data
        const stockData = await fetchStockDataFromAlphaVantage(symbol);
        if (stockData) {
          await saveStockDataToDatabase(stockData);
          results.push({ symbol, stockData: true });
        } else {
          results.push({ symbol, stockData: false });
        }

        // Fetch and save AI analysis
        const aiAnalysis = await generateAIAnalysisWithClaude(symbol);
        if (aiAnalysis) {
          await saveAIAnalysisToDatabase(aiAnalysis);
          results[results.length - 1].aiAnalysis = true;
        } else {
          results[results.length - 1].aiAnalysis = false;
        }

        // Rate limiting - 3 second delay between symbols
        if (symbolList.indexOf(symbol) < symbolList.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }

      const summary = {
        timestamp: new Date().toISOString(),
        processed: symbolList.length,
        successful: results.filter(r => r.stockData).length,
        results: results
      };

      console.log(`✅ Data collection completed: ${summary.successful}/${summary.processed} successful`);

      return new Response(JSON.stringify(summary), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });

    } else if (action === 'health') {
      // Health check
      console.log(`🔑 Service Role Key status: ${supabaseServiceKey ? 'FOUND' : 'NOT FOUND'}`);
      
      const { data, error } = await supabase
        .from('stock_data')
        .select('id')
        .limit(1);

      if (error) {
        console.error('Database health check failed:', error.message);
        return new Response(JSON.stringify({ 
          status: 'error', 
          message: error.message 
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

      return new Response(JSON.stringify({ 
        status: 'healthy', 
        database: 'connected',
        timestamp: new Date().toISOString()
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });

    } else {
      return new Response(JSON.stringify({ error: 'Invalid action. Use "collect" or "health"' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

  } catch (error) {
    console.error('Data collector function error:', error.message);
    
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
