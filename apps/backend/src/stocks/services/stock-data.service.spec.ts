import { Test, TestingModule } from '@nestjs/testing';
import { StockDataService } from './stock-data.service';
import { StockValidationService } from './stock-validation.service';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('StockDataService', () => {
  let service: StockDataService;
  let validationService: jest.Mocked<StockValidationService>;

  beforeEach(async () => {
    const mockValidationService = {
      validateSymbol: jest.fn(),
      validateStockData: jest.fn(),
      isValidMarketCapFormat: jest.fn(),
      getSupportedSymbols: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockDataService,
        {
          provide: StockValidationService,
          useValue: mockValidationService,
        },
      ],
    }).compile();

    service = module.get<StockDataService>(StockDataService);
    validationService = module.get(StockValidationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getStockData', () => {
    beforeEach(() => {
      validationService.validateSymbol.mockReturnValue(true);
    });

    it('should return mock data when API key is not configured', async () => {
      const result = await service.getStockData('AAPL');

      expect(result).toBeDefined();
      expect(result.price).toBeDefined();
      expect(result.source).toBeDefined();
    });

    it('should fetch data from Alpha Vantage when API key is configured', async () => {
      process.env.ALPHA_VANTAGE_API_KEY = 'test-key';
      
      const mockQuoteResponse = {
        data: {
          'Global Quote': {
            '05. price': '150.00',
            '09. change': '2.50',
            '10. change percent': '1.69%',
            '06. volume': '50000000',
          },
        },
      };

      const mockOverviewResponse = {
        data: {
          Symbol: 'AAPL',
          MarketCapitalization: '2.4T',
          PERatio: '25.5',
          '52WeekHigh': '180.00',
          '52WeekLow': '120.00',
        },
      };

      mockedAxios.get
        .mockResolvedValueOnce(mockQuoteResponse)
        .mockResolvedValueOnce(mockOverviewResponse);

      const result = await service.getStockData('AAPL');

      expect(result).toBeDefined();
      expect(result.price).toBe(150.00);
      expect(result.change).toBe(2.50);
      expect(result.changePercent).toBe(1.69);
      expect(result.source).toBe('alpha_vantage');

      delete process.env.ALPHA_VANTAGE_API_KEY;
    });

    it('should fallback to mock data when API fails', async () => {
      process.env.ALPHA_VANTAGE_API_KEY = 'test-key';
      mockedAxios.get.mockRejectedValue(new Error('API Error'));

      const result = await service.getStockData('AAPL');

      expect(result).toBeDefined();
      expect(result.source).not.toBe('alpha_vantage');

      delete process.env.ALPHA_VANTAGE_API_KEY;
    });
  });

  describe('getAlphaVantageQuote', () => {
    beforeEach(() => {
      process.env.ALPHA_VANTAGE_API_KEY = 'test-key';
    });

    afterEach(() => {
      delete process.env.ALPHA_VANTAGE_API_KEY;
    });

    it('should return quote data for valid symbol', async () => {
      const mockResponse = {
        data: {
          'Global Quote': {
            '05. price': '150.00',
            '09. change': '2.50',
            '10. change percent': '1.69%',
            '06. volume': '50000000',
          },
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await service.getAlphaVantageQuote('AAPL');

      expect(result).toBeDefined();
      expect(result!['05. price']).toBe('150.00');
    });

    it('should return null when API returns empty data', async () => {
      const mockResponse = {
        data: {
          'Global Quote': {},
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await service.getAlphaVantageQuote('AAPL');

      expect(result).toBeNull();
    });
  });

  describe('getAlphaVantageOverview', () => {
    beforeEach(() => {
      process.env.ALPHA_VANTAGE_API_KEY = 'test-key';
    });

    afterEach(() => {
      delete process.env.ALPHA_VANTAGE_API_KEY;
    });

    it('should return overview data for valid symbol', async () => {
      const mockResponse = {
        data: {
          Symbol: 'AAPL',
          MarketCapitalization: '2.4T',
          PERatio: '25.5',
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await service.getAlphaVantageOverview('AAPL');

      expect(result).toBeDefined();
      expect(result!.Symbol).toBe('AAPL');
    });

    it('should return null when symbol does not match', async () => {
      const mockResponse = {
        data: {
          Symbol: 'WRONG',
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await service.getAlphaVantageOverview('AAPL');

      expect(result).toBeNull();
    });
  });
});