// Emergency API Utils - Simplified and Reliable
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
  emergencyMode: boolean;
  diagnosis: string;
}

/**
 * Emergency-safe API base URL function
 */
export function getApiBaseUrl(): string {
  const url = getApiUrl();
  
  if (isInEmergencyMode()) {
    console.error('🚨 EMERGENCY: Using hardcoded API URL due to env var failure');
  }
  
  return url;
}

/**
 * Build full URL from relative path
 */
export function buildApiUrl(path: string): string {
  const baseUrl = getApiBaseUrl();
  return path.startsWith('http') ? path : `${baseUrl}${path}`;
}

/**
 * Emergency-safe Supabase Edge Function fetcher
 */
export async function edgeFunctionFetcher<T = unknown>(
  functionName: string, 
  payload?: unknown
): Promise<T> {
  const functionsUrl = getSupabaseFunctionsUrl();
  const anonKey = getSupabaseAnonKey();
  
  // Enhanced logging for emergency mode
  if (isInEmergencyMode()) {
    console.warn('🚨 Edge Function Emergency Mode:', {
      functionName,
      functionsUrl,
      hasAnonKey: !!anonKey,
      diagnosis: diagnoseEnvironmentIssue()
    });
  }
  
  const url = `${functionsUrl}/${functionName}`;
  
  const options: RequestInit = {
    method: payload ? 'POST' : 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${anonKey}`,
      'apikey': anonKey,
    },
  };
  
  if (payload) {
    options.body = JSON.stringify(payload);
  }
  
  console.log('🌐 Edge Function Request:', {
    url,
    method: options.method,
    hasAuth: !!anonKey,
    payload: payload ? 'Present' : 'None'
  });
  
  const response = await fetch(url, options);
  
  if (!response.ok) {
    const error = `Edge function ${functionName} failed: ${response.status} ${response.statusText}`;
    console.error('❌ Edge Function Error:', error);
    throw new Error(error);
  }
  
  const data = await response.json();
  console.log('✅ Edge Function Success:', functionName);
  return data;
}

/**
 * Enhanced fetch wrapper with emergency diagnostics
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
    timestamp: new Date().toISOString(),
    emergencyMode: isInEmergencyMode(),
    diagnosis: diagnoseEnvironmentIssue()
  };
  
  // Enhanced emergency mode logging
  console.group('🔍 Emergency-Safe API Request');
  console.log('🎯 Target URL:', debugInfo.fullUrl);
  console.log('🏗️ Base URL:', debugInfo.baseUrl);
  console.log('🚨 Emergency Mode:', debugInfo.emergencyMode);
  console.log('📊 Diagnosis:', debugInfo.diagnosis);
  console.log('🖥️ Is Client:', debugInfo.isClient);
  console.log('⏰ Timestamp:', debugInfo.timestamp);
  console.groupEnd();
  
  return fetch(debugInfo.fullUrl, options);
}

/**
 * Emergency environment diagnostics
 */
export function logEmergencyEnvironmentStatus(): void {
  console.group('🚨 EMERGENCY ENVIRONMENT STATUS');
  console.log('Emergency Mode:', isInEmergencyMode());
  console.log('Diagnosis:', diagnoseEnvironmentIssue());
  console.log('API URL:', getApiUrl());
  console.log('Supabase Functions URL:', getSupabaseFunctionsUrl());
  console.log('Supabase Anon Key Length:', getSupabaseAnonKey().length);
  
  // Check what environment variables actually exist
  const allEnvVars = Object.keys(process.env);
  const nextPublicVars = allEnvVars.filter(k => k.startsWith('NEXT_PUBLIC_'));
  console.log('Total NEXT_PUBLIC_ vars:', nextPublicVars.length);
  console.log('NEXT_PUBLIC_ vars:', nextPublicVars.slice(0, 10)); // Show first 10
  
  console.groupEnd();
}
