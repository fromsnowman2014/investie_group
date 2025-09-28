// Centralized API utilities for consistent URL handling across all components
import { fetchMarketOverviewDirect } from './direct-api';


/**
 * Get the correct API base URL based on environment
 */
export function getApiBaseUrl(): string {
  // In development, prefer local functions if available
  if (process.env.NODE_ENV === 'development') {
    const localUrl = process.env.NEXT_PUBLIC_SUPABASE_LOCAL_FUNCTIONS_URL;
    if (localUrl) {
      console.log('🔧 API Utils: Using local Supabase functions:', localUrl);
      return localUrl;
    }
  }

  const supabaseFunctionsUrl = process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL;
  console.log('🌐 API Utils: Using production Supabase functions:', supabaseFunctionsUrl);
  return supabaseFunctionsUrl || 'https://your-project.supabase.co/functions/v1';
}

/**
 * Build full URL from relative path
 */
export function buildApiUrl(path: string): string {
  const baseUrl = getApiBaseUrl();
  return path.startsWith('http') ? path : `${baseUrl}${path}`;
}

/**
 * Enhanced fetch wrapper with error handling
 */
export async function apiFetch(url: string, options?: RequestInit): Promise<Response> {
  const fullUrl = buildApiUrl(url);
  
  try {
    const response = await fetch(fullUrl, options);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} - ${response.statusText}`);
    }

    return response;
  } catch (error) {
    console.error('API Request failed:', error);
    throw error;
  }
}

/**
 * Simplified fetcher function that returns JSON data
 */
export async function apiFetcher<T = unknown>(url: string): Promise<T> {
  const response = await apiFetch(url);
  return response.json();
}

/**
 * Enhanced debug fetch with comprehensive logging
 */
export async function debugFetch(url: string, options?: RequestInit): Promise<Response> {
  console.log('🚀 Debug Fetch Starting:', {
    url,
    method: options?.method || 'GET',
    headers: options?.headers,
    body: options?.body ? 'Present' : 'None',
    timestamp: new Date().toISOString()
  });

  try {
    const startTime = Date.now();
    const response = await fetch(url, options);
    const responseTime = Date.now() - startTime;

    console.log('📡 Debug Fetch Response:', {
      url,
      status: response.status,
      statusText: response.statusText,
      responseTime: `${responseTime}ms`,
      headers: Object.fromEntries(response.headers.entries()),
      timestamp: new Date().toISOString()
    });

    return response;
  } catch (error) {
    console.error('❌ Debug Fetch Error:', {
      url,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

/**
 * Smart router for market overview data - chooses between direct API and Edge Functions
 */
export async function fetchMarketOverview(): Promise<{
  indices?: { sp500?: { value: number; change: number; changePercent: number }; nasdaq?: { value: number; change: number; changePercent: number }; dow?: { value: number; change: number; changePercent: number } };
  source?: string;
  timestamp?: string;
  [key: string]: unknown;
}> {
  console.log('🎯 Smart Router: Determining market overview data source...');

  const directAPIEnabled = process.env.NEXT_PUBLIC_USE_DIRECT_API === 'true';

  if (directAPIEnabled) {
    console.log('🌐 Smart Router: Using direct API approach (NEXT_PUBLIC_USE_DIRECT_API=true)');
    return await fetchMarketOverviewDirect();
  } else {
    console.log('⚡ Smart Router: Using Supabase Edge Functions approach');
    return await edgeFunctionFetcher('market-overview');
  }
}

/**
 * Supabase Edge Function fetcher with proper authentication
 */
export async function edgeFunctionFetcher<T = unknown>(
  functionName: string,
  payload?: unknown
): Promise<T> {
  console.log(`⚡ Edge Function: Calling ${functionName}...`);

  const baseUrl = getApiBaseUrl();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'fallback-anon-key';

  // For local development, don't use Authorization header
  const isLocal = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1');

  const url = `${baseUrl}/${functionName}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Only add Authorization for remote calls
  if (!isLocal) {
    headers['Authorization'] = `Bearer ${anonKey}`;
    console.log(`🔐 Edge Function: Adding auth header for remote call to ${functionName}`);
  } else {
    console.log(`🔧 Edge Function: Local call to ${functionName}, skipping auth header`);
  }

  const options: RequestInit = {
    method: 'POST',
    headers,
    body: payload ? JSON.stringify(payload) : undefined,
  };

  console.log(`📡 Edge Function: Calling ${url}`, {
    method: options.method,
    hasAuth: !!headers.Authorization,
    hasBody: !!options.body
  });

  const response = await debugFetch(url, options);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Edge Function Error: ${functionName}`, {
      status: response.status,
      statusText: response.statusText,
      body: errorText
    });
    throw new Error(`Edge Function ${functionName} failed: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log(`✅ Edge Function: ${functionName} completed successfully`);
  return result;
}