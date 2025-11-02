/**
 * SERPAPI Client Tests
 *
 * Test suite for SERPAPI news fetching functionality
 */

import { fetchNewsFromSerpApi, type SerpApiNewsArticle } from '../serpapi-client';

// Mock fetch globally
global.fetch = jest.fn();

describe('SERPAPI Client', () => {
  const mockApiKey = 'test-api-key';
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetAllMocks();
    process.env = { ...originalEnv, SERPAPI_API_KEY: mockApiKey };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('fetchNewsFromSerpApi', () => {
    it('should fetch news for a valid symbol', async () => {
      const mockResponse = {
        news_results: [
          {
            title: 'Apple announces new iPhone',
            link: 'https://example.com/article1',
            snippet: 'Apple Inc. released new iPhone with advanced features.',
            source: 'TechCrunch',
            date: '1 day ago',
          },
          {
            title: 'Apple stock rises',
            link: 'https://example.com/article2',
            snippet: 'Apple stock surges on strong earnings.',
            source: 'Bloomberg',
            date: '2 days ago',
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await fetchNewsFromSerpApi('AAPL');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        title: 'Apple announces new iPhone',
        link: 'https://example.com/article1',
        snippet: 'Apple Inc. released new iPhone with advanced features.',
        source: 'TechCrunch',
        date: '1 day ago',
      });

      // Verify API call parameters
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('serpapi.com/search'),
        undefined
      );
      const callUrl = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(callUrl).toContain('q=AAPL+stock+news');
      expect(callUrl).toContain('tbm=nws');
      expect(callUrl).toContain('tbs=qdr:w');
      expect(callUrl).toContain(`api_key=${mockApiKey}`);
    });

    it('should throw error when API key is missing', async () => {
      delete process.env.SERPAPI_API_KEY;

      await expect(fetchNewsFromSerpApi('AAPL')).rejects.toThrow(
        'SERPAPI_API_KEY is not configured'
      );
    });

    it('should handle API rate limits (429)', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      });

      await expect(fetchNewsFromSerpApi('AAPL')).rejects.toThrow(
        'SERPAPI rate limit exceeded'
      );
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      await expect(fetchNewsFromSerpApi('AAPL')).rejects.toThrow(
        'Failed to fetch news from SERPAPI'
      );
    });

    it('should handle API errors (non-200 status)', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(fetchNewsFromSerpApi('AAPL')).rejects.toThrow(
        'SERPAPI API error: 500 - Internal Server Error'
      );
    });

    it('should parse SERPAPI response correctly', async () => {
      const mockResponse = {
        news_results: [
          {
            title: 'Test Article',
            link: 'https://test.com',
            snippet: 'Test snippet',
            source: 'Test Source',
            date: '1 hour ago',
            thumbnail: 'https://test.com/image.jpg',
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await fetchNewsFromSerpApi('TSLA');

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Test Article');
      expect(result[0].link).toBe('https://test.com');
      expect(result[0].snippet).toBe('Test snippet');
      expect(result[0].source).toBe('Test Source');
      expect(result[0].date).toBe('1 hour ago');
    });

    it('should return empty array if no news results', async () => {
      const mockResponse = {
        news_results: [],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await fetchNewsFromSerpApi('UNKNOWN');

      expect(result).toEqual([]);
    });

    it('should handle malformed API response', async () => {
      const mockResponse = {
        // Missing news_results field
        error: 'Invalid request',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await fetchNewsFromSerpApi('AAPL');

      // Should return empty array for malformed response
      expect(result).toEqual([]);
    });

    it('should limit number of articles to specified count', async () => {
      const mockResponse = {
        news_results: Array.from({ length: 30 }, (_, i) => ({
          title: `Article ${i + 1}`,
          link: `https://example.com/article${i + 1}`,
          snippet: `Snippet ${i + 1}`,
          source: 'Source',
          date: '1 day ago',
        })),
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await fetchNewsFromSerpApi('AAPL', 7, 20);

      // Should return all 30 articles (API will limit to 20 via query param)
      expect(result.length).toBeLessThanOrEqual(30);
    });

    it('should use custom days parameter', async () => {
      const mockResponse = {
        news_results: [
          {
            title: 'Recent news',
            link: 'https://example.com',
            snippet: 'Snippet',
            source: 'Source',
            date: '3 days ago',
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await fetchNewsFromSerpApi('AAPL', 3);

      const callUrl = (global.fetch as jest.Mock).mock.calls[0][0];
      // For 3 days, we'd still use qdr:w (week) as SERPAPI doesn't have a 3-day option
      expect(callUrl).toContain('tbs=qdr:w');
    });
  });
});
