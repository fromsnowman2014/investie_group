# Investie Backend 개선 설계 문서

## 🎯 프로젝트 개요

### 현재 상황 분석
**프로덕션 환경**:
- **Frontend**: `https://investie-group-web.vercel.app/` (Vercel 배포)
- **Backend**: `investie-backend-02-production.up.railway.app` (Railway 배포)
- **데이터 저장**: 로컬 `apps/backend/data` 폴더 기반

### 목표
1. **데이터 저장소 클라우드 이전**: 로컬 파일 시스템 → 클라우드 데이터베이스/스토리지
2. **새로운 Frontend API 지원**: 4섹션 레이아웃을 위한 API 확장 및 최적화
3. **확장 가능한 아키텍처**: 실시간 데이터, 사용자 맞춤화, 알림 시스템 준비
4. **무중단 서비스**: 기존 프로덕션 서비스 영향 없이 점진적 개선

---

## 🏗️ Architecture 전략 분석

### 현재 아키텍처 제약사항
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Vercel        │    │   Railway       │    │   Local Files   │
│   (Frontend)    │ ←→ │   (Backend)     │ ←→ │   (Data Store)  │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

**문제점**:
- 로컬 파일 기반 → 스케일링 불가, 동시성 문제
- Railway 인스턴스 재시작 시 데이터 손실 위험
- 백업/복구 체계 부재
- 다중 인스턴스 배포 불가

### 목표 아키텍처
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Vercel        │    │   Railway       │    │   Cloud DB      │
│   (Frontend)    │ ←→ │   (API Server)  │ ←→ │   (MongoDB/     │
│                 │    │                 │    │    PostgreSQL)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                ↓
                       ┌─────────────────┐
                       │   Cloud Storage │
                       │   (AWS S3/      │
                       │    Google Cloud)│
                       └─────────────────┘
```

---

## 🚀 개발 전략 (Architect 관점)

### Phase 1: Backend Infrastructure 준비 (Week 1-2)
**우선순위**: ⭐⭐⭐⭐⭐ (최고 우선순위)

**이유**: Frontend가 실제 데이터로 개발하려면 안정적인 Backend API가 필수

#### 1.1 데이터베이스 설계 및 구축
```typescript
// 데이터베이스 스키마 설계
interface NewsDataSchema {
  _id: ObjectId;
  symbol: string;
  date: string;           // YYYY-MM-DD
  overview: {
    symbol: string;
    overview: string;
    recommendation: 'BUY' | 'HOLD' | 'SELL';
    confidence: number;
    keyFactors: string[];
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    timeHorizon: string;
    source: string;
    timestamp: Date;
  };
  stockNews: {
    headline: string;
    articles: Article[];
    metadata: {
      source: string;
      cached: boolean;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

interface MacroNewsSchema {
  _id: ObjectId;
  date: string;           // YYYY-MM-DD
  topHeadline: string;
  articles: Article[];
  totalArticles: number;
  query: string;
  metadata: {
    source: string;
    cached: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface MarketDataSchema {
  _id: ObjectId;
  date: string;
  timestamp: Date;
  indices: {
    sp500: IndexData;
    nasdaq: IndexData;
    dow: IndexData;
  };
  sectors: SectorData[];
  marketSentiment: string;
  volatilityIndex: number;
  source: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### 1.2 데이터 마이그레이션 전략
```typescript
// 마이그레이션 스크립트 구조
class DataMigrationService {
  // Step 1: 로컬 파일 데이터 읽기
  async readLocalData(): Promise<LocalDataStructure> {
    // apps/backend/data 폴더 스캔
    // JSON 파일들을 메모리로 로드
  }
  
  // Step 2: 데이터 정규화 및 검증
  async validateAndNormalize(data: LocalDataStructure): Promise<NormalizedData> {
    // 데이터 일관성 검증
    // 스키마에 맞게 정규화
    // 중복 데이터 제거
  }
  
  // Step 3: 클라우드 DB에 배치 삽입
  async migrateToCloud(data: NormalizedData): Promise<MigrationResult> {
    // 배치 단위로 DB 삽입
    // 실패 시 롤백 처리
    // 진행 상황 로깅
  }
  
  // Step 4: 데이터 무결성 검증
  async verifyMigration(): Promise<VerificationResult> {
    // 원본 vs 마이그레이션 데이터 비교
    // 누락 데이터 확인
    // 성능 테스트
  }
}
```

#### 1.3 환경별 데이터베이스 구성
```yaml
# 환경별 설정
development:
  database:
    type: "mongodb"
    url: "mongodb://localhost:27017/investie_dev"
    # 또는 MongoDB Atlas 무료 티어
  
staging:
  database:
    type: "mongodb" 
    url: "mongodb+srv://staging.cluster.mongodb.net/investie_staging"
    
production:
  database:
    type: "mongodb"
    url: "mongodb+srv://production.cluster.mongodb.net/investie_prod"
    # 백업 및 복제 설정 포함
```

### Phase 2: API 확장 및 최적화 (Week 2-3)
**우선순위**: ⭐⭐⭐⭐ (높음)

#### 2.1 새로운 API 엔드포인트 설계
```typescript
// Frontend 4섹션 레이아웃을 위한 최적화된 API

// 1. 통합 대시보드 데이터 API (Single Request)
@Get('/api/v1/dashboard/:symbol')
async getDashboardData(@Param('symbol') symbol: string) {
  return {
    success: true,
    data: {
      // AI Investment Analysis Section
      aiAnalysis: {
        overview: string;
        recommendation: 'BUY' | 'HOLD' | 'SELL';
        confidence: number;
        keyFactors: string[];
        riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
        timeHorizon: string;
        timestamp: string;
      },
      
      // Stock Profile Section  
      stockProfile: {
        symbol: string;
        currentPrice: number;
        changePercent: number;
        marketCap: string;
        pe: number;
        volume: string;
        lastUpdated: string;
      },
      
      // News Analysis Section
      newsAnalysis: {
        stockNews: {
          headline: string;
          articles: Article[];
          sentiment: 'positive' | 'neutral' | 'negative';
        },
        macroNews: {
          topHeadline: string;
          articles: Article[];
          marketImpact: 'bullish' | 'neutral' | 'bearish';
        },
      },
      
      // Market Indicators Section
      marketIndicators: {
        indices: IndexData;
        sectors: SectorData[];
        marketSentiment: string;
        volatilityIndex: number;
        // Phase 2 확장: FRED API 데이터
        macroEconomicData?: MacroEconomicData;
      },
      
      // 메타데이터
      lastUpdated: string;
      dataFreshness: {
        aiAnalysis: string;
        stockProfile: string;
        newsAnalysis: string;
        marketIndicators: string;
      };
    }
  };
}

// 2. 실시간 데이터 업데이트 API
@Get('/api/v1/realtime/:symbol')
async getRealtimeUpdates(@Param('symbol') symbol: string) {
  // 가격, 뉴스 헤드라인 등 자주 변경되는 데이터만 반환
}

// 3. 데이터 가용성 확인 API
@Get('/api/v1/data-availability/:symbol')
async checkDataAvailability(@Param('symbol') symbol: string) {
  return {
    symbol,
    availability: {
      aiAnalysis: boolean;
      stockProfile: boolean;
      newsAnalysis: boolean;
      marketIndicators: boolean;
    },
    lastUpdated: {
      aiAnalysis: string | null;
      stockProfile: string | null;
      newsAnalysis: string | null;
      marketIndicators: string | null;
    },
    dataAge: {
      aiAnalysis: number; // hours
      stockProfile: number;
      newsAnalysis: number;
      marketIndicators: number;
    }
  };
}
```

#### 2.2 캐싱 전략 구현
```typescript
@Injectable()
export class CacheService {
  
  // Redis 기반 멀티레벨 캐싱
  @Cacheable({
    key: 'dashboard:#{symbol}',
    ttl: 300, // 5분
    condition: '#{symbol != null}'
  })
  async getDashboardData(symbol: string): Promise<DashboardData> {
    // 데이터베이스에서 조회
  }
  
  // 실시간 데이터는 짧은 TTL
  @Cacheable({
    key: 'realtime:#{symbol}',
    ttl: 60, // 1분
  })
  async getRealtimeData(symbol: string): Promise<RealtimeData> {
    // 외부 API 호출
  }
  
  // 시장 지표는 긴 TTL
  @Cacheable({
    key: 'market_indicators',
    ttl: 1800, // 30분
  })
  async getMarketIndicators(): Promise<MarketIndicators> {
    // 시장 데이터 조회
  }
}
```

### Phase 3: Frontend-Backend 통합 개발 (Week 3-4)
**우선순위**: ⭐⭐⭐ (보통 - 병렬 진행 가능)

#### 3.1 병렬 개발 전략
```typescript
// API 계약 우선 정의 (Contract-First Development)
interface DashboardAPIContract {
  // TypeScript 인터페이스로 API 스펙 정의
  // Frontend와 Backend 팀이 동일한 타입 정의 사용
  
  endpoint: '/api/v1/dashboard/:symbol';
  method: 'GET';
  params: { symbol: string };
  response: DashboardResponse;
  errors: {
    400: { message: 'Invalid symbol' };
    404: { message: 'Data not found' };
    500: { message: 'Internal server error' };
  };
}
```

#### 3.2 개발 환경별 API 엔드포인트
```typescript
// 환경별 API URL 설정
const API_CONFIG = {
  development: {
    baseURL: 'http://localhost:3001',
    features: {
      localDataFallback: true,
      mockData: true,
      debugMode: true,
    }
  },
  
  staging: {
    baseURL: 'https://investie-backend-staging.railway.app',
    features: {
      localDataFallback: false,
      mockData: false,
      debugMode: true,
    }
  },
  
  production: {
    baseURL: 'https://investie-backend-02-production.up.railway.app',
    features: {
      localDataFallback: false,
      mockData: false,
      debugMode: false,
    }
  }
};
```

---

## ☁️ 무료 클라우드 서비스 분석 및 권장사항 (2025년 기준)

### Firebase vs Supabase 상세 비교

#### 1. 무료 티어 한계 비교
```yaml
firebase_free_tier:
  projects: 3개 프로젝트 제한
  database:
    firestore: 1GB 저장공간, 50K reads/day, 20K writes/day
    realtime_db: 1GB 저장공간, 10GB 전송량/월
  storage: 5GB 저장공간, 1GB 다운로드/day
  hosting: 10GB 저장공간, 360MB 다운로드/day
  functions: 125K 호출/월, 40K CPU초/월
  authentication: 무제한 사용자
  pricing_model: "사용량 기반 (예측 어려움)"

supabase_free_tier:
  projects: "무제한 프로젝트"
  database:
    postgresql: "1GB 저장공간, 무제한 읽기/쓰기"
    realtime: "무제한 구독자, 200MB 전송량/월"
  storage: "1GB 저장공간, 2GB 전송량/월"  
  edge_functions: "500K 실행/월"
  authentication: "50K 활성 사용자/월"
  pricing_model: "예측 가능한 고정 요금제"
  additional_features:
    - "PostgREST API 자동 생성"
    - "실시간 구독 기능"
    - "Row Level Security (RLS)"
    - "Database 백업 기능"
```

#### 2. 투자 플랫폼 요구사항 맞춤 분석
```typescript
// 프로젝트 요구사항별 점수 (10점 만점)
const requirementAnalysis = {
  
  데이터_저장_용량: {
    requirement: "뉴스, AI분석, 시장데이터 (예상 1GB/년)",
    firebase: {
      score: 7,
      note: "1GB Firestore + 5GB Storage로 충분하지만 NoSQL 제약"
    },
    supabase: {
      score: 9, 
      note: "1GB PostgreSQL + 1GB Storage, SQL 관계형 DB로 더 적합"
    }
  },
  
  API_요청_빈도: {
    requirement: "대시보드 API, 실시간 데이터 (예상 10K req/day)",
    firebase: {
      score: 6,
      note: "50K reads/day로 충분하지만 writes 20K/day 제한적"
    },
    supabase: {
      score: 10,
      note: "무제한 읽기/쓰기, PostgREST API 자동 생성"
    }
  },
  
  개발_편의성: {
    requirement: "NestJS 통합, 기존 JSON 구조 호환성",
    firebase: {
      score: 7,
      note: "Firebase Admin SDK 지원, NoSQL은 스키마 변경 자유롭지만 복잡한 쿼리 제한"
    },
    supabase: {
      score: 9,
      note: "PostgreSQL + Prisma ORM, SQL 관계형 DB로 복잡한 조인 가능"
    }
  },
  
  확장성: {
    requirement: "사용자 증가, 데이터 볼륨 확장",
    firebase: {
      score: 9,
      note: "Google 인프라 기반 자동 스케일링"
    },
    supabase: {
      score: 8,
      note: "PostgreSQL 기반으로 수직/수평 확장 가능"
    }
  },
  
  비용_예측성: {
    requirement: "개발 단계에서 비용 예측 가능성",
    firebase: {
      score: 5,
      note: "사용량 기반 요금으로 예측 어려움, 갑작스런 비용 증가 위험"
    },
    supabase: {
      score: 10,
      note: "고정 요금제로 비용 예측 가능"
    }
  }
};

// 총점 계산
const totalScores = {
  firebase: 34/50, // 68%
  supabase: 46/50  // 92%
};
```

#### 3. 최종 권장사항: **Supabase 선택**

**선택 이유**:
1. **무제한 프로젝트**: 개발/스테이징/프로덕션 환경 분리 가능
2. **PostgreSQL**: 기존 JSON 데이터를 관계형으로 정규화 가능
3. **예측 가능한 비용**: 갑작스런 요금 폭증 위험 없음
4. **NestJS 호환성**: Prisma ORM으로 타입 안전 보장
5. **API 자동 생성**: PostgREST로 CRUD API 자동 생성

### Supabase 프로젝트 설정 가이드

#### Step 1: Supabase 프로젝트 생성
```bash
# 1. Supabase 계정 생성 및 로그인
# 브라우저에서 https://supabase.com 접속 → GitHub 로그인

# 2. 새 프로젝트 생성
# Dashboard → "New Project" 클릭
# Organization: 개인 계정 선택
# Project Name: investie-backend-dev (개발용)
# Database Password: [강력한 비밀번호 설정]
# Region: Northeast Asia (ap-northeast-1) 선택
# Pricing Plan: Free tier 선택

# 3. 환경별 프로젝트 생성 (권장)
# - investie-backend-dev (개발)
# - investie-backend-staging (스테이징) 
# - investie-backend-prod (프로덕션)
```

#### Step 2: 데이터베이스 스키마 설계
```sql
-- Supabase Dashboard → SQL Editor에서 실행

-- 1. 뉴스 데이터 테이블
CREATE TABLE news_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  date DATE NOT NULL,
  overview JSONB NOT NULL,
  stock_news JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 매크로 뉴스 테이블  
CREATE TABLE macro_news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  top_headline TEXT NOT NULL,
  articles JSONB NOT NULL,
  total_articles INTEGER NOT NULL,
  query TEXT NOT NULL,
  metadata JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 시장 데이터 테이블
CREATE TABLE market_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  indices JSONB NOT NULL,
  sectors JSONB NOT NULL,
  market_sentiment TEXT,
  volatility_index NUMERIC,
  source TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 인덱스 생성
CREATE INDEX idx_news_data_symbol_date ON news_data(symbol, date DESC);
CREATE INDEX idx_news_data_created_at ON news_data(created_at DESC);
CREATE INDEX idx_macro_news_date ON macro_news(date DESC);
CREATE INDEX idx_market_data_date ON market_data(date DESC);

-- 5. RLS (Row Level Security) 활성화
ALTER TABLE news_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE macro_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_data ENABLE ROW LEVEL SECURITY;

-- 6. 공개 읽기 정책 (현재는 인증 없이 모든 데이터 읽기 허용)
CREATE POLICY "Public read access" ON news_data FOR SELECT USING (true);
CREATE POLICY "Public read access" ON macro_news FOR SELECT USING (true);
CREATE POLICY "Public read access" ON market_data FOR SELECT USING (true);

-- 7. 서버 전용 쓰기 정책 (API 키로만 쓰기 가능)
CREATE POLICY "Service role write access" ON news_data FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role write access" ON macro_news FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role write access" ON market_data FOR ALL USING (auth.role() = 'service_role');
```

#### Step 3: NestJS 프로젝트 Supabase 연동 설정

```bash
# 1. 필요한 패키지 설치
cd apps/backend
npm install @supabase/supabase-js
npm install prisma @prisma/client
npm install --save-dev prisma
```

```typescript
// 2. 환경 변수 설정 (.env 파일)
# apps/backend/.env.development
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:[password]@db.[project-id].supabase.co:5432/postgres

# apps/backend/.env.staging  
SUPABASE_URL=https://staging-project-id.supabase.co
SUPABASE_ANON_KEY=staging-anon-key
SUPABASE_SERVICE_KEY=staging-service-role-key
DATABASE_URL=postgresql://postgres:[password]@db.[staging-project-id].supabase.co:5432/postgres

# apps/backend/.env.production
SUPABASE_URL=https://prod-project-id.supabase.co
SUPABASE_ANON_KEY=prod-anon-key  
SUPABASE_SERVICE_KEY=prod-service-role-key
DATABASE_URL=postgresql://postgres:[password]@db.[prod-project-id].supabase.co:5432/postgres
```

```typescript
// 3. Supabase 클라이언트 설정
// apps/backend/src/config/supabase.config.ts
import { createClient } from '@supabase/supabase-js';

export const supabaseConfig = {
  url: process.env.SUPABASE_URL,
  anonKey: process.env.SUPABASE_ANON_KEY,
  serviceKey: process.env.SUPABASE_SERVICE_KEY,
};

export const supabase = createClient(
  supabaseConfig.url,
  supabaseConfig.serviceKey, // 서버에서는 service_role 키 사용
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
```

```typescript
// 4. Prisma 스키마 설정
// apps/backend/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model NewsData {
  id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  symbol     String
  date       DateTime @db.Date
  overview   Json
  stockNews  Json     @map("stock_news")
  createdAt  DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt  DateTime @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)

  @@index([symbol, date(sort: Desc)])
  @@map("news_data")
}

model MacroNews {
  id            String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  date          DateTime @db.Date
  topHeadline   String   @map("top_headline")
  articles      Json
  totalArticles Int      @map("total_articles")
  query         String
  metadata      Json
  createdAt     DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt     DateTime @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)

  @@index([date(sort: Desc)])
  @@map("macro_news")
}

model MarketData {
  id               String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  date             DateTime @db.Date
  timestamp        DateTime @db.Timestamptz(6)
  indices          Json
  sectors          Json
  marketSentiment  String?  @map("market_sentiment")
  volatilityIndex  Decimal? @map("volatility_index") @db.Decimal
  source           String
  createdAt        DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt        DateTime @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)

  @@index([date(sort: Desc)])
  @@map("market_data")
}
```

```bash
# 5. Prisma 클라이언트 생성
cd apps/backend
npx prisma generate
npx prisma db push  # 스키마를 Supabase DB에 적용
```

#### Step 4: 데이터 마이그레이션 스크립트 구현

```typescript
// apps/backend/src/migration/supabase-migration.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class SupabaseMigrationService {
  private readonly logger = new Logger(SupabaseMigrationService.name);

  constructor(private prisma: PrismaService) {}

  async migrateLocalDataToSupabase(): Promise<void> {
    try {
      this.logger.log('🚀 Supabase 데이터 마이그레이션 시작...');

      // Step 1: 로컬 데이터 폴더 스캔
      const dataPath = path.join(process.cwd(), 'data');
      const newsPath = path.join(dataPath, 'news');

      // Step 2: 주식 뉴스 데이터 마이그레이션
      await this.migrateStockNews(newsPath);

      // Step 3: 매크로 뉴스 데이터 마이그레이션  
      await this.migrateMacroNews(newsPath);

      this.logger.log('✅ 마이그레이션 완료!');

    } catch (error) {
      this.logger.error('❌ 마이그레이션 실패:', error);
      throw error;
    }
  }

  private async migrateStockNews(newsPath: string): Promise<void> {
    const stockNewsPath = path.join(newsPath, 'stock_news');
    const symbols = fs.readdirSync(stockNewsPath);

    for (const symbol of symbols) {
      const symbolPath = path.join(stockNewsPath, symbol);
      const dates = fs.readdirSync(symbolPath);

      for (const date of dates) {
        const datePath = path.join(symbolPath, date);
        
        // overview.json 읽기
        const overviewPath = path.join(datePath, 'overview.json');
        const stockNewsPath = path.join(datePath, 'stock_news.json');

        if (fs.existsSync(overviewPath) && fs.existsSync(stockNewsPath)) {
          const overview = JSON.parse(fs.readFileSync(overviewPath, 'utf8'));
          const stockNews = JSON.parse(fs.readFileSync(stockNewsPath, 'utf8'));

          // Supabase에 저장
          await this.prisma.newsData.upsert({
            where: {
              symbol_date: { symbol, date: new Date(date) }
            },
            update: {
              overview,
              stockNews,
              updatedAt: new Date()
            },
            create: {
              symbol,
              date: new Date(date),
              overview,
              stockNews
            }
          });

          this.logger.log(`✅ 마이그레이션 완료: ${symbol} - ${date}`);
        }
      }
    }
  }

  private async migrateMacroNews(newsPath: string): Promise<void> {
    const macroNewsPath = path.join(newsPath, 'macro_news');
    const dates = fs.readdirSync(macroNewsPath);

    for (const date of dates) {
      const filePath = path.join(macroNewsPath, date, 'macro_news.json');
      
      if (fs.existsSync(filePath)) {
        const macroNews = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        await this.prisma.macroNews.upsert({
          where: { date: new Date(date) },
          update: {
            topHeadline: macroNews.topHeadline,
            articles: macroNews.articles,
            totalArticles: macroNews.totalArticles,
            query: macroNews.query,
            metadata: macroNews.metadata,
            updatedAt: new Date()
          },
          create: {
            date: new Date(date),
            topHeadline: macroNews.topHeadline,
            articles: macroNews.articles,
            totalArticles: macroNews.totalArticles,
            query: macroNews.query,
            metadata: macroNews.metadata
          }
        });

        this.logger.log(`✅ 매크로 뉴스 마이그레이션 완료: ${date}`);
      }
    }
  }
}
```

```typescript
// apps/backend/src/migration/migration.controller.ts  
import { Controller, Post } from '@nestjs/common';
import { SupabaseMigrationService } from './supabase-migration.service';

@Controller('migration')
export class MigrationController {

  constructor(private migrationService: SupabaseMigrationService) {}

  @Post('supabase')
  async migrateToSupabase() {
    await this.migrationService.migrateLocalDataToSupabase();
    return { message: 'Migration completed successfully' };
  }
}
```

#### Step 5: API 서비스 Supabase 연동

```typescript
// apps/backend/src/dashboard/dashboard.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {

  constructor(private prisma: PrismaService) {}

  async getDashboardData(symbol: string) {
    // 최신 뉴스 데이터 조회
    const newsData = await this.prisma.newsData.findFirst({
      where: { symbol },
      orderBy: { date: 'desc' }
    });

    // 당일 매크로 뉴스 조회
    const today = new Date().toISOString().split('T')[0];
    const macroNews = await this.prisma.macroNews.findFirst({
      where: { date: new Date(today) }
    });

    // 당일 시장 데이터 조회 (향후 추가)
    const marketData = await this.prisma.marketData.findFirst({
      where: { date: new Date(today) }
    });

    return {
      success: true,
      data: {
        aiAnalysis: newsData?.overview || null,
        stockNews: newsData?.stockNews || null,
        macroNews: macroNews || null,
        marketData: marketData || null,
        lastUpdated: newsData?.updatedAt || new Date()
      }
    };
  }

  async getStockProfile(symbol: string) {
    // PostgREST API 직접 호출 (선택사항)
    const { data, error } = await this.supabase
      .from('news_data')
      .select('overview')
      .eq('symbol', symbol)
      .order('date', { ascending: false })
      .limit(1)
      .single();

    if (error) throw error;
    return data;
  }
}
```

#### Step 6: 배포 설정

```bash
# Railway 환경 변수 설정
# Railway Dashboard → Variables 탭에서 설정

# Development
SUPABASE_URL=https://dev-project-id.supabase.co
SUPABASE_SERVICE_KEY=your-dev-service-key
DATABASE_URL=postgresql://postgres:password@db.dev-project-id.supabase.co:5432/postgres

# Production  
SUPABASE_URL=https://prod-project-id.supabase.co
SUPABASE_SERVICE_KEY=your-prod-service-key
DATABASE_URL=postgresql://postgres:password@db.prod-project-id.supabase.co:5432/postgres
```

### 마이그레이션 실행 체크리스트

#### 필수 작업 (사용자 직접 수행)
```bash
# ✅ 1. Supabase 계정 생성 및 프로젝트 생성
# - https://supabase.com 가입 (GitHub 계정 연동)
# - 3개 프로젝트 생성 (dev/staging/prod)
# - Database 비밀번호 안전하게 보관

# ✅ 2. API 키 복사 및 환경 변수 설정
# - Project Settings → API → Copy keys
# - .env 파일에 SUPABASE_URL, SUPABASE_SERVICE_KEY 설정

# ✅ 3. 데이터베이스 스키마 생성
# - Supabase Dashboard → SQL Editor
# - 제공된 SQL 스크립트 실행

# ✅ 4. Railway 환경 변수 업데이트
# - Railway Dashboard → Variables
# - Supabase 연결 정보 추가
```

#### 자동화 가능 작업
```bash
# 🤖 1. 패키지 설치 및 Prisma 설정
npm run setup:supabase

# 🤖 2. 로컬 데이터 마이그레이션 실행
npm run migrate:supabase

# 🤖 3. API 테스트 및 검증
npm run test:supabase-connection
```

### 예상 개발 시간
- **Supabase 설정**: 1-2시간 (계정 생성, 프로젝트 설정)
- **스키마 마이그레이션**: 2-3시간 (테이블 생성, 데이터 이전)
- **API 연동**: 4-6시간 (Prisma 설정, 서비스 개발)
- **테스트 및 검증**: 2-3시간 (통합 테스트, 성능 확인)

**총 예상 시간**: 9-14시간 (1-2일)

---

## 🔧 기술 스택 및 도구

### Backend 기술 스택 확장 (Supabase 기반)
```json
{
  "core": {
    "framework": "NestJS 10",
    "runtime": "Node.js 18+",
    "language": "TypeScript 5"
  },
  
  "database": {
    "primary": "PostgreSQL 15 (Supabase)",
    "orm": "Prisma 5",
    "migration": "Prisma Migrate + Custom Scripts",
    "backup": "Supabase 자동 백업 + Point-in-time Recovery"
  },
  
  "caching": {
    "redis": "Redis 7 (Upstash/Railway)",
    "strategy": "Multi-level caching",
    "ttl": "환경별 설정"
  },
  
  "external_apis": {
    "current": ["SERPAPI", "Mock Data"],
    "phase2": ["FRED API", "Alpha Vantage", "Fear & Greed Index"],
    "monitoring": "API rate limiting & health checks"
  },
  
  "deployment": {
    "platform": "Railway",
    "ci_cd": "GitHub Actions",
    "environment": "Multi-stage (dev/staging/prod)",
    "monitoring": "Railway Analytics + Custom Metrics"
  }
}
```

### 새로운 Dependencies (Supabase 기반)
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "prisma": "^5.9.0",
    "@prisma/client": "^5.9.0",
    "@nestjs/cache-manager": "^2.0.0",
    "cache-manager-redis-store": "^3.0.0",
    "@nestjs/schedule": "^4.0.0",
    "node-cron": "^3.0.0"
  },
  
  "devDependencies": {
    "prisma": "^5.9.0",
    "@types/pg": "^8.11.0"
  }
}
```

---

## 📊 데이터 아키텍처 설계

### 1. 데이터베이스 선택 기준

#### MongoDB 선택 이유
```typescript
// 장점 분석
const mongodbAdvantages = {
  schemaFlexibility: {
    reason: "뉴스 데이터, AI 분석 결과 등 비정형 데이터 처리 적합",
    example: "articles 배열, keyFactors 배열 등 가변 구조"
  },
  
  jsonNative: {
    reason: "현재 JSON 파일 구조와 호환성 높음",
    benefit: "마이그레이션 용이성, API 응답 직접 매핑 가능"
  },
  
  cloudIntegration: {
    reason: "MongoDB Atlas 완전 관리형 서비스",
    features: ["자동 백업", "스케일링", "모니터링", "보안"]
  },
  
  performanceForReadHeavy: {
    reason: "투자 정보 조회 중심의 읽기 집약적 워크로드",
    optimization: "인덱싱, 집계 파이프라인 최적화"
  }
};
```

#### 대안 고려사항
```typescript
// PostgreSQL vs MongoDB 비교
const databaseComparison = {
  postgresql: {
    pros: ["ACID 보장", "복잡한 관계 처리", "SQL 표준"],
    cons: ["JSON 처리 제한적", "스키마 변경 복잡", "NoSQL 대비 개발 속도"],
    useCase: "거래 데이터, 사용자 관리, 포트폴리오 관리"
  },
  
  mongodb: {
    pros: ["스키마 유연성", "JSON 네이티브", "빠른 개발", "수평 확장"],
    cons: ["트랜잭션 제한", "조인 성능", "데이터 일관성"],
    useCase: "뉴스 데이터, AI 분석, 시장 데이터, 로그"
  },
  
  recommendation: "Hybrid 접근: MongoDB (주요) + PostgreSQL (사용자/거래)"
};
```

### 2. 컬렉션 설계
```typescript
// MongoDB 컬렉션 구조
const collections = {
  
  // 주요 데이터 컬렉션
  news_data: {
    indexes: [
      { symbol: 1, date: -1 },        // 종목별 최신 데이터 조회
      { 'overview.timestamp': -1 },    // 시간순 정렬
      { 'overview.recommendation': 1 }, // 추천 유형별 필터링
    ],
    shardKey: { symbol: 1 },          // 종목별 샤딩
    ttl: 86400 * 90,                  // 90일 후 자동 삭제
  },
  
  market_data: {
    indexes: [
      { date: -1 },                    // 날짜별 조회
      { timestamp: -1 },               // 시간순 정렬
    ],
    ttl: 86400 * 365,                 // 1년 후 자동 삭제
  },
  
  macro_news: {
    indexes: [
      { date: -1 },                    // 날짜별 조회
      { 'articles.source': 1 },        // 소스별 필터링
    ],
    ttl: 86400 * 180,                 // 6개월 후 자동 삭제
  },
  
  // 메타데이터 컬렉션
  data_freshness: {
    structure: {
      symbol: string,
      lastUpdated: {
        aiAnalysis: Date,
        stockProfile: Date,
        newsAnalysis: Date,
        marketIndicators: Date,
      },
      nextUpdateScheduled: Date,
    },
    indexes: [
      { symbol: 1 },
      { 'lastUpdated.aiAnalysis': 1 },
    ]
  },
  
  // 캐시 무효화 컬렉션
  cache_invalidation: {
    structure: {
      key: string,
      invalidatedAt: Date,
      reason: string,
    },
    ttl: 86400,                       // 24시간 후 자동 삭제
  }
};
```

### 3. 데이터 흐름 최적화
```typescript
// 데이터 페칭 최적화 전략
class OptimizedDataService {
  
  // 단일 쿼리로 대시보드 데이터 조회
  async getDashboardData(symbol: string): Promise<DashboardData> {
    const pipeline = [
      { $match: { symbol, date: this.getTodayDate() } },
      {
        $lookup: {
          from: 'market_data',
          let: { targetDate: '$date' },
          pipeline: [
            { $match: { $expr: { $eq: ['$date', '$$targetDate'] } } },
            { $limit: 1 }
          ],
          as: 'marketData'
        }
      },
      {
        $lookup: {
          from: 'macro_news', 
          let: { targetDate: '$date' },
          pipeline: [
            { $match: { $expr: { $eq: ['$date', '$$targetDate'] } } },
            { $limit: 1 }
          ],
          as: 'macroNews'
        }
      },
      {
        $project: {
          // 필요한 필드만 선택하여 네트워크 트래픽 최소화
          aiAnalysis: '$overview',
          stockNews: 1,
          marketData: { $arrayElemAt: ['$marketData', 0] },
          macroNews: { $arrayElemAt: ['$macroNews', 0] },
        }
      }
    ];
    
    const result = await this.newsDataModel.aggregate(pipeline);
    return this.transformToDashboardFormat(result[0]);
  }
  
  // 배치 데이터 갱신
  async batchUpdateData(symbols: string[]): Promise<UpdateResult[]> {
    const promises = symbols.map(symbol => 
      this.updateSymbolData(symbol)
    );
    
    return Promise.allSettled(promises);
  }
}
```

---

## 🚀 배포 및 환경 전략

### 1. 환경별 구성
```yaml
# 환경별 배포 전략
environments:
  
  development:
    purpose: "로컬 개발 및 테스트"
    infrastructure:
      database: "MongoDB Atlas Free Tier (M0)"
      cache: "Local Redis"
      storage: "Local File System"
    features:
      - Mock data 지원
      - 로컬 data 폴더 fallback
      - Debug 로깅
      - Hot reload
    
  staging:
    purpose: "통합 테스트 및 QA"
    infrastructure:
      database: "MongoDB Atlas Shared (M2)"
      cache: "Upstash Redis"
      storage: "AWS S3"
    features:
      - 프로덕션 데이터 복제본
      - 성능 모니터링
      - E2E 테스트
    deployment:
      platform: "Railway (별도 서비스)"
      url: "https://investie-backend-staging.railway.app"
      
  production:
    purpose: "실제 서비스"
    infrastructure:
      database: "MongoDB Atlas Dedicated (M10+)"
      cache: "Upstash Redis Pro"
      storage: "AWS S3 + CloudFront"
    features:
      - 고가용성 구성
      - 자동 백업
      - 모니터링 & 알림
      - 로드 밸런싱
    deployment:
      platform: "Railway (기존)"
      url: "https://investie-backend-02-production.up.railway.app"
      strategy: "Blue-Green 배포"
```

### 2. CI/CD 파이프라인
```yaml
# .github/workflows/backend-deploy.yml
name: Backend Deploy Pipeline

on:
  push:
    branches: [main, develop, staging]
    paths: ['apps/backend/**']

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd apps/backend
          npm ci
      
      - name: Run tests
        run: |
          cd apps/backend
          npm run test
          npm run test:e2e
      
      - name: Check build
        run: |
          cd apps/backend
          npm run build

  deploy-staging:
    if: github.ref == 'refs/heads/develop'
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Railway Staging
        uses: railwayapp/railway-deploy-action@v1.1.0
        with:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN_STAGING }}
  
  deploy-production:
    if: github.ref == 'refs/heads/main'
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Railway Production
        uses: railwayapp/railway-deploy-action@v1.1.0
        with:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN_PRODUCTION }}
```

### 3. 데이터 백업 및 복구 전략
```typescript
// 자동화된 백업 시스템
@Injectable()
export class BackupService {
  
  @Cron('0 2 * * *') // 매일 오전 2시
  async dailyBackup(): Promise<void> {
    try {
      // MongoDB Atlas 자동 백업은 이미 설정됨
      // 추가로 중요 데이터 S3 백업
      await this.backupToS3();
      
      // 백업 무결성 검증
      await this.verifyBackupIntegrity();
      
      // 슬랙 알림
      await this.notifyBackupStatus('SUCCESS');
      
    } catch (error) {
      await this.notifyBackupStatus('FAILED', error.message);
      throw error;
    }
  }
  
  async backupToS3(): Promise<void> {
    const collections = ['news_data', 'market_data', 'macro_news'];
    
    for (const collection of collections) {
      const data = await this.exportCollection(collection);
      const filename = `backup-${collection}-${new Date().toISOString()}.json`;
      
      await this.s3Client.upload({
        Bucket: process.env.BACKUP_BUCKET,
        Key: `daily-backups/${filename}`,
        Body: JSON.stringify(data),
      }).promise();
    }
  }
}
```

---

## 📈 성능 최적화 전략

### 1. 데이터베이스 최적화
```typescript
// 인덱싱 전략
const indexingStrategy = {
  
  // 복합 인덱스 (Compound Indexes)
  newsData: [
    { symbol: 1, date: -1 },           // 종목별 최신 데이터
    { 'overview.recommendation': 1, symbol: 1 }, // 추천별 종목 필터링
    { 'overview.timestamp': -1 },       // 시간순 정렬
  ],
  
  // 부분 인덱스 (Partial Indexes) - 스토리지 절약
  activeNews: {
    filter: { 
      'overview.timestamp': { 
        $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) 
      }
    },
    index: { symbol: 1, date: -1 }
  },
  
  // 텍스트 인덱스 - 뉴스 검색용
  textSearch: {
    index: {
      'stockNews.headline': 'text',
      'macroNews.articles.title': 'text',
      'overview.overview': 'text'
    },
    options: {
      weights: {
        'stockNews.headline': 10,
        'macroNews.articles.title': 5,
        'overview.overview': 1
      }
    }
  }
};

// 집계 파이프라인 최적화
class QueryOptimizer {
  
  // 자주 사용되는 쿼리 템플릿화
  static getDashboardPipeline(symbol: string): PipelineStage[] {
    return [
      // Stage 1: 최신 데이터만 필터링 (인덱스 활용)
      { 
        $match: { 
          symbol, 
          date: { $gte: this.getDateDaysAgo(7) } 
        } 
      },
      
      // Stage 2: 최신 데이터 1건만 선택
      { $sort: { date: -1 } },
      { $limit: 1 },
      
      // Stage 3: 관련 데이터 조인 (인덱스 활용)
      {
        $lookup: {
          from: 'market_data',
          let: { targetDate: '$date' },
          pipeline: [
            { $match: { $expr: { $eq: ['$date', '$$targetDate'] } } },
            { $project: { indices: 1, sectors: 1, marketSentiment: 1 } }
          ],
          as: 'marketData'
        }
      },
      
      // Stage 4: 필요한 필드만 프로젝션 (네트워크 최적화)
      {
        $project: {
          _id: 0,
          aiAnalysis: '$overview',
          stockNews: {
            headline: '$stockNews.headline',
            articleCount: { $size: '$stockNews.articles' }
          },
          marketData: { $arrayElemAt: ['$marketData', 0] }
        }
      }
    ];
  }
}
```

### 2. 캐싱 전략
```typescript
// 멀티레벨 캐싱 구현
@Injectable()
export class CacheService {
  
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private redisService: RedisService
  ) {}
  
  // L1: 메모리 캐시 (가장 빠름, 휘발성)
  private memoryCache = new Map<string, CacheItem>();
  
  // L2: Redis 캐시 (빠름, 지속성)
  // L3: 데이터베이스 (느림, 영구 저장)
  
  async get<T>(key: string): Promise<T | null> {
    // L1 캐시 확인
    const memoryItem = this.memoryCache.get(key);
    if (memoryItem && !this.isExpired(memoryItem)) {
      return memoryItem.data;
    }
    
    // L2 캐시 확인  
    const redisData = await this.cacheManager.get<T>(key);
    if (redisData) {
      // L1 캐시에 복사 (read-through)
      this.memoryCache.set(key, {
        data: redisData,
        expiredAt: Date.now() + 60000 // 1분
      });
      return redisData;
    }
    
    return null;
  }
  
  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    // 모든 레벨에 동시 저장 (write-through)
    await Promise.all([
      // L1 캐시
      this.setMemoryCache(key, value, ttl),
      
      // L2 캐시  
      this.cacheManager.set(key, value, ttl * 1000)
    ]);
  }
  
  // 스마트 무효화
  async invalidatePattern(pattern: string): Promise<void> {
    // 패턴 매칭으로 관련 캐시 일괄 삭제
    const keys = await this.redisService.keys(pattern);
    await Promise.all([
      this.redisService.del(...keys),
      this.invalidateMemoryPattern(pattern)
    ]);
  }
}

// 캐시 전략별 TTL 설정
const CACHE_STRATEGIES = {
  
  // 자주 변경되는 데이터 - 짧은 TTL
  realtime: {
    stockPrice: 60,        // 1분
    marketStatus: 300,     // 5분
  },
  
  // 일반 데이터 - 중간 TTL
  standard: {
    dashboard: 900,        // 15분
    newsHeadlines: 1800,   // 30분
    marketIndicators: 3600, // 1시간
  },
  
  // 안정적인 데이터 - 긴 TTL
  stable: {
    companyProfile: 86400,   // 24시간
    historicalData: 604800,  // 7일
  }
};
```

### 3. API 성능 최적화
```typescript
// API 응답 최적화
class PerformanceInterceptor implements NestInterceptor {
  
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const startTime = Date.now();
    
    return next.handle().pipe(
      map(data => {
        // 응답 압축
        const compressed = this.compressResponse(data);
        
        // 성능 메트릭 로깅
        const responseTime = Date.now() - startTime;
        this.logPerformanceMetrics(request.url, responseTime, compressed.size);
        
        return compressed;
      })
    );
  }
  
  private compressResponse(data: any): any {
    // 불필요한 필드 제거
    const optimized = this.removeNullFields(data);
    
    // 배열 데이터 페이지네이션
    if (optimized.articles && optimized.articles.length > 10) {
      optimized.articles = optimized.articles.slice(0, 10);
      optimized.hasMore = true;
    }
    
    return optimized;
  }
}

// 배치 요청 처리
@Controller('api/v1/batch')
export class BatchController {
  
  @Post('dashboard')
  async getBatchDashboard(@Body() request: BatchRequest): Promise<BatchResponse> {
    const { symbols, fields } = request;
    
    // 병렬 처리로 여러 종목 데이터 동시 조회
    const promises = symbols.map(symbol => 
      this.dashboardService.getDashboardData(symbol, fields)
    );
    
    const results = await Promise.allSettled(promises);
    
    return {
      success: true,
      data: results.map((result, index) => ({
        symbol: symbols[index],
        success: result.status === 'fulfilled',
        data: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason.message : null
      }))
    };
  }
}
```

---

## 🔐 보안 및 모니터링

### 1. 보안 강화
```typescript
// API 보안 설정
@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 100, // 1분당 100회 요청 제한
    }),
    
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
  ],
})
export class SecurityModule {}

// 데이터 검증 및 새니타이제이션
class DataValidationPipe implements PipeTransform {
  
  transform(value: any, metadata: ArgumentMetadata): any {
    // SQL Injection 방지
    if (typeof value === 'string') {
      value = this.sanitizeString(value);
    }
    
    // XSS 방지
    if (value.symbol) {
      value.symbol = this.validateSymbol(value.symbol);
    }
    
    return value;
  }
  
  private sanitizeString(input: string): string {
    return input.replace(/[<>\"'%;()&+]/g, '');
  }
  
  private validateSymbol(symbol: string): string {
    // 알파벳과 숫자만 허용, 최대 5자
    if (!/^[A-Z0-9]{1,5}$/.test(symbol)) {
      throw new BadRequestException('Invalid symbol format');
    }
    return symbol;
  }
}
```

### 2. 모니터링 및 로깅
```typescript
// 종합 모니터링 시스템
@Injectable()
export class MonitoringService {
  
  constructor(private logger: Logger) {}
  
  // 성능 메트릭 수집
  @Cron('*/5 * * * *') // 5분마다
  async collectMetrics(): Promise<void> {
    const metrics = {
      timestamp: new Date(),
      
      // API 성능
      api: {
        responseTime: await this.getAverageResponseTime(),
        errorRate: await this.getErrorRate(),
        requestCount: await this.getRequestCount(),
      },
      
      // 데이터베이스 성능
      database: {
        connectionCount: await this.getDbConnectionCount(),
        queryTime: await this.getAverageQueryTime(),
        indexHitRatio: await this.getIndexHitRatio(),
      },
      
      // 캐시 성능
      cache: {
        hitRate: await this.getCacheHitRate(),
        memoryUsage: await this.getCacheMemoryUsage(),
        evictionRate: await this.getCacheEvictionRate(),
      },
      
      // 시스템 리소스
      system: {
        cpuUsage: await this.getCpuUsage(),
        memoryUsage: await this.getMemoryUsage(),
        diskUsage: await this.getDiskUsage(),
      }
    };
    
    // 메트릭 저장 및 알림
    await this.storeMetrics(metrics);
    await this.checkAlerts(metrics);
  }
  
  // 알림 규칙
  private async checkAlerts(metrics: any): Promise<void> {
    const alerts = [];
    
    // API 응답 시간 알림
    if (metrics.api.responseTime > 2000) {
      alerts.push({
        type: 'API_SLOW_RESPONSE',
        message: `API 응답시간이 ${metrics.api.responseTime}ms로 느립니다`,
        severity: 'WARNING'
      });
    }
    
    // 에러율 알림
    if (metrics.api.errorRate > 0.05) {
      alerts.push({
        type: 'HIGH_ERROR_RATE',
        message: `API 에러율이 ${(metrics.api.errorRate * 100).toFixed(2)}%입니다`,
        severity: 'CRITICAL'
      });
    }
    
    // 캐시 적중률 알림
    if (metrics.cache.hitRate < 0.8) {
      alerts.push({
        type: 'LOW_CACHE_HIT_RATE',
        message: `캐시 적중률이 ${(metrics.cache.hitRate * 100).toFixed(2)}%로 낮습니다`,
        severity: 'WARNING'
      });
    }
    
    // 알림 발송
    for (const alert of alerts) {
      await this.sendAlert(alert);
    }
  }
}
```

---

## 🔄 개발 순서 및 일정 (Architect 권장사항)

### ⭐ **권장 개발 순서: Backend-First 접근법**

#### **근거:**
1. **API 안정성 우선**: Frontend가 실제 데이터로 개발하려면 안정적인 Backend API 필수
2. **데이터 마이그레이션 복잡성**: 로컬 파일 → 클라우드 DB 이전이 가장 리스크 높음
3. **통합 테스트 효율성**: Backend 완성 후 Frontend 통합이 디버깅 용이
4. **사용자 경험**: Mock 데이터보다 실제 데이터로 UI/UX 검증이 정확

### Week 1-2: Backend Infrastructure (Critical Path)
```typescript
// Sprint 1-2 목표
const backendSprint1_2 = {
  
  week1: {
    priority: "CRITICAL",
    tasks: [
      // 1. 환경 구성
      "MongoDB Atlas 클러스터 설정 (dev/staging/prod)",
      "Railway 환경별 서비스 생성",
      "Redis 캐시 서버 구성",
      
      // 2. 데이터 마이그레이션
      "로컬 data 폴더 분석 및 스키마 설계", 
      "마이그레이션 스크립트 개발",
      "데이터 무결성 검증 도구 개발",
      
      // 3. 핵심 API 개발
      "통합 대시보드 API (/api/v1/dashboard/:symbol)",
      "데이터 가용성 확인 API",
      "기본 에러 처리 및 검증"
    ],
    
    deliverables: [
      "마이그레이션된 클라우드 데이터베이스",
      "기본 대시보드 API 동작 확인",
      "환경별 배포 파이프라인"
    ],
    
    riskMitigation: [
      "로컬 데이터 백업 보관",
      "마이그레이션 롤백 계획 수립", 
      "데이터 검증 자동화"
    ]
  },
  
  week2: {
    priority: "HIGH", 
    tasks: [
      // 1. API 확장 및 최적화
      "실시간 데이터 업데이트 API",
      "배치 요청 처리 API",
      "캐싱 전략 구현",
      
      // 2. 성능 최적화
      "데이터베이스 인덱싱",
      "쿼리 최적화",
      "응답 시간 모니터링",
      
      // 3. 테스트 및 문서화
      "API 문서 자동 생성 (Swagger)",
      "통합 테스트 스위트",
      "성능 벤치마크"
    ],
    
    deliverables: [
      "완전한 Backend API 세트",
      "성능 최적화된 데이터 접근",
      "API 문서 및 테스트"
    ]
  }
};
```

### Week 3: Frontend Development (병렬 진행 가능)
```typescript
// Sprint 3 목표  
const frontendSprint3 = {
  
  prerequisite: "Backend API 안정화 (Week 2 완료)",
  
  tasks: [
    // 1. 레이아웃 기반 구조
    "4섹션 그리드 레이아웃 구현",
    "반응형 디자인 기본 구조",
    "TickerTape 숨김 처리",
    
    // 2. 컴포넌트 개발
    "StockProfile 컴포넌트",
    "AIInvestmentOpinion 컴포넌트", 
    "MacroIndicatorsDashboard 컴포넌트",
    "AINewsAnalysisReport 프레임",
    
    // 3. 상태 관리 확장
    "StockProvider 확장",
    "API 연동 로직",
    "에러 처리 및 로딩 상태"
  ],
  
  parallelDevelopment: {
    enabled: true,
    strategy: "Contract-First Development",
    requirements: [
      "API 스펙 정의 완료 (TypeScript 인터페이스)",
      "Mock 데이터 서비스 준비",
      "Backend API 기본 동작 확인"
    ]
  }
};
```

### Week 4: 통합 및 최적화
```typescript
// Sprint 4 목표
const integrationSprint4 = {
  
  tasks: [
    // 1. Frontend-Backend 통합
    "실제 API 데이터 연동",
    "에러 처리 개선",
    "로딩 상태 최적화",
    
    // 2. 성능 최적화
    "컴포넌트 레이지 로딩",
    "데이터 캐싱 구현", 
    "렌더링 성능 향상",
    
    // 3. 사용자 경험 개선
    "빈 상태 처리",
    "오프라인 지원",
    "접근성 개선",
    
    // 4. 테스트 및 배포
    "E2E 테스트",
    "성능 테스트",
    "프로덕션 배포"
  ],
  
  qualityGates: [
    "API 응답 시간 < 2초",
    "Frontend 로딩 시간 < 3초", 
    "모든 E2E 테스트 통과",
    "접근성 AA 레벨 준수"
  ]
};
```

### 🔄 **병렬 개발 전략 (선택적)**

Frontend 팀의 개발 속도를 높이려면:

```typescript
// 병렬 개발 조건
const parallelDevelopmentConditions = {
  
  requirements: [
    "API 계약 사전 정의 (TypeScript 인터페이스)",
    "Mock 데이터 서비스 준비",
    "Backend 기본 구조 확정"
  ],
  
  workflow: {
    
    // Week 1: API 설계 및 Mock 개발
    week1_parallel: {
      backend: ["환경 구성", "스키마 설계", "기본 API 스켈레톤"],
      frontend: ["레이아웃 구조", "컴포넌트 기본 틀", "Mock 데이터 연동"]
    },
    
    // Week 2: 구현 및 통합 준비
    week2_parallel: {
      backend: ["실제 API 구현", "데이터 마이그레이션", "테스트"],
      frontend: ["컴포넌트 상세 구현", "상태 관리", "UI/UX 최적화"]
    },
    
    // Week 3: 통합 및 테스트
    week3_integration: {
      combined: ["실제 API 연동", "통합 테스트", "성능 최적화"]
    }
  },
  
  riskMitigation: [
    "일일 스탠드업으로 API 변경사항 공유",
    "API 계약 변경 시 즉시 알림",
    "Mock → Real API 전환 체크리스트"
  ]
};
```

---

## 🎯 성공 지표 및 검증 기준

### 1. 기술적 지표
```typescript
const technicalKPIs = {
  
  performance: {
    apiResponseTime: "< 2초 (95th percentile)",
    frontendLoadTime: "< 3초 (First Contentful Paint)",
    cacheHitRate: "> 80%",
    databaseQueryTime: "< 500ms (평균)"
  },
  
  reliability: {
    uptime: "> 99.5%",
    errorRate: "< 0.1%",
    dataFreshness: "< 30분 (AI 분석)",
    backupSuccess: "100% (일일 백업)"
  },
  
  scalability: {
    concurrentUsers: "100명 (동시 접속)",
    dataVolume: "1년치 데이터 (약 100GB)",
    requestThroughput: "1000 req/min"
  }
};
```

### 2. 비즈니스 지표
```typescript
const businessKPIs = {
  
  userExperience: {
    pageLoadTime: "3초 내 완전 로딩",
    dataAccuracy: "95% 이상",
    featureCompleteness: "100% (4섹션 모두 동작)"
  },
  
  operational: {
    deploymentFrequency: "주 2회 (무중단)",
    incidentResolution: "< 4시간",
    costOptimization: "현재 대비 +20% 이내"
  }
};
```

---

## 💡 결론 및 권장사항

### **최우선 권장사항: Backend-First 개발**

1. **Week 1-2: Backend 인프라 집중**
   - 데이터 마이그레이션이 가장 큰 리스크 요소
   - API 안정성 확보가 전체 프로젝트 성공의 핵심
   - 실제 데이터로 Frontend 개발해야 품질 보장

2. **Week 3: Frontend 개발 (Backend 안정화 후)**
   - 실제 API 데이터로 개발 시작
   - UI/UX 검증과 성능 최적화 집중
   - 사용자 경험 개선에 온전히 집중 가능

3. **Week 4: 통합 및 프로덕션 배포**
   - 통합 테스트 및 성능 최적화
   - 점진적 프로덕션 배포
   - 모니터링 및 알림 시스템 구축

### **장기적 아키텍처 비전**
- **Phase 2**: FRED API, WebSocket, 사용자 인증
- **Phase 3**: 포트폴리오 관리, 알림 시스템, 모바일 앱
- **Phase 4**: AI 고도화, 실시간 분석, 소셜 기능

이 전략으로 **완성도 높고 확장 가능한 투자 분석 플랫폼**을 구축할 수 있습니다.

---

**최종 업데이트**: 2025년 8월 19일  
**문서 버전**: 1.0  
**작성자**: Claude (Architect Persona)  
**검토 완료**: 프로덕션 환경 분석 및 개발 전략 수립