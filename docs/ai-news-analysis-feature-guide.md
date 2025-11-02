# AI News Analysis Feature - User & Developer Guide

**Last Updated:** 2025-11-02
**Status:** ✅ Implemented

---

## 📚 Overview

The AI News Analysis feature provides intelligent, AI-powered summaries of stock news using real-time data from SERPAPI and analysis from Claude AI. Instead of showing individual news articles, it aggregates 7 days of news into concise, actionable insights.

---

## 🎯 Features

### User Features
- **Real-time News Aggregation**: Fetches latest news from the past 7 days via SERPAPI
- **AI-Powered Summaries**: Claude AI analyzes and summarizes all articles
- **Sentiment Analysis**: Overall sentiment score (0-100) with visual indicator
- **Key Insights**: 7-10 concise bullet points highlighting important developments
- **Trending Topics**: Top 3-5 topics extracted from news coverage
- **Market Impact Assessment**: Single-sentence impact analysis
- **Auto-refresh**: Results cached for 30 minutes, then refreshed
- **Mobile Responsive**: Optimized layout for all screen sizes

### Technical Features
- **SERPAPI Integration**: Reliable news data source
- **Claude AI Integration**: Advanced natural language understanding
- **Caching Layer**: 30-minute in-memory cache to reduce API costs
- **Error Handling**: Graceful fallbacks when APIs are unavailable
- **TypeScript**: Full type safety
- **SWR Data Fetching**: Efficient client-side data management

---

## 🔧 Setup & Configuration

### Environment Variables

#### Required Variables
Add these to your `.env.local` file:

```bash
# SERPAPI Key for Real News Data
SERPAPI_API_KEY=your-serpapi-key-here

# Claude AI API Key for Summarization
CLAUDE_API_KEY=your-claude-api-key-here
```

#### Getting API Keys

**SERPAPI:**
1. Sign up at [https://serpapi.com/](https://serpapi.com/)
2. Free tier includes 100 searches/month
3. Copy your API key from the dashboard

**Claude AI:**
1. Sign up at [https://console.anthropic.com/](https://console.anthropic.com/)
2. Create an API key
3. Add it to your environment variables

### Vercel Deployment

For production deployment, add environment variables in Vercel dashboard:
1. Go to Project Settings → Environment Variables
2. Add `SERPAPI_API_KEY`
3. Add `CLAUDE_API_KEY`
4. Redeploy your application

---

## 🏗️ Architecture

### Data Flow

```
User Request (AAPL news)
    ↓
Next.js API Route (/api/v1/dashboard/[symbol]/news-analysis)
    ↓
Check Cache (30 min TTL)
    ↓
SERPAPI Client (fetch 20 articles, past 7 days)
    ↓
Claude AI Summarizer (analyze + summarize)
    ↓
Response Format:
{
  symbol: "AAPL",
  summary: {
    overallSentiment: "positive",
    sentimentScore: 85,
    keyPoints: [...],
    trendingTopics: [...],
    marketImpact: "..."
  },
  metadata: {
    articlesAnalyzed: 18,
    timeRange: "Past 7 days",
    lastUpdated: "2025-11-02T14:30:00.000Z"
  }
}
    ↓
Frontend Component (AINewsAnalysisReport)
    ↓
User sees summary
```

### File Structure

```
apps/web/
├── src/
│   ├── lib/
│   │   ├── serpapi-client.ts           # SERPAPI integration
│   │   ├── claude-news-summarizer.ts   # Claude AI summarization
│   │   └── __tests__/
│   │       ├── serpapi-client.test.ts
│   │       └── claude-news-summarizer.test.ts
│   ├── app/
│   │   ├── api/v1/dashboard/[symbol]/news-analysis/
│   │   │   └── route.ts                # API route handler
│   │   ├── components/MarketIntelligence/
│   │   │   └── AINewsAnalysisReport.tsx # Frontend component
│   │   └── globals.css                 # Styles
│   └── .env.local                      # Environment variables
└── test-news-api.ts                    # Manual test script
```

---

## 💻 Usage Examples

### Frontend Component Usage

```tsx
import AINewsAnalysisReport from '@/app/components/MarketIntelligence/AINewsAnalysisReport';

export default function Dashboard() {
  return (
    <div>
      <AINewsAnalysisReport symbol="AAPL" />
    </div>
  );
}
```

### API Route Usage

**Request:**
```bash
GET /api/v1/dashboard/AAPL/news-analysis
```

**Response:**
```json
{
  "symbol": "AAPL",
  "summary": {
    "overallSentiment": "positive",
    "sentimentScore": 85,
    "keyPoints": [
      "iPhone 15 sales exceed analyst expectations in Q4",
      "Services division shows 15% YoY growth",
      "Vision Pro production ramping up for early 2025 launch",
      "App Store margin expansion continues",
      "Morgan Stanley upgrades rating to Overweight",
      "New AI features announced at WWDC",
      "Supply chain diversification progressing well"
    ],
    "trendingTopics": [
      "iPhone 15",
      "Services Growth",
      "AI Features",
      "Vision Pro"
    ],
    "marketImpact": "Positive momentum expected driven by strong product cycle and services growth."
  },
  "metadata": {
    "articlesAnalyzed": 18,
    "timeRange": "Past 7 days",
    "lastUpdated": "2025-11-02T14:30:00.000Z"
  }
}
```

### Programmatic Usage

```typescript
import { fetchNewsFromSerpApi } from '@/lib/serpapi-client';
import { summarizeNewsWithClaude } from '@/lib/claude-news-summarizer';

// Fetch news
const articles = await fetchNewsFromSerpApi('AAPL', 7, 20);

// Generate summary
const summary = await summarizeNewsWithClaude('AAPL', articles);

console.log(summary.keyPoints);
```

---

## 🧪 Testing

### Manual Testing

Run the test script:
```bash
cd apps/web
npx ts-node test-news-api.ts
```

Expected output:
```
🧪 Testing News Analysis API Integration

📰 Step 1: Fetching news from SERPAPI...
✅ Fetched 18 articles for AAPL

Sample article:
  Title: Apple announces record iPhone sales
  Source: Bloomberg
  Date: 1 day ago
  Snippet: Apple Inc. reported strong iPhone sales...

🤖 Step 2: Generating AI summary with Claude...
✅ Summary generated successfully

📊 Summary Results:
  Sentiment: positive (85/100)
  Key Points (7):
    1. iPhone 15 sales exceed expectations
    2. Services revenue grows 15% YoY
    ...

✅ All tests passed!
```

### Unit Tests

Run unit tests (when Jest is configured):
```bash
npm test
```

### Integration Testing

1. Start development server:
   ```bash
   npm run dev
   ```

2. Navigate to: `http://localhost:3000`

3. Select a stock symbol (e.g., AAPL)

4. Verify the AI News Analysis component displays:
   - Sentiment badge with correct color
   - Sentiment score bar (0-100)
   - 7-10 key insights
   - Trending topics chips
   - Market impact statement
   - Last updated timestamp

---

## 🐛 Troubleshooting

### Issue: "SERPAPI_API_KEY is not configured"

**Solution:**
- Check `.env.local` file exists
- Verify `SERPAPI_API_KEY` is set
- Restart development server

### Issue: "CLAUDE_API_KEY is not configured"

**Solution:**
- Check `.env.local` file exists
- Verify `CLAUDE_API_KEY` is set
- Restart development server

### Issue: "SERPAPI rate limit exceeded"

**Solution:**
- Free tier has 100 searches/month
- Upgrade to paid plan or wait for reset
- Cache reduces API calls (30 min)

### Issue: "No news articles found"

**Solution:**
- Check SERPAPI API key is valid
- Try a different stock symbol
- Check SERPAPI service status

### Issue: Component not updating

**Solution:**
- Clear browser cache
- Wait for cache expiration (30 min)
- Force refresh (Ctrl+F5 / Cmd+Shift+R)
- Check browser console for errors

---

## 📊 API Rate Limits & Costs

### SERPAPI
- **Free Tier:** 100 searches/month
- **Paid Tier:** Starts at $50/month for 5,000 searches
- **Cache Strategy:** 30-minute cache reduces usage by ~95%

### Claude AI
- **Model:** claude-sonnet-4-5-20250929
- **Cost:** ~$0.01 per summary (varies by article count)
- **Optimization:** Single API call per symbol per 30 minutes
- **Estimated Monthly Cost:** $10-30 for typical usage

### Cost Optimization Tips
1. Increase cache duration (current: 30 min)
2. Limit to popular stocks only
3. Batch requests for multiple symbols
4. Monitor usage via API dashboards

---

## 🔐 Security Best Practices

1. **Never commit API keys** to version control
2. **Use environment variables** for all secrets
3. **Rotate API keys** regularly
4. **Monitor API usage** for anomalies
5. **Use Vercel environment variables** for production
6. **Enable rate limiting** on API routes if needed

---

## 🚀 Performance Optimization

### Current Optimizations
- ✅ 30-minute in-memory cache
- ✅ SWR client-side caching (10 min)
- ✅ Limit to 20 articles per request
- ✅ Async/await for parallel processing
- ✅ Error boundaries prevent crashes

### Future Optimizations
- [ ] Redis cache for multi-instance deployments
- [ ] Streaming responses for faster perceived performance
- [ ] Background job for popular stocks
- [ ] Edge caching with Vercel Edge Config

---

## 📈 Monitoring & Analytics

### Recommended Metrics to Track
- API success/error rates
- Average response time
- Cache hit rate
- SERPAPI usage (monthly)
- Claude AI usage (tokens/cost)
- User engagement (component views)

### Logging
All important events are logged:
- `🎯 Cache hit for news analysis {symbol}`
- `🚀 Fetching fresh news analysis for {symbol}`
- `📰 Fetched {count} articles for {symbol}`
- `🤖 Generated AI summary for {symbol}`
- `❌ Error fetching news analysis for {symbol}`

---

## 🔄 Maintenance

### Regular Tasks
- [ ] Monitor SERPAPI usage monthly
- [ ] Monitor Claude AI costs weekly
- [ ] Review error logs weekly
- [ ] Update Claude AI model when new versions released
- [ ] Test with different stock symbols monthly

### Version History
- **v1.0.0** (2025-11-02): Initial implementation
  - SERPAPI integration
  - Claude AI summarization
  - Frontend component
  - Caching layer

---

## 🤝 Contributing

To extend or modify this feature:

1. **Backend Changes:**
   - Edit `serpapi-client.ts` for SERPAPI integration
   - Edit `claude-news-summarizer.ts` for AI logic
   - Edit `route.ts` for API route logic

2. **Frontend Changes:**
   - Edit `AINewsAnalysisReport.tsx` for UI
   - Edit `globals.css` for styling

3. **Testing:**
   - Add unit tests in `__tests__/`
   - Run manual test script
   - Test in browser

4. **Documentation:**
   - Update this README
   - Update main CLAUDE.md if needed

---

## 📞 Support

For issues or questions:
1. Check [Troubleshooting](#troubleshooting) section
2. Review error logs in browser console
3. Check API service status pages
4. Review implementation plan: `docs/ai-news-analysis-serpapi-integration-plan.md`

---

## 📚 Additional Resources

- [SERPAPI Documentation](https://serpapi.com/news-results)
- [Claude AI Documentation](https://docs.anthropic.com/claude/reference)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [SWR Documentation](https://swr.vercel.app/)

---

**Built with ❤️ for Investie**
