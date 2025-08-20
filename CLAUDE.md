# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Investie is an AI-powered investment analysis platform that combines real-time stock data with TradingView widgets and AI-driven insights. The project uses a monorepo structure with Turbo for build orchestration.

## Architecture

### Monorepo Structure
- **Root**: Main workspace with Turbo configuration and shared scripts
- **apps/backend**: NestJS API server with Supabase integration and AI services
- **apps/web**: Next.js 15 frontend with TradingView widgets and SWR for data fetching

### Key Technologies
- **Backend**: NestJS, TypeScript, Supabase, Anthropic Claude API, SerpAPI for news
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS, TradingView widgets, SWR
- **Build System**: Turbo monorepo, npm workspaces
- **Deployment**: Railway (backend), Vercel (frontend)

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

### Backend (apps/backend)
```bash
# Development server with hot reload
npm run backend:dev
# or from apps/backend directory:
npm run start:dev

# Build the backend
npm run backend:build
# or from apps/backend directory:
npm run build

# Production server
npm run backend:start
# or from apps/backend directory:
npm run start:prod

# Run all tests
npm run test:all

# Run tests with coverage
npm run test:cov

# Run end-to-end tests
npm run test:e2e

# Pre-deployment test suite
npm run test:pre-deploy

# Database migrations
npm run migrate
npm run migrate:status
npm run migrate:rollback

# Verify Supabase connection
npm run verify:supabase
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

## Backend Architecture

### Core Modules
- **StocksModule**: Stock data management and API endpoints
- **NewsModule**: News fetching, AI analysis, and investment recommendations using Claude API
- **MarketModule**: Market overview and macro indicators
- **AIModule**: AI-powered analysis services (Claude, OpenAI fallback)
- **DatabaseModule**: Supabase integration and schema management
- **DashboardModule**: Dashboard data aggregation

### API Structure
All backend endpoints use the `/api/v1/` prefix:
- **GET /api/v1/stocks**: List all stocks
- **GET /api/v1/stocks/:symbol**: Individual stock data
- **GET /api/v1/news/:symbol**: AI-powered stock news analysis
- **GET /api/v1/news/macro/today**: Daily macro market news
- **POST /api/v1/news/process**: Process news for specific stock
- **GET /api/v1/market/overview**: Market summary
- **GET /api/v1/ai/analysis/:symbol**: AI investment analysis

### Database Integration
The backend uses Supabase for data persistence with:
- Automated schema setup via `schema-setup.service.ts`
- Migration system with TypeScript scripts
- Connection verification utilities

### News Processing Workflow
1. Stock symbol validation using known symbols list
2. Fetch real-time news via SerpAPI (Google News)
3. AI analysis using Claude API (primary) or OpenAI (fallback)
4. Generate investment recommendations (BUY/HOLD/SELL) with confidence scores
5. Cache results in local JSON files (`data/news/` directory)

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

### Styling System
- Tailwind CSS with custom CSS variables
- Blue gradient branding (`#00bce5` to `#2962ff`)
- Responsive breakpoints: 800px (mobile), 1080px (desktop max-width)

## Environment Configuration

### Backend (.env or .env.local in apps/backend)
```bash
PORT=3001
NODE_ENV=development
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-key
CLAUDE_API_KEY=your-claude-api-key
SERPAPI_API_KEY=your-serpapi-key
OPENAI_API_KEY=your-openai-key  # Optional fallback
```

### Frontend (.env.local in apps/web)
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001  # Backend URL
```

## Testing Strategy

### Backend Testing
- **Unit Tests**: Jest with individual service/controller testing
- **E2E Tests**: Supertest for API endpoint validation
- **Coverage**: Generate reports with `npm run test:cov`
- **Pre-deployment**: Comprehensive test suite with `npm run test:pre-deploy`

### Supported Stock Symbols
Major tech stocks: AAPL, MSFT, GOOGL, TSLA, NVDA, META, AMZN, NFLX, AVGO, AMD
Traditional stocks: JPM, BAC, JNJ, PFE
ETFs: SPY, QQQ, VTI

## Deployment

### Backend (Railway)
- Dockerfile-based deployment
- Health check endpoint: `/health`
- Environment variables configured via Railway dashboard
- Automatic deployments from main branch

### Frontend (Vercel)
- Automatic deployments from main branch
- Build command: `npm run frontend:build`
- Root directory: `apps/web`
- Environment variable: `NEXT_PUBLIC_API_URL` pointing to Railway backend

## Data Storage

### Local Cache Structure
```
data/news/
├── macro_news/{date}/          # Daily market news cache
└── stock_news/{symbol}/{date}/ # Stock-specific news cache
```

### Database Tables (Supabase)
Tables are auto-created via `schema-setup.service.ts` based on business requirements.

## Common Patterns

### Error Handling
- Backend: NestJS exception filters with standardized error responses
- Frontend: SWR error handling with user-friendly fallbacks

### API Integration
- SWR for frontend data fetching with automatic revalidation
- Backend services use axios with proper error handling
- Rate limiting and caching implemented via NestJS cache manager

### AI Integration
- Primary: Anthropic Claude API for sophisticated analysis
- Fallback: OpenAI API for reliability
- Last resort: Keyword-based sentiment analysis

When working with this codebase, always check existing patterns in similar modules before implementing new features. The project emphasizes modular architecture, proper error handling, and comprehensive testing.