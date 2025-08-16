import axios from 'axios';
import { Injectable, Logger } from '@nestjs/common';
import { ValidationResult } from '../common/types';

@Injectable()
export class StockValidatorHelper {
  private readonly logger = new Logger(StockValidatorHelper.name);
  
  private knownValidSymbols = new Set([
    // Major US Stocks
    'AAPL', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'TSLA', 'META', 'NVDA', 'AMD', 'INTC',
    'NFLX', 'UBER', 'LYFT', 'SNAP', 'TWTR', 'SHOP', 'PYPL', 'SQ', 'ZOOM', 'CRM',
    'ORCL', 'IBM', 'CSCO', 'V', 'MA', 'JPM', 'BAC', 'WFC', 'GS', 'MS',
    'JNJ', 'PFE', 'MRNA', 'ABBV', 'UNH', 'CVS', 'WMT', 'TGT', 'COST', 'HD',
    'KO', 'PEP', 'MCD', 'SBUX', 'NKE', 'DIS', 'CMCSA', 'VZ', 'T', 'TMUS',
    // Tech giants
    'AVGO', 'QCOM', 'TXN', 'ADBE', 'NOW', 'INTU', 'MU', 'LRCX', 'KLAC', 'AMAT',
    // Popular ETFs
    'SPY', 'QQQ', 'IWM', 'VTI', 'VOO', 'VEA', 'VWO', 'BND', 'VXUS', 'VTEB',
    // Recent popular stocks
    'PLTR', 'COIN', 'RBLX', 'HOOD', 'SOFI', 'RIVN', 'LCID', 'AI', 'SMCI', 'ARM'
  ]);

  async validateSymbol(symbol: string): Promise<ValidationResult> {
    // Tier 1: Format validation (instant)
    const formatResult = this.hasValidFormat(symbol);
    if (!formatResult.isValid) {
      return formatResult;
    }

    // Tier 2: Known symbols lookup (milliseconds)
    const knownResult = this.isKnownValidSymbol(symbol);
    if (knownResult.isValid) {
      return knownResult;
    }

    // Tier 3: Yahoo Finance API validation (seconds)
    return await this.validateWithYahooFinance(symbol);
  }

  private hasValidFormat(symbol: string): ValidationResult {
    const cleanSymbol = symbol.trim().toUpperCase();
    
    // Basic format validation
    if (!cleanSymbol) {
      return {
        isValid: false,
        method: 'format_validation',
        symbol: cleanSymbol,
        reason: 'Symbol cannot be empty',
      };
    }

    // Check for valid symbol format (1-5 letters, no numbers or special characters)
    if (!/^[A-Z]{1,5}$/.test(cleanSymbol)) {
      return {
        isValid: false,
        method: 'format_validation',
        symbol: cleanSymbol,
        reason: 'Symbol must be 1-5 letters only',
      };
    }

    return {
      isValid: true,
      method: 'format_validation',
      symbol: cleanSymbol,
      reason: 'Valid format',
    };
  }

  private isKnownValidSymbol(symbol: string): ValidationResult {
    const upperSymbol = symbol.toUpperCase();
    const isKnown = this.knownValidSymbols.has(upperSymbol);

    return {
      isValid: isKnown,
      method: 'known_symbols_lookup',
      symbol: upperSymbol,
      reason: isKnown ? 'Found in known symbols' : 'Not in known symbols list',
    };
  }

  async validateWithYahooFinance(symbol: string): Promise<ValidationResult> {
    try {
      const response = await axios.get(
        `https://query1.finance.yahoo.com/v8/finance/chart/${symbol.toUpperCase()}`,
        {
          timeout: 8000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        }
      );

      const chart = response.data.chart;
      const isValid = chart?.result?.[0] && !chart.result[0].meta.error;

      return {
        isValid,
        method: 'yahoo_finance_api',
        symbol: symbol.toUpperCase(),
        reason: isValid ? 'Found market data' : 'No market data found',
        price: isValid ? chart.result[0].meta.regularMarketPrice : undefined
      };
    } catch (error) {
      this.logger.warn(`Yahoo Finance validation failed for ${symbol}: ${error.message}`);
      return {
        isValid: false,
        method: 'yahoo_finance_api',
        symbol: symbol.toUpperCase(),
        reason: 'API validation failed',
      };
    }
  }

  getSuggestions(invalidSymbol: string): string[] {
    const suggestions: string[] = [];
    const upperSymbol = invalidSymbol.toUpperCase();

    for (const validSymbol of this.knownValidSymbols) {
      if (validSymbol.includes(upperSymbol) || upperSymbol.includes(validSymbol)) {
        suggestions.push(validSymbol);
      }
      if (suggestions.length >= 5) break;
    }

    // If no partial matches found, suggest popular symbols
    if (suggestions.length === 0) {
      suggestions.push('AAPL', 'MSFT', 'GOOGL', 'TSLA', 'AMZN');
    }

    return suggestions;
  }
}