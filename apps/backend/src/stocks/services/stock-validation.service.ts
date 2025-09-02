import { Injectable } from '@nestjs/common';
import { StockSymbol } from '../../common/types';
import { IStockValidationService } from '../interfaces';

@Injectable()
export class StockValidationService implements IStockValidationService {
  private readonly supportedSymbols: StockSymbol[] = [
    'AAPL',
    'TSLA',
    'MSFT',
    'GOOGL',
    'AMZN',
    'NVDA',
    'META',
    'NFLX',
    'AVGO',
    'AMD',
  ];

  validateSymbol(symbol: string): symbol is StockSymbol {
    if (!symbol || typeof symbol !== 'string') {
      return false;
    }
    return this.supportedSymbols.includes(symbol.toUpperCase() as StockSymbol);
  }

  validateStockData(data: any): boolean {
    if (!data || typeof data !== 'object') {
      return false;
    }

    const requiredFields = ['price', 'change', 'changePercent'];
    
    for (const field of requiredFields) {
      if (!(field in data) || typeof data[field] !== 'number' || isNaN(data[field])) {
        return false;
      }
    }

    return true;
  }

  isValidMarketCapFormat(marketCap: string): boolean {
    if (!marketCap || typeof marketCap !== 'string') {
      return false;
    }

    if (marketCap === 'None' || marketCap === '') {
      return false;
    }

    const marketCapRegex = /^\d+(\.\d+)?[TMB]$/;
    return marketCapRegex.test(marketCap);
  }

  getSupportedSymbols(): StockSymbol[] {
    return [...this.supportedSymbols];
  }
}