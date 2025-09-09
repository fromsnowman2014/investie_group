import { 
  StockSymbol, 
  StockCardData, 
  ChartData, 
  MarketOverview, 
  ApiResponse,
  HealthCheck 
} from '@/types/api';

// Dynamic API URL detection for different environments
const getApiUrl = (): string => {
  // Development: use localhost backend
  if (process.env.NODE_ENV === 'development') {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  }
  
  // Production: use current domain (Vercel Functions)
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  // SSR fallback: use environment variable or default to Vercel domain
  return process.env.NEXT_PUBLIC_API_URL || process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'https://investie-group-web.vercel.app';
};

const API_BASE_URL = getApiUrl();

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Health check endpoint
  async getHealth(): Promise<HealthCheck> {
    const response = await this.request<ApiResponse<HealthCheck>>('/health');
    return response.data;
  }

  // Stock data endpoints
  async getAllStocks(): Promise<StockCardData[]> {
    // Railway backend returns data directly, not wrapped in ApiResponse
    const response = await this.request<StockCardData[]>('/api/v1/stocks');
    return response;
  }

  async getStock(symbol: StockSymbol): Promise<StockCardData> {
    // Railway backend returns data directly, not wrapped in ApiResponse
    const response = await this.request<StockCardData>(`/api/v1/stocks/${symbol}`);
    return response;
  }

  async getStockChart(symbol: StockSymbol, period: string = '1W'): Promise<ChartData> {
    const response = await this.request<ApiResponse<ChartData>>(
      `/api/v1/stocks/${symbol}/chart?period=${period}`
    );
    return response.data;
  }

  // Market data endpoints
  async getMarketOverview(): Promise<MarketOverview> {
    const response = await this.request<ApiResponse<MarketOverview>>('/api/v1/market/overview');
    return response.data;
  }

  // Service health checks
  async getAIHealth(): Promise<Record<string, unknown>> {
    const response = await this.request<ApiResponse<Record<string, unknown>>>('/api/v1/ai/health');
    return response.data;
  }

  async getNewsHealth(): Promise<Record<string, unknown>> {
    const response = await this.request<ApiResponse<Record<string, unknown>>>('/api/v1/news/health');
    return response.data;
  }

  // Search functionality (for future implementation)
  async searchStocks(query: string): Promise<StockCardData[]> {
    const allStocks = await this.getAllStocks();
    return allStocks.filter(stock => 
      stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
      stock.name.toLowerCase().includes(query.toLowerCase())
    );
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export individual methods for convenience
export const {
  getHealth,
  getAllStocks,
  getStock,
  getStockChart,
  getMarketOverview,
  getAIHealth,
  getNewsHealth,
  searchStocks,
} = apiClient;