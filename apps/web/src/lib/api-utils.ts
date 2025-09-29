// Centralized API utilities for consistent URL handling across all components

/**
 * Get the correct API base URL based on environment
 */
export function getApiBaseUrl(): string {
  const supabaseFunctionsUrl = process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL;
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

    // Don't throw on 503 (Service Unavailable) as Edge Functions may return structured error
    if (!response.ok && response.status !== 503) {
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
 * API Error interface for structured error responses
 */
export interface APIError {
  error: string;
  message: string;
  details?: string;
  errorType: string;
  symbol?: string;
}

/**
 * Check if a response is an API error
 */
export function isAPIError(data: unknown): data is APIError {
  return !!(data && 
         typeof data === 'object' && 
         'error' in data && 
         'errorType' in data &&
         'message' in data);
}

/**
 * Supabase Edge Function fetcher with proper authentication and error handling
 */
export async function edgeFunctionFetcher<T = unknown>(
  functionName: string, 
  payload?: unknown
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'fallback-anon-key';
  
  const url = `${baseUrl}/${functionName}`;
  const options: RequestInit = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${anonKey}`,
    },
    body: payload ? JSON.stringify(payload) : undefined,
  };
  
  const response = await apiFetch(url, options);
  const data = await response.json();
  
  // Check if the response is a structured API error
  if (isAPIError(data)) {
    // Create a custom error that preserves the structured error data
    const error = new Error(data.message) as Error & { apiError: APIError };
    error.apiError = data;
    throw error;
  }
  
  return data as T;
}