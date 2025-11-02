/**
 * Claude News Summarizer Tests
 *
 * Test suite for Claude AI news summarization functionality
 */

import { summarizeNewsWithClaude, type NewsSummary } from '../claude-news-summarizer';
import type { SerpApiNewsArticle } from '../serpapi-client';

// Mock Anthropic SDK
jest.mock('@anthropic-ai/sdk', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      messages: {
        create: jest.fn(),
      },
    })),
  };
});

import Anthropic from '@anthropic-ai/sdk';

describe('Claude News Summarizer', () => {
  const mockApiKey = 'test-claude-api-key';
  const originalEnv = process.env;

  const mockArticles: SerpApiNewsArticle[] = [
    {
      title: 'Apple announces record iPhone sales',
      link: 'https://example.com/1',
      snippet: 'Apple Inc. reported strong iPhone sales in Q4.',
      source: 'Bloomberg',
      date: '1 day ago',
    },
    {
      title: 'Apple stock rises on services growth',
      link: 'https://example.com/2',
      snippet: 'Services division shows 15% YoY growth.',
      source: 'CNBC',
      date: '2 days ago',
    },
  ];

  beforeEach(() => {
    jest.resetAllMocks();
    process.env = { ...originalEnv, CLAUDE_API_KEY: mockApiKey };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('summarizeNewsWithClaude', () => {
    it('should generate summary from valid articles', async () => {
      const mockClaudeResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              sentiment: 'positive',
              sentimentScore: 85,
              keyPoints: [
                'iPhone sales exceeded expectations in Q4',
                'Services division growing at 15% YoY',
                'Strong customer retention in ecosystem',
              ],
              topics: ['iPhone Sales', 'Services Growth', 'Earnings'],
              marketImpact: 'Positive momentum expected to continue into next quarter.',
            }),
          },
        ],
      };

      const mockCreate = jest.fn().mockResolvedValue(mockClaudeResponse);
      (Anthropic as jest.Mock).mockImplementation(() => ({
        messages: { create: mockCreate },
      }));

      const result = await summarizeNewsWithClaude('AAPL', mockArticles);

      expect(result).toEqual({
        overallSentiment: 'positive',
        sentimentScore: 85,
        keyPoints: [
          'iPhone sales exceeded expectations in Q4',
          'Services division growing at 15% YoY',
          'Strong customer retention in ecosystem',
        ],
        trendingTopics: ['iPhone Sales', 'Services Growth', 'Earnings'],
        marketImpact: 'Positive momentum expected to continue into next quarter.',
      });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'claude-sonnet-4-5-20250929',
          temperature: 0.3,
        })
      );
    });

    it('should throw error when API key is missing', async () => {
      delete process.env.CLAUDE_API_KEY;

      await expect(summarizeNewsWithClaude('AAPL', mockArticles)).rejects.toThrow(
        'CLAUDE_API_KEY is not configured'
      );
    });

    it('should handle empty article list', async () => {
      const result = await summarizeNewsWithClaude('AAPL', []);

      expect(result).toEqual({
        overallSentiment: 'neutral',
        sentimentScore: 50,
        keyPoints: ['No recent news articles found for this stock.'],
        trendingTopics: ['No Data'],
        marketImpact: 'Insufficient data to assess market impact.',
      });
    });

    it('should determine correct sentiment', async () => {
      const mockClaudeResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              sentiment: 'negative',
              sentimentScore: 25,
              keyPoints: ['Stock price declining', 'Revenue miss'],
              topics: ['Earnings Miss'],
              marketImpact: 'Negative outlook persists.',
            }),
          },
        ],
      };

      const mockCreate = jest.fn().mockResolvedValue(mockClaudeResponse);
      (Anthropic as jest.Mock).mockImplementation(() => ({
        messages: { create: mockCreate },
      }));

      const result = await summarizeNewsWithClaude('AAPL', mockArticles);

      expect(result.overallSentiment).toBe('negative');
      expect(result.sentimentScore).toBe(25);
    });

    it('should limit key points to 10 items', async () => {
      const mockClaudeResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              sentiment: 'positive',
              sentimentScore: 80,
              keyPoints: Array.from({ length: 15 }, (_, i) => `Point ${i + 1}`),
              topics: ['Topic 1'],
              marketImpact: 'Impact',
            }),
          },
        ],
      };

      const mockCreate = jest.fn().mockResolvedValue(mockClaudeResponse);
      (Anthropic as jest.Mock).mockImplementation(() => ({
        messages: { create: mockCreate },
      }));

      const result = await summarizeNewsWithClaude('AAPL', mockArticles);

      expect(result.keyPoints).toHaveLength(10);
    });

    it('should limit topics to 5 items', async () => {
      const mockClaudeResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              sentiment: 'neutral',
              sentimentScore: 50,
              keyPoints: ['Point 1'],
              topics: Array.from({ length: 8 }, (_, i) => `Topic ${i + 1}`),
              marketImpact: 'Impact',
            }),
          },
        ],
      };

      const mockCreate = jest.fn().mockResolvedValue(mockClaudeResponse);
      (Anthropic as jest.Mock).mockImplementation(() => ({
        messages: { create: mockCreate },
      }));

      const result = await summarizeNewsWithClaude('AAPL', mockArticles);

      expect(result.trendingTopics.length).toBeLessThanOrEqual(5);
    });

    it('should handle Claude API errors', async () => {
      const mockCreate = jest.fn().mockRejectedValue(new Error('API Error'));
      (Anthropic as jest.Mock).mockImplementation(() => ({
        messages: { create: mockCreate },
      }));

      await expect(summarizeNewsWithClaude('AAPL', mockArticles)).rejects.toThrow(
        'Failed to summarize news with Claude AI'
      );
    });

    it('should handle malformed JSON response', async () => {
      const mockClaudeResponse = {
        content: [
          {
            type: 'text',
            text: 'This is not valid JSON',
          },
        ],
      };

      const mockCreate = jest.fn().mockResolvedValue(mockClaudeResponse);
      (Anthropic as jest.Mock).mockImplementation(() => ({
        messages: { create: mockCreate },
      }));

      await expect(summarizeNewsWithClaude('AAPL', mockArticles)).rejects.toThrow(
        'No JSON found in Claude response'
      );
    });

    it('should extract JSON from markdown-wrapped response', async () => {
      const mockClaudeResponse = {
        content: [
          {
            type: 'text',
            text: `Here's the analysis:
\`\`\`json
${JSON.stringify({
  sentiment: 'positive',
  sentimentScore: 75,
  keyPoints: ['Point 1'],
  topics: ['Topic 1'],
  marketImpact: 'Impact',
})}
\`\`\``,
          },
        ],
      };

      const mockCreate = jest.fn().mockResolvedValue(mockClaudeResponse);
      (Anthropic as jest.Mock).mockImplementation(() => ({
        messages: { create: mockCreate },
      }));

      const result = await summarizeNewsWithClaude('AAPL', mockArticles);

      expect(result.overallSentiment).toBe('positive');
      expect(result.sentimentScore).toBe(75);
    });

    it('should validate sentiment score bounds', async () => {
      const mockClaudeResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              sentiment: 'positive',
              sentimentScore: 150, // Invalid: too high
              keyPoints: ['Point'],
              topics: ['Topic'],
              marketImpact: 'Impact',
            }),
          },
        ],
      };

      const mockCreate = jest.fn().mockResolvedValue(mockClaudeResponse);
      (Anthropic as jest.Mock).mockImplementation(() => ({
        messages: { create: mockCreate },
      }));

      const result = await summarizeNewsWithClaude('AAPL', mockArticles);

      expect(result.sentimentScore).toBe(100); // Should be clamped to 100
    });

    it('should handle missing key points with default', async () => {
      const mockClaudeResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              sentiment: 'neutral',
              sentimentScore: 50,
              keyPoints: [],
              topics: ['Topic'],
              marketImpact: 'Impact',
            }),
          },
        ],
      };

      const mockCreate = jest.fn().mockResolvedValue(mockClaudeResponse);
      (Anthropic as jest.Mock).mockImplementation(() => ({
        messages: { create: mockCreate },
      }));

      const result = await summarizeNewsWithClaude('AAPL', mockArticles);

      expect(result.keyPoints).toHaveLength(1);
      expect(result.keyPoints[0]).toContain('no specific insights');
    });
  });
});
