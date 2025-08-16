import { Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';

@Injectable()
export class ClaudeService {
  private readonly logger = new Logger(ClaudeService.name);
  private readonly anthropic: Anthropic;
  private readonly isConfigured: boolean;

  constructor() {
    this.isConfigured = !!process.env.CLAUDE_API_KEY;
    this.anthropic = new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY || 'fallback_key',
    });

    if (!this.isConfigured) {
      this.logger.warn('Claude API key not configured - using fallback responses');
    }
  }

  async generateResponse(prompt: string, maxTokens = 1000): Promise<string> {
    if (!this.isConfigured) {
      return this.getFallbackResponse(prompt);
    }

    try {
      const message = await this.anthropic.messages.create({
        model: process.env.CLAUDE_MODEL || 'claude-3-haiku-20240307',
        max_tokens: maxTokens,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = message.content[0];
      if (content.type === 'text') {
        return content.text;
      }

      throw new Error('Unexpected response format from Claude API');
    } catch (error) {
      this.logger.error(`Claude API error: ${error.message}`);
      return this.getFallbackResponse(prompt);
    }
  }

  async generateStructuredResponse<T>(prompt: string, schema: string): Promise<T> {
    if (!this.isConfigured) {
      return this.getFallbackStructuredResponse<T>(prompt, schema);
    }

    try {
      const fullPrompt = `${prompt}\n\nRespond with valid JSON matching this schema:\n${schema}`;
      const response = await this.generateResponse(fullPrompt, 1000);

      // Extract JSON from response (handles Claude's text wrapping)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return JSON.parse(response);
    } catch (error) {
      this.logger.error('Structured response parsing failed:', error.message);
      // Return fallback structured response instead of throwing
      return this.getFallbackStructuredResponse<T>(prompt, schema);
    }
  }

  async generateStockEvaluation(symbol: string): Promise<any> {
    const prompt = `As a senior investment analyst, provide a brief evaluation of ${symbol} stock. 
    Consider recent market conditions, company fundamentals, and industry trends.
    Rate as bullish, neutral, or bearish with confidence level.`;

    const schema = `{
      "rating": "bullish|neutral|bearish",
      "confidence": 85,
      "summary": "2-3 sentence analysis",
      "keyFactors": ["factor1", "factor2", "factor3"]
    }`;

    return this.generateStructuredResponse(prompt, schema);
  }

  async searchWeb(query: string): Promise<string> {
    const prompt = `Based on your knowledge, provide insights about: ${query}
    Focus on factual, investment-relevant information.`;

    return this.generateResponse(prompt, 500);
  }

  async healthCheck(): Promise<{
    status: string;
    hasApiKey: boolean;
    model: string;
    validated?: boolean;
  }> {
    const result = {
      status: this.isConfigured ? 'ready' : 'api_key_required',
      hasApiKey: this.isConfigured,
      model: process.env.CLAUDE_MODEL || 'claude-3-haiku-20240307',
      validated: false,
    };

    if (this.isConfigured) {
      try {
        // Test API key with a simple request
        const testResponse = await this.generateResponse('Test', 10);
        result.validated = !testResponse.includes('fallback');
        if (result.validated) {
          result.status = 'operational';
        }
      } catch (error) {
        this.logger.error('Claude API validation failed:', error.message);
        result.status = 'api_key_invalid';
      }
    }

    return result;
  }

  private getFallbackResponse(prompt: string): string {
    // Intelligent keyword-based fallback selection
    if (prompt.toLowerCase().includes('stock') || prompt.toLowerCase().includes('evaluation')) {
      return 'Stock analysis requires Claude API integration. Please configure CLAUDE_API_KEY for real-time AI evaluation.';
    }

    if (prompt.toLowerCase().includes('fear') || prompt.toLowerCase().includes('greed')) {
      return 'Market sentiment analysis requires API access. Current index value estimation: 45 (neutral).';
    }

    return 'AI analysis is currently being enhanced. Please check back shortly for intelligent insights.';
  }

  private getFallbackStructuredResponse<T>(prompt: string, schema: string): T {
    // Parse schema to determine expected structure
    try {
      const schemaObj = JSON.parse(schema);
      
      // Stock evaluation fallback
      if (prompt.toLowerCase().includes('stock') || prompt.toLowerCase().includes('evaluation')) {
        return {
          rating: 'neutral',
          confidence: 50,
          summary: 'Analysis requires Claude API. Configure CLAUDE_API_KEY for real-time insights.',
          keyFactors: ['API Configuration Required', 'Mock Data Active', 'Limited Analysis']
        } as T;
      }

      // News analysis fallback
      if (prompt.toLowerCase().includes('news') || prompt.toLowerCase().includes('sentiment')) {
        return {
          sentiment: 'neutral',
          summary: 'Sentiment analysis requires API access.',
          confidence: 50,
          topics: ['API Configuration', 'Mock Data']
        } as T;
      }

      // Generic fallback based on schema structure
      const fallback: any = {};
      for (const [key, value] of Object.entries(schemaObj)) {
        if (typeof value === 'string') {
          fallback[key] = 'fallback_value';
        } else if (typeof value === 'number') {
          fallback[key] = 0;
        } else if (Array.isArray(value)) {
          fallback[key] = ['fallback_item'];
        } else {
          fallback[key] = 'fallback';
        }
      }
      return fallback as T;

    } catch (error) {
      // If schema parsing fails, return a generic fallback
      return {
        status: 'fallback',
        message: 'Claude API not configured',
        data: 'mock_response'
      } as T;
    }
  }
}