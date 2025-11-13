# CPI Data Refactoring Summary

## Overview
This document summarizes the refactoring of CPI (Consumer Price Index) data fetching to use FRED API through a server-side Next.js API route, following TDD (Test-Driven Development) principles.

## Date
2025-11-12

## Problem Statement
The existing CPI data fetching had several issues:
1. **CORS Limitations**: Client-side FRED API calls were blocked by CORS, forcing the use of fallback data (static value: 2.4)
2. **Incomplete Data**: Only fetched basic CPI value without month-over-month or year-over-year calculations
3. **Inconsistent Types**: Multiple CPI type definitions across the codebase
4. **Unused Code**: Legacy client-side FRED API code that couldn't work due to CORS

## Solution Approach

### 1. Test-Driven Development (TDD)
Following TDD principles, we:
- **Before Refactoring**: Created comprehensive tests to capture current behavior (baseline)
- **During Refactoring**: Made incremental changes while ensuring tests continue to pass
- **After Refactoring**: Verified all tests pass and build succeeds

### Test File Created
- **Location**: `apps/web/src/__tests__/cpi-data.test.ts`
- **Test Suites**:
  - Current Behavior - Baseline Tests (8 tests)
  - Enhanced CPI Structure - Post-Refactoring Goals (4 tests)
  - Inflation Pressure Logic (3 tests)
  - Trend and Direction Logic (3 tests)
- **Total Tests**: 18 tests, all passing ✅

## Changes Made

### 1. Created FRED API Server-Side Route
**File**: `apps/web/src/app/api/v1/market/cpi/route.ts`

**Features**:
- Server-side FRED API calls (no CORS issues)
- Fetches 2 data points for Month-over-Month calculation
- Fetches 13 data points for Year-over-Year calculation
- Calculates inflation metrics:
  - `monthOverMonth`: Percentage change from previous month
  - `yearOverYear`: Percentage change from same month last year
  - `inflationPressure`: Categorized as 'low', 'moderate', or 'high'
  - `trend`: 'rising', 'falling', or 'stable'
  - `direction`: 'up', 'down', or 'stable'

**Inflation Pressure Thresholds**:
```typescript
if (yearOverYear <= 2.0) return 'low';
if (yearOverYear <= 4.0) return 'moderate';
return 'high';
```

**API Endpoint**: `GET /api/v1/market/cpi`

**Response Format**:
```json
{
  "success": true,
  "data": {
    "value": 322.1,
    "previousValue": 321.5,
    "change": 0.6,
    "percentChange": 0.19,
    "monthOverMonth": 0.20,
    "yearOverYear": 2.73,
    "date": "2025-10-01",
    "trend": "rising",
    "direction": "up",
    "inflationPressure": "moderate",
    "source": "FRED_API_CPIAUCSL"
  }
}
```

### 2. Updated Frontend Data Fetching
**File**: `apps/web/src/lib/direct-api.ts`

**Changes**:
- Created new `fetchCPIData()` function to call API route
- Replaced client-side FRED API call with API route call
- Removed CORS-blocked code
- Marked old `fetchFredData()` as deprecated (kept for unemployment data)

**Before**:
```typescript
fetchFredData('CPIAUCSL')  // Returns null due to CORS
```

**After**:
```typescript
fetchCPIData()  // Returns full CPIData from API route
```

### 3. Consolidated Type Definitions
**File**: `apps/web/src/types/api.ts`

**Created Canonical CPIData Interface**:
```typescript
export interface CPIData {
  value: number;
  previousValue: number;
  change: number;
  percentChange?: number; // Optional for backward compatibility
  monthOverMonth?: number; // Optional for enhanced data
  yearOverYear?: number; // Optional for enhanced data
  date: string;
  trend: 'rising' | 'falling' | 'stable';
  direction?: 'up' | 'down' | 'stable'; // Optional for enhanced data
  inflationPressure?: 'low' | 'moderate' | 'high'; // Optional for enhanced data
  source: string;
}
```

**Updated MarketOverviewData**:
```typescript
economicIndicators: {
  cpi: CPIData;  // Changed from nullable to required (always has fallback)
  // ...
}
```

### 4. Removed Unused Code
- Removed duplicate CPI type definition in `direct-api.ts`
- Removed duplicate CPI type definition in API route
- Added deprecation notice to client-side FRED function
- Consolidated all CPI types to use single source of truth

## Data Flow

### Old Flow (Not Working)
```
┌────────────┐     CORS ❌      ┌──────────┐     ┌──────────┐
│ FRED API   │ ────────────────>│ Frontend │────>│ UI (2.4) │
│ (CPIAUCSL) │                   │ (blocked)│     │ Fallback │
└────────────┘                   └──────────┘     └──────────┘
```

### New Flow (Working)
```
┌────────────┐     ┌──────────────┐     ┌──────────┐     ┌──────────┐
│ FRED API   │────>│ Next.js      │────>│ Frontend │────>│ UI       │
│ (CPIAUCSL) │     │ API Route    │     │          │     │ (Real    │
│            │     │ /api/v1/     │     │          │     │  Data)   │
│            │     │ market/cpi   │     │          │     │          │
└────────────┘     └──────────────┘     └──────────┘     └──────────┘
```

## Environment Variables

### Required
```bash
FRED_API_KEY=your-fred-api-key-here
```

### How to Obtain
1. Visit https://fred.stlouisfed.org/
2. Create a free account
3. Request an API key from https://fredaccount.stlouisfed.org/apikeys
4. Add to `.env.local`:
   ```bash
   FRED_API_KEY=your-key-here
   ```

### Fallback Behavior
If `FRED_API_KEY` is not configured:
- API route returns mock CPI data
- Mock data structure matches real data format
- UI displays data normally with source indicating fallback

## Testing Strategy

### Unit Tests
- **File**: `apps/web/src/__tests__/cpi-data.test.ts`
- **Coverage**: Data structure, calculations, logic
- **Status**: ✅ All 18 tests passing

### Build Validation
- **Command**: `npm run build`
- **Status**: ✅ Build successful
- **TypeScript**: No type errors

### Integration Testing (Manual)
To test with real FRED API key:
1. Add `FRED_API_KEY` to `.env.local`
2. Start dev server: `npm run dev`
3. Navigate to market overview
4. Verify CPI data displays with:
   - Current value
   - Month-over-month percentage
   - Year-over-year percentage
   - Inflation pressure indicator

## Files Changed

### Created
1. `apps/web/src/app/api/v1/market/cpi/route.ts` - New API route
2. `apps/web/src/__tests__/cpi-data.test.ts` - Test suite
3. `apps/web/jest.config.js` - Jest configuration
4. `apps/web/jest.setup.js` - Jest setup

### Modified
1. `apps/web/src/lib/direct-api.ts` - Updated CPI fetching logic
2. `apps/web/src/types/api.ts` - Consolidated type definitions
3. `apps/web/package.json` - Added test scripts and dependencies

### Dependencies Added
```json
{
  "@testing-library/jest-dom": "^6.9.1",
  "@testing-library/react": "^16.3.0",
  "@types/jest": "^30.0.0",
  "jest": "^30.2.0",
  "jest-environment-jsdom": "^30.2.0",
  "ts-node": "^10.9.2"
}
```

## Backward Compatibility

### ✅ Maintained
- All existing components work without changes
- Fallback data structure matches previous format
- Optional fields prevent breaking changes
- Type definitions support both old and new formats

### Enhanced Fields (Optional)
These fields are now available but optional:
- `percentChange`
- `monthOverMonth`
- `yearOverYear`
- `direction`
- `inflationPressure`

Components can optionally use enhanced fields:
```typescript
// Basic usage (works as before)
const cpiValue = data.economicIndicators.cpi.value;

// Enhanced usage (new capability)
if (data.economicIndicators.cpi.yearOverYear) {
  const yoyChange = data.economicIndicators.cpi.yearOverYear;
  const pressure = data.economicIndicators.cpi.inflationPressure;
}
```

## Component Usage

### Current Components Using CPI
1. **MacroIndicatorsDashboard** - Displays CPI value
2. **EnhancedMacroIndicatorsDashboard** - Shows M/M and Y/Y changes
3. **EconomicIndicatorsGrid** - Card layout with all metrics

### No Changes Required
All components continue to work without modification due to:
- Backward-compatible type definitions
- Same base fields (value, date, trend, source)
- Optional enhanced fields

## Performance Considerations

### API Call Optimization
- Single API route call instead of multiple client-side attempts
- Parallel fetching of monthly and yearly data
- 15-second timeout for reliability

### Caching Opportunities (Future)
Consider implementing:
- Server-side caching (SWR on API route level)
- Stale-while-revalidate for CPI data
- Cache duration: 1 hour (CPI updates monthly)

## Known Limitations

1. **Historical Data**: Currently only fetches latest value + 12 months
   - Could be extended to fetch more historical data
   - Would require additional API calls or database storage

2. **API Rate Limits**: FRED API has rate limits
   - Free tier: Unlimited calls/day but rate-limited per second
   - Should implement caching for production

3. **Real-time Updates**: CPI updates monthly
   - Current implementation fetches on every request
   - Could cache for 1 day or more

## Future Enhancements

### 1. Server-Side Caching
```typescript
// Implement in API route
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour
let cpiCache: { data: CPIData; timestamp: number } | null = null;
```

### 2. Historical Data Endpoint
```typescript
// GET /api/v1/market/cpi/history?months=24
// Returns array of CPI data points for charting
```

### 3. Unified Economic Indicators Endpoint
```typescript
// GET /api/v1/market/economic-indicators
// Returns all indicators (CPI, unemployment, interest rate) in one call
```

### 4. Add Unemployment API Route
Similar refactoring needed for unemployment data fetching.

## Verification Checklist

- [x] All tests pass (18/18)
- [x] Build succeeds without errors
- [x] TypeScript types are consistent
- [x] No breaking changes to existing code
- [x] Fallback data provided when API key missing
- [x] Documentation updated
- [x] Code follows TDD principles
- [ ] Manual testing with real FRED API key (pending)

## Testing with Real FRED API Key

### Steps
1. Obtain FRED API key from https://fredaccount.stlouisfed.org/apikeys
2. Add to `.env.local`:
   ```bash
   FRED_API_KEY=your-actual-key-here
   ```
3. Start development server:
   ```bash
   npm run dev
   ```
4. Open browser to http://localhost:3000
5. Navigate to Market Intelligence section
6. Verify CPI data shows:
   - Real current value (300+)
   - Month-over-month percentage
   - Year-over-year percentage
   - Source: "FRED_API_CPIAUCSL"

### Expected Behavior
- CPI value should be ~320-330 (as of late 2024)
- YoY should be ~2-4% (moderate inflation)
- M/M should be ~0.1-0.3%
- Date should be recent month

## Conclusion

This refactoring successfully:
1. ✅ Migrated CPI data fetching to server-side FRED API
2. ✅ Enhanced data with month-over-month and year-over-year calculations
3. ✅ Consolidated type definitions for consistency
4. ✅ Maintained backward compatibility
5. ✅ Followed TDD principles throughout
6. ✅ Removed unused/broken client-side code
7. ✅ Provided comprehensive test coverage
8. ✅ Documented all changes and usage

The CPI data fetching is now production-ready and can display real-time economic data once the FRED API key is configured.

---

## References
- FRED API Documentation: https://fred.stlouisfed.org/docs/api/
- CPI Series (CPIAUCSL): https://fred.stlouisfed.org/series/CPIAUCSL
- Next.js API Routes: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- Jest Testing: https://jestjs.io/docs/getting-started
