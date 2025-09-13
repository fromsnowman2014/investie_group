/**
 * Environment Variable Fallback System
 * Handles cases where Vercel env vars are scoped to specific branches/environments
 */

// Hardcoded fallbacks for when Vercel env vars are not accessible
const ENV_FALLBACKS = {
  SUPABASE_URL: 'https://fwnmnjwtbggasmunsfyk.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3bm1uand0YmdnYXNtdW5zZnlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQxMTQ0OTcsImV4cCI6MjAzOTY5MDQ5N30.p5f3VIWgz6b2kKgQ4OydRhqf7oEfWvTiP6KSUmhQBT8',
  SUPABASE_FUNCTIONS_URL: 'https://fwnmnjwtbggasmunsfyk.supabase.co/functions/v1',
  API_URL: 'https://investiegroup-production.up.railway.app'
} as const;

interface EnvironmentConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseFunctionsUrl: string;
  apiUrl: string;
  source: 'environment' | 'fallback' | 'mixed';
  debug: {
    processAvailable: boolean;
    envAvailable: boolean;
    nextPublicCount: number;
    missingVars: string[];
  };
}

/**
 * Get environment variables with intelligent fallback
 * Prioritizes Vercel env vars, falls back to hardcoded values
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  const processAvailable = typeof process !== 'undefined';
  const envAvailable = processAvailable && !!process.env;
  
  // Track which variables are missing from environment
  const missingVars: string[] = [];
  
  // Get environment variables with fallbacks
  const supabaseUrl = envAvailable ? process.env.NEXT_PUBLIC_SUPABASE_URL : undefined;
  const supabaseAnonKey = envAvailable ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY : undefined;
  const supabaseFunctionsUrl = envAvailable ? process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL : undefined;
  const apiUrl = envAvailable ? process.env.NEXT_PUBLIC_API_URL : undefined;
  
  // Track missing variables
  if (!supabaseUrl) missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!supabaseAnonKey) missingVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  if (!supabaseFunctionsUrl) missingVars.push('NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL');
  if (!apiUrl) missingVars.push('NEXT_PUBLIC_API_URL');
  
  // Determine source type
  let source: 'environment' | 'fallback' | 'mixed';
  if (missingVars.length === 0) {
    source = 'environment';
  } else if (missingVars.length === 4) {
    source = 'fallback';
  } else {
    source = 'mixed';
  }
  
  // Count NEXT_PUBLIC_ variables
  const nextPublicCount = envAvailable ? 
    Object.keys(process.env).filter(k => k.startsWith('NEXT_PUBLIC_')).length : 0;
  
  const config: EnvironmentConfig = {
    supabaseUrl: supabaseUrl || ENV_FALLBACKS.SUPABASE_URL,
    supabaseAnonKey: supabaseAnonKey || ENV_FALLBACKS.SUPABASE_ANON_KEY,
    supabaseFunctionsUrl: supabaseFunctionsUrl || ENV_FALLBACKS.SUPABASE_FUNCTIONS_URL,
    apiUrl: apiUrl || ENV_FALLBACKS.API_URL,
    source,
    debug: {
      processAvailable,
      envAvailable,
      nextPublicCount,
      missingVars
    }
  };
  
  // Enhanced debugging
  console.group('🔧 Environment Config Debug');
  console.log('Source:', source);
  console.log('Missing vars:', missingVars);
  console.log('NEXT_PUBLIC_ count:', nextPublicCount);
  console.log('Final config:', {
    supabaseUrl: config.supabaseUrl,
    supabaseAnonKey: config.supabaseAnonKey ? `${config.supabaseAnonKey.substring(0, 20)}...` : 'MISSING',
    supabaseFunctionsUrl: config.supabaseFunctionsUrl,
    apiUrl: config.apiUrl
  });
  console.groupEnd();
  
  return config;
}

/**
 * Get Supabase client configuration
 */
export function getSupabaseConfig() {
  const config = getEnvironmentConfig();
  return {
    url: config.supabaseUrl,
    anonKey: config.supabaseAnonKey
  };
}

/**
 * Get API base URL with fallback
 */
export function getApiUrl(): string {
  const config = getEnvironmentConfig();
  return config.apiUrl;
}

/**
 * Get Supabase Functions URL with fallback
 */
export function getSupabaseFunctionsUrl(): string {
  const config = getEnvironmentConfig();
  return config.supabaseFunctionsUrl;
}

/**
 * Check if we're using fallback values (indicates env var scoping issue)
 */
export function isUsingFallbacks(): boolean {
  const config = getEnvironmentConfig();
  return config.source === 'fallback' || config.source === 'mixed';
}

/**
 * Get debug information for troubleshooting
 */
export function getEnvironmentDebugInfo() {
  const config = getEnvironmentConfig();
  return {
    ...config.debug,
    source: config.source,
    usingFallbacks: isUsingFallbacks()
  };
}
