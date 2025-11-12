/**
 * Claude AI News Summarizer
 *
 * Analyzes and summarizes stock news articles using Claude AI
 */

import Anthropic from '@anthropic-ai/sdk';
import type { SerpApiNewsArticle } from './serpapi-client';

export interface KeyPointWithSource {
  text: string;
  articleIndices: number[]; // References to source articles (0-indexed)
}

export interface NewsSummary {
  overallSentiment: 'positive' | 'negative' | 'neutral';
  sentimentScore: number; // 0-100
  keyPoints: KeyPointWithSource[]; // 7-10 concise bullet points with source references
  trendingTopics: string[]; // Top 3-5 topics
  marketImpact: string; // Single sentence impact assessment
}

interface ClaudeKeyPoint {
  text: string;
  sources: number[]; // Article indices (1-based from Claude's perspective)
}

interface ClaudeAnalysisResponse {
  sentiment: 'positive' | 'negative' | 'neutral';
  sentimentScore: number;
  keyPoints: ClaudeKeyPoint[];
  topics: string[];
  marketImpact: string;
}

/**
 * Summarizes news articles using Claude AI
 *
 * @param symbol - Stock symbol (e.g., "AAPL")
 * @param articles - Array of news articles from SERPAPI
 * @returns AI-generated news summary
 * @throws Error if Claude API key is missing or API call fails
 */
export async function summarizeNewsWithClaude(
  symbol: string,
  articles: SerpApiNewsArticle[]
): Promise<NewsSummary> {
  // Validate API key
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    throw new Error('CLAUDE_API_KEY is not configured');
  }

  // Handle empty article list
  if (articles.length === 0) {
    return {
      overallSentiment: 'neutral',
      sentimentScore: 50,
      keyPoints: [{ text: 'No recent news articles found for this stock.', articleIndices: [] }],
      trendingTopics: ['No Data'],
      marketImpact: 'Insufficient data to assess market impact.',
    };
  }

  // Initialize Anthropic client
  const anthropic = new Anthropic({
    apiKey: apiKey,
  });

  // Prepare articles for Claude
  const articlesContext = articles
    .map(
      (article, index) =>
        `Article ${index + 1}:
Title: ${article.title}
Source: ${article.source}
Date: ${article.date}
Summary: ${article.snippet}
`
    )
    .join('\n---\n\n');

  // Construct prompt
  const systemPrompt = `You are a financial news analyst with deep expertise in stock market analysis.
Your task is to analyze news articles and provide concise, actionable insights for investors.
Always respond with valid JSON matching the specified structure.`;

  const userPrompt = `Analyze these ${articles.length} news articles for ${symbol} stock from the past 7 days and provide a comprehensive summary.

${articlesContext}

Provide your analysis as a JSON object with the following structure:
{
  "sentiment": "positive" | "negative" | "neutral",
  "sentimentScore": <number 0-100>,
  "keyPoints": [
    {
      "text": "<concise bullet point, max 120 characters>",
      "sources": [<array of article numbers that support this insight>]
    }
  ],
  "topics": [<3-5 trending topics as short phrases>],
  "marketImpact": "<single sentence assessment of market impact>"
}

Guidelines:
- sentiment: Overall sentiment from all articles (positive/negative/neutral)
- sentimentScore: 0-100 scale (0=very negative, 50=neutral, 100=very positive)
- keyPoints: 7-10 most important insights with source article references
  - Each keyPoint must include "text" (the insight) and "sources" (array of article numbers)
  - Article numbers are 1-based (Article 1, Article 2, etc.)
  - Include 1-3 source articles per insight
- topics: 3-5 recurring themes or topics from the news
- marketImpact: One clear sentence about expected market impact

Be concise, factual, and avoid speculation. Focus on data-driven insights.`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2048,
      temperature: 0.3, // Lower temperature for more consistent, factual responses
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      system: systemPrompt,
    });

    // Extract text content from Claude's response
    const responseContent = message.content[0];
    if (responseContent.type !== 'text') {
      throw new Error('Unexpected response type from Claude API');
    }

    const responseText = responseContent.text;

    // Parse JSON response
    let analysisResult: ClaudeAnalysisResponse;
    try {
      // Extract JSON from response (in case Claude wraps it in markdown)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in Claude response');
      }
      analysisResult = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Failed to parse Claude response:', responseText);
      throw new Error('Failed to parse Claude AI response as JSON');
    }

    // Validate and transform response
    const summary: NewsSummary = {
      overallSentiment: validateSentiment(analysisResult.sentiment),
      sentimentScore: Math.max(0, Math.min(100, analysisResult.sentimentScore || 50)),
      keyPoints: (analysisResult.keyPoints || [])
        .slice(0, 10)
        .filter((point) => point && point.text && point.text.trim().length > 0)
        .map((point) => ({
          text: point.text,
          // Convert 1-based article numbers from Claude to 0-based array indices
          articleIndices: (point.sources || [])
            .map((articleNum) => articleNum - 1)
            .filter((idx) => idx >= 0 && idx < articles.length),
        })),
      trendingTopics: (analysisResult.topics || [])
        .slice(0, 5)
        .filter((topic) => topic && topic.trim().length > 0),
      marketImpact:
        analysisResult.marketImpact ||
        'Market impact assessment unavailable.',
    };

    // Ensure at least one key point exists
    if (summary.keyPoints.length === 0) {
      summary.keyPoints = [
        {
          text: 'News analysis completed but no specific insights generated.',
          articleIndices: [],
        },
      ];
    }

    // Ensure at least one topic exists
    if (summary.trendingTopics.length === 0) {
      summary.trendingTopics = ['General Market News'];
    }

    return summary;
  } catch (error) {
    // Handle Claude API errors
    if (error instanceof Error) {
      if (error.message.includes('CLAUDE')) {
        // Re-throw Claude-specific errors
        throw error;
      }
      // Wrap other errors
      throw new Error(`Failed to summarize news with Claude AI: ${error.message}`);
    }
    throw new Error('Failed to summarize news with Claude AI: Unknown error');
  }
}

/**
 * Validates and normalizes sentiment value
 */
function validateSentiment(
  sentiment: string
): 'positive' | 'negative' | 'neutral' {
  const normalized = sentiment.toLowerCase();
  if (normalized === 'positive' || normalized === 'negative') {
    return normalized as 'positive' | 'negative';
  }
  return 'neutral';
}
