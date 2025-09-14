// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

Deno.serve(async (req) => {
  // CORS Headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE'
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers });
  }

  try {
    const alphaVantageApiKey = Deno.env.get('ALPHA_VANTAGE_API_KEY');
    
    console.log('🔑 API Key check:');
    console.log(`  Length: ${alphaVantageApiKey?.length || 0}`);
    console.log(`  First 4 chars: ${alphaVantageApiKey?.substring(0, 4) || 'NONE'}`);
    console.log(`  Env vars available: ${Object.keys(Deno.env.toObject()).length}`);
    
    if (!alphaVantageApiKey) {
      return new Response(JSON.stringify({
        error: 'API key not found',
        envVars: Object.keys(Deno.env.toObject())
      }), { headers });
    }

    console.log('🔍 Testing Alpha Vantage API call...');
    
    const testUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=SPY&apikey=${alphaVantageApiKey}`;
    console.log(`🔗 Calling: ${testUrl.replace(alphaVantageApiKey, 'HIDDEN_KEY')}`);
    
    const response = await fetch(testUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(15000)
    });
    
    console.log(`📡 Response: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      return new Response(JSON.stringify({
        error: 'API call failed',
        status: response.status,
        statusText: response.statusText
      }), { headers });
    }
    
    const data = await response.json();
    console.log('📦 Response data keys:', Object.keys(data));
    
    return new Response(JSON.stringify({
      success: true,
      apiKeyLength: alphaVantageApiKey.length,
      responseStatus: response.status,
      dataKeys: Object.keys(data),
      globalQuote: data['Global Quote'] || null,
      rawData: data
    }), { headers });
    
  } catch (error) {
    console.error('❌ Test function error:', error.message);
    return new Response(JSON.stringify({
      error: error.message,
      stack: error.stack
    }), { headers });
  }
});