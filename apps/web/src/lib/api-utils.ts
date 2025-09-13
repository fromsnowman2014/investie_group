// Centralized API utilities for consistent URL handling across all components

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
 * Get the correct API base URL based on environment
 */
export function getApiBaseUrl(): string {
  const supabaseFunctionsUrl = process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL;
  const nodeEnv = process.env.NODE_ENV;
  
  // Use Supabase Edge Functions if configured
  if (supabaseFunctionsUrl) {
    return supabaseFunctionsUrl;
  }
  
  // Development fallback: local Supabase functions
  if (nodeEnv === 'development') {
    const localSupabase = process.env.NEXT_PUBLIC_SUPABASE_LOCAL_FUNCTIONS_URL;
    return localSupabase || 'http://localhost:54321/functions/v1';
  }
  
  // Production fallback - should not reach here if properly configured
  console.warn('⚠️ Supabase Functions URL not configured, using fallback');
  return 'https://fwnmnjwtbggasmunsfyk.supabase.co/functions/v1';
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
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  const url = `${baseUrl}/${functionName}`;
  const options: RequestInit = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${anonKey}`,
    },
    body: payload ? JSON.stringify(payload) : undefined,
  };
  
  console.group('🚀 Supabase Edge Function Call');
  console.log('📍 Function:', functionName);
  console.log('🌍 Base URL:', baseUrl);
  console.log('🔗 Full URL:', url);
  console.log('📦 Payload:', payload);
  console.log('🔑 Has Auth Key:', !!anonKey);
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