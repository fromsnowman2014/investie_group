// Centralized API utilities for consistent URL handling across all components
import { getApiUrl, getSupabaseFunctionsUrl, getSupabaseAnonKey, isInEmergencyMode, diagnoseEnvironmentIssue } from './emergency-env-recovery';

export interface ApiRequestDebugInfo {
  originalUrl: string;
  baseUrl: string;
  fullUrl: string;
  envApiUrl: string | undefined;
  nodeEnv: string | undefined;
  isClient: boolean;
  currentOrigin: string;
  timestamp: string;
}

export interface ApiResponseDebugInfo {
  status: number;
  statusText: string;
  ok: boolean;
  responseUrl: string;
  requestedUrl: string;
  headers: Record<string, string>;
}

/**
 * Get the correct API base URL based on environment with intelligent fallback
 */
export function getApiBaseUrl(): string {
  // Import the new environment config system
  import('./env-fallback').then(({ getSupabaseFunctionsUrl, getEnvironmentDebugInfo }) => {
    const debugInfo = getEnvironmentDebugInfo();
    
    console.log('🔧 DEBUG: Environment variables check (Enhanced)');
    console.log('🔧 Process available:', debugInfo.processAvailable);
    console.log('🔧 Env available:', debugInfo.envAvailable);
    console.log('🔧 NEXT_PUBLIC_ count:', debugInfo.nextPublicCount);
    console.log('🔧 Missing vars:', debugInfo.missingVars);
    console.log('🔧 Source:', debugInfo.source);
    console.log('🔧 Using fallbacks:', debugInfo.usingFallbacks);
    
    if (debugInfo.usingFallbacks) {
      console.warn('⚠️ Using fallback configuration due to Vercel env var scoping issue');
      console.warn('💡 This may indicate that environment variables are not properly scoped to this branch/environment');
    }
  }).catch(() => {
    console.log('🔧 Fallback system not available, using direct env access');
  });
  
  // Direct fallback implementation for immediate use
  const supabaseFunctionsUrl = process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL;
  const functionsUrl = supabaseFunctionsUrl || 'https://fwnmnjwtbggasmunsfyk.supabase.co/functions/v1';
  
  console.log('🔧 Final Supabase Functions URL:', functionsUrl);
  
  return functionsUrl;
}

/**
 * Build full URL from relative path
 */
export function buildApiUrl(path: string): string {
  const baseUrl = getApiBaseUrl();
  return path.startsWith('http') ? path : `${baseUrl}${path}`;
}

/**
 * Enhanced fetch wrapper with comprehensive debugging
 */
export async function debugFetch(url: string, options?: RequestInit): Promise<Response> {
  const debugInfo: ApiRequestDebugInfo = {
    originalUrl: url,
    baseUrl: getApiBaseUrl(),
    fullUrl: buildApiUrl(url),
    envApiUrl: process.env.NEXT_PUBLIC_API_URL,
    nodeEnv: process.env.NODE_ENV,
    isClient: typeof window !== 'undefined',
    currentOrigin: typeof window !== 'undefined' ? window.location.origin : 'SSR',
    timestamp: new Date().toISOString()
  };

  // Log request details
  console.group('🌐 API Request Debug');
  console.log('📍 Original URL:', debugInfo.originalUrl);
  console.log('🌍 NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL:', process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL || 'UNDEFINED');
  console.log('🔑 NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING');
  console.log('🏗️ NODE_ENV:', debugInfo.nodeEnv);
  console.log('🖥️ Is Client:', debugInfo.isClient);
  console.log('🌐 Current Origin:', debugInfo.currentOrigin);
  console.log('🎯 Base URL:', debugInfo.baseUrl);
  console.log('🔗 Full URL:', debugInfo.fullUrl);
  console.log('⏰ Timestamp:', debugInfo.timestamp);

  // Critical production check
  if (debugInfo.nodeEnv === 'production' && debugInfo.fullUrl.includes('localhost')) {
    console.error('🚨 CRITICAL: Using localhost in production!');
    console.error('🔧 Check Vercel environment variables');
    console.error('🔧 Expected: Vercel Functions, Got: localhost');
    console.error('🔧 Current Full URL:', debugInfo.fullUrl);
  }

  // Check for missing environment variable (using fallback)
  if (!debugInfo.envApiUrl && debugInfo.nodeEnv === 'production') {
    console.warn('⚠️ Using Vercel domain fallback (NEXT_PUBLIC_API_URL not set)');
    console.warn('🔧 Using Vercel Functions on same domain:', debugInfo.fullUrl);
  }

  console.groupEnd();

  try {
    const response = await fetch(debugInfo.fullUrl, options);

    const responseDebug: ApiResponseDebugInfo = {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      responseUrl: response.url,
      requestedUrl: debugInfo.fullUrl,
      headers: Object.fromEntries(response.headers.entries())
    };

    console.group('📡 API Response Debug');
    console.log('✅ Status:', responseDebug.status, responseDebug.statusText);
    console.log('🔗 Response URL:', responseDebug.responseUrl);
    console.log('🔗 Requested URL:', responseDebug.requestedUrl);
    console.log('📦 Headers:', responseDebug.headers);

    if (!response.ok) {
      console.error('❌ HTTP Error Details:', responseDebug);
      console.groupEnd();
      throw new Error(`API Error: ${response.status} - ${response.statusText} (${debugInfo.fullUrl})`);
    }

    console.groupEnd();
    return response;
  } catch (error) {
    console.group('❌ API Request Error');
    console.error('💥 Fetch Error:', error);
    console.error('🔗 Failed URL:', debugInfo.fullUrl);
    console.error('🎯 Base URL:', debugInfo.baseUrl);
    console.error('🌍 Debug Info:', debugInfo);
    console.groupEnd();
    throw error;
  }
}

/**
 * Simplified fetcher function that returns JSON data
 */
export async function apiFetcher<T = unknown>(url: string): Promise<T> {
  const response = await debugFetch(url);
  return response.json();
}

/**
 * Supabase Edge Function fetcher with proper authentication
 */
export async function edgeFunctionFetcher<T = unknown>(
  functionName: string, 
  payload?: unknown
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  
  // Use emergency fix for missing specific variables
  try {
    const { getSupabaseAnonKey } = await import('./emergency-env-fix');
    const finalAnonKey = getSupabaseAnonKey();
    
    console.log('🔧 Using emergency environment fix for anon key');
  } catch (error) {
    console.log('🔧 Emergency fix not available, using direct fallback');
  }
  
  // Direct fallback for anon key (backup)
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3bm1uand0YmdnYXNtdW5zZnlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQxMTQ0OTcsImV4cCI6MjAzOTY5MDQ5N30.p5f3VIWgz6b2kKgQ4OydRhqf7oEfWvTiP6KSUmhQBT8';
  const finalAnonKey = anonKey;
  
  const url = `${baseUrl}/${functionName}`;
  const options: RequestInit = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${finalAnonKey}`,
    },
    body: payload ? JSON.stringify(payload) : undefined,
  };
  
  console.group('🚀 Supabase Edge Function Call');
  console.log('📍 Function:', functionName);
  console.log('🌍 Base URL:', baseUrl);
  console.log('🔗 Full URL:', url);
  console.log('📦 Payload:', payload);
  console.log('🔑 Anon Key from env:', anonKey ? 'SET' : 'MISSING');
  console.log('🔑 Using hardcoded key:', !anonKey ? 'YES' : 'NO');
  console.log('🔑 Final Auth Key:', !!finalAnonKey);
  console.groupEnd();
  
  const response = await debugFetch(url, options);
  return response.json();
}

/**
 * Log environment status for debugging
 */
export function logEnvironmentStatus(): void {
  console.group('🌍 Environment Status');
  console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL || 'UNDEFINED');
  console.log('NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL:', process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL || 'UNDEFINED');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('Calculated Base URL:', getApiBaseUrl());
  console.log('Is Client:', typeof window !== 'undefined');
  if (typeof window !== 'undefined') {
    console.log('Current Origin:', window.location.origin);
    console.log('Current Href:', window.location.href);
  }
  console.groupEnd();
  
  // Additional Vercel-specific debugging
  console.group('🚀 Vercel Environment Debug');
  console.log('All environment variables starting with NEXT_PUBLIC_:');
  Object.keys(process.env)
    .filter(key => key.startsWith('NEXT_PUBLIC_'))
    .forEach(key => {
      const value = process.env[key];
      const isKey = key.toLowerCase().includes('key');
      console.log(`${key}:`, isKey && value ? 'SET' : (value || 'UNDEFINED'));
    });
  console.groupEnd();
}