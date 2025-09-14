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
 * Supabase Edge Function fetcher with proper authentication
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
  return response.json();
}