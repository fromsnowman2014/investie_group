/**
 * FRED CPI Data API Route
 *
 * This route fetches Consumer Price Index (CPI) data from the FRED API
 * and calculates month-over-month, year-over-year changes, and inflation pressure.
 *
 * FRED Series: CPIAUCSL (Consumer Price Index for All Urban Consumers)
 * API Doc: https://fred.stlouisfed.org/docs/api/fred/series_observations.html
 */

import { NextRequest, NextResponse } from 'next/server';

// FRED API Response Types
interface FredObservation {
  realtime_start: string;
  realtime_end: string;
  date: string;
  value: string;
}

interface FredApiResponse {
  realtime_start: string;
  realtime_end: string;
  observation_start: string;
  observation_end: string;
  units: string;
  output_type: number;
  file_type: string;
  order_by: string;
  sort_order: string;
  count: number;
  offset: number;
  limit: number;
  observations: FredObservation[];
}

// CPI Data Response Type
export interface CPIData {
  value: number;
  previousValue: number;
  change: number;
  percentChange: number;
  monthOverMonth: number;
  yearOverYear: number;
  date: string;
  trend: 'rising' | 'falling' | 'stable';
  direction: 'up' | 'down' | 'stable';
  inflationPressure: 'low' | 'moderate' | 'high';
  source: string;
}

/**
 * Fetch data from FRED API
 */
async function fetchFredData(
  seriesId: string,
  limit: number = 1
): Promise<FredApiResponse> {
  const fredApiKey = process.env.FRED_API_KEY;

  if (!fredApiKey) {
    throw new Error('FRED_API_KEY environment variable is not configured');
  }

  const baseUrl = 'https://api.stlouisfed.org/fred/series/observations';
  const params = new URLSearchParams({
    series_id: seriesId,
    api_key: fredApiKey,
    file_type: 'json',
    limit: limit.toString(),
    sort_order: 'desc', // Most recent data first
  });

  const url = `${baseUrl}?${params.toString()}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      // 10 second timeout
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`FRED API responded with status ${response.status}: ${response.statusText}`);
    }

    const data: FredApiResponse = await response.json();

    if (!data.observations || data.observations.length === 0) {
      throw new Error(`No observations returned from FRED API for series ${seriesId}`);
    }

    return data;
  } catch (error) {
    console.error(`FRED API request failed for series ${seriesId}:`, error);
    throw error;
  }
}

/**
 * Determine trend based on change value
 */
function determineTrend(change: number): 'rising' | 'falling' | 'stable' {
  const threshold = 0.01; // 1% threshold for stability
  if (Math.abs(change) <= threshold) return 'stable';
  return change > 0 ? 'rising' : 'falling';
}

/**
 * Determine direction based on percentage change
 */
function determineDirection(value: number): 'up' | 'down' | 'stable' {
  const threshold = 0.05; // 0.05% threshold
  if (Math.abs(value) <= threshold) return 'stable';
  return value > 0 ? 'up' : 'down';
}

/**
 * Determine inflation pressure based on year-over-year percentage
 * - YoY <= 2.0%: low
 * - 2.0% < YoY <= 4.0%: moderate
 * - YoY > 4.0%: high
 */
function determineInflationPressure(yearOverYear: number): 'low' | 'moderate' | 'high' {
  if (yearOverYear <= 2.0) return 'low';
  if (yearOverYear <= 4.0) return 'moderate';
  return 'high';
}

/**
 * Get mock CPI data for fallback when API is unavailable
 */
function getMockCPIData(): CPIData {
  return {
    value: 322.1,
    previousValue: 321.5,
    change: 0.6,
    percentChange: 0.19,
    monthOverMonth: 0.20,
    yearOverYear: 2.73,
    date: new Date().toISOString().split('T')[0],
    trend: 'rising',
    direction: 'up',
    inflationPressure: 'moderate',
    source: 'mock_data_fallback',
  };
}

/**
 * GET /api/v1/market/cpi
 *
 * Fetches CPI data from FRED API with month-over-month and year-over-year calculations
 */
export async function GET(request: NextRequest) {
  try {
    const fredApiKey = process.env.FRED_API_KEY;

    // If no API key, return mock data
    if (!fredApiKey) {
      console.warn('FRED_API_KEY not configured. Using mock CPI data.');
      return NextResponse.json({
        success: true,
        data: getMockCPIData(),
        message: 'Using mock data (FRED API key not configured)',
      });
    }

    // Fetch monthly data (2 months for M/M calculation)
    // Fetch yearly data (13 months for Y/Y calculation)
    const [monthlyResponse, yearlyResponse] = await Promise.all([
      fetchFredData('CPIAUCSL', 2),
      fetchFredData('CPIAUCSL', 13),
    ]);

    const monthlyObs = monthlyResponse.observations;
    const yearlyObs = yearlyResponse.observations;

    // Validate we have enough data
    if (monthlyObs.length < 2 || yearlyObs.length < 13) {
      throw new Error('Insufficient data points for CPI calculation');
    }

    // Parse values
    const current = parseFloat(monthlyObs[0].value);
    const previousMonth = parseFloat(monthlyObs[1].value);
    const previousYear = parseFloat(yearlyObs[12].value);

    // Check for invalid values
    if (isNaN(current) || isNaN(previousMonth) || isNaN(previousYear)) {
      throw new Error('Invalid CPI values returned from FRED API');
    }

    // Calculate changes
    const monthOverMonth = ((current - previousMonth) / previousMonth) * 100;
    const yearOverYear = ((current - previousYear) / previousYear) * 100;
    const change = current - previousMonth;
    const percentChange = monthOverMonth;

    // Build response
    const cpiData: CPIData = {
      value: current,
      previousValue: previousMonth,
      change: change,
      percentChange: percentChange,
      monthOverMonth: monthOverMonth,
      yearOverYear: yearOverYear,
      date: monthlyObs[0].date,
      trend: determineTrend(change),
      direction: determineDirection(monthOverMonth),
      inflationPressure: determineInflationPressure(yearOverYear),
      source: 'FRED_API_CPIAUCSL',
    };

    return NextResponse.json({
      success: true,
      data: cpiData,
    });

  } catch (error) {
    console.error('Error fetching CPI data:', error);

    // Return mock data on error
    return NextResponse.json({
      success: true,
      data: getMockCPIData(),
      message: `Failed to fetch from FRED API: ${error instanceof Error ? error.message : 'Unknown error'}`,
      fallback: true,
    });
  }
}
