// Hybrid Fetcher - Feature Flag 기반으로 Edge Functions vs Direct API 선택

import { edgeFunctionFetcher } from './api-utils';
import { fetchMarketDataDirect, getAPIUsageStatus } from './direct-api-client';

/**
 * Feature Flag 확인
 */
function shouldUseDirectAPI(): boolean {
  const useDirectAPI = process.env.NEXT_PUBLIC_USE_DIRECT_API;
  const enabled = useDirectAPI === 'true';

  if (enabled) {
    console.log('🔄 Using Direct API mode (Feature Flag enabled)');
  } else {
    console.log('🔄 Using Edge Functions mode (Feature Flag disabled)');
  }

  return enabled;
}

// 기존 타입들을 재사용하기 위한 인터페이스 정의
interface CachedMarketData {
  id?: number;
  indicator_type: string;
  data_value: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  data_source: string;
  created_at: string;
  expires_at?: string;
  age_seconds?: number;
  source?: 'cache' | 'realtime' | 'fallback';
  freshness?: {
    ageInSeconds: number;
    ageInHours: number;
    freshness: number;
    isStale: boolean;
  };
}

interface MarketOverviewResponse {
  fearGreedIndex?: CachedMarketData;
  economicIndicators?: CachedMarketData[];
  marketIndicators?: CachedMarketData[];
  sp500Data?: CachedMarketData;
  nasdaqData?: CachedMarketData;
  dowData?: CachedMarketData;
  vixData?: CachedMarketData;
  lastUpdated: string;
  source: 'cache' | 'mixed' | 'realtime';
  cacheInfo: {
    totalIndicators: number;
    freshIndicators: number;
    staleIndicators: number;
    cacheHitRate: number;
  };
  // Direct API 전용 필드들
  directApiInfo?: {
    sources: string[];
    errors: string[];
    usageInfo: Record<string, { used: number; limit: number; remaining: number }>;
  };
}

/**
 * Direct API 결과를 Edge Function 형식으로 변환
 */
interface DirectAPIMarketData {
  indicator_type: string;
  data_value: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  data_source: string;
  expires_at?: string;
}

interface DirectAPIResult {
  indicators: DirectAPIMarketData[];
  sources: string[];
  errors: string[];
  usageInfo: Record<string, { used: number; limit: number; remaining: number }>;
}

function transformDirectAPIToEdgeFormat(directResult: DirectAPIResult): MarketOverviewResponse {
  const { indicators, sources, errors, usageInfo } = directResult;
  const now = new Date().toISOString();

  // DirectAPIMarketData를 CachedMarketData로 변환
  const transformToCachedMarketData = (data: DirectAPIMarketData): CachedMarketData => ({
    indicator_type: data.indicator_type,
    data_value: data.data_value,
    metadata: data.metadata,
    data_source: data.data_source,
    created_at: now,
    expires_at: data.expires_at,
    age_seconds: 0, // Direct API는 방금 가져온 데이터이므로 0
    source: 'realtime',
    freshness: {
      ageInSeconds: 0,
      ageInHours: 0,
      freshness: 100,
      isStale: false
    }
  });

  // 지표별로 분류 및 변환
  const fearGreedIndex = indicators.find((i) => i.indicator_type === 'fear_greed');
  const sp500Data = indicators.find((i) => i.indicator_type === 'sp500');
  const vixData = indicators.find((i) => i.indicator_type === 'stock_vix');

  const economicIndicators = indicators
    .filter((i) => ['treasury_10y', 'unemployment', 'cpi'].includes(i.indicator_type))
    .map(transformToCachedMarketData);

  const marketIndicators = indicators
    .filter((i) => ['sp500', 'stock_vix'].includes(i.indicator_type))
    .map(transformToCachedMarketData);

  return {
    fearGreedIndex: fearGreedIndex ? transformToCachedMarketData(fearGreedIndex) : undefined,
    sp500Data: sp500Data ? transformToCachedMarketData(sp500Data) : undefined,
    nasdaqData: undefined, // TODO: NASDAQ 데이터 수집 구현
    dowData: undefined,    // TODO: DOW 데이터 수집 구현
    vixData: vixData ? transformToCachedMarketData(vixData) : undefined,
    economicIndicators,
    marketIndicators,
    lastUpdated: now,
    source: 'realtime',
    cacheInfo: {
      totalIndicators: indicators.length,
      freshIndicators: indicators.length, // Direct API는 항상 fresh
      staleIndicators: 0,
      cacheHitRate: 0 // Direct API는 cache를 사용하지 않음
    },
    directApiInfo: {
      sources,
      errors,
      usageInfo
    }
  };
}

/**
 * 하이브리드 마켓 오버뷰 패처
 */
export async function hybridMarketOverviewFetcher(): Promise<MarketOverviewResponse> {
  if (shouldUseDirectAPI()) {
    try {
      console.log('📡 Fetching market data via Direct API...');

      const directResult = await fetchMarketDataDirect();
      const transformedResult = transformDirectAPIToEdgeFormat(directResult);

      console.log(`✅ Direct API completed: ${directResult.indicators.length} indicators, ${directResult.errors.length} errors`);

      // 에러가 있으면 로그 출력
      if (directResult.errors.length > 0) {
        console.warn('⚠️ Direct API errors:', directResult.errors);
      }

      // API 사용량 로그 출력
      if (directResult.usageInfo.alpha_vantage.used > 0) {
        console.log(`📊 Alpha Vantage usage: ${directResult.usageInfo.alpha_vantage.used}/${directResult.usageInfo.alpha_vantage.limit}`);
      }

      // Direct API에서 수집한 데이터를 Supabase에 저장 (백그라운드 작업)
      if (directResult.indicators.length > 0) {
        saveDirectAPIDataToSupabase(directResult.indicators).catch(error => {
          console.warn('⚠️ Failed to save Direct API data to Supabase:', error.message);
        });
      }

      return transformedResult;

    } catch (error) {
      console.error('❌ Direct API failed, falling back to Edge Functions:', error);

      // Direct API 실패 시 Edge Function으로 폴백
      return await fallbackToEdgeFunction();
    }

  } else {
    // Feature Flag가 비활성화된 경우 기존 Edge Function 사용
    return await fallbackToEdgeFunction();
  }
}

/**
 * Edge Function 폴백
 */
async function fallbackToEdgeFunction(): Promise<MarketOverviewResponse> {
  try {
    console.log('🔄 Using Edge Functions (database-reader)...');

    const result = await edgeFunctionFetcher<MarketOverviewResponse>('database-reader', {
      action: 'get_market_overview',
      maxAge: 12 * 3600, // 12 hours
      fallbackToAPI: true,
      forceRefresh: false
    });

    console.log(`✅ Edge Function completed: ${result.cacheInfo.totalIndicators} indicators`);

    return result;

  } catch (error) {
    console.error('❌ Edge Function also failed:', error);

    // 최후의 수단: market-overview 직접 호출
    try {
      console.log('🔄 Final fallback to market-overview...');

      const fallbackResult = await edgeFunctionFetcher('market-overview', {});

      // market-overview 결과를 표준 형식으로 변환
      return {
        ...(fallbackResult as Record<string, unknown>),
        source: 'realtime',
        cacheInfo: {
          totalIndicators: 0,
          freshIndicators: 0,
          staleIndicators: 0,
          cacheHitRate: 0
        }
      } as MarketOverviewResponse;

    } catch (finalError) {
      console.error('❌ All fallbacks failed:', finalError);
      throw new Error('All API methods failed');
    }
  }
}

/**
 * 하이브리드 개별 지표 패처
 */
export async function hybridIndicatorFetcher(indicatorType: string): Promise<CachedMarketData | null> {
  if (shouldUseDirectAPI()) {
    try {
      console.log(`📡 Fetching ${indicatorType} via Direct API...`);

      // 지표 타입별로 적절한 Direct API 호출
      // (현재는 종합 데이터만 구현되어 있으므로 Edge Function 사용)
      console.log(`⚠️ Individual indicator fetch not implemented in Direct API, using Edge Function for ${indicatorType}`);
      return await edgeFunctionFetcher('database-reader', {
        action: 'get_cached_data',
        indicatorType,
        maxAge: 12 * 3600,
        fallbackToAPI: true,
        forceRefresh: false
      });

    } catch (error) {
      console.error(`❌ Direct API failed for ${indicatorType}, falling back to Edge Function:`, error);

      return await edgeFunctionFetcher('database-reader', {
        action: 'get_cached_data',
        indicatorType,
        maxAge: 12 * 3600,
        fallbackToAPI: true,
        forceRefresh: false
      });
    }

  } else {
    // Feature Flag 비활성화 시 기존 Edge Function 사용
    return await edgeFunctionFetcher('database-reader', {
      action: 'get_cached_data',
      indicatorType,
      maxAge: 12 * 3600,
      fallbackToAPI: true,
      forceRefresh: false
    });
  }
}

/**
 * Direct API에서 수집한 데이터를 Supabase data-collector에 저장
 */
async function saveDirectAPIDataToSupabase(indicators: DirectAPIMarketData[]): Promise<void> {
  try {
    console.log('💾 Saving Direct API data to Supabase...');

    const response = await edgeFunctionFetcher('data-collector', {
      action: 'save_market_data',
      data: indicators.map(indicator => ({
        indicator_type: indicator.indicator_type,
        data_value: indicator.data_value,
        metadata: indicator.metadata,
        data_source: indicator.data_source,
        expires_at: indicator.expires_at
      }))
    });

    console.log(`✅ Saved ${indicators.length} indicators to Supabase database`);
    return response;

  } catch (error) {
    console.error('❌ Failed to save Direct API data to Supabase:', error);
    throw error;
  }
}

/**
 * 현재 사용 중인 API 모드 확인
 */
export function getCurrentAPIMode(): 'direct_api' | 'edge_functions' {
  return shouldUseDirectAPI() ? 'direct_api' : 'edge_functions';
}

/**
 * Feature Flag 상태 및 API 사용량 정보
 */
export function getAPIStatus() {
  const mode = getCurrentAPIMode();
  const directAPIEnabled = shouldUseDirectAPI();

  let usageInfo = {};

  if (directAPIEnabled) {
    // Direct API 모드에서만 사용량 정보 제공
    try {
      usageInfo = getAPIUsageStatus();
    } catch (error) {
      console.warn('Unable to get API usage status:', error);
    }
  }

  return {
    mode,
    directAPIEnabled,
    edgeFunctionsEnabled: !directAPIEnabled,
    usageInfo,
    timestamp: new Date().toISOString()
  };
}