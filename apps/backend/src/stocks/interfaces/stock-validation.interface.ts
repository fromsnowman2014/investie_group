import { StockSymbol } from '../../common/types';

export interface IStockValidationService {
  validateSymbol(symbol: string): symbol is StockSymbol;
  validateStockData(data: any): boolean;
  isValidMarketCapFormat(marketCap: string): boolean;
  getSupportedSymbols(): StockSymbol[];
}
