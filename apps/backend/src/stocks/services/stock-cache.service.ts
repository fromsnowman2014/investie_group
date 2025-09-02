import { Injectable, Logger } from '@nestjs/common';
import { StockSymbol } from '../../common/types';
import { IStockCacheService, CachedStockData, StockPriceData } from '../interfaces';
import { SupabaseService } from '../../database/supabase.service';

@Injectable()
export class StockCacheService implements IStockCacheService {
  private readonly logger = new Logger(StockCacheService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async loadStockDataFromCache(symbol: StockSymbol): Promise<CachedStockData | null> {
    try {
      const supabase = this.supabaseService.getClient();
      const { data, error } = await supabase
        .from('stock_profiles')
        .select('*')
        .eq('symbol', symbol)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return null;
      }

      return data;
    } catch (error) {
      this.logger.warn(
        `Failed to load stock data from cache for ${symbol}:`,
        error.message
      );
      return null;
    }
  }

  async storeStockDataInCache(symbol: StockSymbol, stockData: StockPriceData): Promise<void> {
    try {
      const supabase = this.supabaseService.getClient();

      const { error } = await supabase.from('stock_profiles').upsert(
        {
          symbol: symbol,
          current_price: stockData.price,
          change_percent: stockData.changePercent,
          market_cap: stockData.marketCap?.toString() || null,
          pe_ratio: stockData.pe,
          volume: stockData.volume?.toString() || null,
          source: stockData.source || 'alpha_vantage',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'symbol',
        },
      );

      if (error) {
        this.logger.error(
          `Failed to store stock data in cache for ${symbol}:`,
          error
        );
      } else {
        this.logger.log(
          `Stock data stored successfully in cache for ${symbol}`
        );
      }
    } catch (error) {
      this.logger.error(`Cache store error for ${symbol}:`, error.message);
    }
  }

  isDataFresh(updatedAt: string): boolean {
    const now = new Date();
    const dataTime = new Date(updatedAt);
    const diffMinutes = (now.getTime() - dataTime.getTime()) / (1000 * 60);

    // Consider data fresh if it's less than 15 minutes old
    return diffMinutes < 15;
  }
}