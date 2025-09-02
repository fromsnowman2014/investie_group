import { StockSymbol } from '../../common/types';

export interface StockPriceData {
  price: number;
  change: number;
  changePercent: number;
  marketCap?: number;
  volume?: number;
  pe?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  source: string;
}

export interface AlphaVantageQuote {
  '05. price': string;
  '09. change': string;
  '10. change percent': string;
  '06. volume': string;
}

export interface AlphaVantageOverview {
  Symbol: string;
  MarketCapitalization: string;
  PERatio: string;
  '52WeekHigh': string;
  '52WeekLow': string;
}

export interface IStockDataService {
  getStockData(symbol: StockSymbol): Promise<StockPriceData>;
  getAlphaVantageQuote(symbol: StockSymbol): Promise<AlphaVantageQuote | null>;
  getAlphaVantageOverview(symbol: StockSymbol): Promise<AlphaVantageOverview | null>;
}