import { Test, TestingModule } from '@nestjs/testing';
import { StockValidationService } from './stock-validation.service';

describe('StockValidationService', () => {
  let service: StockValidationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StockValidationService],
    }).compile();

    service = module.get<StockValidationService>(StockValidationService);
  });

  describe('validateSymbol', () => {
    it('should return true for valid symbols', () => {
      const validSymbols = ['AAPL', 'TSLA', 'MSFT', 'GOOGL'];
      
      validSymbols.forEach(symbol => {
        expect(service.validateSymbol(symbol)).toBe(true);
      });
    });

    it('should return false for invalid symbols', () => {
      const invalidSymbols = ['INVALID', 'XYZ123', '', null, undefined];
      
      invalidSymbols.forEach(symbol => {
        expect(service.validateSymbol(symbol as any)).toBe(false);
      });
    });
  });

  describe('validateStockData', () => {
    it('should return true for valid stock data', () => {
      const validData = {
        price: 150.50,
        change: 2.25,
        changePercent: 1.5,
        source: 'alpha_vantage',
      };

      expect(service.validateStockData(validData)).toBe(true);
    });

    it('should return false for invalid stock data', () => {
      const invalidDatasets = [
        null,
        undefined,
        {},
        { price: 'invalid' },
        { price: 150, change: 'invalid' },
        { price: 150, change: 2.25, changePercent: 'invalid' },
      ];

      invalidDatasets.forEach(data => {
        expect(service.validateStockData(data)).toBe(false);
      });
    });
  });

  describe('isValidMarketCapFormat', () => {
    it('should return true for valid market cap formats', () => {
      const validFormats = ['2.4T', '500B', '50.5M', '1.2T'];
      
      validFormats.forEach(format => {
        expect(service.isValidMarketCapFormat(format)).toBe(true);
      });
    });

    it('should return false for invalid market cap formats', () => {
      const invalidFormats = ['invalid', 'None', '', null, undefined];
      
      invalidFormats.forEach(format => {
        expect(service.isValidMarketCapFormat(format as any)).toBe(false);
      });
    });
  });

  describe('getSupportedSymbols', () => {
    it('should return array of supported symbols', () => {
      const symbols = service.getSupportedSymbols();
      
      expect(Array.isArray(symbols)).toBe(true);
      expect(symbols.length).toBeGreaterThan(0);
      expect(symbols).toContain('AAPL');
      expect(symbols).toContain('TSLA');
    });
  });
});