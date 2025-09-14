// Emergency Environment Variable Recovery System
// This provides hardcoded fallbacks when Vercel environment loading completely fails

interface EmergencyConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseFunctionsUrl: string;
  apiUrl: string;
  isEmergencyMode: boolean;
}

// Hardcoded production values as emergency fallback
const EMERGENCY_CONFIG: EmergencyConfig = {
  supabaseUrl: 'https://fwnmnjwtbggasmunsfyk.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3bm1uand0YmdnYXNtdW5zZnlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQxMTQ0OTcsImV4cCI6MjAzOTY5MDQ5N30.p5f3VIWgz6b2kKgQ4OydRhqf7oEfWvTiP6KSUmhQBT8',
  supabaseFunctionsUrl: 'https://fwnmnjwtbggasmunsfyk.supabase.co/functions/v1',
  apiUrl: 'https://investiegroup-production.up.railway.app',
  isEmergencyMode: true
};

export function getEmergencyConfig(): EmergencyConfig {
  const hasAnyEnvVars = typeof window !== 'undefined' ? 
    Object.keys(process.env).filter(k => k.startsWith('NEXT_PUBLIC_')).length > 0 :
    true; // On server side, assume env vars might be available
    
  // If we have environment variables, try to use them
  if (hasAnyEnvVars && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || EMERGENCY_CONFIG.supabaseAnonKey,
      supabaseFunctionsUrl: process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL || EMERGENCY_CONFIG.supabaseFunctionsUrl,
      apiUrl: process.env.NEXT_PUBLIC_API_URL || EMERGENCY_CONFIG.apiUrl,
      isEmergencyMode: false
    };
  }
  
  // Emergency mode: use hardcoded values
  console.warn('🚨 EMERGENCY MODE: Using hardcoded configuration');
  console.warn('This indicates complete environment variable loading failure');
  
  return EMERGENCY_CONFIG;
}

export function isInEmergencyMode(): boolean {
  const config = getEmergencyConfig();
  return config.isEmergencyMode;
}

export function getSupabaseUrl(): string {
  return getEmergencyConfig().supabaseUrl;
}

export function getSupabaseAnonKey(): string {
  return getEmergencyConfig().supabaseAnonKey;
}

export function getSupabaseFunctionsUrl(): string {
  return getEmergencyConfig().supabaseFunctionsUrl;
}

export function getApiUrl(): string {
  return getEmergencyConfig().apiUrl;
}

// Emergency diagnostic function
export function diagnoseEnvironmentIssue(): string {
  const allEnvVars = Object.keys(process.env);
  const nextPublicVars = allEnvVars.filter(k => k.startsWith('NEXT_PUBLIC_'));
  const vercelVars = nextPublicVars.filter(k => k.includes('VERCEL'));
  
  if (nextPublicVars.length === 0) {
    return 'CRITICAL: Complete environment variable loading failure. No NEXT_PUBLIC_ variables found.';
  } else if (vercelVars.length > 0 && nextPublicVars.length < 5) {
    return 'PARTIAL: Some Vercel variables loaded but custom variables missing.';
  } else if (nextPublicVars.length > 15) {
    return 'GOOD: Environment variables appear to be loading normally.';
  } else {
    return 'UNKNOWN: Unusual environment variable pattern detected.';
  }
}
