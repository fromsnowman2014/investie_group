/**
 * Emergency Environment Variable Fix
 * Handles specific missing variables while maintaining existing working ones
 */

// Only define fallbacks for the confirmed missing variables
const EMERGENCY_FALLBACKS = {
  // These are confirmed missing from Vercel
  NEXT_PUBLIC_SUPABASE_URL: 'https://fwnmnjwtbggasmunsfyk.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3bm1uand0YmdnYXNtdW5zZnlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQxMTQ0OTcsImV4cCI6MjAzOTY5MDQ5N30.p5f3VIWgz6b2kKgQ4OydRhqf7oEfWvTiP6KSUmhQBT8',
  // Don't fallback FUNCTIONS_URL since it's working from Vercel
} as const;

/**
 * Get environment variable with selective fallback
 * Only provides fallback for confirmed missing variables
 */
function getEnvWithSelectiveFallback(key: keyof typeof EMERGENCY_FALLBACKS): string {
  const envValue = typeof process !== 'undefined' ? process.env[key] : undefined;
  
  if (envValue) {
    console.log(`✅ ${key}: Using Vercel environment variable`);
    return envValue;
  }
  
  const fallbackValue = EMERGENCY_FALLBACKS[key];
  console.warn(`⚠️ ${key}: Missing from Vercel, using emergency fallback`);
  return fallbackValue;
}

/**
 * Get Supabase URL with intelligent fallback
 */
export function getSupabaseUrl(): string {
  return getEnvWithSelectiveFallback('NEXT_PUBLIC_SUPABASE_URL');
}

/**
 * Get Supabase Anon Key with intelligent fallback
 */
export function getSupabaseAnonKey(): string {
  return getEnvWithSelectiveFallback('NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

/**
 * Get Supabase Functions URL (this one works from Vercel)
 */
export function getSupabaseFunctionsUrl(): string {
  const envValue = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL : undefined;
  
  if (envValue) {
    console.log('✅ NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL: Using Vercel environment variable');
    return envValue;
  }
  
  // This should not happen based on logs, but provide fallback just in case
  console.warn('⚠️ NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL: Unexpected missing, using fallback');
  return 'https://fwnmnjwtbggasmunsfyk.supabase.co/functions/v1';
}

/**
 * Get complete Supabase configuration
 */
export function getSupabaseConfig() {
  const config = {
    url: getSupabaseUrl(),
    anonKey: getSupabaseAnonKey(),
    functionsUrl: getSupabaseFunctionsUrl()
  };
  
  console.group('🔧 Supabase Configuration');
  console.log('URL source:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Vercel' : 'Fallback');
  console.log('Anon Key source:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Vercel' : 'Fallback');
  console.log('Functions URL source:', process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL ? 'Vercel' : 'Fallback');
  console.groupEnd();
  
  return config;
}

/**
 * Check which variables are using fallbacks
 */
export function getEnvironmentStatus() {
  const status = {
    supabaseUrl: {
      hasEnvVar: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      source: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'vercel' : 'fallback'
    },
    supabaseAnonKey: {
      hasEnvVar: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      source: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'vercel' : 'fallback'
    },
    supabaseFunctionsUrl: {
      hasEnvVar: !!process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL,
      source: process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL ? 'vercel' : 'fallback'
    }
  };
  
  const fallbackCount = Object.values(status).filter(s => s.source === 'fallback').length;
  
  return {
    ...status,
    fallbackCount,
    isFullyConfigured: fallbackCount === 0,
    needsVercelFix: fallbackCount > 0
  };
}
