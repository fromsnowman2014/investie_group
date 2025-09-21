// Debug Environment Variables
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

Deno.serve(async (req) => {
  const debug = {
    DISABLE_API_TRACKING: Deno.env.get('DISABLE_API_TRACKING'),
    SUPABASE_URL: Deno.env.get('SUPABASE_URL'),
    SERVICE_ROLE_KEY_EXISTS: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
    ALPHA_VANTAGE_API_KEY_EXISTS: !!Deno.env.get('ALPHA_VANTAGE_API_KEY'),
  };

  return new Response(JSON.stringify(debug, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
});