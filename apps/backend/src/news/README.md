# News Module

## Overview

The News Module is a comprehensive news analysis system that provides intelligent, time-aware investment insights by fetching, processing, and analyzing financial news data from multiple sources. It combines real-time news aggregation with AI-powered analysis to generate actionable investment recommendations.

## Key Features

### 🔍 **Enhanced News Search**
- **Company Name Resolution**: Dynamically fetches full company names from Yahoo Finance API
- **Dynamic Query Generation**: Creates multiple engaging search variants:
  - `"Company Name" trending news latest updates breakthrough`
  - `"Company Name" SYMBOL earnings announcement upcoming quarterly`
  - `"Company Name" stock analysis investment forecast predictions`
  - `"Company Name" innovation product launch developments`
  - `Company Name SYMBOL news today market performance stock price`
- **Intelligent Fallback**: Tries multiple queries until optimal results are found
- **Rich Article Collection**: Fetches 25+ articles per search with comprehensive metadata

### ⏰ **Time-Aware Analysis**
- **Article Timestamps**: Preserves original publication dates for each article
- **Recency Calculation**: Automatically calculates "days ago" for each article
- **Time-Weighted AI Analysis**: Recent news is weighted more heavily in recommendations
- **Date Range Tracking**: Provides oldest and newest article timestamps
- **Fetch Timestamps**: Records when data was retrieved for cache management

### 🤖 **AI-Powered Investment Analysis**
- **Comprehensive Article Processing**: ALL article titles are included in AI analysis (not just top 3)
- **Claude AI Integration**: Uses advanced language models for sophisticated analysis
- **Time-Pattern Recognition**: Identifies news momentum and trend acceleration/deceleration
- **Sentiment Analysis**: Intelligent sentiment classification with financial context
- **Investment Recommendations**: Generates BUY/HOLD/SELL recommendations with confidence scores

### 📊 **Rich API Response Structure**

```typescript
{
  "symbol": "AAPL",
  "stockNews": {
    "query": "\"Apple Inc.\" trending news latest updates breakthrough",
    "fetchedAt": "2025-08-10T22:27:30.456Z",
    "totalArticles": 40,
    "dateRange": {
      "oldest": "2018-05-10T07:00:00.000Z",
      "newest": "2025-08-08T10:11:00.000Z"
    },
    "headline": "Trump tariffs live updates...",
    "sentiment": "negative",
    "articles": [...] // Full article data with timestamps
  },
  "overview": {
    "recommendation": "HOLD",
    "confidence": 75,
    "keyFactors": [
      "Recent negative macroeconomic news around trade tensions",
      "Deceleration in news momentum over time",
      "Positive developments around new product launches"
    ],
    "riskLevel": "MEDIUM",
    "timeHorizon": "3-6 months"
  },
  "timestamp": "2025-08-10T22:27:30.456Z"
}
```

## Architecture

### Core Components

#### 1. **NewsController** (`news.controller.ts`)
- **GET** `/api/v1/news/:symbol` - Retrieve comprehensive news analysis
- **POST** `/api/v1/news/process` - Process news with validation
- **GET** `/api/v1/news/macro/today` - Get macro market news

**Features:**
- Input validation and sanitization
- Time-aware response formatting
- Error handling with appropriate HTTP status codes
- Helper methods for date range calculation

#### 2. **NewsService** (`news.service.ts`)
- Multi-tier symbol validation
- Company name resolution with caching
- Advanced news search with query optimization
- AI analysis with comprehensive article processing
- Intelligent caching with persistence

**Key Methods:**
- `processStockNews()` - Main workflow orchestration
- `loadStockNews()` - Enhanced news fetching with dynamic queries
- `buildAnalysisPrompt()` - Time-aware AI prompt generation
- `getCompanyName()` - Company name resolution with fallback

#### 3. **StockValidatorHelper** (`stock-validator.helper.ts`)
- Multi-tier symbol validation
- Fuzzy matching for symbol suggestions
- Price validation integration

### Data Flow

```
Symbol Input → Validation → Company Name Resolution → Dynamic Query Generation
     ↓
Multiple News Searches → Article Aggregation → Time Analysis → Cache Storage
     ↓
AI Prompt Generation → Claude Analysis → Response Formatting → API Response
```

## Configuration

### Environment Variables

```bash
# Required
SERPAPI_API_KEY=your_serpapi_key_here

# Optional (for enhanced AI analysis)
ANTHROPIC_API_KEY=your_claude_key_here
```

### Supported Stock Symbols

```typescript
type StockSymbol = 'AAPL' | 'TSLA' | 'MSFT' | 'GOOGL' | 'AMZN' 
                 | 'NVDA' | 'META' | 'NFLX' | 'AVGO' | 'AMD';
```

## Data Storage

### Cache Structure
```
data/news/
├── macro_news/
│   └── {date}/
│       └── macro_news.json
└── stock_news/
    └── {symbol}/
        └── {date}/
            ├── stock_news.json  # Articles with timing data
            └── overview.json    # AI analysis results
```

### Cached Data Format
- **Query Information**: Exact search query used
- **Timing Metadata**: Fetch timestamps, article dates, date ranges
- **Article Data**: Full article metadata with positions and sources
- **Analysis Results**: AI-generated insights with confidence scores

## Usage Examples

### Basic News Retrieval
```bash
curl "http://localhost:3001/api/v1/news/TSLA"
```

### Response Analysis
```typescript
// Check query used
response.stockNews.query
// "Tesla, Inc." trending news latest updates breakthrough"

// Check timing information
response.stockNews.fetchedAt      // When data was retrieved
response.stockNews.totalArticles  // Number of articles found
response.stockNews.dateRange     // Oldest to newest article dates

// Access AI insights
response.overview.recommendation // BUY/HOLD/SELL
response.overview.confidence    // Confidence score (0-100)
response.overview.keyFactors    // Key investment factors identified
```

## Performance Features

### Caching Strategy
- **24-hour TTL** for company names (rarely change)
- **6-hour TTL** for sentiment analysis
- **Daily cache** for news articles and analysis
- **Intelligent cache invalidation** based on market hours

### Search Optimization
- **Progressive query refinement** until optimal results
- **Fallback queries** for edge cases
- **Result quality validation** (minimum article threshold)
- **Query performance logging** for optimization

## Error Handling

### Graceful Degradation
- **API Failures**: Falls back to cached data or mock responses
- **Invalid Symbols**: Provides suggestions and validation errors  
- **Rate Limits**: Implements retry logic and backoff strategies
- **Network Issues**: Timeout handling with fallback data

### Validation Layers
1. **Input Sanitization**: Symbol format and type checking
2. **Symbol Validation**: Multi-tier validation with suggestions
3. **API Response Validation**: Data structure and completeness checks
4. **Analysis Quality Checks**: Confidence thresholds and fallback logic

## Testing

### Unit Tests
- Symbol validation logic
- Company name resolution
- Query generation algorithms
- Time calculation utilities

### Integration Tests
- End-to-end API workflows
- Cache persistence and retrieval
- AI analysis pipeline
- Error handling scenarios

## Development Guidelines

### Adding New Features
1. **Maintain backward compatibility** in API responses
2. **Preserve timing information** in all data flows  
3. **Update TypeScript interfaces** for new data structures
4. **Add comprehensive logging** for debugging
5. **Implement proper error handling** with user-friendly messages

### Performance Considerations
- **Cache frequently accessed data** (company names, sentiment)
- **Implement request throttling** for external APIs
- **Monitor AI token usage** and implement fallbacks
- **Optimize query selection** based on result quality metrics

## Monitoring & Observability

### Key Metrics
- **Query Success Rates**: Track search effectiveness
- **Article Quality Scores**: Monitor result relevance
- **AI Analysis Accuracy**: Confidence score distributions
- **Cache Hit Rates**: Performance optimization metrics
- **Response Times**: API performance tracking

### Health Checks
```bash
# Service health
GET /api/v1/news/health

# Returns:
{
  "status": "operational",
  "serpApiConfigured": true,
  "claudeConfigured": true,
  "openaiConfigured": false
}
```

## Future Enhancements

### Planned Features
- [ ] **Multi-language Support**: International news sources
- [ ] **Social Media Integration**: Twitter sentiment analysis
- [ ] **Technical Analysis Correlation**: News impact on price movements
- [ ] **Sector News Analysis**: Industry-wide trend identification
- [ ] **Real-time Alerts**: Breaking news notifications
- [ ] **Custom Query Templates**: User-defined search patterns

### Performance Improvements
- [ ] **GraphQL API**: More efficient data fetching
- [ ] **WebSocket Streaming**: Real-time news updates
- [ ] **Advanced Caching**: Redis integration for distributed caching
- [ ] **ML Model Integration**: Custom sentiment analysis models
- [ ] **Batch Processing**: Bulk symbol analysis

---

*Last Updated: August 10, 2025*  
*Version: 2.0.0 - Enhanced with comprehensive timing analysis and AI-powered insights*
