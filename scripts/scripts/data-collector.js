#!/usr/bin/env node

/**
 * Stock Data Collector Script
 * Purpose: Fetch data from external APIs and store in Supabase database
 * Schedule: Run 2x daily (9 AM, 4 PM EST)
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://fwnmnjwtbggasmunsfyk.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY; // Use service role key for write access
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY || '***REMOVED***';
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || '***REMOVED***';

// Stock symbols to track
const STOCK_SYMBOLS = ['AAPL', 'TSLA', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'NFLX'];

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Fetch stock data from Alpha Vantage API
 */
async function fetchStockData(symbol) {
  try {
    console.log(`📊 Fetching stock data for ${symbol}...`);
    
    // Get quote data
    const quoteUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    const quoteResponse = await fetch(quoteUrl);
    const quoteData = await quoteResponse.json();
    
    const quote = quoteData['Global Quote'];
    if (!quote) {
      console.warn(`⚠️ No quote data for ${symbol}`);
      return null;
    }

    // Get overview data
    const overviewUrl = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    const overviewResponse = await fetch(overviewUrl);
    const overview = await overviewResponse.json();

    if (!overview.Symbol) {
      console.warn(`⚠️ No overview data for ${symbol}`);
      return null;
    }

    // Parse and format data
    const stockData = {
      symbol: symbol,
      price: parseFloat(quote['05. price']) || 0,
      change_amount: parseFloat(quote['09. change']) || 0,
      change_percent: parseFloat(quote['10. change percent'].replace('%', '')) || 0,
      market_cap: parseMarketCap(overview.MarketCapitalization) || null,
      volume: parseInt(quote['06. volume']) || null,
      pe_ratio: parseFloat(overview.PERatio) || null,
      fifty_two_week_high: parseFloat(overview['52WeekHigh']) || null,
      fifty_two_week_low: parseFloat(overview['52WeekLow']) || null,
      data_source: 'alpha_vantage'
    };

    console.log(`✅ Stock data collected for ${symbol}: $${stockData.price}`);
    return stockData;

  } catch (error) {
    console.error(`❌ Error fetching stock data for ${symbol}:`, error.message);
    return null;
  }
}

/**
 * Parse market cap string to number
 */
function parseMarketCap(marketCapString) {
  if (!marketCapString || marketCapString === 'None') return null;

  const cleanString = marketCapString.replace(/[^0-9.]/g, '');
  const value = parseFloat(cleanString);

  if (marketCapString.includes('T')) {
    return value * 1e12;
  } else if (marketCapString.includes('B')) {
    return value * 1e9;
  } else if (marketCapString.includes('M')) {
    return value * 1e6;
  }

  return value;
}

/**
 * Fetch AI analysis from Claude API
 */
async function fetchAIAnalysis(symbol) {
  try {
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
        'x-api-key': CLAUDE_API_KEY,
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
      console.warn(`⚠️ Claude API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const content = data.content?.[0]?.text;
    
    if (!content) {
      console.warn('⚠️ No content returned from Claude API');
      return null;
    }

    // Extract JSON from response
    const jsonMatch = content.match(/\\{[\\s\\S]*\\}/);
    if (jsonMatch) {
      const analysisData = JSON.parse(jsonMatch[0]);
      
      const aiAnalysis = {
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
    console.error(`❌ Error generating AI analysis for ${symbol}:`, error.message);
    return null;
  }
}

/**
 * Save data to Supabase database
 */
async function saveToDatabase(table, data) {
  try {
    const { error } = await supabase
      .from(table)
      .insert(data);

    if (error) {
      console.error(`❌ Database insert error for ${table}:`, error.message);
      return false;
    }

    console.log(`✅ Data saved to ${table} table`);
    return true;

  } catch (error) {
    console.error(`❌ Database save error for ${table}:`, error.message);
    return false;
  }
}

/**
 * Main data collection function
 */
async function collectData() {
  console.log('🚀 Starting data collection...', new Date().toISOString());

  let successCount = 0;
  let errorCount = 0;

  for (const symbol of STOCK_SYMBOLS) {
    try {
      // Fetch stock data
      const stockData = await fetchStockData(symbol);
      if (stockData) {
        await saveToDatabase('stock_data', stockData);
        successCount++;
      } else {
        errorCount++;
      }

      // Fetch AI analysis
      const aiAnalysis = await fetchAIAnalysis(symbol);
      if (aiAnalysis) {
        await saveToDatabase('ai_analysis', aiAnalysis);
      }

      // Rate limiting - wait 2 seconds between API calls
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      console.error(`❌ Error processing ${symbol}:`, error.message);
      errorCount++;
    }
  }

  console.log(`🎯 Data collection completed: ${successCount} success, ${errorCount} errors`);
}

/**
 * Health check function
 */
async function healthCheck() {
  try {
    // Test Supabase connection
    const { data, error } = await supabase
      .from('stock_data')
      .select('id')
      .limit(1);

    if (error) {
      console.error('❌ Supabase health check failed:', error.message);
      return false;
    }

    console.log('✅ Supabase connection healthy');
    return true;

  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return false;
  }
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'health') {
    healthCheck().then(success => {
      process.exit(success ? 0 : 1);
    });
  } else if (command === 'collect' || !command) {
    // Check if required environment variables are set
    if (!SUPABASE_SERVICE_KEY) {
      console.error('❌ SUPABASE_SERVICE_KEY environment variable is required');
      process.exit(1);
    }

    collectData().then(() => {
      console.log('✅ Data collection script completed');
      process.exit(0);
    }).catch(error => {
      console.error('❌ Data collection failed:', error);
      process.exit(1);
    });
  } else {
    console.log(`Usage: node data-collector.js [collect|health]`);
    process.exit(1);
  }
}

module.exports = {
  collectData,
  healthCheck,
  fetchStockData,
  fetchAIAnalysis
};