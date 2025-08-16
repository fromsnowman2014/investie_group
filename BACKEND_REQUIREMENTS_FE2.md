# 🔧 Backend Requirements for FE2 Implementation

**FE2 UI/UX 개발을 위해 필요한 백엔드 추가 구현 사항**

---


## 🚨 즉시 필요한 API 엔드포인트

### **1. 주식 검색 API (High Priority)**

**현재 상태**: 미구현  
**필요성**: Header 컴포넌트의 검색 기능 완성  
**구현 위치**: `apps/backend/src/stocks/stocks.controller.ts`

```typescript
// 추가 필요
@Get('search')
async searchStocks(@Query('q') query: string, @Query('limit') limit?: string) {
  try {
    const searchLimit = parseInt(limit) || 10;
    const results = await this.stocksService.searchStocks(query, searchLimit);
    
    return {
      success: true,
      data: results,
      timestamp: new Date().toISOString(),
      count: results.length
    };
  } catch (error) {
    throw new HttpException(
      {
        success: false,
        error: 'Search failed',
        message: error.message
      },
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}
```

**Service 메서드 추가 필요**:
```typescript
// apps/backend/src/stocks/stocks.service.ts
async searchStocks(query: string, limit: number = 10): Promise<StockSearchResult[]> {
  const allStocks = await this.getAllStocks();
  
  const filtered = allStocks.filter(stock => 
    stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
    stock.name.toLowerCase().includes(query.toLowerCase())
  ).slice(0, limit);
  
  return filtered.map(stock => ({
    symbol: stock.symbol,
    name: stock.name,
    sector: stock.sectorPerformance.name,
    marketCap: stock.fundamentals.marketCap,
    price: stock.price.current
  }));
}
```

### **2. 배치 주식 조회 API (Medium Priority)**

**현재 상태**: 개별 조회만 가능  
**필요성**: StockGrid 컴포넌트 성능 최적화  
**구현 위치**: `apps/backend/src/stocks/stocks.controller.ts`

```typescript
// 추가 필요
@Post('batch')
async getBatchStocks(@Body() body: { symbols: StockSymbol[] }) {
  try {
    if (!body.symbols || !Array.isArray(body.symbols)) {
      throw new HttpException(
        {
          success: false,
          error: 'Invalid request',
          message: 'symbols array is required'
        },
        HttpStatus.BAD_REQUEST
      );
    }

    const stockData: Record<string, any> = {};
    
    await Promise.all(
      body.symbols.map(async (symbol) => {
        try {
          stockData[symbol] = await this.stocksService.getStock(symbol);
        } catch (error) {
          stockData[symbol] = null; // 실패한 경우 null 처리
        }
      })
    );

    return {
      success: true,
      data: stockData,
      timestamp: new Date().toISOString(),
      count: Object.keys(stockData).length
    };
  } catch (error) {
    throw new HttpException(
      {
        success: false,
        error: 'Batch request failed',
        message: error.message
      },
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}
```

### **3. 회사 로고 API (Low Priority)**

**현재 상태**: 미구현  
**필요성**: StockCard 컴포넌트 시각적 개선  
**구현 위치**: `apps/backend/src/stocks/stocks.controller.ts`

```typescript
// 추가 필요
@Get(':symbol/logo')
async getCompanyLogo(@Param('symbol') symbol: string) {
  try {
    const logoUrl = await this.stocksService.getCompanyLogo(symbol as StockSymbol);
    
    return {
      success: true,
      data: {
        symbol,
        logoUrl,
        fallbackUrl: `/api/v1/stocks/${symbol}/logo/default`
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new HttpException(
      {
        success: false,
        error: 'Logo not found',
        message: error.message
      },
      HttpStatus.NOT_FOUND
    );
  }
}
```

---

## 📊 현재 API 상태 분석

### ✅ **완전 구현된 API**
```bash
GET /api/v1/stocks                 # 모든 주식 목록
GET /api/v1/stocks/:symbol         # 개별 주식 상세 정보
GET /api/v1/stocks/:symbol/chart   # 주식 차트 데이터
GET /api/v1/market/overview        # 시장 개요
GET /api/v1/ai/health              # AI 서비스 상태
GET /api/v1/ai/stats               # AI 사용 통계
GET /api/v1/news/health            # 뉴스 서비스 상태
```

### ⚠️ **부분 구현된 API** 
```bash
GET /api/v1/market/movers          # 시장 상승/하락 종목 (존재하지만 404)
GET /api/v1/market/trending        # 트렌딩 종목 (존재하지만 404)
```

**문제**: Railway 배포에서 Market 모듈이 누락됨  
**해결책**: Market 모듈을 Railway 배포에 포함시키거나 Stocks 서비스에 통합

### ❌ **미구현 API (FE2에 필요)**
```bash
GET /api/v1/stocks/search          # 주식 검색 (즉시 필요)
POST /api/v1/stocks/batch          # 배치 조회 (성능 최적화)
GET /api/v1/stocks/:symbol/logo    # 회사 로고 (시각적 개선)
```

---

## 🔄 기존 API 확장 요구사항

### **1. Market Overview API 확장**

**현재 응답**:
```json
{
  "indices": { "sp500": {...}, "nasdaq": {...}, "dow": {...} },
  "sectors": [...],
  "marketSentiment": "neutral",
  "volatilityIndex": 18.45
}
```

**FE2에 필요한 추가 필드**:
```json
{
  // 기존 필드들...
  "marketMovers": {
    "topGainers": [
      { "symbol": "NVDA", "change": 5.25, "changePercent": 3.45 }
    ],
    "topLosers": [
      { "symbol": "META", "change": -6.78, "changePercent": -2.31 }
    ]
  },
  "tradingVolume": {
    "total": 4500000000,
    "comparison": "above_average"
  }
}
```

### **2. Stock Chart API 확장**

**현재**: 기본 가격 데이터만 제공  
**FE2 필요**: 기술적 지표 포함

```typescript
// apps/backend/src/stocks/stocks.service.ts 수정 필요
async getStockChart(symbol: StockSymbol, period: string) {
  const chartData = // ... 기존 로직
  
  // 추가: 기술적 지표 계산
  const technicalIndicators = {
    movingAverages: {
      ma20: calculateMA(chartData.data, 20),
      ma50: calculateMA(chartData.data, 50)
    },
    rsi: calculateRSI(chartData.data),
    volume: calculateVolumeProfile(chartData.data)
  };
  
  return {
    ...chartData,
    technicalIndicators
  };
}
```

---

## 🚀 Phase 2: 사용자 기능 API (미래 확장)

### **인증 시스템**
```typescript
// apps/backend/src/auth/auth.controller.ts (신규 생성 필요)
@Controller('api/v1/auth')
export class AuthController {
  
  @Post('login')
  async login(@Body() loginDto: SocialLoginDto) {
    // Google, Facebook, GitHub OAuth 처리
  }
  
  @Post('logout')
  async logout(@Headers('authorization') token: string) {
    // JWT 토큰 무효화
  }
  
  @Get('profile')
  async getProfile(@Headers('authorization') token: string) {
    // 사용자 프로필 정보
  }
}
```

### **관심종목 시스템**
```typescript
// apps/backend/src/watchlist/watchlist.controller.ts (신규 생성 필요)
@Controller('api/v1/user/watchlist')
export class WatchlistController {
  
  @Get()
  async getUserWatchlist(@Headers('authorization') token: string) {
    // 사용자 관심종목 목록
  }
  
  @Post()
  async addToWatchlist(
    @Headers('authorization') token: string,
    @Body() addStockDto: { symbol: StockSymbol }
  ) {
    // 관심종목 추가
  }
  
  @Delete(':symbol')
  async removeFromWatchlist(
    @Headers('authorization') token: string,
    @Param('symbol') symbol: StockSymbol
  ) {
    // 관심종목 제거
  }
}
```

---

## 💾 데이터베이스 스키마 (Phase 2)

### **Users 테이블**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(100),
  photo_url TEXT,
  provider VARCHAR(20) NOT NULL, -- 'google', 'facebook', 'github'
  provider_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP DEFAULT NOW()
);
```

### **Watchlists 테이블**
```sql
CREATE TABLE watchlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  symbol VARCHAR(10) NOT NULL,
  custom_name VARCHAR(100),
  order_index INTEGER NOT NULL DEFAULT 0,
  added_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_user_symbol ON watchlists(user_id, symbol);
CREATE INDEX idx_user_order ON watchlists(user_id, order_index);
```

---

## 🏗️ 구현 우선순위

### **Week 1 (즉시 구현)**
1. ✅ **주식 검색 API** - Header 검색 기능 완성
2. ✅ **Market Movers 404 수정** - Railway 배포 이슈 해결
3. ✅ **배치 조회 API** - StockGrid 성능 최적화

### **Week 2 (성능 개선)**
1. 📊 **Chart API 확장** - 기술적 지표 추가
2. 🏢 **회사 로고 API** - 시각적 개선
3. 🔧 **Market Overview 확장** - 추가 시장 데이터

### **Week 3+ (사용자 기능)**
1. 🔐 **인증 시스템** - JWT + OAuth
2. ⭐ **관심종목 시스템** - CRUD API
3. 💾 **데이터베이스 통합** - PostgreSQL

---

## 🛠️ 구체적인 구현 가이드

### **1. 검색 API 구현 단계**

```bash
# 1. StocksService에 검색 메서드 추가
# apps/backend/src/stocks/stocks.service.ts

# 2. StocksController에 검색 엔드포인트 추가  
# apps/backend/src/stocks/stocks.controller.ts

# 3. E2E 테스트 추가
# apps/backend/test/api-endpoints.e2e-spec.ts
```

### **2. Market 모듈 Railway 배포 수정**

```typescript
// apps/backend/src/app.module.ts 확인
@Module({
  imports: [
    StocksModule,
    MarketModule,  // ← 이 모듈이 포함되어 있는지 확인
    AIModule,
    NewsModule,
  ],
  // ...
})
```

### **3. Frontend API 클라이언트 확장**

```typescript
// apps/web/src/lib/api.ts 확장 필요
export async function searchStocks(query: string, limit?: number): Promise<StockSearchResult[]> {
  const searchParams = new URLSearchParams({ q: query });
  if (limit) searchParams.append('limit', limit.toString());
  
  const response = await apiClient.request<StockSearchResult[]>(
    `/api/v1/stocks/search?${searchParams}`
  );
  return response;
}

export async function getBatchStocks(symbols: StockSymbol[]): Promise<Record<string, StockCardData>> {
  const response = await apiClient.request<Record<string, StockCardData>>(
    '/api/v1/stocks/batch',
    {
      method: 'POST',
      body: JSON.stringify({ symbols }),
      headers: { 'Content-Type': 'application/json' }
    }
  );
  return response;
}
```

---

## ✅ 완료 체크리스트

### **즉시 구현 (Week 1)**
- [ ] 주식 검색 API 구현 완료
- [ ] 배치 조회 API 구현 완료
- [ ] Market 모듈 Railway 배포 수정
- [ ] Frontend API 클라이언트 확장

### **성능 개선 (Week 2)**
- [ ] Chart API 기술적 지표 추가
- [ ] Market Overview API 확장
- [ ] 회사 로고 API 구현

### **사용자 기능 (Week 3+)**
- [ ] 인증 시스템 구현
- [ ] 관심종목 CRUD API 구현
- [ ] 데이터베이스 스키마 구현

---

**이 요구사항들은 FE2 UI/UX 개발의 완성도를 크게 높일 것입니다. 특히 즉시 구현이 필요한 검색 API는 사용자 경험에 직접적인 영향을 미칩니다.**