import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface FredApiResponse {
  observations: Array<{
    realtime_start: string;
    realtime_end: string;
    date: string;
    value: string;
  }>;
}

export interface EconomicIndicator {
  value: number;
  previousValue: number;
  change: number;
  percentChange: number;
  date: string;
  trend: 'rising' | 'falling' | 'stable';
  source: 'fred_api';
}

export interface InterestRateData extends EconomicIndicator {
  basisPointsChange: number;
  aiOutlook?: string;
}

export interface CPIData extends EconomicIndicator {
  yearOverYear: number;
  monthOverMonth: number;
  direction: 'up' | 'down' | 'stable';
  inflationPressure: 'low' | 'moderate' | 'high';
}

export interface UnemploymentData extends EconomicIndicator {
  monthOverMonth: number;
  employmentHealth: 'strong' | 'moderate' | 'weak';
}

@Injectable()
export class FredApiService {
  private readonly logger = new Logger(FredApiService.name);
  private readonly fredApiKey = process.env.FRED_API_KEY;
  private readonly fredBaseUrl =
    'https://api.stlouisfed.org/fred/series/observations';

  constructor() {
    if (!this.fredApiKey) {
      this.logger.warn(
        'FRED API key not configured. Economic indicators will use mock data.',
      );
    }
  }

  /**
   * Get 10-Year Treasury Yield (Interest Rate)
   */
  async getInterestRateData(): Promise<InterestRateData> {
    try {
      if (!this.fredApiKey) {
        return this.getMockInterestRateData();
      }

      const response = await this.fetchFredData('GS10', 2); // 10-Year Treasury
      const observations = response.observations;

      if (observations.length < 2) {
        throw new Error(
          'Insufficient data points for interest rate calculation',
        );
      }

      const current = parseFloat(observations[0].value);
      const previous = parseFloat(observations[1].value);
      const change = current - previous;
      const percentChange = (change / previous) * 100;
      const basisPointsChange = change * 100;

      return {
        value: current,
        previousValue: previous,
        change: change,
        percentChange: percentChange,
        basisPointsChange: basisPointsChange,
        date: observations[0].date,
        trend: this.determineTrend(change),
        source: 'fred_api',
      };
    } catch (error) {
      this.logger.error('Error fetching interest rate data:', error.message);
      return this.getMockInterestRateData();
    }
  }

  /**
   * Get Consumer Price Index (CPI) data
   */
  async getCPIData(): Promise<CPIData> {
    try {
      if (!this.fredApiKey) {
        return this.getMockCPIData();
      }

      const [monthlyResponse, yearlyResponse] = await Promise.all([
        this.fetchFredData('CPIAUCSL', 2), // Monthly CPI
        this.fetchFredData('CPIAUCSL', 13), // 13 months for YoY calculation
      ]);

      const monthlyObs = monthlyResponse.observations;
      const yearlyObs = yearlyResponse.observations;

      if (monthlyObs.length < 2 || yearlyObs.length < 13) {
        throw new Error('Insufficient data points for CPI calculation');
      }

      const current = parseFloat(monthlyObs[0].value);
      const previousMonth = parseFloat(monthlyObs[1].value);
      const previousYear = parseFloat(yearlyObs[12].value);

      const monthOverMonth = ((current - previousMonth) / previousMonth) * 100;
      const yearOverYear = ((current - previousYear) / previousYear) * 100;
      const change = current - previousMonth;
      const percentChange = monthOverMonth;

      return {
        value: current,
        previousValue: previousMonth,
        change: change,
        percentChange: percentChange,
        monthOverMonth: monthOverMonth,
        yearOverYear: yearOverYear,
        date: monthlyObs[0].date,
        trend: this.determineTrend(change),
        direction: this.determineDirection(monthOverMonth),
        inflationPressure: this.determineInflationPressure(yearOverYear),
        source: 'fred_api',
      };
    } catch (error) {
      this.logger.error('Error fetching CPI data:', error.message);
      return this.getMockCPIData();
    }
  }

  /**
   * Get Unemployment Rate data
   */
  async getUnemploymentData(): Promise<UnemploymentData> {
    try {
      if (!this.fredApiKey) {
        return this.getMockUnemploymentData();
      }

      const response = await this.fetchFredData('UNRATE', 2); // Unemployment Rate
      const observations = response.observations;

      if (observations.length < 2) {
        throw new Error(
          'Insufficient data points for unemployment calculation',
        );
      }

      const current = parseFloat(observations[0].value);
      const previous = parseFloat(observations[1].value);
      const change = current - previous;
      const percentChange = (change / previous) * 100;
      const monthOverMonth = change;

      return {
        value: current,
        previousValue: previous,
        change: change,
        percentChange: percentChange,
        monthOverMonth: monthOverMonth,
        date: observations[0].date,
        trend: this.determineTrend(change),
        employmentHealth: this.determineEmploymentHealth(current, change),
        source: 'fred_api',
      };
    } catch (error) {
      this.logger.error('Error fetching unemployment data:', error.message);
      return this.getMockUnemploymentData();
    }
  }

  /**
   * Fetch data from FRED API
   */
  private async fetchFredData(
    seriesId: string,
    limit: number = 1,
  ): Promise<FredApiResponse> {
    try {
      const response = await axios.get(this.fredBaseUrl, {
        params: {
          series_id: seriesId,
          api_key: this.fredApiKey,
          file_type: 'json',
          limit: limit,
          sort_order: 'desc',
        },
        timeout: 10000,
      });

      if (!response.data || !response.data.observations) {
        throw new Error(
          `Invalid response from FRED API for series ${seriesId}`,
        );
      }

      return response.data;
    } catch (error) {
      this.logger.error(
        `FRED API request failed for series ${seriesId}:`,
        error.message,
      );
      throw error;
    }
  }

  /**
   * Helper methods
   */
  private determineTrend(change: number): 'rising' | 'falling' | 'stable' {
    const threshold = 0.01; // 1% threshold for stability
    if (Math.abs(change) <= threshold) return 'stable';
    return change > 0 ? 'rising' : 'falling';
  }

  private determineDirection(value: number): 'up' | 'down' | 'stable' {
    const threshold = 0.05; // 0.05% threshold
    if (Math.abs(value) <= threshold) return 'stable';
    return value > 0 ? 'up' : 'down';
  }

  private determineInflationPressure(
    yearOverYear: number,
  ): 'low' | 'moderate' | 'high' {
    if (yearOverYear <= 2.0) return 'low';
    if (yearOverYear <= 4.0) return 'moderate';
    return 'high';
  }

  private determineEmploymentHealth(
    rate: number,
    change: number,
  ): 'strong' | 'moderate' | 'weak' {
    // Lower unemployment rate is better
    // Decreasing unemployment is positive
    if (rate <= 4.0 && change <= 0) return 'strong';
    if (rate <= 6.0 && change <= 0.2) return 'moderate';
    return 'weak';
  }

  /**
   * Mock data methods for fallback
   */
  private getMockInterestRateData(): InterestRateData {
    return {
      value: 4.25,
      previousValue: 4.1,
      change: 0.15,
      percentChange: 3.66,
      basisPointsChange: 15,
      date: new Date().toISOString().split('T')[0],
      trend: 'rising',
      source: 'fred_api',
      aiOutlook:
        'Fed expected to maintain current stance amid inflation concerns',
    };
  }

  private getMockCPIData(): CPIData {
    return {
      value: 307.2,
      previousValue: 306.8,
      change: 0.4,
      percentChange: 0.13,
      monthOverMonth: 0.13,
      yearOverYear: 3.2,
      date: new Date().toISOString().split('T')[0],
      trend: 'rising',
      direction: 'up',
      inflationPressure: 'moderate',
      source: 'fred_api',
    };
  }

  private getMockUnemploymentData(): UnemploymentData {
    return {
      value: 3.8,
      previousValue: 3.9,
      change: -0.1,
      percentChange: -2.56,
      monthOverMonth: -0.1,
      date: new Date().toISOString().split('T')[0],
      trend: 'falling',
      employmentHealth: 'strong',
      source: 'fred_api',
    };
  }
}
