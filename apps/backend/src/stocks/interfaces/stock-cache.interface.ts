import { StockSymbol } from '../../common/types';
import { StockPriceData } from './stock-data.interface';

export interface CachedStockData {
  symbol: string;
  current_price: number;
  change_percent: number;
  market_cap?: string;
  pe_ratio?: number;
  volume?: string;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface IStockCacheService {
  loadStockDataFromCache(symbol: StockSymbol): Promise<CachedStockData | null>;
  storeStockDataInCache(
    symbol: StockSymbol,
    data: StockPriceData,
  ): Promise<void>;
  isDataFresh(updatedAt: string): boolean;
}
