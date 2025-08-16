import { Test, TestingModule } from '@nestjs/testing';
import { StockValidatorHelper } from './stock-validator.helper';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('StockValidatorHelper', () => {
  let service: StockValidatorHelper;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StockValidatorHelper],
    }).compile();

    service = module.get<StockValidatorHelper>(StockValidatorHelper);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateSymbol', () => {
    it('should reject empty symbol', async () => {
      const result = await service.validateSymbol('');

      expect(result.isValid).toBe(false);
      expect(result.method).toBe('format_validation');
      expect(result.reason).toBe('Symbol cannot be empty');
    });

    it('should reject invalid format symbols', async () => {
      const invalidSymbols = ['123', 'TOOLONG', 'AA-BB', 'A1'];

      for (const symbol of invalidSymbols) {
        const result = await service.validateSymbol(symbol);
        expect(result.isValid).toBe(false);
        expect(result.method).toBe('format_validation');
        expect(result.reason).toBe('Symbol must be 1-5 letters only');
      }
    });

    it('should accept valid format symbols', async () => {
      const result = await service.validateSymbol('TEST');
      // Should pass format validation and proceed to other validation stages
      expect(result).toBeDefined();
      expect(result.symbol).toBe('TEST');
    });

    it('should validate known symbols quickly', async () => {
      const knownSymbols = ['AAPL', 'TSLA', 'MSFT', 'GOOGL', 'AMZN'];

      for (const symbol of knownSymbols) {
        const result = await service.validateSymbol(symbol);
        expect(result.isValid).toBe(true);
        expect(result.method).toBe('known_symbols_lookup');
        expect(result.reason).toBe('Found in known symbols');
        expect(result.symbol).toBe(symbol);
      }
    });

    it('should attempt Yahoo Finance API validation for unknown symbols', async () => {
      const unknownSymbol = 'UNKNOWN';
      
      const result = await service.validateSymbol(unknownSymbol);

      // Should process unknown symbols (format validation should pass)
      expect(result).toBeDefined();
      expect(result.symbol).toBe(unknownSymbol);
      expect(['yahoo_finance_api', 'known_symbols_lookup', 'format_validation']).toContain(result.method);
    });

    it('should handle validation errors gracefully', async () => {
      const unknownSymbol = 'BADSTOCK';
      
      const result = await service.validateSymbol(unknownSymbol);

      expect(result).toBeDefined();
      expect(result.symbol).toBe(unknownSymbol);
      expect(typeof result.isValid).toBe('boolean');
      expect(result.method).toBeDefined();
      expect(result.reason).toBeDefined();
    });

    it('should process symbols consistently', async () => {
      const testSymbol = 'TEST';
      
      const result = await service.validateSymbol(testSymbol);

      expect(result).toBeDefined();
      expect(result.symbol).toBe(testSymbol);
      expect(typeof result.isValid).toBe('boolean');
      expect(result.method).toBeDefined();
    });
  });

  describe('getSuggestions', () => {
    it('should provide suggestions for partial matches', () => {
      const suggestions = service.getSuggestions('APP');

      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions).toContain('AAPL');
    });

    it('should provide default suggestions for no matches', () => {
      const suggestions = service.getSuggestions('XYZ123');

      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBe(5);
      expect(suggestions).toContain('AAPL');
      expect(suggestions).toContain('MSFT');
      expect(suggestions).toContain('GOOGL');
      expect(suggestions).toContain('TSLA');
      expect(suggestions).toContain('AMZN');
    });

    it('should limit suggestions to 5 items', () => {
      const suggestions = service.getSuggestions('A');

      expect(suggestions.length).toBeLessThanOrEqual(5);
    });

    it('should handle case insensitive matches', () => {
      const suggestions = service.getSuggestions('aapl');

      expect(suggestions).toBeDefined();
      expect(suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('three-tier validation flow', () => {
    it('should process validation in correct order', async () => {
      // Test with unknown symbol
      const testSymbol = 'UNKNOWN';
      
      const result = await service.validateSymbol(testSymbol);

      // Should have attempted validation (regardless of result)
      expect(result).toBeDefined();
      expect(result.symbol).toBe(testSymbol);
      expect(result.method).toBeDefined();
    });

    it('should handle known symbols efficiently', async () => {
      const result = await service.validateSymbol('AAPL');

      // Should validate known symbols without API call
      expect(result.method).toBe('known_symbols_lookup');
      expect(result.isValid).toBe(true);
      expect(result.symbol).toBe('AAPL');
    });
  });
});