import { Injectable, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { ClaudeService } from '../ai/claude.service';
import { StockValidatorHelper } from './stock-validator.helper';
import {
  NewsProcessingResult,
  StockSymbol,
  MacroNewsData,
  StockNewsSummary,
  StockOverview,
  SerpApiNewsResult
} from '../common/types';

@Injectable()
export class NewsService {
  private readonly logger = new Logger(NewsService.name);
  private readonly serpApiKey = process.env.SERPAPI_API_KEY;
  private readonly dataDir = path.join(process.cwd(), 'data', 'news');
  private readonly macroNewsDir = path.join(this.dataDir, 'macro_news');
  private readonly stockNewsDir = path.join(this.dataDir, 'stock_news');
  private readonly stockValidator: StockValidatorHelper;

  constructor(
    private readonly claudeService: ClaudeService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {
    this.stockValidator = new StockValidatorHelper();
    this.ensureDirectoryExists(this.dataDir);
    this.ensureDirectoryExists(this.macroNewsDir);
    this.ensureDirectoryExists(this.stockNewsDir);
  }

  async processStockNews(inputSymbol: string): Promise<NewsProcessingResult> {
    try {
      // Step 1-2: Multi-tier symbol validation
      const validationResult = await this.stockValidator.validateSymbol(inputSymbol);
      if (!validationResult.isValid) {
        return {
          isValid: false,
          error: validationResult.reason,
          suggestions: this.stockValidator.getSuggestions(inputSymbol)
        };
      }

      const symbol = validationResult.symbol as StockSymbol;
      const today = this.getTodayDateString();

      // Step 3-4: Load or fetch macro market news
      let macroNews: MacroNewsData | null = null;
      if (!this.hasTodaysMacroNews(today)) {
        macroNews = await this.loadMacroNews(today);
        if (macroNews) this.storeMacroNews(macroNews, today);
      } else {
        macroNews = this.loadStoredMacroNews(today);
      }

      // Step 5: Load or fetch stock-specific news
      let stockNewsData: { summary: StockNewsSummary; articles: SerpApiNewsResult[]; query?: string } | null = null;
      if (!this.hasTodaysStockNews(symbol, today)) {
        stockNewsData = await this.loadStockNews(symbol, today);
        if (stockNewsData) this.storeStockNews(stockNewsData, symbol, today);
      } else {
        stockNewsData = this.loadStoredStockNews(symbol, today);
      }

      // Step 6: Generate comprehensive AI overview
      const overview = await this.generateOverview(symbol, stockNewsData?.summary || null, stockNewsData?.articles || [], macroNews);
      if (overview) {
        this.storeOverview(overview, symbol, today);
        return { 
          isValid: true, 
          symbol, 
          overview, 
          stockNews: stockNewsData ? { 
            headline: stockNewsData.summary.headline,
            source: stockNewsData.summary.source,
            articles: stockNewsData.articles,
            query: stockNewsData.query
          } : undefined,
          macroNews: macroNews || undefined,
          validationResult 
        };
      }

      return { isValid: false, error: 'Failed to generate investment overview' };
    } catch (error) {
      this.logger.error(`News processing failed for ${inputSymbol}: ${error.message}`);
      return { isValid: false, error: 'Internal processing error' };
    }
  }

  async loadMacroNews(date: string): Promise<MacroNewsData | null> {
    if (!this.serpApiKey) {
      this.logger.warn('SerpAPI key not configured, using mock data');
      return this.getMockMacroNews();
    }

    try {
      const macroQuery = 'stock market economy finance business';
      const response = await axios.get('https://serpapi.com/search', {
        params: {
          engine: 'google_news',
          q: macroQuery,
          gl: 'us',
          hl: 'en',
          num: 75,
          api_key: this.serpApiKey,
        },
        timeout: 15000,
      });

      const newsResults = response.data.news_results;
      if (!newsResults?.length) return null;

      // Filter out articles that are too old (older than 30 days) as a backup
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const filteredResults = newsResults.filter(article => {
        if (!article.date) return true; // Keep if no date info
        
        try {
          // Parse the article date (format: "MM/dd/yyyy, hh:mm AM/PM, +0000 UTC")
          const dateParts = article.date.split(', ');
          if (dateParts.length >= 2) {
            const articleDate = new Date(dateParts[0] + ', ' + dateParts[1]);
            return articleDate >= thirtyDaysAgo;
          }
          return true; // Keep if we can't parse properly
        } catch (error) {
          // If we can't parse the date, keep the article
          return true;
        }
      });
      
      this.logger.log(`[Macro News] Filtered out old articles: ${newsResults.length} -> ${filteredResults.length}`);

      return {
        topHeadline: filteredResults[0]?.title || 'Market news',
        articles: filteredResults,
        totalArticles: filteredResults.length,
        source: 'serpapi_google_news',
        timestamp: new Date().toISOString(),
        query: macroQuery
      };
    } catch (error) {
      this.logger.error(`Failed to load macro news: ${error.message}`);
      return this.getMockMacroNews();
    }
  }

  async loadStockNews(symbol: StockSymbol, date: string): Promise<{ summary: StockNewsSummary; articles: SerpApiNewsResult[]; query?: string } | null> {
    if (!this.serpApiKey) {
      this.logger.warn('SerpAPI key not configured, using mock data');
      const mockSummary = this.getMockStockNews(symbol);
      return mockSummary ? { summary: mockSummary, articles: [] } : null;
    }

    try {
      // Get full company name for better search results
      const companyName = await this.getCompanyName(symbol);
      
      // Create shorter, more generic search queries for better coverage
      const searchQueries = [
        `${symbol} news`,
        `${companyName} stock`,
        `${symbol} earnings`,
        `${companyName} today`,
        `${symbol} trending news`
      ];

      this.logger.log(`🔍 Starting enhanced search for ${symbol} (${companyName})`);
      this.logger.log(`🔍 Search queries prepared: ${searchQueries.length} variants`);

      // Try queries until we get good results
      let newsResults: any[] = [];
      let selectedQuery = '';

      for (const query of searchQueries) {
        this.logger.log(`Trying search query: "${query}"`);
        
        try {
          const response = await axios.get('https://serpapi.com/search', {
            params: {
              engine: 'google_news',
              q: query,
              gl: 'us', 
              hl: 'en', 
              num: 25,
              api_key: this.serpApiKey,
            },
            timeout: 15000,
          });

          if (response.data.news_results?.length > 5) {
            newsResults = response.data.news_results;
            selectedQuery = query;
            this.logger.log(`Success with query: "${query}" - ${newsResults.length} articles found`);
            break;
          }
        } catch (queryError) {
          this.logger.warn(`Query failed: "${query}" - ${queryError.message}`);
          continue;
        }
      }

      // If we still don't have enough results, try a simple fallback
      if (newsResults.length < 5) {
        this.logger.log(`Limited results (${newsResults.length}), trying fallback search`);
        
        try {
          const fallbackQuery = `"${companyName}" ${symbol}`;
          const fallbackResponse = await axios.get('https://serpapi.com/search', {
            params: {
              engine: 'google_news',
              q: fallbackQuery,
              gl: 'us', 
              hl: 'en', 
              num: 15,
              api_key: this.serpApiKey,
            },
            timeout: 15000,
          });
          
          if (fallbackResponse.data.news_results?.length > newsResults.length) {
            newsResults = fallbackResponse.data.news_results;
            selectedQuery = fallbackQuery;
            this.logger.log(`Fallback search found ${newsResults.length} articles`);
          }
        } catch (fallbackError) {
          this.logger.warn(`Fallback search failed: ${fallbackError.message}`);
        }
      }

      // Filter out articles that are too old (older than 30 days) as a backup
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const filteredResults = newsResults.filter(article => {
        if (!article.date) return true; // Keep if no date info
        
        try {
          // Parse the article date - try multiple formats
          let articleDate: Date | null = null;
          
          if (article.date.includes(',')) {
            // Format: "MM/dd/yyyy, hh:mm AM/PM, +0000 UTC"
            const dateParts = article.date.split(', ');
            if (dateParts.length >= 2) {
              articleDate = new Date(dateParts[0] + ', ' + dateParts[1]);
            }
          }
          
          if (!articleDate || isNaN(articleDate.getTime())) {
            // Try parsing the full date string
            articleDate = new Date(article.date);
          }
          
          if (!articleDate || isNaN(articleDate.getTime())) {
            // Keep article if we can't parse the date
            return true;
          }
          
          return articleDate >= thirtyDaysAgo;
        } catch (error) {
          // If we can't parse the date, keep the article
          return true;
        }
      });
      
      this.logger.log(`Filtered out old articles: ${newsResults.length} -> ${filteredResults.length}`);
      newsResults = filteredResults;

      if (!newsResults || newsResults.length === 0) {
        this.logger.warn(`No news results found for ${symbol}`);
        return null;
      }

      // Debug: Log some article dates to understand the format
      this.logger.log(`Sample article dates from API:`);
      newsResults.slice(0, 3).forEach((article, index) => {
        this.logger.log(`Article ${index + 1}: "${article.title}" - Date: ${article.date}`);
      });

      const topHeadline = newsResults[0]?.title || `${companyName} trending news`;

      this.logger.log(`Final query used: "${selectedQuery}" - ${newsResults.length} articles returned after filtering`);

      const summary: StockNewsSummary = {
        headline: topHeadline,
        source: 'google_news',
      };

      return {
        summary,
        articles: newsResults,
        query: selectedQuery
      };
    } catch (error) {
      this.logger.error(`Failed to load stock news for ${symbol}: ${error.message}`);
      const mockSummary = this.getMockStockNews(symbol);
      return mockSummary ? { summary: mockSummary, articles: [] } : null;
    }
  }

  async generateOverview(symbol: StockSymbol, stockNews: StockNewsSummary | null, stockArticles: SerpApiNewsResult[], macroNews: MacroNewsData | null): Promise<StockOverview | null> {
    // Try Claude AI first (most sophisticated)
    const claudeResult = await this.analyzeWithClaude(symbol, stockNews, stockArticles, macroNews);
    if (claudeResult) return claudeResult;

    // Final fallback to rule-based analysis
    return this.generateBasicOverview(symbol, stockNews, macroNews);
  }

  async healthCheck(): Promise<{
    status: string;
    serpApiConfigured: boolean;
    claudeConfigured: boolean;
    openaiConfigured: boolean;
  }> {
    const claudeHealth = await this.claudeService.healthCheck();
    
    return {
      status: 'operational',
      serpApiConfigured: !!this.serpApiKey,
      claudeConfigured: claudeHealth.hasApiKey,
      openaiConfigured: false, // OpenAI not implemented yet
    };
  }

  // Private helper methods
  private async getCompanyName(symbol: StockSymbol): Promise<string> {
    // Check cache first (24-hour TTL for company names - they don't change often)
    const cacheKey = `company_name:${symbol}`;
    const cached = await this.cacheManager.get<string>(cacheKey);
    if (cached) return cached;

    try {
      // Try Yahoo Finance API first - it's free and reliable
      const response = await axios.get(`https://query1.finance.yahoo.com/v1/finance/search`, {
        params: { q: symbol, quotesCount: 1, newsCount: 0 },
        timeout: 10000,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Investie/1.0)' }
      });

      if (response.data?.quotes?.[0]?.longname || response.data?.quotes?.[0]?.shortname) {
        const companyName = response.data.quotes[0].longname || response.data.quotes[0].shortname;
        // Cache for 24 hours
        await this.cacheManager.set(cacheKey, companyName, 86400000);
        this.logger.log(`Found company name for ${symbol}: ${companyName}`);
        return companyName;
      }
    } catch (error) {
      this.logger.warn(`Yahoo Finance API failed for ${symbol}: ${error.message}`);
    }

    // Fallback to enhanced static mapping
    const enhancedCompanyMap: Record<string, string> = {
      AAPL: 'Apple Inc',
      TSLA: 'Tesla Inc', 
      MSFT: 'Microsoft Corporation',
      GOOGL: 'Alphabet Inc',
      AMZN: 'Amazon.com Inc',
      NVDA: 'NVIDIA Corporation',
      META: 'Meta Platforms Inc',
      NFLX: 'Netflix Inc',
      AVGO: 'Broadcom Inc',
      AMD: 'Advanced Micro Devices Inc'
    };

    const fallbackName = enhancedCompanyMap[symbol] || symbol;
    // Cache fallback for 1 hour (shorter TTL since it might not be accurate)
    await this.cacheManager.set(cacheKey, fallbackName, 3600000);
    return fallbackName;
  }

  private async analyzeWithClaude(symbol: StockSymbol, stockNews: StockNewsSummary | null, stockArticles: SerpApiNewsResult[], macroNews: MacroNewsData | null): Promise<StockOverview | null> {
    try {
      const prompt = this.buildAnalysisPrompt(symbol, stockNews, stockArticles, macroNews);
      const schema = `{
        "overview": "2-3 sentence analysis of the stock's outlook based on the news",
        "recommendation": "BUY|HOLD|SELL",
        "confidence": 85,
        "keyFactors": ["factor1", "factor2", "factor3"],
        "riskLevel": "LOW|MEDIUM|HIGH",
        "timeHorizon": "1-3 months|3-6 months|6-12 months"
      }`;

      const response = await this.claudeService.generateStructuredResponse<any>(prompt, schema);

      return {
        symbol,
        overview: response.overview || `Analysis for ${symbol}`,
        recommendation: response.recommendation || 'HOLD',
        confidence: response.confidence || 70,
        keyFactors: response.keyFactors || ['Market conditions', 'Company fundamentals'],
        riskLevel: response.riskLevel || 'MEDIUM',
        timeHorizon: response.timeHorizon || '3-6 months',
        source: 'claude_ai_analysis',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`Claude analysis failed for ${symbol}: ${error.message}`);
      return null;
    }
  }

  private buildAnalysisPrompt(symbol: StockSymbol, stockNews: StockNewsSummary | null, stockArticles: SerpApiNewsResult[], macroNews: MacroNewsData | null): string {
    const currentDate = new Date().toISOString().split('T')[0];
    let prompt = `Analyze ${symbol} stock for investment recommendation based on the following comprehensive news data (Analysis Date: ${currentDate}):\n\n`;

    if (stockNews) {
      prompt += `COMPANY-SPECIFIC NEWS:\n- Headline: ${stockNews.headline}\n- Source: ${stockNews.source}\n`;
      
      // Add ALL article titles and content with timing analysis
      if (stockArticles && stockArticles.length > 0) {
        prompt += `\nAll Recent Articles (${stockArticles.length} total):\n`;
        
        // Calculate article recency
        const articlesByRecency = stockArticles.map(article => {
          const articleDate = new Date(article.date);
          const daysDiff = Math.floor((Date.now() - articleDate.getTime()) / (1000 * 60 * 60 * 24));
          return { ...article, daysAgo: daysDiff };
        }).sort((a, b) => a.daysAgo - b.daysAgo);

        // Show ALL article titles with timing information
        prompt += `\nArticle Headlines (with timing):\n`;
        articlesByRecency.forEach((article, index) => {
          const recencyText = article.daysAgo === 0 ? 'Today' : 
                             article.daysAgo === 1 ? '1 day ago' : 
                             `${article.daysAgo} days ago`;
          prompt += `${index + 1}. "${article.title}" (${recencyText} - ${article.date})\n`;
        });
        
        // Add detailed content for most recent articles
        prompt += `\nDetailed Content (Most Recent Articles):\n`;
        articlesByRecency.slice(0, 5).forEach((article, index) => {
          const recencyText = article.daysAgo === 0 ? 'Today' : 
                             article.daysAgo === 1 ? '1 day ago' : 
                             `${article.daysAgo} days ago`;
          prompt += `${index + 1}. "${article.title}" (${recencyText})\n`;
          if (article.snippet) {
            prompt += `   Content: ${article.snippet}\n`;
          }
          prompt += `   Source: ${article.source}\n\n`;
        });
      }
    }

    if (macroNews?.articles && macroNews.articles.length > 0) {
      prompt += `\nMARKET & ECONOMIC NEWS:\n- Top Headline: ${macroNews.topHeadline}\n\nKey Market Articles:\n`;
      macroNews.articles.slice(0, 5).forEach((article, index) => {
        const articleDate = new Date(article.date);
        const daysDiff = Math.floor((Date.now() - articleDate.getTime()) / (1000 * 60 * 60 * 24));
        const recencyText = daysDiff === 0 ? 'Today' : 
                           daysDiff === 1 ? '1 day ago' : 
                           `${daysDiff} days ago`;
        prompt += `${index + 1}. "${article.title}" (${recencyText})\n`;
        if (article.snippet) {
          prompt += `   Content: ${article.snippet}\n`;
        }
        prompt += `   Source: ${article.source}\n\n`;
      });
    }

    return prompt + `
Based on this comprehensive time-aware news analysis with ALL ${stockArticles.length} article headlines and recency information, provide an investment assessment for ${symbol} in JSON format:

CRITICAL TIMING CONSIDERATIONS:
- Analyze the recency of news (today's news vs older articles)
- Consider the momentum and frequency of recent vs older news
- Weight more recent developments more heavily in your analysis
- Identify if there's a trend acceleration or deceleration in news sentiment over time

IMPORTANT: Consider ALL ${stockArticles.length} article headlines in your analysis for:
- Overall sentiment and narrative themes across time periods
- Company-specific developments and their timing
- Market conditions and economic factors with recency weighting
- Industry trends and competitive dynamics evolution
- Risk factors and concerns, especially recent ones
- Growth opportunities or strategic initiatives and their timing
- Frequency and consistency of positive/negative themes across different time periods
- Overall news momentum and timing patterns for stock price impact predictions

Generate keyFactors that reflect insights from the complete set of articles with emphasis on timing and recency patterns.`;
  }

  private generateBasicOverview(symbol: StockSymbol, stockNews: StockNewsSummary | null, macroNews: MacroNewsData | null): StockOverview {
    const keyFactors: string[] = [];
    let confidence = 50;

    if (stockNews?.headline) {
      keyFactors.push('Company-specific news data available');
      confidence += 10;
    }

    if (macroNews?.articles && macroNews.articles.length > 0) {
      keyFactors.push('Market news context available');
      confidence += 5;
    }

    keyFactors.push('Technical analysis pending', 'Fundamental review needed');

    return {
      symbol,
      recommendation: 'HOLD',
      confidence: Math.max(30, Math.min(confidence, 70)),
      overview: `Unable to perform AI-powered analysis for ${symbol}. Recommend manual research.`,
      keyFactors,
      riskLevel: 'MEDIUM',
      timeHorizon: '3-6 months',
      source: 'fallback_data_analysis',
      timestamp: new Date().toISOString()
    };
  }

  // File system helper methods
  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  private getTodayDateString(): string {
    return new Date().toISOString().split('T')[0];
  }

  private hasTodaysMacroNews(date: string): boolean {
    const macroPath = path.join(this.macroNewsDir, date, 'macro_news.json');
    return fs.existsSync(macroPath);
  }

  private hasTodaysStockNews(symbol: StockSymbol, date: string): boolean {
    const stockPath = path.join(this.stockNewsDir, symbol, date, 'stock_news.json');
    return fs.existsSync(stockPath);
  }

  private storeMacroNews(macroNews: MacroNewsData, date: string): void {
    const macroDir = path.join(this.macroNewsDir, date);
    this.ensureDirectoryExists(macroDir);

    const storeData = {
      date, timestamp: macroNews.timestamp,
      query: 'stock market economy finance business',
      topHeadline: macroNews.topHeadline,
      totalArticles: macroNews.totalArticles,
      articles: macroNews.articles,
      metadata: { source: macroNews.source, cached: false }
    };

    fs.writeFileSync(path.join(macroDir, 'macro_news.json'), JSON.stringify(storeData, null, 2));
  }

  private storeStockNews(stockNewsData: { summary: StockNewsSummary; articles: SerpApiNewsResult[]; query?: string }, symbol: StockSymbol, date: string): void {
    const stockDir = path.join(this.stockNewsDir, symbol, date);
    this.ensureDirectoryExists(stockDir);

    const storeData = {
      symbol, date, timestamp: new Date().toISOString(),
      query: stockNewsData.query || `${symbol} enhanced search`,
      summary: { 
        headline: stockNewsData.summary.headline, 
        source: stockNewsData.summary.source 
      },
      articles: stockNewsData.articles,
      metadata: { source: stockNewsData.summary.source, cached: false }
    };

    fs.writeFileSync(path.join(stockDir, 'stock_news.json'), JSON.stringify(storeData, null, 2));
  }

  private storeOverview(overview: StockOverview, symbol: StockSymbol, date: string): void {
    const stockDir = path.join(this.stockNewsDir, symbol, date);
    this.ensureDirectoryExists(stockDir);
    fs.writeFileSync(path.join(stockDir, 'overview.json'), JSON.stringify(overview, null, 2));
  }

  private loadStoredMacroNews(date: string): MacroNewsData | null {
    try {
      const macroPath = path.join(this.macroNewsDir, date, 'macro_news.json');
      const data = JSON.parse(fs.readFileSync(macroPath, 'utf8'));
      return {
        topHeadline: data.topHeadline,
        articles: data.articles,
        totalArticles: data.totalArticles,
        source: data.source,
        timestamp: data.timestamp
      };
    } catch (error) {
      return null;
    }
  }

  private loadStoredStockNews(symbol: StockSymbol, date: string): { summary: StockNewsSummary; articles: SerpApiNewsResult[]; query?: string } | null {
    try {
      const stockPath = path.join(this.stockNewsDir, symbol, date, 'stock_news.json');
      const data = JSON.parse(fs.readFileSync(stockPath, 'utf8'));
      return {
        summary: {
          headline: data.summary.headline,
          source: data.summary.source
        },
        articles: data.articles || [],
        query: data.query
      };
    } catch (error) {
      return null;
    }
  }

  // Mock data methods
  private getMockMacroNews(): MacroNewsData {
    return {
      topHeadline: 'Markets show mixed signals amid economic uncertainty',
      articles: [
        {
          title: 'Markets show mixed signals amid economic uncertainty',
          link: 'https://example.com/news1',
          snippet: 'Economic indicators suggest cautious optimism',
          date: new Date().toISOString(),
          source: 'MockNews'
        }
      ],
      totalArticles: 1,
      source: 'mock_data',
      timestamp: new Date().toISOString(),
      query: 'stock market economy finance business'
    };
  }

  private getMockStockNews(symbol: StockSymbol): StockNewsSummary {
    const mockHeadlines: Record<string, string> = {
      'AAPL': 'Apple reports strong quarterly earnings with Services growth',
      'TSLA': 'Tesla expands charging network amid EV competition',
      'NVDA': 'NVIDIA sees continued AI chip demand growth',
      'GOOGL': 'Google Cloud revenue acceleration continues',
      'MSFT': 'Microsoft Azure gains market share in cloud computing'
    };

    return {
      headline: mockHeadlines[symbol] || `${symbol} company updates`,
      source: 'mock_data'
    };
  }
}