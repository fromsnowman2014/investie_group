// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { trackApiCall } from '../_shared/api-usage-tracker.ts';

interface AIAnalysisResponse {
  rating: 'bullish' | 'neutral' | 'bearish';
  confidence: number;
  summary: string;
  keyFactors: string[];
  recommendation: 'BUY' | 'HOLD' | 'SELL';
  analysisDate: string;
}

const VALID_SYMBOLS = [
  'AAPL', 'TSLA', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 
  'META', 'NFLX', 'AVGO', 'AMD', 'JPM', 'BAC', 
  'JNJ', 'PFE', 'SPY', 'QQQ', 'VTI'
];

function validateSymbol(symbol: string): boolean {
  return VALID_SYMBOLS.includes(symbol.toUpperCase());
}

async function generateClaudeAnalysis(symbol: string, claudeApiKey: string): Promise<AIAnalysisResponse | null> {
  try {
    const prompt = `As a senior investment analyst, provide a comprehensive evaluation of ${symbol} stock.
    Consider recent market conditions, company fundamentals, industry trends, and macroeconomic factors.
    Rate the stock as bullish, neutral, or bearish with a confidence level (0-100).
    Provide specific key factors that support your analysis.
    Give a clear BUY/HOLD/SELL recommendation based on current conditions.`;

    const data = await trackApiCall(
      'anthropic',
      'https://api.anthropic.com/v1/messages',
      'ai-analysis',
      async () => {
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
              content: `${prompt}\n\nRespond with valid JSON matching this schema:
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
          throw new Error(`Claude API error: ${response.status}`);
        }

        return await response.json();
      },
      {
        indicatorType: 'ai_analysis',
        apiKey: claudeApiKey
      }
    );
    const content = data.content?.[0]?.text;
    
    if (!content) {
      console.warn('No content returned from Claude API');
      return null;
    }

    // Extract JSON from response (handles Claude's text wrapping)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const analysisData = JSON.parse(jsonMatch[0]);
      return {
        ...analysisData,
        analysisDate: new Date().toISOString()
      };
    }

    // Try parsing the entire response as JSON
    const analysisData = JSON.parse(content);
    return {
      ...analysisData,
      analysisDate: new Date().toISOString()
    };

  } catch (error) {
    console.error(`Claude API error for ${symbol}:`, error.message);
    return null;
  }
}

async function generateOpenAIAnalysis(symbol: string, openaiApiKey: string): Promise<AIAnalysisResponse | null> {
  try {
    const prompt = `As a senior investment analyst, analyze ${symbol} stock. Rate as bullish/neutral/bearish with confidence (0-100). Provide 2-3 sentence summary, key factors, and BUY/HOLD/SELL recommendation. Respond in JSON format with fields: rating, confidence, summary, keyFactors (array), recommendation.`;

    const data = await trackApiCall(
      'openai',
      'https://api.openai.com/v1/chat/completions',
      'ai-analysis',
      async () => {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiApiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [{
              role: 'user',
              content: prompt
            }],
            max_tokens: 500
          })
        });

        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.status}`);
        }

        return await response.json();
      },
      {
        indicatorType: 'ai_analysis',
        apiKey: openaiApiKey
      }
    );
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      console.warn('No content returned from OpenAI API');
      return null;
    }

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const analysisData = JSON.parse(jsonMatch[0]);
      return {
        ...analysisData,
        analysisDate: new Date().toISOString()
      };
    }

    return null;

  } catch (error) {
    console.error(`OpenAI API error for ${symbol}:`, error.message);
    return null;
  }
}

function getFallbackAnalysis(symbol: string): AIAnalysisResponse {
  const fallbackRatings = ['bullish', 'neutral', 'bearish'] as const;
  const fallbackRecommendations = ['BUY', 'HOLD', 'SELL'] as const;
  
  // Simple deterministic fallback based on symbol
  const index = symbol.charCodeAt(0) % 3;
  
  return {
    rating: fallbackRatings[index],
    confidence: 50,
    summary: `Analysis for ${symbol} requires Claude API configuration. Current market conditions suggest moderate volatility. Please configure CLAUDE_API_KEY for real-time AI insights.`,
    keyFactors: [
      'API Configuration Required',
      'Mock Analysis Active', 
      'Limited Data Available'
    ],
    recommendation: fallbackRecommendations[index],
    analysisDate: new Date().toISOString()
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

    // Try Claude API first
    const claudeApiKey = Deno.env.get('CLAUDE_API_KEY');
    console.log('🔑 Claude API Key status:', claudeApiKey ? 'FOUND' : 'NOT FOUND');
    console.log('🔑 Available env vars:', Object.keys(Deno.env.toObject()));
    
    if (claudeApiKey) {
      const claudeAnalysis = await generateClaudeAnalysis(upperSymbol, claudeApiKey);
      if (claudeAnalysis) {
        console.log(`Generated Claude AI analysis for ${upperSymbol}`);
        return new Response(JSON.stringify(claudeAnalysis), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    }

    // Fallback to OpenAI if Claude fails
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (openaiApiKey) {
      const openaiAnalysis = await generateOpenAIAnalysis(upperSymbol, openaiApiKey);
      if (openaiAnalysis) {
        console.log(`Generated OpenAI analysis for ${upperSymbol} (Claude fallback)`);
        return new Response(JSON.stringify(openaiAnalysis), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    }

    // Final fallback to mock analysis
    console.warn(`AI APIs not available for ${upperSymbol}, using fallback analysis`);
    const fallbackAnalysis = getFallbackAnalysis(upperSymbol);
    
    return new Response(JSON.stringify(fallbackAnalysis), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('AI analysis function error:', error.message);
    
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
