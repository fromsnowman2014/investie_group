# Watchlist 및 검색 기능 개선 실행 계획

## 프로젝트 개요
정적인 10개 하드코딩된 Ticker를 동적 검색 및 Watchlist 관리 시스템으로 전환

## 현재 상태 분석

### 문제점
1. **Frontend**: 하드코딩된 10개 ticker만 제공 (`STOCK_SYMBOLS` 배열)
2. **Backend**: 검색 API 존재하지만 동일한 10개 ticker에서만 검색
3. **검색창**: 기존 목록에서 필터링만 가능, 새로운 ticker 추가 불가
4. **Watchlist**: 고정된 목록으로 사용자 맞춤화 불가

### 기존 구현 상태
- ✅ Backend `/api/v1/stocks/search` 엔드포인트 존재
- ✅ Frontend 검색 UI 구현됨
- ❌ 실제 ticker 검색 데이터베이스 연동 없음
- ❌ Watchlist 추가/제거 기능 없음

## 구현 계획

### Phase 1: Backend 확장 (Backend API Enhancement)

#### 1.1 Ticker 검색 데이터 확장
**파일**: `apps/backend/src/stocks/stocks.service.ts`
- **현재**: 하드코딩된 10개 ticker 목록
- **개선**: 실제 주요 미국 주식 ticker 데이터베이스 구축
- **구현**:
  ```typescript
  // 주요 미국 주식 500+ ticker 목록 추가
  private readonly ALL_TICKERS: Record<string, string> = {
    // 기존 10개 + S&P 500 주요 종목들
    'AAPL': 'Apple Inc.',
    'TSLA': 'Tesla, Inc.',
    // ... 500+ tickers
  };
  ```

#### 1.2 검색 알고리즘 개선
**파일**: `apps/backend/src/stocks/stocks.service.ts:105-130`
- **현재**: `getAllStocks()`에서 필터링 (느림)
- **개선**: 직접 ticker/회사명 검색
- **구현**:
  ```typescript
  async searchStocks(query: string, limit: number = 10): Promise<any[]> {
    // 1. Symbol 검색 (정확한 매칭 우선)
    // 2. Company name 검색 (부분 매칭)
    // 3. 결과 정렬 (인기도, 시가총액 순)
  }
  ```

#### 1.3 Watchlist 관리 API 추가
**새 엔드포인트**:
- `POST /api/v1/watchlist/add` - ticker 추가
- `DELETE /api/v1/watchlist/remove/:symbol` - ticker 제거
- `GET /api/v1/watchlist` - 사용자 watchlist 조회

### Phase 2: Frontend 동적 검색 구현

#### 2.1 실시간 검색 기능 (Header.tsx)
**파일**: `apps/web/src/app/components/Header.tsx:30-42`
- **개선사항**:
  - Debounced search (300ms 지연)
  - 실시간 API 호출 `/api/v1/stocks/search`
  - 검색 결과 드롭다운 표시
  - 로딩 상태 및 에러 핸들링

```typescript
// 구현 예시
const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
const [isSearching, setIsSearching] = useState(false);

const debouncedSearch = useMemo(
  () => debounce(async (query: string) => {
    if (query.length < 2) return;
    
    setIsSearching(true);
    try {
      const results = await searchStocks(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      // Error handling
    } finally {
      setIsSearching(false);
    }
  }, 300),
  []
);
```

#### 2.2 Watchlist 관리 UI
**파일**: `apps/web/src/app/components/Header.tsx:71-104`
- **기능**:
  - 검색 결과에서 "+" 버튼으로 Watchlist 추가
  - Watchlist에서 "×" 버튼으로 제거
  - LocalStorage에 사용자 Watchlist 저장
  - 최대 20개 ticker 제한

#### 2.3 새로운 API 유틸리티 함수
**파일**: `apps/web/src/lib/api.ts`
```typescript
export async function searchStocks(query: string, limit?: number): Promise<SearchResult[]>
export async function addToWatchlist(symbol: string): Promise<void>
export async function removeFromWatchlist(symbol: string): Promise<void>
export async function getWatchlist(): Promise<string[]>
```

### Phase 3: 사용자 경험 개선

#### 3.1 에러 처리 및 예외 상황
- **API 오류**: 네트워크 오류 시 캐시된 검색 결과 표시
- **검색 결과 없음**: "No results found" 메시지
- **로딩 상태**: 검색 중 스피너 표시
- **중복 추가**: 이미 Watchlist에 있는 ticker 추가 방지

#### 3.2 성능 최적화
- **검색 결과 캐싱**: 최근 검색 결과 임시 저장
- **Debouncing**: 과도한 API 호출 방지
- **Virtual Scrolling**: 많은 검색 결과 효율적 렌더링

#### 3.3 UI/UX 개선
- **검색 하이라이트**: 검색어 강조 표시
- **키보드 네비게이션**: 화살표 키로 결과 탐색
- **즐겨찾기 표시**: 인기 ticker 별도 표시

## 기술 상세 사양

### API 응답 형식
```typescript
// 검색 API 응답
interface SearchResponse {
  success: boolean;
  data: {
    symbol: string;
    name: string;
    sector: string;
    marketCap: number;
    price: number;
    change: number;
    changePercent: number;
    popularity?: number; // 검색/조회 빈도
  }[];
  count: number;
  query: string;
}
```

### Frontend 상태 관리
```typescript
interface WatchlistState {
  symbols: string[];
  isLoading: boolean;
  error: string | null;
  maxSize: number; // 20
}
```

## 안전성 고려사항

### 기존 기능 영향 분석
1. **기존 10개 ticker**: 기본 제공 유지 (하위 호환성)
2. **API 엔드포인트**: 기존 `/api/v1/stocks/:symbol` 유지
3. **프론트엔드 레이아웃**: Header 컴포넌트 내부 로직만 변경

### 점진적 배포 전략
1. **Phase 1**: Backend API 확장 (기존 API 유지)
2. **Phase 2**: Frontend 기능 추가 (Feature Flag 적용)
3. **Phase 3**: 사용자 테스트 후 기본 활성화

### 에러 복구 계획
- Backend 오류 시 하드코딩된 10개 ticker로 fallback
- API 타임아웃 시 로컬 캐시 사용
- 무한 로딩 방지 (5초 타임아웃)

## 구현 순서

1. **Backend 확장** (1-2시간)
   - Ticker 데이터 확장
   - 검색 API 개선
   
2. **Frontend 검색 기능** (2-3시간)
   - 실시간 검색 구현
   - Debounce 적용
   
3. **Watchlist 관리** (2-3시간)
   - 추가/제거 기능
   - 로컬 저장소 연동
   
4. **UI/UX 개선** (1-2시간)
   - 로딩 상태
   - 에러 처리
   
5. **테스트 및 최적화** (1시간)
   - 엣지 케이스 테스트
   - 성능 검증

**총 예상 작업시간**: 7-11시간

## 성공 지표

1. ✅ 500+ ticker 검색 가능
2. ✅ 300ms 이내 검색 응답
3. ✅ Watchlist에 20개까지 추가 가능
4. ✅ 에러 상황 적절히 처리
5. ✅ 기존 기능 100% 유지

이 계획을 승인해주시면 단계별로 구현을 시작하겠습니다.