// Common utility functions for Supabase Edge Functions
import type { ErrorResponse } from './types.ts';

/**
 * Standard CORS headers for all functions
 */
export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
} as const;

/**
 * Standard response headers
 */
export const STANDARD_HEADERS = {
  'Content-Type': 'application/json',
  ...CORS_HEADERS,
} as const;

/**
 * Handle CORS preflight requests
 */
export function handleCORS(): Response {
  return new Response(null, {
    status: 200,
    headers: CORS_HEADERS,
  });
}

/**
 * Create standardized success response
 */
export function createSuccessResponse<T>(
  data: T,
  headers: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      ...STANDARD_HEADERS,
      ...headers,
    },
  });
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  error: string,
  status: number = 500,
  message?: string
): Response {
  const errorResponse: ErrorResponse = {
    error,
    message,
    timestamp: new Date().toISOString(),
    status,
  };

  return new Response(JSON.stringify(errorResponse), {
    status,
    headers: STANDARD_HEADERS,
  });
}

/**
 * Validate HTTP method
 */
export function validateMethod(
  request: Request,
  allowedMethods: string[] = ['POST']
): Response | null {
  if (request.method === 'OPTIONS') {
    return handleCORS();
  }

  if (!allowedMethods.includes(request.method)) {
    return createErrorResponse(
      'Method not allowed',
      405,
      `Allowed methods: ${allowedMethods.join(', ')}`
    );
  }

  return null;
}

/**
 * Safe JSON parsing with error handling
 */
export async function safeParseJSON<T = any>(
  request: Request,
  defaultValue: T = {} as T
): Promise<T> {
  try {
    return await request.json();
  } catch (error) {
    console.warn('⚠️ Failed to parse JSON, using default value:', error.message);
    return defaultValue;
  }
}

/**
 * Get Supabase environment configuration
 */
export function getSupabaseConfig() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://fwnmnjwtbggasmunsfyk.supabase.co';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SERVICE_ROLE_KEY') || '';

  if (!supabaseServiceKey) {
    console.error('❌ Service Role Key is not configured (checked SUPABASE_SERVICE_ROLE_KEY and SERVICE_ROLE_KEY)');
  } else {
    const keySource = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ? 'SUPABASE_SERVICE_ROLE_KEY' : 'SERVICE_ROLE_KEY';
    console.log(`✅ Service Role Key is configured (using ${keySource})`);
  }

  return {
    url: supabaseUrl,
    serviceKey: supabaseServiceKey,
    isLocal: supabaseUrl.includes('127.0.0.1') || supabaseUrl.includes('localhost'),
  };
}

/**
 * Get functions URL for internal calls
 */
export function getFunctionsUrl(): string {
  const config = getSupabaseConfig();
  return config.isLocal
    ? 'http://127.0.0.1:54321/functions/v1'
    : `${config.url}/functions/v1`;
}

/**
 * Make internal function call
 */
export async function callInternalFunction<T = any>(
  functionName: string,
  body: any,
  headers: Record<string, string> = {}
): Promise<T> {
  const config = getSupabaseConfig();
  const functionsUrl = getFunctionsUrl();

  console.log(`🔍 Calling internal function: ${functionName}`);

  const response = await fetch(`${functionsUrl}/${functionName}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.serviceKey}`,
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Internal function call failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log(`✅ Internal function call successful: ${functionName}`);

  return data;
}

/**
 * Serialize BigInt values for JSON
 */
export function serializeForJSON(obj: any): any {
  return JSON.parse(JSON.stringify(obj, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ));
}

/**
 * Retry function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxAttempts) {
        throw lastError;
      }

      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.warn(`⚠️ Attempt ${attempt} failed, retrying in ${delay}ms:`, lastError.message);

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Log function entry and exit for debugging
 */
export function logFunctionCall(functionName: string, params?: any) {
  const timestamp = new Date().toISOString();
  console.log(`🚀 [${timestamp}] Starting ${functionName}`, params ? `with params: ${JSON.stringify(params)}` : '');

  return {
    end: (result?: any) => {
      const endTimestamp = new Date().toISOString();
      console.log(`✅ [${endTimestamp}] Completed ${functionName}`, result ? `with result keys: ${Object.keys(result).join(', ')}` : '');
    },
    error: (error: Error) => {
      const errorTimestamp = new Date().toISOString();
      console.error(`❌ [${errorTimestamp}] Failed ${functionName}:`, error.message);
    }
  };
}