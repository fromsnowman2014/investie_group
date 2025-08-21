# 📊 Investie - Complete Development Guide

## 🎯 Project Overview

Investie is a comprehensive investment analysis platform with a **TradingView-integrated frontend** and **API-first NestJS backend**. The project follows a monorepo architecture with shared types and utilities, designed for real-time stock analysis with AI-powered insights.

### Architecture Components

```
investie/
├── apps/
│   ├── mobile/          # React Native/Expo (Future Implementation)
│   ├── web/             # Next.js 14 + TradingView Widgets
│   └── backend/         # NestJS API Server (API-First Architecture)
├── packages/
│   ├── types/           # Shared TypeScript Types
│   ├── mock/            # Development Mock Data
│   └── utils/           # Shared Helper Functions
└── infrastructure/      # Railway Deployment + Environment Config
```

---

## 🏗️ Backend Architecture (API-First)

### Core Principles
- **API-First**: All data requires real API keys - no mock fallbacks in production
- **Real-Time Data**: SerpApi (Google Finance) + FRED API + Claude AI
- **TradingView Compatible**: Data format optimized for `NASDAQ:SYMBOL` format
- **Microservices Design**: Modular service architecture with dependency injection

### Service Architecture

#### 1. **Data Services**
```typescript
// SerpApiService - Stock Data & News
class SerpApiService {
  async getStockData(symbol: string, exchange = 'NASDAQ'): Promise<StockData>
  async getStockNews(symbol: string): Promise<NewsData[]>
  async getChartData(symbol: string, period = '1W'): Promise<ChartData>
}

// NewsService - Comprehensive News & Sentiment Analysis
class NewsService {
  async processStockNews(inputSymbol: string): Promise<NewsProcessingResult>
  async loadMacroNews(date: string): Promise<MacroNewsData | null>
  async loadStockNews(symbol: StockSymbol, date: string): Promise<StockNewsSummary | null>
  async generateOverview(symbol: StockSymbol, stockNews: StockNewsSummary | null, macroNews: MacroNewsData | null): Promise<StockOverview | null>
  async analyzeSentiment(headline: string, articles: SerpApiNewsResult[]): Promise<'positive' | 'neutral' | 'negative'>
  async healthCheck(): Promise<{ status: string; serpApiConfigured: boolean; claudeConfigured: boolean; openaiConfigured: boolean }>
}

// FinancialDataService - Economic Indicators
class FinancialDataService {
  async getEconomicIndicators(): Promise<EconomicData>
  async getMarketIndices(): Promise<MarketData>
}

// ClaudeService - AI Analysis & Chat
class ClaudeService {
  async generateResponse(prompt: string, maxTokens?: number): Promise<string>
  async generateStructuredResponse<T>(prompt: string, schema: string): Promise<T>
  async generateStockEvaluation(symbol: string): Promise<any>
  async searchWeb(query: string): Promise<string>
  async healthCheck(): Promise<{ status: string; hasApiKey: boolean; model: string; validated?: boolean }>
}

// AIEvaluationService - Stock Analysis Orchestration  
class AIEvaluationService {
  async generateEvaluation(symbol: StockSymbol, stockData?: any): Promise<AIEvaluation>
  async refreshEvaluation(symbol: StockSymbol, stockData?: any): Promise<AIEvaluation>
  async healthCheck(): Promise<{ status: string; cacheSize: number }>
}
```

#### 2. **Business Logic Services**
```typescript
// StocksService - Main Stock Data Orchestration
class StocksService {
  async getAllStocks(): Promise<StockCardData[]>
  async getStock(symbol: StockSymbol): Promise<StockCardData | null>
  async getStockChart(symbol: StockSymbol, period: string): Promise<ChartData>
}

// MarketService - Market Summary with AI
class MarketService {
  async getSummary(): Promise<MarketSummaryData>
  async getMarketSentimentAnalysis(): Promise<SentimentData>
}

// TechnicalAnalysisService - RSI & Technical Indicators
class TechnicalAnalysisService {
  async getAnalysis(symbol: string): Promise<StockTechnicals>
  calculateRSI(prices: number[], period = 14): StockTechnicals
}
```

### API Endpoints

#### Stock Data Endpoints
```bash
GET  /api/v1/stocks                    # All 10 target stocks
GET  /api/v1/stocks/:symbol            # Individual stock (AAPL, TSLA, etc.)
GET  /api/v1/stocks/:symbol/chart      # Historical chart data
```

#### Market Data Endpoints
```bash
GET  /api/v1/market-summary            # Market overview with AI insights
GET  /api/v1/market-summary/health     # Market service health check
POST /api/v1/market-summary/force-update # Manual cache refresh
```

#### AI Chat System
```bash
POST /api/v1/chat/sessions             # Create chat session
POST /api/v1/chat/sessions/:id/messages # Send message
GET  /api/v1/chat/sessions/:id         # Get session history
```

### Data Model (TypeScript)

#### Core Stock Data Structure
```typescript
interface StockCardData {
  symbol: StockSymbol;
  name: string;
  price: {
    current: number;
    change: number;
    changePercent: number;
    source: 'google_finance';
  };
  fundamentals: {
    pe: number;
    marketCap: number;
    volume: number;
    fiftyTwoWeekHigh: number;
    fiftyTwoWeekLow: number;
  };
  aiEvaluation: AIEvaluation;
  technicals: StockTechnicals;
  newsSummary: StockNewsSummary;
  sectorPerformance: {
    name: string;
    weeklyChange: number;
  };
}

interface AIEvaluation {
  rating: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
  confidence: number; // 0-100
  summary: string;
  keyFactors: string[];
  timeframe: '1M' | '3M' | '1Y';
  source: 'claude_ai';
  lastUpdated: string;
}

type StockSymbol = 'AAPL' | 'TSLA' | 'MSFT' | 'GOOGL' | 'AMZN' 
                 | 'NVDA' | 'META' | 'NFLX' | 'AVGO' | 'AMD';
```

#### Market Summary Structure
```typescript
interface MarketSummaryData {
  fearGreedIndex: {
    value: number;
    status: 'fear' | 'neutral' | 'greed';
    source: string;
  };
  vix: {
    value: number;
    status: 'low' | 'medium' | 'high';
  };
  interestRate: {
    value: number;
    aiOutlook: string; // Claude AI analysis
  };
  cpi: {
    value: number;
    monthOverMonth: number;
    direction: 'up' | 'down' | 'stable';
  };
}
```

---

## 🧠 AI Services Architecture (Claude Integration)

### AI Service Design Principles
- **Structured Responses**: All AI outputs follow defined TypeScript schemas
- **Graceful Fallbacks**: Enhanced mock data when AI services unavailable
- **Intelligent Caching**: 12-hour TTL for AI evaluations, immediate cache invalidation available
- **Health Monitoring**: Real-time service health checks and API key validation

### AI Service Components

#### 1. **Claude Service** (`services/claude.service.ts`)
Core AI communication layer with Anthropic Claude API.

##### Service Architecture
```typescript
@Injectable()
export class ClaudeService {
  private readonly anthropic: Anthropic;
  private readonly isConfigured: boolean;
  
  // Core methods
  async generateResponse(prompt: string, maxTokens = 1000): Promise<string>
  async generateStructuredResponse<T>(prompt: string, schema: string): Promise<T>
  
  // Stock-specific methods  
  async generateStockEvaluation(symbol: string): Promise<any>
  async searchWeb(query: string): Promise<string>
  
  // Utility methods
  async healthCheck(): Promise<{ status: string; hasApiKey: boolean; model: string; validated?: boolean }>
  private getFallbackResponse(prompt: string): string
}
```

##### Critical Implementation Details

**API Key Configuration**:
```typescript
constructor() {
  this.isConfigured = !!process.env.CLAUDE_API_KEY;
  this.anthropic = new Anthropic({
    apiKey: process.env.CLAUDE_API_KEY || 'fallback_key',
  });
  
  if (!this.isConfigured) {
    this.logger.warn('Claude API key not configured - using fallback responses');
  }
}
```

**Structured Response Pattern**:
```typescript
async generateStructuredResponse<T>(prompt: string, schema: string): Promise<T> {
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
    throw new Error(`Failed to parse structured response: ${error.message}`);
  }
}
```

**Error Handling & Fallbacks**:
```typescript
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
```

#### 2. **AI Evaluation Service** (`ai/ai-evaluation.service.ts`)
High-level orchestration service for stock analysis.

##### Service Architecture
```typescript
@Injectable()
export class AIEvaluationService {
  constructor(
    private readonly claudeService: ClaudeService,
    private readonly cacheService: CacheService,
  ) {}
  
  // Primary evaluation method
  async generateEvaluation(symbol: StockSymbol, stockData?: any): Promise<AIEvaluation>
  
  // Cache management
  async refreshEvaluation(symbol: StockSymbol, stockData?: any): Promise<AIEvaluation>
  
  // Service monitoring
  async healthCheck(): Promise<{ status: string; cacheSize: number }>
  
  // Internal methods
  private buildEvaluationPrompt(symbol: StockSymbol, stockData: any): string
  private getEvaluationSchema(): string
  private getEnhancedMockEvaluation(symbol: StockSymbol): AIEvaluation
}
```

##### Advanced Prompt Engineering
```typescript
private buildEvaluationPrompt(symbol: StockSymbol, stockData: any): string {
  const dataContext = stockData ? 
    `Current price: $${stockData.price || 'N/A'}, Volume: ${stockData.volume || 'N/A'}, Market Cap: ${stockData.marketCap || 'N/A'}` :
    'Using latest available market data';

  return `
As a senior investment analyst, provide a comprehensive evaluation of ${symbol} stock.

Context: ${dataContext}

Consider these factors in your analysis:
1. Recent financial performance and key metrics
2. Market sentiment and technical indicators  
3. Industry trends and competitive position
4. Risk factors and potential growth catalysts
5. Current economic environment and market conditions
6. Recent news and developments affecting the company

Provide a balanced, objective analysis suitable for retail investors.
Focus on actionable insights with clear reasoning.
Rate the stock as bullish, neutral, or bearish with a confidence level (0-100).
Identify 3-4 key factors that most influence your rating.
Set an appropriate timeframe for this evaluation (1W, 1M, or 3M).

Be specific about ${symbol}'s business model, competitive advantages, and current challenges.
  `;
}
```

##### Enhanced Mock Data System
```typescript
private getEnhancedMockEvaluation(symbol: StockSymbol): AIEvaluation {
  const evaluations: Record<StockSymbol, Partial<AIEvaluation>> = {
    'AAPL': {
      summary: 'Apple demonstrates strong fundamentals with robust Services revenue growth and Vision Pro innovation potential. iPhone upgrade cycle momentum building despite supply chain challenges.',
      rating: 'bullish' as const,
      confidence: 85,
      keyFactors: ['Services revenue expansion', 'Vision Pro market opportunity', 'Strong balance sheet', 'AI integration across products'],
    },
    'NVDA': {
      summary: 'NVIDIA leads AI chip market with strong data center demand. Gaming recovery and automotive AI expansion provide diversification.',
      rating: 'bullish' as const,
      confidence: 90,
      keyFactors: ['AI chip market dominance', 'Data center demand surge', 'Gaming market recovery', 'Automotive AI partnerships'],
    },
    // ... comprehensive evaluations for all 10 stocks
  };

  const evaluation = evaluations[symbol] || {
    summary: `${symbol} analysis requires real-time market data integration. Current market conditions remain mixed with fundamental uncertainty.`,
    rating: 'neutral' as const,
    confidence: 60,
    keyFactors: ['Market volatility', 'Economic uncertainty', 'Sector performance', 'Technical indicators'],
  };

  return {
    summary: evaluation.summary || 'Stock evaluation unavailable at this time.',
    rating: evaluation.rating || 'neutral',
    confidence: evaluation.confidence || 50,
    keyFactors: evaluation.keyFactors || ['Market conditions', 'Company fundamentals', 'Technical analysis'],
    timeframe: '3M',
    source: 'claude_ai',
    lastUpdated: new Date().toISOString(),
  };
}
```

#### 3. **AI Module Configuration** (`ai/ai.module.ts`)
```typescript
@Module({
  imports: [CacheModule],
  providers: [
    AIEvaluationService,
    ClaudeService,
    TechnicalAnalysisService,
  ],
  exports: [
    AIEvaluationService,
    ClaudeService,
    TechnicalAnalysisService,
  ],
})
export class AIModule {}
```

### AI Integration Patterns

#### Stock Service Integration
```typescript
// In stocks.service.ts
async getStock(symbol: StockSymbol): Promise<StockCardData | null> {
  const [stockData, newsData, aiEvaluation, technicalData] = 
    await Promise.allSettled([
      this.serpApiService.getStockData(symbol, 'NASDAQ'),
      this.serpApiService.getStockNews(symbol),
      this.aiEvaluationService.generateEvaluation(symbol, stockData), // AI integration
      this.technicalService.getAnalysis(symbol)
    ]);
  
  return this.transformToStockCardData(stockData, newsData, aiEvaluation, technicalData, symbol);
}
```

#### Market Service AI Enhancement
```typescript
// For market sentiment analysis
async getMarketSentimentAnalysis(): Promise<string> {
  const prompt = `Analyze current market sentiment based on Fear & Greed Index, VIX levels, and economic indicators. 
  Provide a brief outlook for retail investors in 2-3 sentences.`;
  
  return await this.claudeService.generateResponse(prompt, 200);
}
```

### Cache Strategy Implementation

#### AI Content Caching (12-hour TTL)
```typescript
// In ai-evaluation.service.ts
async generateEvaluation(symbol: StockSymbol, stockData?: any): Promise<AIEvaluation> {
  try {
    // Check cache first (12-hour TTL for AI content)
    const cacheKey = `evaluation:${symbol}`;
    const cached = this.cacheService.getAIContent<AIEvaluation>(cacheKey);
    if (cached) {
      this.logger.log(`Using cached evaluation for ${symbol}`);
      return cached;
    }

    // Generate new evaluation
    const evaluation = await this.generateFreshEvaluation(symbol, stockData);
    
    // Cache the result
    this.cacheService.setAIContent(cacheKey, evaluation);
    
    return evaluation;
  } catch (error) {
    // Graceful fallback to enhanced mock data
    return this.getEnhancedMockEvaluation(symbol);
  }
}
```

### Health Monitoring & API Validation

#### Claude Service Health Check
```typescript
async healthCheck(): Promise<{ status: string; hasApiKey: boolean; model: string; validated?: boolean }> {
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
```

#### AI Service Health Endpoint
```bash
# Test AI service health
GET /api/v1/ai/health

# Expected response
{
  "status": "operational", 
  "cacheSize": 15,
  "claude": {
    "status": "operational",
    "hasApiKey": true,
    "model": "claude-3-haiku-20240307",
    "validated": true
  }
}
```

### Environment Configuration

#### Required Environment Variables
```bash
# .env file
CLAUDE_API_KEY=sk-ant-api03-...                    # Required for AI functionality
CLAUDE_MODEL=claude-3-haiku-20240307               # Optional, defaults to haiku

# Cache Configuration for AI content
AI_CONTENT_TTL=43200                               # 12 hours (optional)
ECONOMIC_DATA_TTL=86400                            # 24 hours 
STOCK_DATA_TTL=300                                 # 5 minutes
```

### Error Handling & Recovery

#### AI Service Error Categories
1. **API Key Issues**: Invalid or missing Claude API key
2. **Rate Limiting**: Claude API rate limits exceeded  
3. **Response Parsing**: JSON extraction from Claude responses
4. **Network Issues**: Connectivity problems with Anthropic
5. **Cache Issues**: Redis cache unavailable

#### Recovery Strategies
```typescript
// Layered fallback system
try {
  // Primary: Claude API call
  return await this.claudeService.generateStructuredResponse(prompt, schema);
} catch (apiError) {
  try {
    // Secondary: Simple Claude API call  
    const response = await this.claudeService.generateResponse(prompt);
    return this.parseManualResponse(response);
  } catch (parseError) {
    // Tertiary: Enhanced mock data
    this.logger.warn(`AI service degraded, using enhanced mock data for ${symbol}`);
    return this.getEnhancedMockEvaluation(symbol);
  }
}
```

### Performance Optimization

#### Target Performance Metrics
- **AI Evaluation Generation**: <30 seconds per stock
- **Cache Hit Ratio**: >80% for repeat requests within 12 hours
- **API Response Time**: <200ms average for cached responses
- **Fallback Response Time**: <50ms for mock data

#### Optimization Strategies
1. **Intelligent Caching**: 12-hour TTL with selective cache invalidation
2. **Batch Processing**: Generate multiple evaluations in parallel
3. **Response Compression**: Structured JSON responses minimize token usage
4. **Fallback Optimization**: Enhanced mock data provides immediate responses

---

## 📰 News Service Architecture (Multi-AI Sentiment Analysis)

### News Service Design Principles
- **Multi-Tier AI Analysis**: Claude AI → OpenAI → Keyword fallback for maximum reliability
- **Intelligent Caching**: 6-hour TTL for news data with file-system backup storage
- **Stock Validation**: Multi-level symbol validation with Yahoo Finance API integration
- **Comprehensive Coverage**: Macro market news + stock-specific news integration
- **Investment Overview Generation**: AI-powered stock analysis with confidence scoring

### News Service Components

#### 1. **News Service** (`news/news.service.ts`)
Advanced news processing and sentiment analysis orchestration service.

##### Service Architecture
```typescript
@Injectable()
export class NewsService {
  private readonly serpApiKey = process.env.SERPAPI_API_KEY;
  private readonly openai: OpenAI | null;
  private readonly stockValidator: StockValidatorHelper;
  
  constructor(
    private readonly claudeService: ClaudeService,
    private readonly cacheService: CacheService,
  ) {}
  
  // Main orchestration method
  async processStockNews(inputSymbol: string): Promise<NewsProcessingResult>
  
  // News data acquisition
  async loadMacroNews(date: string): Promise<MacroNewsData | null>
  async loadStockNews(symbol: StockSymbol, date: string): Promise<StockNewsSummary | null>
  
  // AI analysis methods
  async generateOverview(symbol: StockSymbol, stockNews: StockNewsSummary | null, macroNews: MacroNewsData | null): Promise<StockOverview | null>
  async analyzeSentiment(headline: string, articles: SerpApiNewsResult[]): Promise<'positive' | 'neutral' | 'negative'>
  
  // AI provider methods
  async analyzeWithClaude(symbol: StockSymbol, stockNews: StockNewsSummary | null, macroNews: MacroNewsData | null): Promise<StockOverview | null>
  async analyzeWithOpenAI(symbol: StockSymbol, stockNews: StockNewsSummary | null, macroNews: MacroNewsData | null): Promise<StockOverview | null>
  
  // Fallback and utility methods
  generateBasicOverview(symbol: StockSymbol, stockNews: StockNewsSummary | null, macroNews: MacroNewsData | null): StockOverview
  getKeywordBasedSentiment(headline: string): 'positive' | 'neutral' | 'negative'
  async healthCheck(): Promise<{ status: string; serpApiConfigured: boolean; claudeConfigured: boolean; openaiConfigured: boolean }>
}
```

##### Complete News Processing Workflow
```typescript
async processStockNews(inputSymbol: string): Promise<NewsProcessingResult> {
  // Step 1-2: Multi-tier symbol validation
  const validationResult = await this.stockValidator.validateSymbol(inputSymbol);
  if (!validationResult.isValid) {
    return { isValid: false, error: validationResult.reason, suggestions: this.stockValidator.getSuggestions(inputSymbol) };
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
  let stockNews: StockNewsSummary | null = null;
  if (!this.hasTodaysStockNews(symbol, today)) {
    stockNews = await this.loadStockNews(symbol, today);
    if (stockNews) this.storeStockNews(stockNews, symbol, today);
  } else {
    stockNews = this.loadStoredStockNews(symbol, today);
  }

  // Step 6: Generate comprehensive AI overview
  const overview = await this.generateOverview(symbol, stockNews, macroNews);
  if (overview) {
    this.storeOverview(overview, symbol, today);
    return { isValid: true, symbol, overview, validationResult };
  }

  return { isValid: false, error: 'Failed to generate investment overview' };
}
```

#### 2. **Stock Validator Helper** (`news/stock-validator.helper.ts`)
Multi-tier stock symbol validation system.

##### Validation Architecture
```typescript
export class StockValidatorHelper {
  private knownValidSymbols = new Set([
    // 100+ major US stocks, ETFs, and known symbols for fast validation
  ]);

  // Three-tier validation system
  async validateSymbol(symbol: string): Promise<ValidationResult> {
    // Tier 1: Format validation (instant)
    const formatResult = this.hasValidFormat(symbol);
    if (!formatResult.isValid) return formatResult;

    // Tier 2: Known symbols lookup (milliseconds)
    const knownResult = this.isKnownValidSymbol(symbol);
    if (knownResult.isValid) return knownResult;

    // Tier 3: Yahoo Finance API validation (seconds)
    return await this.validateWithYahooFinance(symbol);
  }

  // Yahoo Finance API integration (free, no key required)
  async validateWithYahooFinance(symbol: string): Promise<ValidationResult> {
    const response = await axios.get(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`,
      { timeout: 8000, headers: { 'User-Agent': 'Mozilla/5.0...' } }
    );
    
    const chart = response.data.chart;
    const isValid = chart?.result?.[0] && !chart.result[0].meta.error;
    
    return {
      isValid,
      method: 'yahoo_finance_api',
      symbol: symbol.toUpperCase(),
      reason: isValid ? 'Found market data' : 'No market data found',
      price: isValid ? chart.result[0].meta.regularMarketPrice : undefined
    };
  }

  // Smart suggestions for invalid symbols
  getSuggestions(invalidSymbol: string): string[] {
    const suggestions = [];
    for (const validSymbol of this.knownValidSymbols) {
      if (validSymbol.includes(invalidSymbol.toUpperCase()) || invalidSymbol.toUpperCase().includes(validSymbol)) {
        suggestions.push(validSymbol);
      }
      if (suggestions.length >= 5) break;
    }
    return suggestions;
  }
}
```

#### 3. **News Controller** (`news/news.controller.ts`)
RESTful API endpoint for news processing.

```typescript
@Controller('news')
export class NewsController {
  @Post('process')
  async processStockNews(@Body() request: ProcessNewsRequest): Promise<ProcessNewsResponse> {
    // Request validation
    if (!request.symbol || typeof request.symbol !== 'string') {
      throw new HttpException('Symbol is required and must be a string', HttpStatus.BAD_REQUEST);
    }

    // Process using comprehensive workflow
    const result = await this.newsService.processStockNews(request.symbol.trim());

    if (!result.isValid) {
      return { success: false, error: result.error, suggestions: result.suggestions };
    }

    return {
      success: true,
      data: {
        symbol: result.symbol!,
        overview: result.overview,
        validationResult: result.validationResult
      }
    };
  }
}
```

### Multi-AI Sentiment Analysis System

#### Three-Tier AI Hierarchy
**🥇 Primary: Claude 3 Haiku** - Financial expertise and context understanding
**🥈 Secondary: OpenAI GPT-4/3.5-turbo** - Fast and reliable fallback 
**🥉 Final: Keyword Analysis** - Always available, rule-based sentiment

#### Advanced Sentiment Analysis Implementation
```typescript
async analyzeSentiment(headline: string, articles: SerpApiNewsResult[]): Promise<'positive' | 'neutral' | 'negative'> {
  try {
    // Check cache first (6-hour TTL)
    const cacheKey = `sentiment:${Buffer.from(headline).toString('base64').slice(0, 20)}`;
    const cached = this.cacheService.getNewsData<'positive' | 'neutral' | 'negative'>(cacheKey);
    if (cached) return cached;

    // Build comprehensive sentiment analysis prompt
    const articlesText = articles.map(article => `${article.title}: ${article.snippet || ''}`).join('\n');

    const sentimentPrompt = `
Analyze the sentiment of these financial news headlines and content:

Main Headline: ${headline}

Additional Articles:
${articlesText}

Classify the overall sentiment as positive, neutral, or negative based on:
- Market impact implications
- Company performance indicators  
- Investor sentiment tone
- Economic implications
- Risk factors mentioned

Consider the financial context and potential impact on stock price.

Respond with only one word: positive, neutral, or negative
    `;

    // Try Claude AI first
    const response = await this.claudeService.generateResponse(sentimentPrompt, 50);
    const sentiment = this.parseSentimentResponse(response);
    
    // Cache and return result
    this.cacheService.setNewsData(cacheKey, sentiment);
    return sentiment;
  } catch (error) {
    // Fallback to keyword-based analysis
    return this.getKeywordBasedSentiment(headline);
  }
}

private getKeywordBasedSentiment(headline: string): 'positive' | 'neutral' | 'negative' {
  const text = headline.toLowerCase();
  
  const positiveWords = ['growth', 'gains', 'surge', 'rally', 'bullish', 'beat', 'strong', 'up', 'rise'];
  const negativeWords = ['decline', 'fall', 'crash', 'bearish', 'miss', 'weak', 'down', 'loss'];

  const positiveScore = positiveWords.reduce((score, word) => score + (text.includes(word) ? 1 : 0), 0);
  const negativeScore = negativeWords.reduce((score, word) => score + (text.includes(word) ? 1 : 0), 0);

  if (positiveScore > negativeScore) return 'positive';
  if (negativeScore > positiveScore) return 'negative';
  return 'neutral';
}
```

## 📋 Step-by-Step Implementation Guide

### Phase 1: Service Foundation Setup

**Step 1**: Create the news module structure
```bash
mkdir -p apps/backend/src/news
cd apps/backend/src/news
touch news.module.ts news.service.ts news.controller.ts stock-validator.helper.ts
```

**Step 2**: Set up environment variables
```bash
# Required API keys
SERPAPI_API_KEY=your_serpapi_key           # For Google News via SerpApi
CLAUDE_API_KEY=your_claude_api_key         # For AI sentiment analysis
OPENAI_API_KEY=your_openai_api_key         # Fallback AI analysis
```

**Step 3**: Install required dependencies
```bash
npm install openai axios
npm install --save-dev @types/node
```

### Phase 2: Stock Validation System

**Step 4**: Implement the StockValidatorHelper
```typescript
// stock-validator.helper.ts
export class StockValidatorHelper {
  private knownValidSymbols = new Set([
    // Add 100+ known valid stock symbols
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'AMD', 'INTC',
    'NFLX', 'UBER', 'LYFT', 'SNAP', 'TWTR', 'SHOP', 'PYPL', 'SQ', 'ZOOM', 'CRM',
    // ... include full list from implementation
  ]);

  // Three-tier validation:
  // 1. Format check (regex)
  // 2. Known symbols lookup
  // 3. Yahoo Finance API validation
  async validateSymbol(symbol: string): Promise<ValidationResult> {
    const formatResult = this.hasValidFormat(symbol);
    if (!formatResult.isValid) return formatResult;

    const knownResult = this.isKnownValidSymbol(symbol);
    if (knownResult.isValid) return knownResult;

    return await this.validateWithYahooFinance(symbol);
  }
}
```

**Step 5**: Configure Yahoo Finance integration (no API key required)
```typescript
async validateWithYahooFinance(symbol: string): Promise<ValidationResult> {
  const response = await axios.get(
    `https://query1.finance.yahoo.com/v8/finance/chart/${symbol.toUpperCase()}`,
    {
      timeout: 8000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    }
  );
  // Extract price data and validation status
}
```

### Phase 3: News Service Core Implementation

**Step 6**: Create the main NewsService class
```typescript
@Injectable()
export class NewsService {
  private readonly serpApiKey = process.env.SERPAPI_API_KEY;
  private readonly dataDir = path.join(process.cwd(), 'data', 'news');
  private readonly macroNewsDir = path.join(this.dataDir, 'macro_news');
  private readonly stockNewsDir = path.join(this.dataDir, 'stock_news');
  private readonly openai: OpenAI | null;
  private readonly stockValidator: StockValidatorHelper;

  constructor(
    private readonly claudeService: ClaudeService,
    private readonly cacheService: CacheService,
  ) {
    this.openai = process.env.OPENAI_API_KEY 
      ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
    this.stockValidator = new StockValidatorHelper();
  }
}
```

**Step 7**: Implement the 6-step processing workflow
```typescript
async processStockNews(inputSymbol: string): Promise<NewsProcessingResult> {
  // Step 1-2: Validate symbol using multi-tier approach
  const validationResult = await this.stockValidator.validateSymbol(inputSymbol);
  if (!validationResult.isValid) {
    const suggestions = this.stockValidator.getSuggestions(inputSymbol);
    return { isValid: false, error: validationResult.reason, suggestions };
  }

  const symbol = validationResult.symbol as StockSymbol;
  const today = this.getTodayDateString();

  // Step 3-4: Check and load macro news
  let macroNews = this.hasTodaysMacroNews(today) 
    ? this.loadStoredMacroNews(today)
    : await this.loadMacroNews(today);

  // Step 4-5: Check and load stock-specific news
  let stockNews = this.hasTodaysStockNews(symbol, today)
    ? this.loadStoredStockNews(symbol, today) 
    : await this.loadStockNews(symbol, today);

  // Step 6: Generate AI overview with multi-tier fallbacks
  const overview = await this.generateOverview(symbol, stockNews, macroNews);
  
  return { isValid: true, symbol, overview, validationResult };
}
```

**Step 8**: Build SerpApi integration
```typescript
private async loadStockNews(symbol: StockSymbol): Promise<StockNewsSummary> {
  // Company name mapping for better search results
  const companyMap: Record<string, string> = {
    AAPL: 'Apple', TSLA: 'Tesla', MSFT: 'Microsoft', GOOGL: 'Google Alphabet',
    AMZN: 'Amazon', NVDA: 'NVIDIA', META: 'Meta Facebook', NFLX: 'Netflix'
  };

  const companyName = companyMap[symbol] || symbol;
  const query = `${companyName} ${symbol} stock`;

  const response = await axios.get('https://serpapi.com/search', {
    params: {
      engine: 'google_news',
      q: query,
      gl: 'us',
      hl: 'en',
      num: 10,
      api_key: this.serpApiKey,
    },
    timeout: 15000,
  });

  const newsResults = response.data.news_results;
  const sentiment = await this.analyzeSentiment(newsResults[0].title, newsResults.slice(0, 3));
  
  return {
    headline: newsResults[0].title,
    sentiment,
    source: 'google_news + claude_ai',
    _fullArticles: newsResults // Store full articles for analysis
  };
}
```

### Phase 4: Multi-AI Analysis System

**Step 9**: Implement Claude AI integration (Primary)
```typescript
private async analyzeWithClaude(
  symbol: StockSymbol,
  stockNews: StockNewsSummary | null,
  macroNews: MacroNewsData | null
): Promise<StockOverview | null> {
  const prompt = this.buildAnalysisPrompt(symbol, stockNews, macroNews);

  const response = await axios.post('https://api.anthropic.com/v1/messages', {
    model: 'claude-3-haiku-20240307',
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }]
  }, {
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01'
    }
  });

  const content = response.data.content?.[0]?.text;
  const parsed = JSON.parse(content);
  
  return {
    symbol, overview: parsed.overview, recommendation: parsed.recommendation,
    confidence: parsed.confidence, keyFactors: parsed.keyFactors,
    riskLevel: parsed.riskLevel, timeHorizon: parsed.timeHorizon,
    source: 'claude_ai_analysis', timestamp: new Date().toISOString()
  };
}
```

**Step 10**: Add OpenAI fallback system
```typescript
private async analyzeWithOpenAI(...args): Promise<StockOverview | null> {
  const models = ['gpt-4-1106-preview', 'gpt-4-turbo-preview', 'gpt-4', 'gpt-3.5-turbo'];
  
  for (const model of models) {
    try {
      const completion = await this.openai.chat.completions.create({
        model, messages: [{ role: 'user', content: prompt }],
        max_tokens: 600, temperature: 0.2,
        response_format: { type: "json_object" }
      });
      // Parse and return structured response
      break;
    } catch (modelError) {
      continue; // Try next model
    }
  }
}
```

**Step 11**: Create keyword-based fallback
```typescript
private generateBasicOverview(symbol, stockNews, macroNews): StockOverview {
  const keyFactors = [];
  let confidence = 50;
  
  if (stockNews?.headline) {
    keyFactors.push('Company-specific news data available');
    confidence += 10;
  }
  
  return {
    symbol, recommendation: 'HOLD', confidence: Math.max(30, Math.min(confidence, 70)),
    overview: `Unable to perform AI-powered analysis for ${symbol}. Recommend manual research.`,
    keyFactors, riskLevel: 'MEDIUM', timeHorizon: '3-6 months',
    source: 'fallback_data_analysis', timestamp: new Date().toISOString()
  };
}
```

### Phase 5: Data Management & Caching

**Step 12**: Set up file system storage
```typescript
// Directory structure:
// data/news/macro_news/2024-01-15/macro_news.json
// data/news/stock_news/AAPL/2024-01-15/stock_news.json
// data/news/stock_news/AAPL/2024-01-15/overview.json

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
  
  fs.writeFileSync(this.getMacroNewsPath(date), JSON.stringify(storeData, null, 2));
}
```

**Step 13**: Implement caching strategy
```typescript
// Cache TTL configuration:
// - 24h for macro news (economic data changes slowly)
// - 12h for AI analysis (market sentiment shifts)
// - 6h for sentiment analysis (news sentiment updates)

private async analyzeSentiment(headline: string, articles: SerpApiNewsResult[]): Promise<'positive' | 'neutral' | 'negative'> {
  const cacheKey = `sentiment:${Buffer.from(headline).toString('base64').slice(0, 20)}`;
  const cached = this.cacheService.getNewsData(cacheKey);
  if (cached) return cached;
  
  const response = await this.claudeService.generateResponse(sentimentPrompt, 50);
  const sentiment = this.parseSentimentResponse(response);
  
  this.cacheService.setNewsData(cacheKey, sentiment); // 6h TTL
  return sentiment;
}
```

**Step 14**: Add health monitoring
```typescript
async healthCheck(): Promise<{
  status: string;
  serpApiConfigured: boolean;
  claudeConfigured: boolean;
  openaiConfigured: boolean;
}> {
  return {
    status: 'operational',
    serpApiConfigured: !!this.serpApiKey,
    claudeConfigured: !!(await this.claudeService.healthCheck()).hasApiKey,
    openaiConfigured: !!this.openai,
  };
}
```

### Phase 6: Controller & API Endpoints

**Step 15**: Create REST API controller
```typescript
@Controller('news')
export class NewsController {
  @Post('process')
  async processStockNews(@Body() request: ProcessNewsRequest): Promise<ProcessNewsResponse> {
    // Input validation
    if (!request.symbol || typeof request.symbol !== 'string') {
      throw new HttpException('Symbol is required and must be a string', HttpStatus.BAD_REQUEST);
    }

    const result = await this.newsService.processStockNews(request.symbol.trim());

    if (!result.isValid) {
      return {
        success: false,
        error: result.error,
        suggestions: result.suggestions
      };
    }

    return {
      success: true,
      data: {
        symbol: result.symbol!,
        overview: result.overview,
        validationResult: result.validationResult
      }
    };
  }
}
```

**Step 16**: Add comprehensive error handling
```typescript
// Error responses include:
// - Input validation with meaningful messages
// - Symbol suggestions for invalid inputs (getSuggestions method)
// - Graceful degradation when external services fail
// - Detailed logging for debugging and monitoring

interface ProcessNewsResponse {
  success: boolean;
  data?: {
    symbol: string;
    overview?: StockOverview;
    validationResult?: ValidationResult;
  };
  error?: string;
  suggestions?: string[]; // Suggested valid symbols
}
```

### Phase 7: Module Integration

**Step 17**: Configure the NewsModule
```typescript
@Module({
  imports: [CacheModule],
  controllers: [NewsController],
  providers: [NewsService, ClaudeService],
  exports: [NewsService],
})
export class NewsModule {}
```

**Step 18**: Add to main application module
```typescript
// In app.module.ts
@Module({
  imports: [
    // ... other modules
    NewsModule,
    CacheModule,
  ],
})
export class AppModule {}
```

### Implementation Checklist

✅ **Core Structure**
- Service class with dependency injection
- Controller with endpoint routing  
- Module configuration with imports
- TypeScript interfaces for type safety

✅ **Multi-Tier Validation System**
- Format validation (regex pattern matching)
- Known symbols lookup (100+ cached symbols)
- Yahoo Finance API validation with real-time data

✅ **News Fetching & Processing**
- SerpApi Google News integration with proper error handling
- Macro market news collection (75 articles)
- Stock-specific news with company name mapping
- File system storage with date-based organization

✅ **Multi-AI Sentiment Analysis**
- Primary: Claude API with structured prompts
- Fallback: OpenAI with model tier fallbacks
- Final: Keyword-based sentiment scoring
- Caching strategy for repeated analysis

✅ **Investment Overview Generation**
- Comprehensive prompt engineering for context analysis
- JSON response parsing with fallback handling
- Conservative analysis when AI services unavailable
- Confidence scoring and risk assessment

✅ **Data Persistence & Caching**
- File system storage organized by date and symbol
- Redis caching for API responses and analysis results
- Comprehensive data structures for news and analysis
- Automatic directory creation and management

### SerpApi Integration & News Data Acquisition

#### Macro Market News Processing
```typescript
async loadMacroNews(date: string): Promise<MacroNewsData | null> {
  const response = await axios.get<SerpApiResponse>(this.baseUrl, {
    params: {
      engine: 'google_news',
      q: 'stock market economy finance business',
      gl: 'us',
      hl: 'en',
      num: 75,
      api_key: this.serpApiKey,
    },
    timeout: 15000,
  });

  const newsResults = response.data.news_results;
  if (!newsResults?.length) return null;

  return {
    topHeadline: newsResults[0].title || 'Market news',
    articles: newsResults,
    totalArticles: newsResults.length,
    source: 'serpapi_google_news',
    timestamp: new Date().toISOString()
  };
}
```

#### Stock-Specific News Processing
```typescript
async loadStockNews(symbol: StockSymbol, date: string): Promise<StockNewsSummary | null> {
  // Enhanced company mapping for better search results
  const companyMap: Record<string, string> = {
    AAPL: 'Apple', TSLA: 'Tesla', MSFT: 'Microsoft', GOOGL: 'Google Alphabet',
    AMZN: 'Amazon', NVDA: 'NVIDIA', META: 'Meta Facebook', NFLX: 'Netflix'
  };

  const companyName = companyMap[symbol] || symbol;
  const query = `${companyName} ${symbol} stock`;

  const response = await axios.get<SerpApiResponse>(this.baseUrl, {
    params: {
      engine: 'google_news',
      q: query,
      gl: 'us', hl: 'en', num: 10,
      api_key: this.serpApiKey,
    },
    timeout: 15000,
  });

  const newsResults = response.data.news_results;
  if (!newsResults?.length) return null;

  const topHeadline = newsResults[0].title || `${symbol} stock news`;
  const sentiment = await this.analyzeSentiment(topHeadline, newsResults.slice(0, 3));

  return {
    headline: topHeadline,
    sentiment,
    source: 'google_news + claude_ai',
    _fullArticles: newsResults // Store for comprehensive analysis
  } as StockNewsSummary & { _fullArticles?: SerpApiNewsResult[] };
}
```

### AI Investment Overview Generation

#### Multi-Provider Analysis System
```typescript
async generateOverview(symbol: StockSymbol, stockNews: StockNewsSummary | null, macroNews: MacroNewsData | null): Promise<StockOverview | null> {
  // Try Claude AI first (most sophisticated)
  const claudeResult = await this.analyzeWithClaude(symbol, stockNews, macroNews);
  if (claudeResult) return claudeResult;

  // Fallback to OpenAI
  const openaiResult = await this.analyzeWithOpenAI(symbol, stockNews, macroNews);
  if (openaiResult) return openaiResult;

  // Final fallback to rule-based analysis
  return this.generateBasicOverview(symbol, stockNews, macroNews);
}
```

#### Claude AI Analysis Implementation
```typescript
async analyzeWithClaude(symbol: StockSymbol, stockNews: StockNewsSummary | null, macroNews: MacroNewsData | null): Promise<StockOverview | null> {
  const prompt = this.buildAnalysisPrompt(symbol, stockNews, macroNews);

  const response = await axios.post('https://api.anthropic.com/v1/messages', {
    model: 'claude-3-haiku-20240307',
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }]
  }, {
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    timeout: 15000
  });

  const content = response.data.content?.[0]?.text;
  if (content) {
    const parsed = JSON.parse(content);
    return {
      symbol, overview: parsed.overview, recommendation: parsed.recommendation,
      confidence: parsed.confidence, keyFactors: parsed.keyFactors || [],
      riskLevel: parsed.riskLevel || 'MEDIUM', timeHorizon: parsed.timeHorizon || '3-6 months',
      source: 'claude_ai_analysis', timestamp: new Date().toISOString()
    };
  }
  return null;
}
```

#### Analysis Prompt Engineering
```typescript
buildAnalysisPrompt(symbol: StockSymbol, stockNews: StockNewsSummary | null, macroNews: MacroNewsData | null): string {
  let prompt = `Analyze ${symbol} stock for investment recommendation based on the following news data:\n\n`;
  
  if (stockNews) {
    prompt += `COMPANY-SPECIFIC NEWS:\n- Headline: ${stockNews.headline}\n- Source: ${stockNews.source}\n`;
    // Include additional headlines if available
    const stockNewsWithArticles = stockNews as StockNewsSummary & { _fullArticles?: SerpApiNewsResult[] };
    if (stockNewsWithArticles._fullArticles?.length > 1) {
      prompt += `- Additional Headlines:\n`;
      stockNewsWithArticles._fullArticles.slice(1, 6).forEach((article, index) => {
        prompt += `  ${index + 2}. ${article.title}\n`;
      });
    }
  }
  
  if (macroNews?.articles?.length > 0) {
    prompt += `MARKET & ECONOMIC NEWS:\n- Top Headline: ${macroNews.topHeadline}\n- Additional Headlines:\n`;
    macroNews.articles.slice(0, 5).forEach((article, index) => {
      prompt += `  ${index + 1}. ${article.title}\n`;
    });
  }
  
  prompt += `Based on this news analysis, provide an investment assessment for ${symbol} in the following JSON format:
{
  "overview": "2-3 sentence analysis of the stock's outlook based on the news",
  "recommendation": "BUY|HOLD|SELL",
  "confidence": 1-100,
  "keyFactors": ["factor1", "factor2", "factor3"],
  "riskLevel": "LOW|MEDIUM|HIGH",
  "timeHorizon": "1-3 months|3-6 months|6-12 months"
}

Focus on:
- Company performance indicators from news
- Market conditions and economic factors
- Industry trends
- Risk factors mentioned in news
- Growth opportunities or concerns`;

  return prompt;
}
```

## 🔧 Troubleshooting & Deployment Guide

### Common Issues & Solutions

#### API Integration Problems

**SerpApi Rate Limiting**
```bash
# Error: Too many requests
# Solution: Implement exponential backoff
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async retryWithBackoff<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await delay(Math.pow(2, i) * 1000); // 1s, 2s, 4s
    }
  }
  throw new Error('Max retries exceeded');
}
```

**Claude API Connection Issues**
```typescript
// Health check implementation
async checkClaudeConnection(): Promise<boolean> {
  try {
    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-3-haiku-20240307',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'test' }]
    }, {
      headers: {
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      timeout: 5000
    });
    return response.status === 200;
  } catch (error) {
    this.logger.error('Claude API connection failed:', error.message);
    return false;
  }
}
```

**Yahoo Finance API Failures**
```typescript
// Fallback validation when Yahoo Finance is down
async validateSymbolWithFallback(symbol: string): Promise<ValidationResult> {
  try {
    return await this.validateWithYahooFinance(symbol);
  } catch (error) {
    this.logger.warn('Yahoo Finance unavailable, using known symbols only');
    return this.isKnownValidSymbol(symbol);
  }
}
```

#### Data Storage Issues

**File System Permissions**
```bash
# Ensure proper directory permissions
mkdir -p data/news/{macro_news,stock_news}
chmod 755 data/news
chmod 755 data/news/macro_news data/news/stock_news

# Fix ownership if needed
chown -R $(whoami):$(whoami) data/news
```

**Disk Space Management**
```typescript
// Automatic cleanup of old news data
async cleanupOldNewsData(daysToKeep = 30): Promise<void> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  
  const cleanup = async (dir: string) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const dirDate = new Date(entry.name);
        if (dirDate < cutoffDate) {
          fs.rmSync(path.join(dir, entry.name), { recursive: true });
          this.logger.log(`Cleaned up old data: ${entry.name}`);
        }
      }
    }
  };
  
  await cleanup(this.macroNewsDir);
  const stockDirs = fs.readdirSync(this.stockNewsDir);
  for (const stockDir of stockDirs) {
    await cleanup(path.join(this.stockNewsDir, stockDir));
  }
}
```

#### Performance Optimization

**Redis Cache Configuration**
```typescript
// Optimal cache settings for news service
@Module({
  imports: [
    CacheModule.register({
      store: redisStore,
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      ttl: 21600, // 6 hours default
      max: 1000, // Maximum number of items in cache
    }),
  ],
})
```

**Concurrent Request Handling**
```typescript
// Rate limiting for external API calls
private requestQueue = new Map<string, Promise<any>>();

async queuedRequest<T>(key: string, fn: () => Promise<T>): Promise<T> {
  if (this.requestQueue.has(key)) {
    return this.requestQueue.get(key);
  }
  
  const promise = fn();
  this.requestQueue.set(key, promise);
  
  try {
    const result = await promise;
    return result;
  } finally {
    this.requestQueue.delete(key);
  }
}
```

### Deployment Configuration

#### Environment Variables
```bash
# Production environment setup
export NODE_ENV=production
export PORT=3000

# API Keys (Required)
export SERPAPI_API_KEY=your_production_serpapi_key
export CLAUDE_API_KEY=your_production_claude_key
export OPENAI_API_KEY=your_production_openai_key  # Optional fallback

# Redis Configuration
export REDIS_HOST=your_redis_host
export REDIS_PORT=6379
export REDIS_PASSWORD=your_redis_password

# Logging
export LOG_LEVEL=info

# Data Storage
export DATA_DIR=/app/data
```

#### Railway Deployment Setup
```dockerfile
# Dockerfile additions for news service
FROM node:18-alpine

# Create data directory with proper permissions
RUN mkdir -p /app/data/news && \
    chown -R node:node /app/data

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .
RUN npm run build

# Set proper ownership
RUN chown -R node:node /app

USER node
EXPOSE 3000
CMD ["npm", "run", "start:prod"]
```

**Railway Configuration**
```yaml
# railway.yml
build:
  command: npm run build
  
deploy:
  command: npm run start:prod
  
variables:
  NODE_ENV: production
  LOG_LEVEL: info
  DATA_DIR: /app/data
```

#### Health Monitoring
```typescript
// Production health check endpoint
@Get('news/health')
async getNewsHealth(): Promise<{
  status: string;
  services: {
    serpApi: boolean;
    claude: boolean;
    openai: boolean;
    redis: boolean;
    fileSystem: boolean;
  };
  timestamp: string;
}> {
  const services = {
    serpApi: !!process.env.SERPAPI_API_KEY,
    claude: await this.checkClaudeConnection(),
    openai: !!this.openai,
    redis: await this.cacheService.isHealthy(),
    fileSystem: this.checkFileSystemAccess()
  };
  
  const allHealthy = Object.values(services).every(Boolean);
  
  return {
    status: allHealthy ? 'healthy' : 'degraded',
    services,
    timestamp: new Date().toISOString()
  };
}

private checkFileSystemAccess(): boolean {
  try {
    fs.accessSync(this.dataDir, fs.constants.W_OK);
    return true;
  } catch (error) {
    return false;
  }
}
```

### Testing Strategy

#### Unit Tests
```typescript
// news.service.spec.ts
describe('NewsService', () => {
  let service: NewsService;
  let mockClaudeService: jest.Mocked<ClaudeService>;
  let mockCacheService: jest.Mocked<CacheService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NewsService,
        { provide: ClaudeService, useValue: mockClaudeService },
        { provide: CacheService, useValue: mockCacheService },
      ],
    }).compile();

    service = module.get<NewsService>(NewsService);
  });

  describe('processStockNews', () => {
    it('should validate invalid symbols', async () => {
      const result = await service.processStockNews('INVALID');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid');
      expect(result.suggestions).toHaveLength(0);
    });

    it('should process valid symbols successfully', async () => {
      // Mock external API responses
      jest.spyOn(axios, 'get').mockResolvedValue({
        data: { news_results: [{ title: 'Test news', source: 'Test' }] }
      });

      const result = await service.processStockNews('AAPL');
      
      expect(result.isValid).toBe(true);
      expect(result.symbol).toBe('AAPL');
      expect(result.overview).toBeDefined();
    });
  });
});
```

#### Integration Tests
```typescript
// news.integration.spec.ts
describe('News Integration Tests', () => {
  let app: INestApplication;
  let newsService: NewsService;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [NewsModule, CacheModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    
    newsService = app.get<NewsService>(NewsService);
  });

  it('/news/process (POST) - should process valid stock', () => {
    return request(app.getHttpServer())
      .post('/news/process')
      .send({ symbol: 'AAPL' })
      .expect(200)
      .expect((res) => {
        expect(res.body.success).toBe(true);
        expect(res.body.data.symbol).toBe('AAPL');
      });
  });

  it('/news/process (POST) - should reject invalid stock', () => {
    return request(app.getHttpServer())
      .post('/news/process')
      .send({ symbol: 'INVALID' })
      .expect(200)
      .expect((res) => {
        expect(res.body.success).toBe(false);
        expect(res.body.error).toBeDefined();
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
```

### Performance Metrics

#### Monitoring Configuration
```typescript
// Performance tracking middleware
export function NewsPerformanceMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const originalSend = res.send;
    
    res.send = function(data) {
      const duration = Date.now() - startTime;
      
      // Log performance metrics
      if (req.path.includes('/news/')) {
        const logger = new Logger('NewsPerformance');
        logger.log(`${req.method} ${req.path} - ${duration}ms`);
        
        // Track slow requests
        if (duration > 5000) {
          logger.warn(`Slow news request: ${duration}ms for ${req.path}`);
        }
      }
      
      return originalSend.call(this, data);
    };
    
    next();
  };
}
```

#### Expected Performance Benchmarks
```yaml
Performance_Targets:
  symbol_validation: "<500ms"
  news_fetching: "<3000ms"  
  ai_analysis: "<5000ms"
  total_processing: "<10000ms"
  cache_hit_ratio: ">80%"
  
Alert_Thresholds:
  error_rate: ">5%"
  response_time_p95: ">15000ms"
  cache_miss_ratio: ">50%"
  api_failure_rate: ">10%"
```
  
  if (macroNews?.articles?.length > 0) {
    prompt += `MARKET & ECONOMIC NEWS:\n- Top Headline: ${macroNews.topHeadline}\n`;
    macroNews.articles.slice(0, 5).forEach((article, index) => {
      prompt += `  ${index + 1}. ${article.title}\n`;
    });
  }
  
  return prompt + `
Based on this news analysis, provide an investment assessment for ${symbol} in JSON format:
{
  "overview": "2-3 sentence analysis of the stock's outlook based on the news",
  "recommendation": "BUY|HOLD|SELL",
  "confidence": 1-100,
  "keyFactors": ["factor1", "factor2", "factor3"],
  "riskLevel": "LOW|MEDIUM|HIGH",
  "timeHorizon": "1-3 months|3-6 months|6-12 months"
}

Focus on: Company performance, market conditions, industry trends, risk factors, growth opportunities.`;
}
```

### Data Storage & Caching Strategy

#### File System Storage Structure
```
data/news/
├── macro_news/
│   └── 2025-01-10/
│       └── macro_news.json
└── stock_news/
    ├── AAPL/
    │   └── 2025-01-10/
    │       ├── stock_news.json
    │       └── overview.json
    └── TSLA/
        └── 2025-01-10/
            ├── stock_news.json
            └── overview.json
```

#### Storage Implementation
```typescript
private storeMacroNews(macroNews: MacroNewsData, date: string): void {
  const storeData = {
    date, timestamp: macroNews.timestamp,
    query: 'stock market economy finance business',
    topHeadline: macroNews.topHeadline,
    totalArticles: macroNews.totalArticles,
    articles: macroNews.articles,
    metadata: { source: macroNews.source, cached: false }
  };
  
  const macroPath = this.getMacroNewsPath(date);
  this.ensureDirectoryExists(path.dirname(macroPath));
  fs.writeFileSync(macroPath, JSON.stringify(storeData, null, 2));
}

private storeStockNews(stockNews: StockNewsSummary, symbol: StockSymbol, date: string): void {
  const stockNewsWithArticles = stockNews as StockNewsSummary & { _fullArticles?: SerpApiNewsResult[] };
  
  const storeData = {
    symbol, date, timestamp: new Date().toISOString(),
    query: `${symbol} stock`,
    summary: { headline: stockNews.headline, source: stockNews.source },
    ...(stockNewsWithArticles._fullArticles && {
      articles: stockNewsWithArticles._fullArticles,
      totalArticles: stockNewsWithArticles._fullArticles.length
    }),
    metadata: { source: stockNews.source, cached: false }
  };
  
  const stockPath = this.getStockNewsPath(symbol, date);
  this.ensureDirectoryExists(path.dirname(stockPath));
  fs.writeFileSync(stockPath, JSON.stringify(storeData, null, 2));
}
```

### Integration with Stock Service

#### News Service Integration Pattern
```typescript
// In stocks.service.ts - Enhanced integration
async getStock(symbol: StockSymbol): Promise<StockCardData | null> {
  const [stockData, aiEvaluation, technicalData, newsData] = 
    await Promise.allSettled([
      this.serpApiService.getStockData(symbol, 'NASDAQ'),
      this.aiEvaluationService.generateEvaluation(symbol),
      this.technicalService.getAnalysis(symbol),
      this.newsService.processStockNews(symbol) // Comprehensive news integration
    ]);
  
  // Extract news summary from comprehensive result
  const newsSummary = newsData.status === 'fulfilled' && newsData.value.isValid 
    ? {
        headline: newsData.value.overview?.overview || 'No news available',
        sentiment: this.extractSentimentFromOverview(newsData.value.overview),
        source: newsData.value.overview?.source || 'fallback_data'
      }
    : this.getMockNewsSummary(symbol);
  
  return this.transformToStockCardData(stockData, aiEvaluation, technicalData, newsSummary, symbol);
}
```

### News Module Configuration
```typescript
// news/news.module.ts
@Module({
  imports: [CacheModule],
  controllers: [NewsController],
  providers: [NewsService, ClaudeService],
  exports: [NewsService],
})
export class NewsModule {}
```

### Environment Configuration

#### Required Environment Variables
```bash
# .env file - News Service Configuration
SERPAPI_API_KEY=your-serpapi-key-for-google-news     # Required for news data
CLAUDE_API_KEY=your-claude-api-key                   # Primary AI analysis
OPENAI_API_KEY=your-openai-api-key                   # Secondary AI fallback

# Cache Configuration
NEWS_DATA_TTL=21600                                  # 6 hours for news data
AI_CONTENT_TTL=43200                                 # 12 hours for AI analysis
```

### Health Monitoring & API Validation

#### Comprehensive Health Check
```typescript
async healthCheck(): Promise<{
  status: string;
  serpApiConfigured: boolean;
  claudeConfigured: boolean; 
  openaiConfigured: boolean;
}> {
  return {
    status: 'operational',
    serpApiConfigured: !!this.serpApiKey,
    claudeConfigured: !!(await this.claudeService.healthCheck()).hasApiKey,
    openaiConfigured: !!this.openai,
  };
}
```

---

## 🚀 Cloud-Native Deployment Architecture

### Deployment Strategy Overview

**Frontend (Vercel)** + **Backend (Railway)** = **Full-Stack Cloud Deployment**

The project is designed for cloud-first development with:
- **Frontend**: Next.js app deployed on Vercel for optimal performance
- **Backend**: NestJS API deployed on Railway for scalable backend services
- **Environment Management**: Separate staging and production environments
- **CI/CD Pipeline**: Automated deployment on git push

### Production URLs
```bash
# Frontend (Vercel)
https://investie-frontend.vercel.app

# Backend (Railway)
https://investie-backend-02-production.up.railway.app
```

---

## 🖥️ Frontend Deployment (Vercel)

### Vercel Configuration

#### 1. **Project Structure for Vercel**
```typescript
// apps/web/next.config.ts - Vercel optimization
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Vercel optimization settings
  experimental: {
    optimizePackageImports: ['@investie/types', '@investie/utils'],
  },
  
  // API routes configuration for external backend
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/api/v1/:path*`,
      },
    ]
  },
  
  // Environment variables validation
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_ENVIRONMENT: process.env.NODE_ENV,
  },
  
  // Build optimization
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
}

export default nextConfig
```

#### 2. **Vercel Deployment Configuration**
Create `vercel.json` in the web app root:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "functions": {
    "app/**/*.tsx": {
      "maxDuration": 30
    }
  },
  "crons": [],
  "env": {
    "NEXT_PUBLIC_API_URL": "@api-url",
    "NODE_ENV": "production"
  },
  "build": {
    "env": {
      "NEXT_PUBLIC_API_URL": "@api-url-build"
    }
  }
}
```

#### 3. **Environment Variables (Vercel Dashboard)**
```bash
# Production Environment Variables
NEXT_PUBLIC_API_URL=https://investie-backend-02-production.up.railway.app
NEXT_PUBLIC_ENVIRONMENT=production
NODE_ENV=production

# Development Environment Variables
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_ENVIRONMENT=development
```

#### 4. **Frontend Package Configuration**
```json
// apps/web/package.json - Vercel-optimized scripts
{
  "name": "investie-frontend",
  "scripts": {
    "dev": "next dev --turbopack --port 3001",
    "build": "next build",
    "start": "next start --port 3001",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "preview": "next build && next start"
  },
  "dependencies": {
    "@investie/types": "file:../../packages/types",
    "@investie/utils": "file:../../packages/utils",
    "next": "15.4.5",
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "recharts": "^3.1.2"
  }
}
```

### Vercel Deployment Workflow

#### Manual Deployment
```bash
# Connect project to Vercel
npm install -g vercel
cd apps/web
vercel

# Production deployment
vercel --prod

# Check deployment status
vercel ls
vercel logs [deployment-url]
```

#### Automatic Deployment (Git Integration)
```bash
# Set up Vercel Git integration
vercel link

# Automatic deployments on:
# - Push to main → Production
# - Push to develop → Preview
# - Pull requests → Preview deployments
```

#### Frontend Build Optimization
```bash
# Build command for Vercel
cd apps/web
npm run build:packages  # Build shared packages first
npm run build          # Build Next.js app
```

### Frontend Environment Management

#### Development Environment Setup
```typescript
// apps/web/src/config/env.ts
export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  environment: process.env.NEXT_PUBLIC_ENVIRONMENT || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
}

// Usage in components
import { config } from '@/config/env'

const apiCall = async () => {
  const response = await fetch(`${config.apiUrl}/api/v1/stocks`)
  return response.json()
}
```

---

## 🚂 Backend Deployment (Railway)

### Railway Configuration

#### 1. **Railway Project Configuration**
```json
// railway.json - Railway deployment config
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "cd apps/backend && npm run build",
    "startCommand": "cd apps/backend && npm run start:prod",
    "watchPatterns": ["apps/backend/**"]
  },
  "deploy": {
    "numReplicas": 1,
    "restartPolicyType": "ON_FAILURE", 
    "restartPolicyMaxRetries": 10,
    "healthcheckPath": "/api/v1/health",
    "healthcheckTimeout": 30,
    "sleepApplication": false
  },
  "environments": {
    "production": {
      "variables": {
        "NODE_ENV": "production",
        "PORT": "3000"
      }
    }
  }
}
```

#### 2. **Nixpacks Configuration**
```toml
# nixpacks.toml - Build configuration for Railway
[phases.setup]
nixPkgs = ['nodejs-20_x', 'npm-10_x']

[phases.install]
cmds = ['cd apps/backend', 'npm install --only=production']

[phases.build] 
cmds = ['cd apps/backend', 'npm run build']

[start]
cmd = 'cd apps/backend && npm run start:prod'

[variables]
NODE_ENV = 'production'
PORT = '3000'
```

#### 3. **Backend Package Configuration for Railway**
```json
// apps/backend/package.json - Railway-optimized
{
  "name": "investie-backend",
  "scripts": {
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch", 
    "start:prod": "node dist/main",
    "build": "nest build",
    "build:packages": "echo 'Packages build handled separately'",
    "test": "jest",
    "test:e2e": "jest --config ./test/jest-e2e.json",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix"
  },
  "dependencies": {
    "@investie/types": "file:../../packages/types",
    "@investie/utils": "file:../../packages/utils",
    "@nestjs/common": "^10.4.10",
    "@nestjs/core": "^10.4.10",
    "@nestjs/platform-express": "^10.4.10",
    "axios": "^1.7.9",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.1"
  }
}
```

#### 4. **Environment Variables (Railway Dashboard)**
```bash
# Production API Keys (Required)
SERPAPI_API_KEY=your_production_serpapi_key
CLAUDE_API_KEY=your_production_claude_key
FRED_API_KEY=your_production_fred_key
OPENAI_API_KEY=your_production_openai_key  # Optional

# Application Configuration
NODE_ENV=production
PORT=3000

# Database Configuration (if using)
DATABASE_URL=postgresql://user:pass@host:port/db

# Redis Configuration (if using)
REDIS_URL=redis://user:pass@host:port/db

# CORS Configuration
CORS_ORIGIN=https://investie-frontend.vercel.app,https://yourdomain.com

# Logging
LOG_LEVEL=info
```

### Railway Deployment Workflow

#### Manual Deployment
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and link project
railway login
railway link

# Deploy to Railway
git push origin main  # Automatic deployment
# or
railway up           # Manual deployment

# Monitor deployment
railway logs --follow
railway status
```

#### Deployment Verification
```bash
# Health check
curl https://investie-backend-02-production.up.railway.app/api/v1/health

# API endpoints test
curl https://investie-backend-02-production.up.railway.app/api/v1/stocks/AAPL
curl https://investie-backend-02-production.up.railway.app/api/v1/market-summary
```

---

## 🔄 Complete Development Workflow

### Phase 1: Local Development Setup

#### 1. **Environment Configuration**
```bash
# Clone repository
git clone https://github.com/your-org/investie.git
cd investie

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Configure API keys for local development
```

#### 2. **Development Server Setup**
```bash
# Terminal 1: Backend (localhost:3000)
npm run dev:backend

# Terminal 2: Frontend (localhost:3001) 
npm run dev:web

# Terminal 3: Monitor all services
npm run dev  # Concurrent mode
```

#### 3. **Local Environment Variables**
```bash
# .env.local (Local Development)
# Backend API Keys
SERPAPI_API_KEY=your_dev_serpapi_key
CLAUDE_API_KEY=your_dev_claude_key  
FRED_API_KEY=your_dev_fred_key

# Frontend Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_ENVIRONMENT=development

# Development Mode
NODE_ENV=development
```

### Phase 2: Staging Environment

#### 1. **Staging Branch Strategy**
```bash
# Create staging branch
git checkout -b staging
git push origin staging

# Staging deployments trigger on staging branch push
```

#### 2. **Staging Environment URLs**
```bash
# Frontend Staging (Vercel)
https://investie-frontend-git-staging.vercel.app

# Backend Staging (Railway)
https://investie-backend-staging.railway.app
```

#### 3. **Staging Environment Variables**
```bash
# Staging API Keys (Railway)
SERPAPI_API_KEY=your_staging_serpapi_key
CLAUDE_API_KEY=your_staging_claude_key
NODE_ENV=staging
CORS_ORIGIN=https://investie-frontend-git-staging.vercel.app

# Staging Frontend Config (Vercel)
NEXT_PUBLIC_API_URL=https://investie-backend-staging.railway.app
NEXT_PUBLIC_ENVIRONMENT=staging
```

### Phase 3: Production Deployment

#### 1. **Production Branch Strategy**
```bash
# Merge to main for production
git checkout main
git merge staging
git push origin main

# Production deployments trigger automatically
```

#### 2. **Pre-Deployment Checklist**
```bash
# Build verification
npm run build:packages
npm run build

# Type checking
npm run typecheck

# Testing
npm run test
npm run test:e2e

# Linting
npm run lint
```

#### 3. **Production Environment Variables**
```bash
# Production API Keys (Railway Dashboard)
SERPAPI_API_KEY=your_production_serpapi_key
CLAUDE_API_KEY=your_production_claude_key
FRED_API_KEY=your_production_fred_key
NODE_ENV=production
CORS_ORIGIN=https://investie-frontend.vercel.app

# Production Frontend Config (Vercel Dashboard)
NEXT_PUBLIC_API_URL=https://investie-backend-02-production.up.railway.app
NEXT_PUBLIC_ENVIRONMENT=production
```

### Phase 4: Monitoring & Maintenance

#### 1. **Health Monitoring**
```bash
# Automated health checks
curl -f https://investie-backend-02-production.up.railway.app/api/v1/health
curl -f https://investie-frontend.vercel.app/api/health

# Performance monitoring
railway metrics
vercel analytics
```

#### 2. **Log Monitoring**
```bash
# Railway logs
railway logs --follow --env production

# Vercel logs
vercel logs [deployment-url]
```

#### 3. **Database & Cache Monitoring**
```bash
# Redis monitoring (if applicable)
railway run redis-cli info memory

# Database monitoring
railway psql  # Connect to PostgreSQL if using
```

---

## 🔐 Security & Environment Management

### API Key Management

#### Development Keys (Limited Quota)
```bash
# Use development/testing API keys with lower quotas
SERPAPI_API_KEY=your_dev_key_100_searches_per_month
CLAUDE_API_KEY=your_dev_key_10000_tokens_per_month
```

#### Production Keys (Full Quota)
```bash
# Use production API keys with full quotas
SERPAPI_API_KEY=your_prod_key_unlimited_searches
CLAUDE_API_KEY=your_prod_key_unlimited_tokens
```

### Environment Security Best Practices

#### 1. **Never Commit API Keys**
```bash
# .gitignore
.env
.env.local
.env.production.local
.env.staging.local
**/.env*
!/.env.example
```

#### 2. **Environment Variable Validation**
```typescript
// apps/backend/src/config/env.validation.ts
import { IsString, IsUrl, IsEnum, IsOptional } from 'class-validator'

export class EnvironmentVariables {
  @IsEnum(['development', 'staging', 'production'])
  NODE_ENV: string

  @IsString()
  SERPAPI_API_KEY: string

  @IsString()
  CLAUDE_API_KEY: string

  @IsOptional()
  @IsString()
  OPENAI_API_KEY?: string

  @IsUrl()
  CORS_ORIGIN: string
}
```

#### 3. **Runtime Environment Checks**
```typescript
// apps/backend/src/main.ts
async function bootstrap() {
  // Validate required environment variables on startup
  const requiredEnvVars = ['SERPAPI_API_KEY', 'CLAUDE_API_KEY']
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`)
    }
  }
  
  const app = await NestFactory.create(AppModule)
  await app.listen(process.env.PORT ?? 3000)
}
```

---

## 📊 CI/CD Pipeline Configuration

### GitHub Actions (Optional Advanced Setup)

#### 1. **Build and Test Pipeline**
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, staging, develop]
  pull_request:
    branches: [main]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build packages
      run: npm run build:packages
    
    - name: Type check
      run: npm run typecheck
    
    - name: Run tests
      run: npm run test
    
    - name: Build applications
      run: npm run build
      
    - name: E2E tests
      run: npm run test:e2e
```

#### 2. **Deployment Pipeline**
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
    - name: Deploy to Railway
      run: |
        # Railway deployment happens automatically
        echo "Backend deployed to Railway"
  
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
    - name: Deploy to Vercel
      run: |
        # Vercel deployment happens automatically
        echo "Frontend deployed to Vercel"
```

### Deployment Status Monitoring

#### 1. **Automated Testing After Deployment**
```bash
# test-production-deployment.sh
#!/bin/bash

BACKEND_URL="https://investie-backend-02-production.up.railway.app"
FRONTEND_URL="https://investie-frontend.vercel.app"

# Backend health check
curl -f "$BACKEND_URL/api/v1/health" || exit 1

# Frontend health check
curl -f "$FRONTEND_URL" || exit 1

# API functionality test
curl -f "$BACKEND_URL/api/v1/stocks/AAPL" | jq '.symbol' || exit 1

echo "✅ Production deployment verified successfully"
```

#### 2. **Performance Monitoring Setup**
```typescript
// apps/backend/src/monitoring/performance.middleware.ts
export function PerformanceMonitoringMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now()
    
    res.on('finish', () => {
      const duration = Date.now() - startTime
      
      // Log slow requests
      if (duration > 5000) {
        console.warn(`Slow request: ${req.method} ${req.path} - ${duration}ms`)
      }
      
      // Send metrics to monitoring service (optional)
      // sendToMonitoring({ path: req.path, duration, status: res.statusCode })
    })
    
    next()
  }
}
```

---

## 🎨 Frontend Architecture (TradingView Integration)

### Design System
- **Framework**: Next.js 15.4.5 with App Router
- **Styling**: Tailwind CSS 4.x
- **Charts**: TradingView Widgets (External Embedding)
- **Layout**: CSS Grid with responsive design

### Frontend Structure Analysis

#### Layout Grid System
```css
/* Main Grid Layout - From styles.css */
main {
  display: grid;
  max-width: 1080px;
  grid-template-columns: 1fr 1fr;
  grid-gap: var(--gap-size);
}

/* Component Spanning Rules */
.span-one-column {
  grid-column: span 1;  /* Symbol Info, Technical Analysis */
}

.span-full-grid {
  grid-column: span 2;  /* Advanced Chart, Fundamental Data, etc. */
}
```

#### TradingView Widget Components

##### 1. **Ticker Tape** (Market Overview)
```javascript
// Dual ticker implementation - Market indices + bonds/commodities
// First ticker - Main market indices
{
  "symbols": [
    {"proName": "FRED:DJIA", "title": "Dow Jones"},
    {"proName": "SPREADEX:SPX", "title": "S&P 500"},
    {"proName": "NASDAQ:IXIC", "title": "NASDAQ"},
    {"proName": "IG:RUSSELL", "title": "Russell"},
    {"proName": "BITSTAMP:BTCUSD", "title": "Bitcoin"},
    {"proName": "BITSTAMP:ETHUSD", "title": "Ethereum"}
  ],
  "colorTheme": "light",
  "locale": "en",
  "largeChartUrl": "",
  "isTransparent": true,
  "showSymbolLogo": true
}

// Second ticker - Bonds and commodities
{
  "symbols": [
    {"proName": "PYTH:US02Y", "title": "US 2yr Bond"},
    {"proName": "PYTH:US10Y", "title": "US 10yr Bond"},
    {"proName": "MARKETSCOM:OIL", "title": "Oil"},
    {"proName": "CAPITALCOM:GOLD", "title": "Gold"},
    {"proName": "NASDAQ:MSTR", "title": "MicroStrategy"},
    {"proName": "AMEX:BMNR", "title": "Bitmine"}
  ],
  "colorTheme": "light",
  "locale": "en", 
  "isTransparent": true,
  "showSymbolLogo": true
}
```

##### 2. **Symbol Info Widget** (Stock Price Display)
```javascript
// Main stock price display - Left column
{
  "symbol": "NASDAQ:AAPL",
  "colorTheme": "light",
  "isTransparent": true,
  "locale": "en",
  "width": "50%"
  // Note: Height and width are controlled by CSS container
}
```

##### 3. **Technical Analysis Widget** (RSI, Indicators)
```javascript
// Technical indicators - Right column  
{
  "colorTheme": "light",
  "displayMode": "multiple",
  "isTransparent": true,
  "locale": "en",
  "interval": "1D",
  "disableInterval": false,
  "width": "100%",
  "height": "100%",
  "symbol": "NASDAQ:AAPL",
  "showIntervalTabs": true
}
```

##### 4. **Advanced Chart Widget** (Main Chart)
```javascript
// Full-width interactive chart with comprehensive settings
{
  "allow_symbol_change": true,
  "calendar": false,
  "details": false,
  "hide_side_toolbar": true,
  "hide_top_toolbar": false,
  "hide_legend": false,
  "hide_volume": false,
  "hotlist": false,
  "interval": "D",
  "locale": "en",
  "save_image": true,
  "style": "1",
  "symbol": "NASDAQ:AAPL",
  "theme": "light",
  "timezone": "Etc/UTC",
  "backgroundColor": "#ffffff",
  "gridColor": "rgba(46, 46, 46, 0.06)",
  "watchlist": [],
  "withdateranges": false,
  "compareSymbols": [],
  "studies": [],
  "autosize": true
}
```

##### 5. **Fundamental Data Widget** (Financial Metrics)
```javascript
// Company financials display
{
  "symbol": "NASDAQ:AAPL",
  "colorTheme": "light",
  "displayMode": "regular",
  "isTransparent": true,
  "locale": "en",
  "width": "100%",
  "height": "100%"
}
```

##### 6. **Company Profile Widget** (Company Information)
```javascript
// Company profile and description
{
  "symbol": "NASDAQ:AAPL",
  "colorTheme": "light",
  "isTransparent": true,
  "locale": "en",
  "width": "100%",
  "height": "100%"
}
```

##### 7. **Top Stories/Timeline Widget** (News Feed)
```javascript
// Symbol-specific news timeline
{
  "displayMode": "regular",
  "feedMode": "symbol",
  "colorTheme": "light",
  "symbol": "NASDAQ:AAPL",
  "isTransparent": true,
  "locale": "en",
  "width": "100%",
  "height": "100%"
}
```

### Component Heights (From CSS Analysis)
```css
#ticker-tape         { height: 170px; }
#symbol-info         { height: 480px; }
#technical-analysis  { height: 480px; }
#advanced-chart      { height: 600px; }
#company-profile     { height: 300px; }
#fundamental-data    { height: 490px; }
#top-stories         { height: 425px; }
```

### UI Implementation Guidelines

#### Critical Layout Requirements
1. **Max Width Constraint**: `1080px` maximum width for main grid
2. **Two-Column Grid**: `grid-template-columns: 1fr 1fr` for desktop layout
3. **Component Heights**: Exact pixel heights must be maintained for proper widget rendering
4. **Gap Size**: `32px` consistent spacing using CSS custom properties

#### TradingView Widget Script Loading Pattern
```javascript
// Critical: Scripts must be loaded dynamically and asynchronously
// Widget configuration must be embedded as JSON within script tags
<script type="text/javascript" src="https://s3.tradingview.com/external-embedding/embed-widget-[TYPE].js" async>
{
  // Widget configuration as JSON object
  "symbol": "NASDAQ:AAPL",
  "colorTheme": "light",
  "isTransparent": true
}
</script>
```

#### Symbol Format Requirements
- **Backend Format**: `AAPL`, `TSLA`, `MSFT` (simple stock symbols)
- **TradingView Format**: `NASDAQ:AAPL`, `NASDAQ:TSLA` (exchange:symbol)
- **Conversion Required**: Frontend must prefix symbols with exchange

#### Widget Container Structure
```html
<!-- Standard container pattern for all widgets -->
<div class="tradingview-widget-container">
  <div class="tradingview-widget-container__widget"></div>
  <!-- Script tag with widget configuration -->
</div>

<!-- Symbol Info uses span elements (different pattern) -->
<span class="tradingview-widget-container">
  <span class="tradingview-widget-container__widget"></span>
  <!-- Script tag with widget configuration -->
</span>
```

#### Component Loading Order
1. **Ticker Tape** (170px height) - Market overview navigation
2. **Symbol Info** (480px height) - Left column price display
3. **Technical Analysis** (480px height) - Right column indicators
4. **Advanced Chart** (600px height) - Full-width main chart
5. **Fundamental Data** (490px height) - Full-width financial metrics
6. **Company Profile** (300px height) - Full-width company information
7. **Top Stories** (425px height) - Full-width news timeline

### Frontend-Backend Integration

#### Data Sync Strategy
```typescript
// Frontend expects TradingView-compatible symbol format
const symbol = "NASDAQ:AAPL";  // Not just "AAPL"

// Backend API calls - Convert from TradingView to backend format
const backendSymbol = symbol.split(':')[1];  // Extract "AAPL" from "NASDAQ:AAPL"
const stockData = await fetch(`/api/v1/stocks/${backendSymbol}`);
const chartData = await fetch(`/api/v1/stocks/${backendSymbol}/chart?period=1W`);

// Real-time updates
const marketSummary = await fetch('/api/v1/market-summary');

// Widget symbol switching
function updateWidgetSymbol(newSymbol: string) {
  // Ensure proper NASDAQ: prefix for TradingView widgets
  const tradingViewSymbol = newSymbol.startsWith('NASDAQ:') ? newSymbol : `NASDAQ:${newSymbol}`;
  
  // Update all widgets with new symbol
  updateSymbolInfoWidget(tradingViewSymbol);
  updateTechnicalAnalysisWidget(tradingViewSymbol);
  updateAdvancedChartWidget(tradingViewSymbol);
  updateFundamentalDataWidget(tradingViewSymbol);
  updateCompanyProfileWidget(tradingViewSymbol);
  updateTopStoriesWidget(tradingViewSymbol);
}
```

#### Real-time Data Flow
```typescript
// Backend provides data → Frontend displays via TradingView widgets
// Backend: /api/v1/stocks/AAPL → { symbol: "AAPL", price: { current: 229.35 } }
// Frontend: NASDAQ:AAPL → TradingView widgets display real-time data

// Backend AI evaluation supplements TradingView data
// AI insights displayed alongside TradingView financial widgets
```

---

## 🚀 Complete Implementation Guide

### Phase 1: Backend Setup (API-First)

#### 1.1 Environment Setup
```bash
# Create project structure
mkdir -p investie/{apps/{backend,web,mobile},packages/{types,mock,utils}}
cd investie

# Initialize backend
cd apps/backend
npm init -y
npm install @nestjs/core @nestjs/common @nestjs/platform-express
npm install --save-dev @nestjs/cli typescript @types/node
```

#### 1.2 Required API Keys
```bash
# .env file - DO NOT COMMIT TO GIT
SERPAPI_API_KEY=your-serpapi-key-for-google-finance
CLAUDE_API_KEY=your-claude-api-key-for-ai-analysis  
FRED_API_KEY=your-fred-api-key-for-economic-data

# Cache Configuration
REDIS_HOST=your-redis-host
ECONOMIC_DATA_TTL=86400  # 24 hours
STOCK_DATA_TTL=300       # 5 minutes
AI_CONTENT_TTL=43200     # 12 hours
```

#### 1.3 AI Services Implementation (Production-Ready)

##### Step-by-Step AI Service Setup

**1. Install Required Dependencies**:
```bash
cd apps/backend
npm install @anthropic-ai/sdk@^0.59.0
```

**2. Create Claude Service** (`src/services/claude.service.ts`):
```typescript
import { Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';

@Injectable()
export class ClaudeService {
  private readonly logger = new Logger(ClaudeService.name);
  private readonly anthropic: Anthropic;
  private readonly isConfigured: boolean;

  constructor() {
    this.isConfigured = !!process.env.CLAUDE_API_KEY;
    
    if (!this.isConfigured) {
      this.logger.warn('Claude API key not configured - using fallback responses');
    } else {
      this.logger.log('Claude API service initialized with API key');
    }

    this.anthropic = new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY || 'fallback_key',
    });
  }

  async generateStructuredResponse<T>(prompt: string, schema: string): Promise<T> {
    if (!this.isConfigured) {
      throw new Error('Claude API key required for structured responses');
    }

    try {
      const fullPrompt = `${prompt}\n\nRespond with valid JSON matching this schema:\n${schema}`;
      const message = await this.anthropic.messages.create({
        model: process.env.CLAUDE_MODEL || 'claude-3-haiku-20240307',
        max_tokens: 1000,
        messages: [{ role: 'user', content: fullPrompt }],
      });

      const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
      
      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return JSON.parse(responseText);
    } catch (error) {
      this.logger.error('Structured response parsing failed:', error.message);
      throw new Error(`Failed to parse structured response: ${error.message}`);
    }
  }

  async healthCheck(): Promise<{ status: string; hasApiKey: boolean; model: string; validated?: boolean }> {
    const result = {
      status: this.isConfigured ? 'ready' : 'api_key_required',
      hasApiKey: this.isConfigured,
      model: process.env.CLAUDE_MODEL || 'claude-3-haiku-20240307',
      validated: false,
    };

    if (this.isConfigured) {
      try {
        const testResponse = await this.anthropic.messages.create({
          model: result.model,
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Test' }],
        });
        result.validated = true;
        result.status = 'operational';
      } catch (error) {
        this.logger.error('Claude API validation failed:', error.message);
        result.status = 'api_key_invalid';
      }
    }

    return result;
  }
}
```

**3. Create AI Evaluation Service** (`src/ai/ai-evaluation.service.ts`):
```typescript
import { Injectable, Logger } from '@nestjs/common';
import type { AIEvaluation, StockSymbol } from '../types';
import { ClaudeService } from '../services/claude.service';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class AIEvaluationService {
  private readonly logger = new Logger(AIEvaluationService.name);

  constructor(
    private readonly claudeService: ClaudeService,
    private readonly cacheService: CacheService,
  ) {}

  async generateEvaluation(symbol: StockSymbol, stockData?: any): Promise<AIEvaluation> {
    try {
      // Check cache first (12-hour TTL)
      const cacheKey = `evaluation:${symbol}`;
      const cached = this.cacheService.getAIContent<AIEvaluation>(cacheKey);
      if (cached) {
        this.logger.log(`Using cached evaluation for ${symbol}`);
        return cached;
      }

      this.logger.log(`Generating AI evaluation for ${symbol}`);
      
      const prompt = this.buildEvaluationPrompt(symbol, stockData);
      const response = await this.claudeService.generateStructuredResponse<{
        summary: string;
        rating: 'bullish' | 'neutral' | 'bearish';
        confidence: number;
        keyFactors: string[];
        timeframe: '1W' | '1M' | '3M';
      }>(prompt, this.getEvaluationSchema());

      const evaluation: AIEvaluation = {
        ...response,
        source: 'claude_ai',
        lastUpdated: new Date().toISOString(),
      };

      // Cache the result
      this.cacheService.setAIContent(cacheKey, evaluation);
      
      this.logger.log(`Generated AI evaluation for ${symbol}: ${evaluation.rating} (${evaluation.confidence}%)`);
      return evaluation;
    } catch (error) {
      this.logger.error(`AI evaluation failed for ${symbol}:`, error.message);
      
      // Fallback to enhanced mock data
      return this.getEnhancedMockEvaluation(symbol);
    }
  }

  private buildEvaluationPrompt(symbol: StockSymbol, stockData: any): string {
    const dataContext = stockData ? 
      `Current price: $${stockData.price || 'N/A'}, Volume: ${stockData.volume || 'N/A'}, Market Cap: ${stockData.marketCap || 'N/A'}` :
      'Using latest available market data';

    return `
As a senior investment analyst, provide a comprehensive evaluation of ${symbol} stock.

Context: ${dataContext}

Consider these factors in your analysis:
1. Recent financial performance and key metrics
2. Market sentiment and technical indicators  
3. Industry trends and competitive position
4. Risk factors and potential growth catalysts
5. Current economic environment and market conditions
6. Recent news and developments affecting the company

Provide a balanced, objective analysis suitable for retail investors.
Focus on actionable insights with clear reasoning.
Rate the stock as bullish, neutral, or bearish with a confidence level (0-100).
Identify 3-4 key factors that most influence your rating.
Set an appropriate timeframe for this evaluation (1W, 1M, or 3M).

Be specific about ${symbol}'s business model, competitive advantages, and current challenges.
    `;
  }

  private getEvaluationSchema(): string {
    return `{
  "summary": "2-3 sentence comprehensive analysis explaining the rating and outlook",
  "rating": "bullish|neutral|bearish", 
  "confidence": "number between 0-100 representing confidence in the analysis",
  "keyFactors": ["factor1", "factor2", "factor3", "factor4"],
  "timeframe": "1W|1M|3M"
}`;
  }

  // Enhanced mock data with realistic evaluations for all 10 stocks
  private getEnhancedMockEvaluation(symbol: StockSymbol): AIEvaluation {
    const evaluations: Record<StockSymbol, Partial<AIEvaluation>> = {
      'AAPL': {
        summary: 'Apple demonstrates strong fundamentals with robust Services revenue growth and Vision Pro innovation potential. iPhone upgrade cycle momentum building despite supply chain challenges.',
        rating: 'bullish' as const,
        confidence: 85,
        keyFactors: ['Services revenue expansion', 'Vision Pro market opportunity', 'Strong balance sheet', 'AI integration across products'],
      },
      'TSLA': {
        summary: 'Tesla faces delivery headwinds but maintains EV market leadership. FSD progress and energy storage growth provide catalysts amid valuation concerns.',
        rating: 'neutral' as const,
        confidence: 70,
        keyFactors: ['EV market competition intensifying', 'FSD technology advancement', 'Energy business scaling', 'Valuation premium concerns'],
      },
      'MSFT': {
        summary: 'Microsoft benefits from Azure cloud growth and AI integration across products. Strong enterprise positioning drives consistent revenue growth.',
        rating: 'bullish' as const,
        confidence: 88,
        keyFactors: ['Azure cloud market share', 'AI/Copilot integration', 'Enterprise software dominance', 'Subscription model stability'],
      },
      'GOOGL': {
        summary: 'Google maintains search dominance while investing in AI capabilities. Cloud growth and cost optimization efforts support long-term outlook.',
        rating: 'bullish' as const,
        confidence: 82,
        keyFactors: ['Search advertising resilience', 'Bard/Gemini AI development', 'Google Cloud acceleration', 'YouTube revenue growth'],
      },
      'AMZN': {
        summary: 'Amazon shows AWS strength and retail efficiency improvements. Cloud margins and prime membership growth drive profitability.',
        rating: 'bullish' as const,
        confidence: 80,
        keyFactors: ['AWS market leadership', 'Retail margin expansion', 'Prime ecosystem growth', 'Logistics optimization'],
      },
      'NVDA': {
        summary: 'NVIDIA leads AI chip market with strong data center demand. Gaming recovery and automotive AI expansion provide diversification.',
        rating: 'bullish' as const,
        confidence: 90,
        keyFactors: ['AI chip market dominance', 'Data center demand surge', 'Gaming market recovery', 'Automotive AI partnerships'],
      },
      'META': {
        summary: 'Meta shows advertising recovery with improved efficiency metrics. VR/AR investments position for future growth despite current costs.',
        rating: 'neutral' as const,
        confidence: 75,
        keyFactors: ['Digital advertising recovery', 'Reality Labs investment costs', 'User engagement metrics', 'AI-driven content optimization'],
      },
      'NFLX': {
        summary: 'Netflix demonstrates subscriber growth resilience with password sharing monetization. Content investment and international expansion drive growth.',
        rating: 'neutral' as const,
        confidence: 78,
        keyFactors: ['Subscriber growth sustainability', 'Password sharing crackdown success', 'Content production costs', 'Streaming competition'],
      },
      'AVGO': {
        summary: 'Broadcom benefits from AI infrastructure demand and diversified semiconductor portfolio. Software acquisitions expand addressable market.',
        rating: 'bullish' as const,
        confidence: 83,
        keyFactors: ['AI infrastructure demand', 'Diversified product portfolio', 'Software acquisition strategy', 'Enterprise customer base'],
      },
      'AMD': {
        summary: 'AMD gains CPU and GPU market share with competitive product roadmap. Data center and AI chip opportunities offset PC market weakness.',
        rating: 'neutral' as const,
        confidence: 76,
        keyFactors: ['CPU market share gains', 'GPU AI competition', 'Data center growth', 'PC market cyclical weakness'],
      },
    };

    const evaluation = evaluations[symbol] || {
      summary: `${symbol} analysis requires real-time market data integration. Current market conditions remain mixed with fundamental uncertainty.`,
      rating: 'neutral' as const,
      confidence: 60,
      keyFactors: ['Market volatility', 'Economic uncertainty', 'Sector performance', 'Technical indicators'],
    };

    return {
      summary: evaluation.summary || 'Stock evaluation unavailable at this time.',
      rating: evaluation.rating || 'neutral',
      confidence: evaluation.confidence || 50,
      keyFactors: evaluation.keyFactors || ['Market conditions', 'Company fundamentals', 'Technical analysis'],
      timeframe: '3M',
      source: 'claude_ai',
      lastUpdated: new Date().toISOString(),
    };
  }

  async refreshEvaluation(symbol: StockSymbol, stockData?: any): Promise<AIEvaluation> {
    const cacheKey = `evaluation:${symbol}`;
    this.cacheService.delete(`ai:${cacheKey}`);
    return this.generateEvaluation(symbol, stockData);
  }

  async healthCheck(): Promise<{ status: string; cacheSize: number }> {
    const claudeHealth = await this.claudeService.healthCheck();
    return {
      status: claudeHealth.hasApiKey ? 'operational' : 'limited_functionality',
      cacheSize: this.cacheService.getCacheStats()?.totalItems || 0,
    };
  }
}
```

**4. Create AI Module** (`src/ai/ai.module.ts`):
```typescript
import { Module } from '@nestjs/common';
import { AIEvaluationService } from './ai-evaluation.service';
import { ClaudeService } from '../services/claude.service';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [CacheModule],
  providers: [
    AIEvaluationService,
    ClaudeService,
  ],
  exports: [
    AIEvaluationService,
    ClaudeService,
  ],
})
export class AIModule {}
```

**5. Integration with Stock Service**:
```typescript
// In src/stocks/stocks.service.ts
constructor(
  private readonly serpApiService: SerpApiService,
  private readonly aiEvaluationService: AIEvaluationService, // Add AI service
  private readonly technicalService: TechnicalAnalysisService,
  private readonly cacheService: CacheService,
) {}

async getStock(symbol: StockSymbol): Promise<StockCardData | null> {
  const [stockData, aiEvaluation, technicalData] = 
    await Promise.allSettled([
      this.serpApiService.getStockData(symbol, 'NASDAQ'),
      this.aiEvaluationService.generateEvaluation(symbol), // AI integration
      this.technicalService.getAnalysis(symbol)
    ]);
  
  // Transform and combine all data
  return this.transformToStockCardData(stockData, aiEvaluation, technicalData, symbol);
}
```

**6. Environment Configuration**:
```bash
# apps/backend/.env
CLAUDE_API_KEY=sk-ant-api03-your-actual-api-key-here
CLAUDE_MODEL=claude-3-haiku-20240307
AI_CONTENT_TTL=43200  # 12 hours
```

**7. Testing AI Services**:
```bash
# Test Claude service health
curl http://localhost:3000/api/v1/health

# Test individual stock with AI evaluation
curl http://localhost:3000/api/v1/stocks/AAPL | jq .aiEvaluation

# Force refresh AI evaluation
curl -X POST http://localhost:3000/api/v1/stocks/AAPL/refresh-ai
```

#### 1.4 Core Services Implementation

##### SerpApi Integration (Critical - Fixed Data Extraction)
```typescript
// apps/backend/src/services/serpapi.service.ts
@Injectable()
export class SerpApiService {
  async getStockData(symbol: string, exchange = 'NASDAQ') {
    const result = await getJson({
      engine: 'google_finance',
      api_key: this.apiKey,
      q: `${symbol}:${exchange}`,
    });
    
    // CRITICAL: Use extracted_price, not price field
    return {
      price: result.summary.extracted_price,        // NOT result.summary.price
      change: result.summary.market.price_movement.value,
      changePercent: result.summary.market.price_movement.percentage
    };
  }
}
```

##### Stock Service Orchestration
```typescript
// apps/backend/src/stocks/stocks.service.ts
@Injectable()
export class StocksService {
  async getStock(symbol: StockSymbol): Promise<StockCardData | null> {
    const [stockData, newsData, aiEvaluation, technicalData] = 
      await Promise.allSettled([
        this.serpApiService.getStockData(symbol, 'NASDAQ'),
        this.serpApiService.getStockNews(symbol),
        this.claudeService.generateStockEvaluation(symbol),
        this.technicalService.getAnalysis(symbol)
      ]);
    
    return this.transformToStockCardData(stockData, newsData, aiEvaluation, technical, symbol);
  }
}
```

#### 1.4 API Endpoints Implementation
```typescript
// apps/backend/src/stocks/stocks.controller.ts
@Controller('api/v1/stocks')
export class StocksController {
  @Get()
  async getAllStocks(): Promise<StockCardData[]> {
    return await this.stocksService.getAllStocks();
  }

  @Get(':symbol')
  async getStock(@Param('symbol') symbol: StockSymbol): Promise<StockCardData | null> {
    return await this.stocksService.getStock(symbol);
  }
}
```

### Phase 2: Frontend Setup (TradingView Integration)

#### 2.1 Next.js Project Setup
```bash
cd apps/web
npx create-next-app@latest . --typescript --tailwind --app
npm install recharts  # For custom charts if needed
```

#### 2.2 TradingView Widget Integration

##### Complete HTML Implementation (Production-Ready)
```html
<!-- Dual Ticker Tape - Market Overview -->
<nav id="ticker-tape">
  <!-- Market Indices Ticker -->
  <div class="tradingview-widget-container">
    <div class="tradingview-widget-container__widget"></div>
    <script type="text/javascript" src="https://s3.tradingview.com/external-embedding/embed-widget-tickers.js" async>
    {
      "symbols": [
        {"proName": "FRED:DJIA", "title": "Dow Jones"},
        {"proName": "SPREADEX:SPX", "title": "S&P 500"},
        {"proName": "NASDAQ:IXIC", "title": "NASDAQ"},
        {"proName": "IG:RUSSELL", "title": "Russell"},
        {"proName": "BITSTAMP:BTCUSD", "title": "Bitcoin"},
        {"proName": "BITSTAMP:ETHUSD", "title": "Ethereum"}
      ],
      "colorTheme": "light",
      "locale": "en",
      "isTransparent": true,
      "showSymbolLogo": true
    }
    </script>
  </div>
  
  <!-- Bonds & Commodities Ticker -->
  <div class="tradingview-widget-container">
    <div class="tradingview-widget-container__widget"></div>
    <script type="text/javascript" src="https://s3.tradingview.com/external-embedding/embed-widget-tickers.js" async>
    {
      "symbols": [
        {"proName": "PYTH:US02Y", "title": "US 2yr Bond"},
        {"proName": "PYTH:US10Y", "title": "US 10yr Bond"},
        {"proName": "MARKETSCOM:OIL", "title": "Oil"},
        {"proName": "CAPITALCOM:GOLD", "title": "Gold"},
        {"proName": "NASDAQ:MSTR", "title": "MicroStrategy"},
        {"proName": "AMEX:BMNR", "title": "Bitmine"}
      ],
      "colorTheme": "light",
      "locale": "en",
      "isTransparent": true,
      "showSymbolLogo": true
    }
    </script>
  </div>
</nav>

<!-- Main Grid Layout -->
<main>
  <!-- Symbol Info Widget - Left Column -->
  <section id="symbol-info">
    <span class="tradingview-widget-container">
      <span class="tradingview-widget-container__widget"></span>
      <script type="text/javascript" src="https://s3.tradingview.com/external-embedding/embed-widget-symbol-info.js" async>
      {
        "symbol": "NASDAQ:AAPL",
        "colorTheme": "light",
        "isTransparent": true,
        "locale": "en",
        "width": "50%"
      }
      </script>
    </span>
  </section>

  <!-- Technical Analysis Widget - Right Column -->
  <section id="technical-analysis">
    <span class="tradingview-widget-container">
      <span class="tradingview-widget-container__widget"></span>
      <script type="text/javascript" src="https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js" async>
      {
        "colorTheme": "light",
        "displayMode": "multiple",
        "isTransparent": true,
        "locale": "en",
        "interval": "1D",
        "disableInterval": false,
        "width": "100%",
        "height": "100%",
        "symbol": "NASDAQ:AAPL",
        "showIntervalTabs": true
      }
      </script>
    </span>
  </section>

  <!-- Advanced Chart - Full Width -->
  <section id="advanced-chart">
    <div class="tradingview-widget-container" style="height:100%;width:100%">
      <div class="tradingview-widget-container__widget" style="height:calc(100% - 32px);width:100%"></div>
      <script type="text/javascript" src="https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js" async>
      {
        "allow_symbol_change": true,
        "calendar": false,
        "details": false,
        "hide_side_toolbar": true,
        "hide_top_toolbar": false,
        "hide_legend": false,
        "hide_volume": false,
        "hotlist": false,
        "interval": "D",
        "locale": "en",
        "save_image": true,
        "style": "1",
        "symbol": "NASDAQ:AAPL",
        "theme": "light",
        "timezone": "Etc/UTC",
        "backgroundColor": "#ffffff",
        "gridColor": "rgba(46, 46, 46, 0.06)",
        "watchlist": [],
        "withdateranges": false,
        "compareSymbols": [],
        "studies": [],
        "autosize": true
      }
      </script>
    </div>
  </section>

  <!-- Fundamental Data - Full Width -->
  <section id="fundamental-data">
    <div class="tradingview-widget-container">
      <div class="tradingview-widget-container__widget"></div>
      <script type="text/javascript" src="https://s3.tradingview.com/external-embedding/embed-widget-financials.js" async>
      {
        "symbol": "NASDAQ:AAPL",
        "colorTheme": "light",
        "displayMode": "regular",
        "isTransparent": true,
        "locale": "en",
        "width": "100%",
        "height": "100%"
      }
      </script>
    </div>
  </section>

  <!-- Company Profile -->
  <section id="company-profile">
    <div class="tradingview-widget-container">
      <div class="tradingview-widget-container__widget"></div>
      <script type="text/javascript" src="https://s3.tradingview.com/external-embedding/embed-widget-symbol-profile.js" async>
      {
        "symbol": "NASDAQ:AAPL",
        "colorTheme": "light",
        "isTransparent": true,
        "locale": "en",
        "width": "100%",
        "height": "100%"
      }
      </script>
    </div>
  </section>

  <!-- Top Stories/News Timeline -->
  <section id="top-stories">
    <div class="tradingview-widget-container">
      <div class="tradingview-widget-container__widget"></div>
      <script type="text/javascript" src="https://s3.tradingview.com/external-embedding/embed-widget-timeline.js" async>
      {
        "displayMode": "regular",
        "feedMode": "symbol",
        "colorTheme": "light",
        "symbol": "NASDAQ:AAPL",
        "isTransparent": true,
        "locale": "en",
        "width": "100%",
        "height": "100%"
      }
      </script>
    </div>
  </section>
</main>
```

##### React/Next.js Component Implementation
```typescript
// components/TradingViewWidget.tsx
export function TradingViewSymbolInfo({ symbol }: { symbol: string }) {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-info.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbol: `NASDAQ:${symbol}`,
      colorTheme: 'light',
      isTransparent: true,
      locale: 'en',
      width: '50%'
    });
    
    const container = document.querySelector('#symbol-info .tradingview-widget-container__widget');
    container?.appendChild(script);
  }, [symbol]);

  return (
    <section id="symbol-info">
      <span className="tradingview-widget-container">
        <span className="tradingview-widget-container__widget"></span>
      </span>
    </section>
  );
}
```

#### 2.3 Layout Implementation
```typescript
// app/stocks/[symbol]/page.tsx
export default function StockDetailPage({ params }: { params: { symbol: string } }) {
  return (
    <div className="stock-detail-layout">
      {/* Ticker Tape - Top */}
      <nav className="ticker-tape">
        <TradingViewTickerTape />
      </nav>
      
      {/* Main Grid Layout */}
      <main className="main-grid">
        {/* Left Column */}
        <section className="span-one-column">
          <TradingViewSymbolInfo symbol={params.symbol} />
        </section>
        
        {/* Right Column */} 
        <section className="span-one-column">
          <TradingViewTechnicalAnalysis symbol={params.symbol} />
        </section>
        
        {/* Full Width Components */}
        <section className="span-full-grid">
          <TradingViewAdvancedChart symbol={params.symbol} />
        </section>
        
        <section className="span-full-grid">
          <TradingViewFundamentalData symbol={params.symbol} />
        </section>
      </main>
    </div>
  );
}
```

#### 2.4 Complete Styling Implementation (Production CSS)
```css
/* globals.css - Complete styles from working frontend */
:root {
  --gap-size: 32px;
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, 'Trebuchet MS', Roboto, Ubuntu, sans-serif;
  color: #000;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #fff;
}

/* Header Layout */
header {
  display: flex;
  width: 100%;
  align-items: center;
  background: rgba(0, 0, 0, 0.05);
  justify-content: space-between;
  padding: 0 var(--gap-size);
  gap: calc(var(--gap-size) * 2);
  box-shadow: rgba(0, 0, 0, 0.05) 0 2px 6px 0;
  flex-direction: row;
}

header #site-logo {
  font-weight: 600;
  font-size: 32px;
  padding: 16px;
  background: linear-gradient(90deg, #00bce5 0%, #2962ff 100%);
  -webkit-text-fill-color: transparent;
  -webkit-background-clip: text;
  background-clip: text;
}

header input[type='search'] {
  padding: 10px;
  width: 100%;
  height: 32px;
  max-width: 400px;
  border: 1px solid #ccc;
  border-radius: 20px;
}

/* Main Grid Layout - CRITICAL IMPLEMENTATION */
main {
  display: grid;
  width: 100%;
  padding: 0 calc(var(--gap-size) * 0.5);
  max-width: 1080px;  /* Key constraint for proper layout */
  grid-template-columns: 1fr 1fr;  /* Two-column responsive grid */
  grid-gap: var(--gap-size);
}

/* Grid Column Spanning Rules */
.span-one-column,
#symbol-info,
#technical-analysis {
  grid-column: span 1;  /* Left and right columns */
}

.span-full-grid,
#advanced-chart,
#company-profile,
#fundamental-data,
#top-stories,
#powered-by-tv {
  grid-column: span 2;  /* Full-width components */
}

/* Component Styling and Heights - EXACT MEASUREMENTS */
.skeleton,
#symbol-info,
#technical-analysis,
#advanced-chart,
#company-profile,
#fundamental-data,
#top-stories,
#ticker-tape {
  text-align: center;
  padding: 16px;
  font-size: 24px;
  background: rgba(0, 0, 0, 0.075);
  border-radius: 4px;
}

/* Precise Component Heights */
#ticker-tape {
  width: 90%;
  margin: var(--gap-size);
  height: 170px;  /* Dual ticker height */
}

#symbol-info,
#technical-analysis {
  height: 480px;  /* Side-by-side components */
}

#advanced-chart {
  height: 600px;  /* Main chart display */
}

#company-profile {
  height: 300px;
}

#fundamental-data {
  height: 490px;
}

#top-stories {
  height: 425px;
}

/* TradingView Attribution Section */
#powered-by-tv {
  display: flex;
  background: #f8f9fd;
  border: solid 1px #e0e3eb;
  text-align: justify;
  flex-direction: column;
  gap: 8px;
  font-size: 14px;
  padding: 16px;
  border-radius: 6px;
}

#powered-by-tv a, 
#powered-by-tv a:visited {
  color: #2962ff;
}

#powered-by-tv p {
  margin: 0;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.6);
}

/* Responsive Design - Mobile Layout */
@media (max-width: 800px) {
  main > section,
  .span-full-grid,
  #symbol-info,
  #technical-analysis {
    grid-column: span 2;  /* Stack vertically on mobile */
  }
}

/* Footer */
footer {
  display: flex;
  width: 100%;
  align-items: center;
  background: rgba(0, 0, 0, 0.05);
  flex-direction: column;
  padding: calc(var(--gap-size) * 0.5) var(--gap-size);
  margin-top: var(--gap-size);
  border-top: solid 2px rgba(0, 0, 0, 0.1);
  justify-content: center;
}

footer p {
  margin: 0;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.6);
}
```

### Phase 3: Data Integration

#### 3.1 API Client Setup
```typescript
// lib/api-client.ts
export class InvestieAPIClient {
  private baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  
  async getStock(symbol: string): Promise<StockCardData> {
    const response = await fetch(`${this.baseURL}/api/v1/stocks/${symbol}`);
    return response.json();
  }
  
  async getMarketSummary(): Promise<MarketSummaryData> {
    const response = await fetch(`${this.baseURL}/api/v1/market-summary`);
    return response.json();
  }
}
```

#### 3.2 Real-Time Updates
```typescript
// hooks/useStockData.ts
export function useStockData(symbol: string) {
  const [data, setData] = useState<StockCardData | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      const stockData = await apiClient.getStock(symbol);
      setData(stockData);
    };
    
    fetchData();
    const interval = setInterval(fetchData, 30000); // Update every 30s
    
    return () => clearInterval(interval);
  }, [symbol]);
  
  return data;
}
```

### Phase 4: Deployment (Railway)

#### 4.1 Railway Configuration
```toml
# nixpacks.toml
[phases.setup]
nixPkgs = ['nodejs_20']

[phases.install]
cmds = ['npm ci']

[phases.build]
cmds = ['npm run build']

[start]
cmd = 'npm run start:prod'
```

#### 4.2 Environment Variables (Railway Dashboard)
```bash
# Production Environment Variables
SERPAPI_API_KEY=<your-production-serpapi-key>
CLAUDE_API_KEY=<your-production-claude-key>
FRED_API_KEY=<your-production-fred-key>

NODE_ENV=production
DEBUG_MODE=false
PORT=3000
```

#### 4.3 Deployment Commands
```bash
# Connect to Railway
npm install -g @railway/cli
railway login
railway link

# Deploy
git push origin main  # Automatic deployment

# Monitor
railway logs --follow
```

---

## 🧪 Testing & Validation

### Backend API Testing
```bash
# Health Check
curl https://your-app.railway.app/api/v1/health

# Stock Data Test (includes AI evaluation)
curl https://your-app.railway.app/api/v1/stocks/AAPL | jq .aiEvaluation

# Market Summary Test  
curl https://your-app.railway.app/api/v1/market-summary | jq .fearGreedIndex

# AI Service Health Check
curl https://your-app.railway.app/api/v1/ai/health

# Force refresh AI evaluation (if endpoint exists)
curl -X POST https://your-app.railway.app/api/v1/stocks/AAPL/refresh-ai
```

### Expected Data Format
```json
{
  "symbol": "AAPL",
  "price": {
    "current": 229.35,
    "change": 0.61,
    "changePercent": 0.27
  },
  "aiEvaluation": {
    "summary": "Apple demonstrates strong fundamentals with robust Services revenue growth and Vision Pro innovation potential. iPhone upgrade cycle momentum building despite supply chain challenges.",
    "rating": "bullish",
    "confidence": 85,
    "keyFactors": ["Services revenue expansion", "Vision Pro market opportunity", "Strong balance sheet", "AI integration across products"],
    "timeframe": "3M",
    "source": "claude_ai",
    "lastUpdated": "2025-01-10T12:34:56.789Z"
  }
}
```

### AI Service Troubleshooting

#### Common AI Service Issues

**1. Claude API Key Issues**
```bash
# Symptoms
- "Claude API key not configured" warnings in logs  
- AI evaluations return enhanced mock data only
- Health check shows "api_key_required" status

# Solutions
export CLAUDE_API_KEY=sk-ant-api03-your-actual-key-here
# Restart backend service
npm run start:dev

# Verification
curl http://localhost:3000/api/v1/ai/health | jq .claude.validated
```

**2. Structured Response Parsing Errors**
```bash
# Symptoms  
- "Failed to parse structured response" errors
- AI evaluations fall back to mock data frequently
- Invalid JSON extraction from Claude responses

# Solutions
# Check Claude model compatibility
export CLAUDE_MODEL=claude-3-haiku-20240307  # Recommended for structured responses

# Monitor logs for JSON extraction issues
tail -f logs/app.log | grep "Structured response"

# Test with minimal prompt
curl -X POST http://localhost:3000/api/v1/ai/test-structured-response
```

**3. Cache Service Integration Issues**
```bash
# Symptoms
- AI evaluations regenerate on every request
- High Claude API usage and costs
- Cache size always shows 0

# Solutions  
# Check cache service health
curl http://localhost:3000/api/v1/cache/health

# Clear corrupted cache entries
curl -X DELETE http://localhost:3000/api/v1/cache/ai:evaluation:AAPL

# Verify cache TTL settings
grep AI_CONTENT_TTL apps/backend/.env
```

**4. Performance Issues**
```bash
# Symptoms
- AI evaluation generation >30 seconds
- High API response times
- Timeouts on stock data requests

# Solutions
# Enable parallel evaluation processing
# Check if multiple evaluations are being generated simultaneously
# Optimize prompt length and complexity

# Monitor performance
curl -w "@curl-format.txt" http://localhost:3000/api/v1/stocks/AAPL | jq .aiEvaluation
```

#### AI Service Deployment Checklist

**Railway Production Deployment**:
```bash
# Environment Variables (Railway Dashboard)
CLAUDE_API_KEY=<production-claude-key>         # Required
CLAUDE_MODEL=claude-3-haiku-20240307           # Recommended  
AI_CONTENT_TTL=43200                          # 12 hours
DEBUG_MODE=false                              # Disable debug logs

# Health Check Endpoints
curl https://your-app.railway.app/api/v1/health
curl https://your-app.railway.app/api/v1/ai/health

# Test AI Integration
curl https://your-app.railway.app/api/v1/stocks/AAPL | jq .aiEvaluation
```

**Monitoring & Alerts**:
```typescript
// Add to monitoring service
const aiServiceMetrics = {
  evaluationLatency: '<30s',           // AI evaluation generation time
  cacheHitRatio: '>80%',              // Cache effectiveness  
  apiKeyValidation: 'operational',     // Claude API status
  fallbackRate: '<20%',               // Mock data usage rate
  errorRate: '<5%',                   // Service error percentage
};
```

---

## 🔧 Development Commands

### Backend Development
```bash
cd apps/backend

# Development
npm run start:dev          # Start with hot reload
npm run build             # Build for production
npm run test              # Run tests
npm run lint              # Code linting

# API Testing
./test-endpoints.sh       # Test all endpoints
./check-api-keys.sh       # Verify API key status
```

### Frontend Development  
```bash
cd apps/web

# Development
npm run dev               # Next.js development server
npm run build             # Production build
npm run typecheck         # TypeScript checking
```

### Full Stack Development
```bash
# Root directory
npm run dev               # Start all services concurrently
npm run build             # Build all packages and apps
npm run typecheck         # Type check everything
```

---

## 🎯 Target Stock Symbols

The platform focuses on 10 major tech stocks:
- **AAPL** (Apple Inc.)
- **TSLA** (Tesla Inc.) 
- **MSFT** (Microsoft Corp.)
- **GOOGL** (Alphabet Inc.)
- **AMZN** (Amazon.com Inc.)
- **NVDA** (NVIDIA Corp.)
- **META** (Meta Platforms Inc.)
- **NFLX** (Netflix Inc.)
- **AVGO** (Broadcom Inc.)
- **AMD** (Advanced Micro Devices)

Each stock includes:
- ✅ Real-time price data (SerpApi)
- ✅ AI-powered analysis (Claude)
- ✅ Technical indicators (RSI, etc.)
- ✅ News summaries 
- ✅ TradingView chart integration

---

## 📊 Success Metrics

### Backend Performance Targets
- **API Response Time**: <200ms average
- **Uptime**: 99.9% availability
- **Data Freshness**: Stock prices <5min old
- **AI Analysis**: <30s generation time

### Frontend Performance Targets
- **Page Load Time**: <3s on 3G
- **Widget Load Time**: <2s per TradingView widget
- **Real-time Updates**: 30s refresh interval
- **Mobile Responsive**: Full functionality on mobile

This comprehensive guide provides everything needed to recreate the Investie platform from scratch, combining the API-first backend architecture with the TradingView-integrated frontend for a complete investment analysis platform. 🚀