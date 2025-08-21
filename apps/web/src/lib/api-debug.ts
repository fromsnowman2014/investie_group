// Global API Debug Interceptor
// This will help debug all API requests across the application

let originalFetch: typeof fetch;

interface DebugLog {
  timestamp: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  baseUrl: string | undefined;
  envApiUrl: string | undefined;
  isProduction: boolean;
  userAgent: string;
}

class APIDebugger {
  private logs: DebugLog[] = [];
  private isEnabled = true;

  constructor() {
    if (typeof window !== 'undefined' && !originalFetch) {
      this.interceptFetch();
    }
  }

  private interceptFetch() {
    originalFetch = window.fetch;
    
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = input instanceof Request ? input.url : input.toString();
      const method = (input instanceof Request ? input.method : init?.method) || 'GET';
      
      // Log the request details
      const debugInfo: DebugLog = {
        timestamp: new Date().toISOString(),
        url: url,
        method: method,
        headers: this.extractHeaders(input, init),
        baseUrl: process.env.NEXT_PUBLIC_API_URL,
        envApiUrl: process.env.NEXT_PUBLIC_API_URL,
        isProduction: process.env.NODE_ENV === 'production',
        userAgent: navigator.userAgent
      };

      this.logs.push(debugInfo);

      // Enhanced logging for API requests
      if (url.includes('/api/v1/')) {
        console.group('🚀 API Request Debug');
        console.log('📍 URL:', url);
        console.log('🔧 Method:', method);
        console.log('🌍 Base URL from ENV:', process.env.NEXT_PUBLIC_API_URL);
        console.log('🏗️ Environment:', process.env.NODE_ENV);
        console.log('⏰ Timestamp:', debugInfo.timestamp);
        
        // Check if URL is hitting Vercel instead of Railway
        if (url.includes('vercel.app') && url.includes('/api/v1/')) {
          console.error('🚨 PROBLEM: Request going to Vercel instead of Railway!');
          console.error('Expected: Should go to Railway backend');
          console.error('Actual: Going to Vercel frontend');
          console.error('Check NEXT_PUBLIC_API_URL environment variable');
        }
        
        console.groupEnd();
      }

      try {
        const response = await originalFetch(input, init);
        
        // Log response details for API calls
        if (url.includes('/api/v1/')) {
          console.group('📨 API Response Debug');
          console.log('📍 URL:', url);
          console.log('✅ Status:', response.status, response.statusText);
          console.log('🔗 Response URL:', response.url);
          console.log('📦 Headers:', Object.fromEntries(response.headers.entries()));
          console.groupEnd();
        }
        
        return response;
      } catch (error) {
        console.group('❌ API Error Debug');
        console.log('📍 URL:', url);
        console.error('💥 Error:', error);
        console.log('🔧 Request Details:', debugInfo);
        console.groupEnd();
        throw error;
      }
    };
  }

  private extractHeaders(input: RequestInfo | URL, init?: RequestInit): Record<string, string> {
    const headers: Record<string, string> = {};
    
    if (input instanceof Request) {
      input.headers.forEach((value, key) => {
        headers[key] = value;
      });
    }
    
    if (init?.headers) {
      if (init.headers instanceof Headers) {
        init.headers.forEach((value, key) => {
          headers[key] = value;
        });
      } else if (Array.isArray(init.headers)) {
        init.headers.forEach(([key, value]) => {
          headers[key] = value;
        });
      } else {
        Object.assign(headers, init.headers);
      }
    }
    
    return headers;
  }

  getLogs(): DebugLog[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // Add to window object for manual debugging
  addToWindow() {
    if (typeof window !== 'undefined') {
      (window as any).apiDebugger = this;
      console.log('🔍 API Debugger available at window.apiDebugger');
      console.log('📋 Use window.apiDebugger.getLogs() to see all requests');
      console.log('🧹 Use window.apiDebugger.clearLogs() to clear logs');
      console.log('📤 Use window.apiDebugger.exportLogs() to export logs');
    }
  }
}

// Create global instance
export const apiDebugger = new APIDebugger();

// Auto-initialize in browser
if (typeof window !== 'undefined') {
  apiDebugger.addToWindow();
}