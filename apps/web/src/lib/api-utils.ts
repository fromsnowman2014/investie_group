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
  const envApiUrl = process.env.NEXT_PUBLIC_API_URL;
  const nodeEnv = process.env.NODE_ENV;
  const isClient = typeof window !== 'undefined';
  
  // If environment variable is set, use it
  if (envApiUrl) {
    return envApiUrl;
  }
  
  // Fallback logic for missing environment variables
  if (nodeEnv === 'production' && isClient) {
    console.error('🚨 CRITICAL: NEXT_PUBLIC_API_URL not set in production!');
    console.error('🔧 Please set the Railway backend URL in Vercel environment variables');
    // Return a placeholder that will fail gracefully
    return 'https://railway-backend-not-configured.invalid';
  }
  
  // Development fallback
  return 'http://localhost:3001';
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
  console.log('🌍 NEXT_PUBLIC_API_URL:', debugInfo.envApiUrl || 'UNDEFINED');
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
    console.error('🔧 Expected: Railway URL, Got: localhost');
    console.error('🔧 Current Full URL:', debugInfo.fullUrl);
  }

  // Check for invalid URLs
  if (debugInfo.fullUrl.includes('railway-backend-not-configured.invalid')) {
    console.error('🚨 CRITICAL: Railway backend URL not configured!');
    console.error('🔧 Set NEXT_PUBLIC_API_URL in Vercel environment variables');
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
 * Log environment status for debugging
 */
export function logEnvironmentStatus(): void {
  console.group('🌍 Environment Status');
  console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL || 'UNDEFINED');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('Calculated Base URL:', getApiBaseUrl());
  console.log('Is Client:', typeof window !== 'undefined');
  if (typeof window !== 'undefined') {
    console.log('Current Origin:', window.location.origin);
    console.log('Current Href:', window.location.href);
  }
  console.groupEnd();
}