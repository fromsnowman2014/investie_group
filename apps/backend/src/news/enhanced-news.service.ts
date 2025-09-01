import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface EnhancedNewsArticle {
  provider: string;
  title: string;
  summary: string;
  url: string;
  publishedAt: Date;
  sentiment?: 'positive' | 'negative' | 'neutral';
  relevanceScore: number;
  isRecent: boolean; // Published in last 24 hours
}

export interface EnhancedNewsResult {
  articles: EnhancedNewsArticle[];
  totalCount: number;
  recentCount: number; // Articles from last 24 hours
  sources: string[];
  timestamp: string;
}

@Injectable()
export class EnhancedNewsService {
  private readonly logger = new Logger(EnhancedNewsService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Get enhanced news from multiple sources, prioritizing recent articles
   */
  async getEnhancedStockNews(
    symbol: string,
    limit: number = 15,
  ): Promise<EnhancedNewsResult> {
    this.logger.log(`🔍 Fetching enhanced news for ${symbol}...`);

    const newsPromises = [
      this.getAlphaVantageNews(symbol),
      this.getNewsAPIFinancialNews(symbol),
      this.getPolygonNews(symbol),
      this.getFinnhubNews(symbol),
      this.getMarketauxNews(symbol),
      this.getImprovedSerpAPINews(symbol), // Keep as backup but improved
    ];

    try {
      const newsResults = await Promise.allSettled(newsPromises);
      const allNews: EnhancedNewsArticle[] = [];
      const successfulSources: string[] = [];

      newsResults.forEach((result, index) => {
        const sources = [
          'Alpha Vantage',
          'NewsAPI',
          'Polygon',
          'Finnhub',
          'Marketaux',
          'SerpAPI',
        ];

        if (result.status === 'fulfilled' && result.value.length > 0) {
          allNews.push(...result.value);
          successfulSources.push(sources[index]);
          this.logger.log(
            `✅ ${sources[index]}: ${result.value.length} articles`,
          );
        } else {
          const errorMsg =
            result.status === 'rejected' ? result.reason : 'No articles';
          this.logger.warn(`❌ ${sources[index]} failed: ${errorMsg}`);
        }
      });

      // Sort by recency and relevance
      const rankedNews = this.rankNewsByRecencyAndRelevance(allNews, limit);
      const recentNews = rankedNews.filter((article) => article.isRecent);

      this.logger.log(
        `📊 Total articles: ${rankedNews.length}, Recent (24h): ${recentNews.length}`,
      );

      return {
        articles: rankedNews,
        totalCount: rankedNews.length,
        recentCount: recentNews.length,
        sources: successfulSources,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to fetch enhanced news', error);
      throw error;
    }
  }

  /**
   * Alpha Vantage News & Sentiment API - Very recent financial news
   */
  private async getAlphaVantageNews(
    symbol: string,
  ): Promise<EnhancedNewsArticle[]> {
    const apiKey = this.configService.get<string>('ALPHA_VANTAGE_API_KEY');
    if (!apiKey) {
      this.logger.warn('Alpha Vantage API key not configured');
      return [];
    }

    try {
      const response = await axios.get('https://www.alphavantage.co/query', {
        params: {
          function: 'NEWS_SENTIMENT',
          tickers: symbol,
          topics: 'earnings,technology,finance,ipo',
          time_from: this.getTimeFilter(24), // Last 24 hours
          sort: 'LATEST',
          limit: 50,
          apikey: apiKey,
        },
        timeout: 10000,
      });

      const articles = response.data?.feed || [];

      return articles.map((article) => ({
        provider: 'Alpha Vantage',
        title: article.title,
        summary: article.summary,
        url: article.url,
        publishedAt: new Date(article.time_published),
        sentiment: this.mapAlphaSentiment(article.overall_sentiment_score),
        relevanceScore: this.calculateAlphaRelevance(article, symbol),
        isRecent: this.isRecent(new Date(article.time_published), 24),
      }));
    } catch (error) {
      this.logger.error('Alpha Vantage news failed', error);
      return [];
    }
  }

  /**
   * NewsAPI - Financial news with better filtering for recent articles
   */
  private async getNewsAPIFinancialNews(
    symbol: string,
  ): Promise<EnhancedNewsArticle[]> {
    const apiKey = this.configService.get<string>('NEWS_API_KEY');
    if (!apiKey) {
      this.logger.warn('NewsAPI key not configured');
      return [];
    }

    try {
      const response = await axios.get('https://newsapi.org/v2/everything', {
        params: {
          q: `"${symbol}" AND (stock OR earnings OR financial OR shares)`,
          domains:
            'reuters.com,bloomberg.com,cnbc.com,marketwatch.com,yahoo.com,fool.com,benzinga.com,seekingalpha.com',
          language: 'en',
          sortBy: 'publishedAt',
          from: this.getTimeFilter(48), // Last 48 hours
          pageSize: 30,
          apiKey: apiKey,
        },
        timeout: 10000,
      });

      const articles = response.data?.articles || [];

      return articles.map((article) => ({
        provider: 'NewsAPI',
        title: article.title,
        summary:
          article.description || article.content?.substring(0, 200) + '...',
        url: article.url,
        publishedAt: new Date(article.publishedAt),
        sentiment: 'neutral' as const,
        relevanceScore: this.calculateTextRelevance(
          `${article.title} ${article.description}`,
          symbol,
        ),
        isRecent: this.isRecent(new Date(article.publishedAt), 24),
      }));
    } catch (error) {
      this.logger.error('NewsAPI failed', error);
      return [];
    }
  }

  /**
   * Polygon.io News - High quality, very recent financial news
   */
  private async getPolygonNews(symbol: string): Promise<EnhancedNewsArticle[]> {
    const apiKey = this.configService.get<string>('POLYGON_API_KEY');
    if (!apiKey) {
      this.logger.warn('Polygon API key not configured');
      return [];
    }

    try {
      const response = await axios.get(
        `https://api.polygon.io/v2/reference/news`,
        {
          params: {
            ticker: symbol,
            'published_utc.gte': this.getTimeFilter(72), // Last 3 days
            order: 'desc',
            limit: 50,
            apikey: apiKey,
          },
          timeout: 10000,
        },
      );

      const articles = response.data?.results || [];

      return articles.map((article) => ({
        provider: 'Polygon',
        title: article.title,
        summary: article.description,
        url: article.article_url,
        publishedAt: new Date(article.published_utc),
        sentiment: 'neutral' as const,
        relevanceScore: 0.95, // Polygon is very stock-specific
        isRecent: this.isRecent(new Date(article.published_utc), 24),
      }));
    } catch (error) {
      this.logger.error('Polygon news failed', error);
      return [];
    }
  }

  /**
   * Finnhub News - Real-time market news
   */
  private async getFinnhubNews(symbol: string): Promise<EnhancedNewsArticle[]> {
    const apiKey = this.configService.get<string>('FINNHUB_API_KEY');
    if (!apiKey) {
      this.logger.warn('Finnhub API key not configured');
      return [];
    }

    try {
      const fromUnix = Math.floor((Date.now() - 48 * 60 * 60 * 1000) / 1000); // 48 hours ago
      const toUnix = Math.floor(Date.now() / 1000);

      const response = await axios.get(
        'https://finnhub.io/api/v1/company-news',
        {
          params: {
            symbol: symbol,
            from: fromUnix,
            to: toUnix,
            token: apiKey,
          },
          timeout: 10000,
        },
      );

      const articles = response.data || [];

      return articles.map((article) => ({
        provider: 'Finnhub',
        title: article.headline,
        summary: article.summary,
        url: article.url,
        publishedAt: new Date(article.datetime * 1000),
        sentiment: 'neutral' as const,
        relevanceScore: 0.9,
        isRecent: this.isRecent(new Date(article.datetime * 1000), 24),
      }));
    } catch (error) {
      this.logger.error('Finnhub news failed', error);
      return [];
    }
  }

  /**
   * Marketaux - Another good financial news source
   */
  private async getMarketauxNews(
    symbol: string,
  ): Promise<EnhancedNewsArticle[]> {
    const apiKey = this.configService.get<string>('MARKETAUX_API_KEY');
    if (!apiKey) {
      this.logger.warn('Marketaux API key not configured');
      return [];
    }

    try {
      const response = await axios.get(
        'https://api.marketaux.com/v1/news/all',
        {
          params: {
            symbols: symbol,
            filter_entities: true,
            language: 'en',
            sort: 'published_desc',
            limit: 50,
            published_after: this.getTimeFilter(48),
            api_token: apiKey,
          },
          timeout: 10000,
        },
      );

      const articles = response.data?.data || [];

      return articles.map((article) => ({
        provider: 'Marketaux',
        title: article.title,
        summary: article.description,
        url: article.url,
        publishedAt: new Date(article.published_at),
        sentiment: 'neutral' as const,
        relevanceScore: 0.85,
        isRecent: this.isRecent(new Date(article.published_at), 24),
      }));
    } catch (error) {
      this.logger.error('Marketaux news failed', error);
      return [];
    }
  }

  /**
   * Improved SerpAPI with better time filtering
   */
  private async getImprovedSerpAPINews(
    symbol: string,
  ): Promise<EnhancedNewsArticle[]> {
    const apiKey = this.configService.get<string>('SERP_API_KEY');
    if (!apiKey) {
      this.logger.warn('SerpAPI key not configured');
      return [];
    }

    try {
      const response = await axios.get('https://serpapi.com/search', {
        params: {
          engine: 'google_news',
          q: `"${symbol}" stock news`,
          tbm: 'nws',
          tbs: 'qdr:d', // Last day only!
          num: 20,
          hl: 'en',
          gl: 'us',
          api_key: apiKey,
        },
        timeout: 10000,
      });

      const articles = response.data?.news_results || [];

      return articles.map((article) => ({
        provider: 'SerpAPI (Improved)',
        title: article.title,
        summary: article.snippet,
        url: article.link,
        publishedAt: this.parseSerpDate(article.date),
        sentiment: 'neutral' as const,
        relevanceScore: 0.7,
        isRecent: this.isRecent(this.parseSerpDate(article.date), 24),
      }));
    } catch (error) {
      this.logger.error('Improved SerpAPI news failed', error);
      return [];
    }
  }

  /**
   * Rank news by recency (70%) and relevance (30%)
   */
  private rankNewsByRecencyAndRelevance(
    allNews: EnhancedNewsArticle[],
    limit: number,
  ): EnhancedNewsArticle[] {
    const now = Date.now();

    return allNews
      .filter((news) => {
        const ageHours = (now - news.publishedAt.getTime()) / (1000 * 60 * 60);
        return ageHours <= 72; // Only last 72 hours
      })
      .sort((a, b) => {
        // Calculate recency score (newer = higher score)
        const aAge = (now - a.publishedAt.getTime()) / (1000 * 60 * 60);
        const bAge = (now - b.publishedAt.getTime()) / (1000 * 60 * 60);

        const aRecencyScore = Math.max(0, 1 - aAge / 72);
        const bRecencyScore = Math.max(0, 1 - bAge / 72);

        // Final score: 70% recency + 30% relevance
        const aFinalScore = aRecencyScore * 0.7 + a.relevanceScore * 0.3;
        const bFinalScore = bRecencyScore * 0.7 + b.relevanceScore * 0.3;

        return bFinalScore - aFinalScore;
      })
      .slice(0, limit);
  }

  // Helper methods
  private getTimeFilter(hoursAgo: number): string {
    const date = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
    return date.toISOString().split('T')[0];
  }

  private isRecent(publishedAt: Date, hoursThreshold: number = 24): boolean {
    const ageHours = (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60);
    return ageHours <= hoursThreshold;
  }

  private mapAlphaSentiment(
    score: number,
  ): 'positive' | 'negative' | 'neutral' {
    if (score > 0.1) return 'positive';
    if (score < -0.1) return 'negative';
    return 'neutral';
  }

  private calculateAlphaRelevance(article: any, symbol: string): number {
    let score = 0.5;

    const title = article.title?.toLowerCase() || '';
    const summary = article.summary?.toLowerCase() || '';
    const symbolLower = symbol.toLowerCase();

    if (title.includes(symbolLower)) score += 0.3;
    if (summary.includes(symbolLower)) score += 0.2;
    if (article.ticker_sentiment?.some((t) => t.ticker === symbol))
      score += 0.2;

    return Math.min(1, score);
  }

  private calculateTextRelevance(text: string, symbol: string): number {
    const textLower = text.toLowerCase();
    const symbolLower = symbol.toLowerCase();

    let score = 0.5;
    if (textLower.includes(symbolLower)) score += 0.4;
    if (textLower.includes('stock') || textLower.includes('share'))
      score += 0.1;

    return Math.min(1, score);
  }

  private parseSerpDate(dateStr: string): Date {
    if (!dateStr) return new Date();

    // Handle "X hours ago", "X minutes ago", etc.
    if (
      dateStr.includes('hour') ||
      dateStr.includes('min') ||
      dateStr.includes('ago')
    ) {
      return new Date(); // Assume very recent
    }

    try {
      return new Date(dateStr);
    } catch {
      return new Date();
    }
  }
}
