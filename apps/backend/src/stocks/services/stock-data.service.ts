import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { StockSymbol } from '../../common/types';
import {
  IStockDataService,
  StockPriceData,
  AlphaVantageQuote,
  AlphaVantageOverview,
} from '../interfaces';
import { StockValidationService } from './stock-validation.service';

@Injectable()
export class StockDataService implements IStockDataService {
  private readonly logger = new Logger(StockDataService.name);
  private readonly alphaVantageBaseUrl = 'https://www.alphavantage.co/query';

  constructor(private readonly validationService: StockValidationService) {}

  async getStockData(symbol: StockSymbol): Promise<StockPriceData> {
    if (!this.validationService.validateSymbol(symbol)) {
      throw new Error(`Invalid stock symbol: ${symbol}`);
    }

    try {
      const alphaVantageApiKey = process.env.ALPHA_VANTAGE_API_KEY;
      if (!alphaVantageApiKey) {
        this.logger.warn(
          'Alpha Vantage API key not configured, using mock data',
        );
        return this.getMockStockData(symbol);
      }

      const [realTimeData, overviewData] = await Promise.allSettled([
        this.getAlphaVantageQuote(symbol),
        this.getAlphaVantageOverview(symbol),
      ]);

      const quote =
        realTimeData.status === 'fulfilled' ? realTimeData.value : null;
      const overview =
        overviewData.status === 'fulfilled' ? overviewData.value : null;

      if (quote && overview) {
        const stockData: StockPriceData = {
          price: parseFloat(quote['05. price']),
          change: parseFloat(quote['09. change']),
          changePercent: parseFloat(
            quote['10. change percent'].replace('%', ''),
          ),
          marketCap: this.parseMarketCap(overview.MarketCapitalization),
          volume: parseInt(quote['06. volume']),
          pe: parseFloat(overview.PERatio) || undefined,
          fiftyTwoWeekHigh: parseFloat(overview['52WeekHigh']),
          fiftyTwoWeekLow: parseFloat(overview['52WeekLow']),
          source: 'alpha_vantage',
        };

        this.logger.log(
          `Fetched fresh stock data for ${symbol} from Alpha Vantage`,
        );
        return stockData;
      }

      this.logger.warn(
        `Alpha Vantage API failed for ${symbol}, using mock data`,
      );
      return this.getMockStockData(symbol);
    } catch (error) {
      this.logger.error(
        `Error fetching stock data for ${symbol}:`,
        error.message,
      );
      return this.getMockStockData(symbol);
    }
  }

  async getAlphaVantageQuote(
    symbol: StockSymbol,
  ): Promise<AlphaVantageQuote | null> {
    try {
      const response = await axios.get(this.alphaVantageBaseUrl, {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol: symbol,
          apikey: process.env.ALPHA_VANTAGE_API_KEY,
        },
        timeout: 10000,
      });

      const quote = response.data['Global Quote'];
      if (!quote || Object.keys(quote).length === 0) {
        this.logger.warn(`No quote data returned for ${symbol}`);
        return null;
      }

      return quote;
    } catch (error) {
      this.logger.error(
        `Alpha Vantage quote API error for ${symbol}:`,
        error.message,
      );
      return null;
    }
  }

  async getAlphaVantageOverview(
    symbol: StockSymbol,
  ): Promise<AlphaVantageOverview | null> {
    try {
      const response = await axios.get(this.alphaVantageBaseUrl, {
        params: {
          function: 'OVERVIEW',
          symbol: symbol,
          apikey: process.env.ALPHA_VANTAGE_API_KEY,
        },
        timeout: 10000,
      });

      const overview = response.data;
      if (!overview || overview.Symbol !== symbol) {
        this.logger.warn(`No overview data returned for ${symbol}`);
        return null;
      }

      return overview;
    } catch (error) {
      this.logger.error(
        `Alpha Vantage overview API error for ${symbol}:`,
        error.message,
      );
      return null;
    }
  }

  private getMockStockData(symbol: StockSymbol): StockPriceData {
    const mockPrices: Record<StockSymbol, number> = {
      AAPL: 182.52,
      TSLA: 245.83,
      MSFT: 378.24,
      GOOGL: 138.93,
      AMZN: 146.8,
      NVDA: 685.32,
      META: 298.57,
      NFLX: 456.78,
      AVGO: 892.13,
      AMD: 143.29,
    };

    const basePrice = mockPrices[symbol] || 100;
    const change = (Math.random() - 0.5) * 10;
    const changePercent = (change / basePrice) * 100;

    return {
      price: basePrice + change,
      change,
      changePercent,
      pe: 15 + Math.random() * 20,
      marketCap: Math.random() * 2000000000000,
      volume: Math.random() * 50000000,
      fiftyTwoWeekHigh: basePrice * 1.2,
      fiftyTwoWeekLow: basePrice * 0.8,
      source: 'mock_data',
    };
  }

  private parseMarketCap(marketCapString: string): number {
    if (!marketCapString || marketCapString === 'None') return 0;

    const cleanString = marketCapString.replace(/[^0-9.]/g, '');
    const value = parseFloat(cleanString);

    if (marketCapString.includes('T')) {
      return value * 1e12;
    } else if (marketCapString.includes('B')) {
      return value * 1e9;
    } else if (marketCapString.includes('M')) {
      return value * 1e6;
    }

    return value;
  }
}
