# AI News Analysis - Deployment Checklist

**Feature:** AI-Powered News Summarization with SERPAPI + Claude AI
**Status:** Implementation Complete - Pending Deployment

---

## 🔑 Pre-Deployment Requirements

### 1. Obtain API Keys

#### SERPAPI API Key
- [ ] Sign up at [https://serpapi.com/](https://serpapi.com/)
- [ ] Verify email address
- [ ] Copy API key from dashboard
- [ ] Test API key with a sample request
- [ ] Note: Free tier = 100 searches/month

#### Claude AI API Key
- [x] Already configured in project
- [ ] Verify key is valid and has credits
- [ ] Check current usage/limits

---

## 🛠️ Development Setup

### 2. Configure Local Environment

- [ ] Add to `apps/web/.env.local`:
  ```bash
  SERPAPI_API_KEY=your-serpapi-key-here
  CLAUDE_API_KEY=your-claude-api-key-here
  ```
- [ ] Restart development server:
  ```bash
  npm run dev
  ```
- [ ] Verify no errors in console

---

## 🧪 Testing Phase

### 3. Run Automated Tests

- [ ] TypeScript compilation:
  ```bash
  cd apps/web && npx tsc --noEmit
  ```
  **Expected:** No errors

- [ ] Verify dependencies:
  ```bash
  npm list @anthropic-ai/sdk
  ```
  **Expected:** `@anthropic-ai/sdk@0.59.0` or later

### 4. Manual API Testing

- [ ] Run manual test script:
  ```bash
  cd apps/web
  npx ts-node test-news-api.ts
  ```
  **Expected output:**
  ```
  🧪 Testing News Analysis API Integration
  📰 Step 1: Fetching news from SERPAPI...
  ✅ Fetched X articles for AAPL
  🤖 Step 2: Generating AI summary with Claude...
  ✅ Summary generated successfully
  ✅ All tests passed!
  ```

- [ ] Test fails gracefully without API keys:
  - Remove `SERPAPI_API_KEY` from `.env.local`
  - Run test again
  - **Expected:** Clear error message about missing key
  - Restore API key

### 5. Browser Testing

- [ ] Start dev server: `npm run dev`
- [ ] Open browser: `http://localhost:3000`
- [ ] Select stock symbol: AAPL
- [ ] Verify AI News Analysis component shows:
  - [ ] Sentiment badge (colored, with icon)
  - [ ] Sentiment score bar (0-100 range)
  - [ ] 7-10 key insights as bullet points
  - [ ] Trending topics (3-5 chips)
  - [ ] Market impact statement
  - [ ] "Last updated" timestamp
  - [ ] "AI-Generated Summary" badge

- [ ] Test loading state:
  - [ ] Refresh page
  - [ ] See skeleton loading animation
  - [ ] Smoothly transitions to data

- [ ] Test error state:
  - [ ] Stop dev server
  - [ ] See error message
  - [ ] Restart server

- [ ] Test different stocks:
  - [ ] TSLA
  - [ ] GOOGL
  - [ ] MSFT
  - [ ] Less popular stock (e.g., AMD)

- [ ] Test mobile responsiveness:
  - [ ] Open DevTools (F12)
  - [ ] Toggle device toolbar (Ctrl+Shift+M)
  - [ ] Test iPhone view
  - [ ] Test iPad view
  - [ ] Verify layout adjusts correctly

### 6. Cache Testing

- [ ] Select a stock (e.g., AAPL)
- [ ] Note the "Last updated" time
- [ ] Refresh page immediately
- [ ] Verify same data appears (cache hit)
- [ ] Check console for: `🎯 Cache hit for news analysis AAPL`

- [ ] Wait 30+ minutes
- [ ] Refresh page
- [ ] Verify new data is fetched (cache miss)
- [ ] Check console for: `🚀 Fetching fresh news analysis for AAPL`

### 7. Performance Testing

- [ ] Measure initial load time:
  - Open DevTools → Network tab
  - Refresh page
  - Check API request to `/api/v1/dashboard/AAPL/news-analysis`
  - **Target:** < 3 seconds (cache miss)
  - **Target:** < 500ms (cache hit)

- [ ] Test with slow network:
  - DevTools → Network tab → Throttling: "Slow 3G"
  - Verify loading state appears
  - Verify no crashes/timeouts

---

## 🚀 Production Deployment

### 8. Vercel Configuration

- [ ] Login to Vercel dashboard
- [ ] Navigate to project settings
- [ ] Go to "Environment Variables"
- [ ] Add production variables:
  - [ ] `SERPAPI_API_KEY` = `your-production-serpapi-key`
  - [ ] `CLAUDE_API_KEY` = `your-production-claude-key`
  - [ ] Set scope: Production
- [ ] Save changes

### 9. Deploy to Production

- [ ] Commit all changes:
  ```bash
  git add .
  git commit -m "feat: Add SERPAPI + Claude AI news summarization"
  git push origin main
  ```

- [ ] Verify deployment starts in Vercel dashboard
- [ ] Wait for build to complete
- [ ] Check deployment logs for errors

### 10. Production Testing

- [ ] Visit production URL: `https://your-app.vercel.app`
- [ ] Test AI News Analysis component:
  - [ ] AAPL
  - [ ] TSLA
  - [ ] GOOGL
- [ ] Verify data loads correctly
- [ ] Check browser console for errors
- [ ] Test mobile view on real device

---

## 📊 Post-Deployment Monitoring

### 11. Monitor API Usage

#### SERPAPI
- [ ] Login to SERPAPI dashboard
- [ ] Check usage statistics
- [ ] **Alert threshold:** > 80 searches/month (free tier)
- [ ] Set up usage alerts if available

#### Claude AI
- [ ] Login to Anthropic console
- [ ] Check usage/credits
- [ ] **Alert threshold:** > $8/month
- [ ] Monitor cost trends

### 12. Monitor Error Logs

- [ ] Vercel dashboard → Logs
- [ ] Filter for errors
- [ ] Look for:
  - `❌ Error fetching news analysis`
  - `SERPAPI rate limit exceeded`
  - `Failed to summarize news with Claude AI`
- [ ] **Target:** < 5% error rate

### 13. Monitor Performance

- [ ] Vercel Analytics
- [ ] Check page load times
- [ ] Check API route performance
- [ ] **Target:** 95th percentile < 3 seconds

---

## 🐛 Rollback Plan

If critical issues arise:

### 14. Emergency Rollback

- [ ] Option 1: Revert to previous deployment
  - Vercel dashboard → Deployments → Previous version → Promote to Production

- [ ] Option 2: Disable feature with environment variable
  - Add `DISABLE_AI_NEWS=true` to Vercel env vars
  - Update code to check this flag
  - Redeploy

- [ ] Option 3: Git revert
  ```bash
  git revert HEAD
  git push origin main
  ```

---

## ✅ Success Criteria

Deployment is successful when:

- [ ] No TypeScript errors in build
- [ ] All manual tests pass
- [ ] Production site loads without errors
- [ ] AI News Analysis displays real data
- [ ] Sentiment analysis is reasonable
- [ ] Mobile view works correctly
- [ ] Cache is working (verify in logs)
- [ ] API usage within budget
- [ ] Error rate < 5%
- [ ] Load time < 3 seconds (cache miss)

---

## 📋 Quick Reference

### Environment Variables
```bash
# Development (.env.local)
SERPAPI_API_KEY=your-key-here
CLAUDE_API_KEY=your-key-here

# Production (Vercel)
# Same keys, configured in Vercel dashboard
```

### Test Commands
```bash
# Type check
npx tsc --noEmit

# Manual API test
npx ts-node test-news-api.ts

# Start dev server
npm run dev
```

### API Endpoints
```
Local:      http://localhost:3000/api/v1/dashboard/AAPL/news-analysis
Production: https://your-app.vercel.app/api/v1/dashboard/AAPL/news-analysis
```

### Useful Logs
```bash
# Cache hit
🎯 Cache hit for news analysis {symbol}

# Cache miss (fetching fresh data)
🚀 Fetching fresh news analysis for {symbol}
📰 Fetched X articles for {symbol}
🤖 Generated AI summary for {symbol}

# Error
❌ Error fetching news analysis for {symbol}
```

---

## 🎯 Final Checklist

Before marking deployment complete:

- [ ] All tests passing
- [ ] Production deployment successful
- [ ] Real data appearing on production site
- [ ] API usage monitored
- [ ] Error logs reviewed
- [ ] Performance acceptable
- [ ] Mobile tested
- [ ] Team notified
- [ ] Documentation updated
- [ ] User feedback mechanism in place

---

**Deployment Date:** ________________

**Deployed By:** ________________

**Production URL:** ________________

**Status:** ☐ Pending  ☐ In Progress  ☐ Complete

---

**Notes:**

_Use this space to record any issues, observations, or special configurations made during deployment._

---

**Last Updated:** 2025-11-02
