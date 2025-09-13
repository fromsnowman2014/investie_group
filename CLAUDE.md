# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Investie is an AI-powered investment analysis platform that combines real-time stock data with TradingView widgets and AI-driven insights. The project uses a monorepo structure with Turbo for build orchestration.

## Architecture

### Monorepo Structure
- **Root**: Main workspace with Turbo configuration and shared scripts
- **apps/backend**: Legacy NestJS API server (deprecated - migrated to Supabase Edge Functions)
- **apps/web**: Next.js 15 frontend with TradingView widgets and SWR for data fetching
- **supabase/functions/**: Supabase Edge Functions (current backend implementation)

### Key Technologies
- **Backend**: Supabase Edge Functions (Deno), Alpha Vantage API for stock data
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS, TradingView widgets, SWR
- **Build System**: Turbo monorepo, npm workspaces
- **Deployment**: Supabase Edge Functions (backend), Vercel (frontend)

## Development Commands

### Root Level (Monorepo)
```bash
# Install dependencies for all workspaces
npm install

# Start both backend and frontend in development
npm run dev

# Build all applications
npm run build

# Lint all applications
npm run lint

# Format code across the entire project
npm run format
```

### Supabase Edge Functions (Current Backend)
```bash
# Serve functions locally (requires Supabase CLI)
supabase functions serve

# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy stock-data

# View function logs
supabase functions logs stock-data

# Test functions locally
curl -X POST 'http://localhost:54321/functions/v1/stock-data' \
  -H 'Content-Type: application/json' \
  -d '{"symbol":"AAPL"}'
```

### Legacy Backend (apps/backend) - Deprecated
```bash
# These commands are maintained for reference but backend is migrated to Supabase Edge Functions
npm run backend:dev
npm run backend:build  
npm run test:all
npm run test:pre-deploy
```

### Frontend (apps/web)
```bash
# Development server with Turbopack
npm run frontend:dev
# or from apps/web directory:
npm run dev

# Build the frontend
npm run frontend:build
# or from apps/web directory:
npm run build

# Production server
npm run frontend:start
# or from apps/web directory:
npm run start

# Lint frontend code
npm run lint
```

## Backend Architecture (Supabase Edge Functions)

### Current Implementation
- **supabase/functions/stock-data/**: Real-time stock price data using Alpha Vantage API
- **supabase/functions/news-analysis/**: News analysis and AI-powered insights
- **supabase/functions/market-overview/**: Market overview and macro indicators

### API Structure
All endpoints are Supabase Edge Functions with POST requests:
- **POST /functions/v1/stock-data**: Get stock price data
  - Body: `{"symbol": "AAPL"}`
  - Returns: Real-time stock data or mock data if API key missing
- **POST /functions/v1/news-analysis**: AI-powered stock news analysis
- **POST /functions/v1/market-overview**: Market summary and macro indicators

### Data Sources
- **Alpha Vantage API**: Primary source for real-time stock data (GLOBAL_QUOTE, OVERVIEW)
- **Mock Data**: Fallback when API keys are not configured
- **Supported Symbols**: AAPL, TSLA, MSFT, GOOGL, AMZN, NVDA, META, NFLX, AVGO, AMD, JPM, BAC, JNJ, PFE, SPY, QQQ, VTI

### Stock Data Processing
1. Symbol validation against supported symbols list
2. Alpha Vantage API calls (quote + overview data)
3. Data transformation and error handling
4. Fallback to mock data if API fails
5. CORS-enabled JSON response

## Frontend Architecture

### Component Structure
- **MainLayout**: Responsive grid layout (desktop: 2-column, mobile: single column)
- **Header**: Navigation with stock selection dropdown
- **AIAnalysis**: AI-generated investment insights and recommendations
- **MarketIntelligence**: Macro market news and analysis
- **ChartAnalysis**: TradingView widgets integration
- **TradingView/**: Modular TradingView widget components

### State Management
- **StockProvider**: React Context for current stock symbol
- **SWRProvider**: Global SWR configuration for API data fetching
- **APIDebugger**: Debug panel for environment variable monitoring (forced active for debugging)

### API Integration Pattern
- **api-utils.ts**: Centralized API utility functions
  - `getApiBaseUrl()`: Determines correct API base URL (Supabase Functions vs fallbacks)
  - `debugFetch()`: Enhanced fetch wrapper with comprehensive logging
  - `edgeFunctionFetcher()`: Supabase Edge Function specific fetcher with auth
- **Environment Priority**: NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL → local fallbacks → hardcoded fallback

### Styling System
- Tailwind CSS with custom CSS variables
- Blue gradient branding (`#00bce5` to `#2962ff`)
- Responsive breakpoints: 800px (mobile), 1080px (desktop max-width)

## Environment Configuration

### Supabase Edge Functions Environment Variables
Set in Supabase Dashboard → Project Settings → Edge Functions:
```bash
ALPHA_VANTAGE_API_KEY=your-alpha-vantage-key  # Required for real stock data
```

### Frontend (.env.local in apps/web)
```bash
# Primary API configuration (Supabase Edge Functions)
NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL=https://your-project.supabase.co/functions/v1
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Legacy configuration (deprecated)
# NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Vercel Deployment Environment Variables
Required for production deployment:
- `NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Testing Strategy

### API Testing Tools
- **test-api-debug.html**: Comprehensive API testing interface accessible at `/test-api-debug.html`
  - Tests all Supabase Edge Functions with proper authentication
  - Real-time environment variable validation
  - Console logging for debugging
- **APIDebugger Component**: Always-visible debug panel showing:
  - Environment variable status
  - API configuration validation
  - Real-time API health monitoring

### Manual Testing Commands
```bash
# Test stock-data function locally
curl -X POST 'http://localhost:54321/functions/v1/stock-data' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"symbol":"AAPL"}'

# Test production function
curl -X POST 'https://your-project.supabase.co/functions/v1/stock-data' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"symbol":"AAPL"}'
```

### Legacy Backend Testing (Deprecated)
```bash
npm run test:all        # Unit + E2E tests
npm run test:pre-deploy # Full test suite
```

## Deployment

### Current Deployment (Supabase + Vercel)
- **Backend**: Supabase Edge Functions (auto-deploy from main branch)
- **Frontend**: Vercel (auto-deploy from main branch)
- **Root directory**: `apps/web`
- **Build command**: `npm run frontend:build`

### Environment Variables Setup
1. **Supabase Dashboard**: Configure `ALPHA_VANTAGE_API_KEY`
2. **Vercel Dashboard**: Configure frontend environment variables

## Debugging and Development

### Debug Tools Available
- **APIDebugger Component**: Always-visible debug panel in top-right corner
  - Shows environment variable status
  - API URL configuration validation
  - Real-time connection status
- **test-api-debug.html**: Standalone testing page at `/test-api-debug.html`
  - Test all Edge Functions individually
  - Environment variable introspection
  - Real-time API response logging

### Common Development Patterns

### API Integration
- **Frontend**: Uses `api-utils.ts` for consistent API calls
  - `debugFetch()`: Enhanced fetch with logging
  - `edgeFunctionFetcher()`: Supabase-specific wrapper with auth
  - Automatic fallback URL handling
- **Backend**: Supabase Edge Functions with standardized error responses
  - CORS enabled for all functions
  - Consistent JSON response format
  - Environment variable validation with fallbacks

### Error Handling Strategy
- **Edge Functions**: Return structured JSON errors with proper HTTP status codes
- **Frontend**: SWR error handling with user-friendly fallbacks
- **Mock Data**: Automatic fallback when API keys are missing or API calls fail

### Supported Stock Symbols
Major tech stocks: AAPL, TSLA, MSFT, GOOGL, AMZN, NVDA, META, NFLX, AVGO, AMD
Traditional stocks: JPM, BAC, JNJ, PFE
ETFs: SPY, QQQ, VTI

### Migration Notes
- **Legacy Backend**: NestJS backend in `apps/backend` is deprecated but maintained for reference
- **Current Backend**: All production traffic uses Supabase Edge Functions
- **API URLs**: Frontend automatically determines correct API base URL via environment variables

When working with this codebase, always use the current Supabase Edge Functions architecture. The legacy NestJS backend is kept for reference but should not be extended. All new backend features should be implemented as Supabase Edge Functions.