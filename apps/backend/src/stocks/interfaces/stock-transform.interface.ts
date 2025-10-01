import { StockCardData, StockSymbol } from '../../common/types';
import { StockPriceData } from './stock-data.interface';

export interface IStockTransformService {
  transformToStockCardData(
    stockData: StockPriceData,
    aiEvaluation: any,
    technicals: any,
    newsSummary: any,
    symbol: StockSymbol,
  ): StockCardData;

  getCompanyName(symbol: StockSymbol): string;
  getSectorName(symbol: StockSymbol): string;
  extractSentimentFromOverview(
    overview: any,
  ): 'positive' | 'neutral' | 'negative';
  parseMarketCap(marketCapString: string): number;
  calculateChange(price: number, changePercent: number): number;
}
