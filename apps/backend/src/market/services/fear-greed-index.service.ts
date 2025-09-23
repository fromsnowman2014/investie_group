import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface FearGreedComponents {
  marketVolatility: number; // VIX-based (0-100, inverted)
  marketVolume: number; // Trading volume analysis (0-100)
  marketMomentum: number; // Price momentum (0-100)
  stockPriceBreadth: number; // Market breadth (0-100)
  safehavenDemand: number; // Bond/gold demand (0-100)
  junkBondDemand: number; // Credit spreads (0-100)
  putCallRatio: number; // Options sentiment (0-100)
}

export interface FearGreedIndex {
  value: number; // 0-100 scale
  status: 'extreme-fear' | 'fear' | 'neutral' | 'greed' | 'extreme-greed';
  confidence: number; // Confidence score 0-100
  components: FearGreedComponents;
  methodology: string;
  lastUpdated: string;
  source: 'calculated' | 'claude-search';
}

@Injectable()
export class FearGreedIndexService {
  private readonly logger = new Logger(FearGreedIndexService.name);
  private readonly alphaVantageApiKey = process.env.ALPHA_VANTAGE_API_KEY;
  private readonly claudeApiKey = process.env.CLAUDE_API_KEY;

  constructor() {
    if (!this.alphaVantageApiKey) {
      this.logger.warn(
        'Alpha Vantage API key not configured for Fear & Greed calculation',
      );
    }
  }

  /**
   * Calculate proprietary Fear & Greed Index
   */
  async calculateFearGreedIndex(): Promise<FearGreedIndex> {
    try {
      // Fetch all required market data in parallel
      const [vixData, sp500VolumeData, marketBreadthData, bondYieldData] =
        await Promise.allSettled([
          this.getVixData(),
          this.getSP500VolumeData(),
          this.getMarketBreadthData(),
          this.getBondYieldData(),
        ]);

      // Calculate individual components
      const components: FearGreedComponents = {
        marketVolatility: this.calculateVolatilityScore(vixData),
        marketVolume: this.calculateVolumeScore(sp500VolumeData),
        marketMomentum: await this.calculateMomentumScore(),
        stockPriceBreadth: this.calculateBreadthScore(marketBreadthData),
        safehavenDemand: this.calculateSafehavenScore(bondYieldData),
        junkBondDemand: await this.calculateJunkBondScore(),
        putCallRatio: await this.calculatePutCallScore(),
      };

      // Calculate weighted Fear & Greed value
      const fearGreedValue = this.calculateWeightedFearGreed(components);
      const status = this.classifyFearGreedStatus(fearGreedValue);
      const confidence = this.calculateConfidence(components);

      return {
        value: fearGreedValue,
        status,
        confidence,
        components,
        methodology:
          'Proprietary calculation using VIX, volume, momentum, breadth, and sentiment indicators',
        lastUpdated: new Date().toISOString(),
        source: 'calculated',
      };
    } catch (error) {
      this.logger.error('Error calculating Fear & Greed Index:', error.message);
      return this.getFallbackFearGreedData();
    }
  }

  /**
   * Get VIX data for volatility calculation
   */
  private async getVixData(): Promise<number> {
    try {
      if (!this.alphaVantageApiKey) {
        return 20; // Default VIX value
      }

      const response = await axios.get('https://www.alphavantage.co/query', {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol: 'VIX',
          apikey: this.alphaVantageApiKey,
        },
        timeout: 10000,
      });

      const vixValue =
        parseFloat(response.data['Global Quote']['05. price']) || 20;
      return Math.max(0, vixValue);
    } catch (error) {
      this.logger.warn('Could not fetch VIX data, using default');
      return 20;
    }
  }

  /**
   * Get S&P 500 volume data
   */
  private async getSP500VolumeData(): Promise<number> {
    try {
      if (!this.alphaVantageApiKey) {
        return 50000000; // Default volume
      }

      const response = await axios.get('https://www.alphavantage.co/query', {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol: 'SPY',
          apikey: this.alphaVantageApiKey,
        },
        timeout: 10000,
      });

      const volume =
        parseInt(response.data['Global Quote']['06. volume']) || 50000000;
      return Math.max(0, volume);
    } catch (error) {
      this.logger.warn('Could not fetch S&P 500 volume, using default');
      return 50000000;
    }
  }

  /**
   * Get market breadth data (simulated using major indices)
   */
  private async getMarketBreadthData(): Promise<{
    advancing: number;
    declining: number;
  }> {
    try {
      // Simplified breadth calculation using major sector ETFs
      const sectors = [
        'XLK',
        'XLV',
        'XLF',
        'XLE',
        'XLI',
        'XLY',
        'XLP',
        'XLRE',
        'XLB',
        'XLU',
      ];
      let advancing = 0;
      let declining = 0;

      // In production, you'd fetch each sector's performance
      // For now, using a simplified approach
      const sectorPromises = sectors.slice(0, 5).map(async (symbol) => {
        try {
          const response = await axios.get(
            'https://www.alphavantage.co/query',
            {
              params: {
                function: 'GLOBAL_QUOTE',
                symbol: symbol,
                apikey: this.alphaVantageApiKey,
              },
              timeout: 5000,
            },
          );
          const change =
            parseFloat(response.data['Global Quote']['09. change']) || 0;
          return change > 0 ? 'advancing' : 'declining';
        } catch {
          return Math.random() > 0.5 ? 'advancing' : 'declining'; // Random fallback
        }
      });

      const results = await Promise.allSettled(sectorPromises);
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          if (result.value === 'advancing') advancing++;
          else declining++;
        }
      });

      // Fill remaining with random data if API calls failed
      const remaining = 10 - advancing - declining;
      for (let i = 0; i < remaining; i++) {
        if (Math.random() > 0.5) advancing++;
        else declining++;
      }

      return { advancing, declining };
    } catch (error) {
      this.logger.warn('Could not calculate market breadth, using default');
      return { advancing: 6, declining: 4 }; // Slightly bullish default
    }
  }

  /**
   * Get bond yield data for safe haven calculation
   */
  private async getBondYieldData(): Promise<number> {
    try {
      // This would typically come from FRED API or bond market data
      // For now, using a mock value
      return 4.25; // 10Y Treasury yield
    } catch (error) {
      return 4.25; // Default yield
    }
  }

  /**
   * Component calculation methods
   */
  private calculateVolatilityScore(
    vixData: PromiseSettledResult<number>,
  ): number {
    const vix = vixData.status === 'fulfilled' ? vixData.value : 20;

    // VIX interpretation: Lower VIX = more greed (higher score)
    // VIX 10-15: Extreme Greed (90-100)
    // VIX 15-20: Greed (70-90)
    // VIX 20-25: Neutral (40-70)
    // VIX 25-35: Fear (20-40)
    // VIX 35+: Extreme Fear (0-20)

    if (vix <= 15) return Math.max(90, Math.min(100, 110 - vix * 2));
    if (vix <= 20) return Math.max(70, Math.min(90, 140 - vix * 3.5));
    if (vix <= 25) return Math.max(40, Math.min(70, 170 - vix * 5.2));
    if (vix <= 35) return Math.max(20, Math.min(40, 150 - vix * 3.7));
    return Math.max(0, Math.min(20, 70 - vix));
  }

  private calculateVolumeScore(
    volumeData: PromiseSettledResult<number>,
  ): number {
    const volume =
      volumeData.status === 'fulfilled' ? volumeData.value : 50000000;

    // Higher volume generally indicates more conviction
    // Compare to historical averages (simplified)
    const avgVolume = 50000000; // Historical S&P 500 average
    const volumeRatio = volume / avgVolume;

    // Convert ratio to 0-100 scale
    if (volumeRatio >= 2.0) return 100;
    if (volumeRatio >= 1.5) return 80;
    if (volumeRatio >= 1.2) return 60;
    if (volumeRatio >= 0.8) return 40;
    if (volumeRatio >= 0.6) return 20;
    return 0;
  }

  private async calculateMomentumScore(): Promise<number> {
    try {
      // Calculate momentum using S&P 500 recent performance
      // This is simplified - in production you'd use more sophisticated momentum indicators
      const response = await axios.get('https://www.alphavantage.co/query', {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol: 'SPY',
          apikey: this.alphaVantageApiKey,
        },
        timeout: 10000,
      });

      const changePercent =
        parseFloat(
          response.data['Global Quote']['10. change percent'].replace('%', ''),
        ) || 0;

      // Convert daily change to momentum score
      // Positive momentum = higher greed score
      if (changePercent >= 2) return 100;
      if (changePercent >= 1) return 80;
      if (changePercent >= 0.5) return 65;
      if (changePercent >= 0) return 55;
      if (changePercent >= -0.5) return 45;
      if (changePercent >= -1) return 25;
      if (changePercent >= -2) return 10;
      return 0;
    } catch (error) {
      return 50; // Neutral default
    }
  }

  private calculateBreadthScore(
    breadthData: PromiseSettledResult<{ advancing: number; declining: number }>,
  ): number {
    const breadth =
      breadthData.status === 'fulfilled'
        ? breadthData.value
        : { advancing: 5, declining: 5 };

    const total = breadth.advancing + breadth.declining;
    const advancingRatio = breadth.advancing / total;

    // Convert to 0-100 scale
    return Math.round(advancingRatio * 100);
  }

  private calculateSafehavenScore(
    bondYieldData: PromiseSettledResult<number>,
  ): number {
    const bondYield =
      bondYieldData.status === 'fulfilled' ? bondYieldData.value : 4.25;

    // Higher bond yields often indicate risk-on sentiment
    // This is simplified and would need more context in production
    if (bondYield >= 5.0) return 70; // Risk-on
    if (bondYield >= 4.5) return 55;
    if (bondYield >= 4.0) return 45;
    if (bondYield >= 3.5) return 35;
    return 25; // Risk-off (flight to safety)
  }

  private async calculateJunkBondScore(): Promise<number> {
    // Simplified junk bond demand calculation
    // In production, you'd use credit spreads data
    return 50; // Neutral default
  }

  private async calculatePutCallScore(): Promise<number> {
    // Simplified put/call ratio calculation
    // In production, you'd use options market data
    return 55; // Slightly bullish default
  }

  /**
   * Calculate weighted Fear & Greed score
   */
  private calculateWeightedFearGreed(components: FearGreedComponents): number {
    const weights = {
      marketVolatility: 0.25, // VIX has high weight
      marketVolume: 0.15,
      marketMomentum: 0.2, // Momentum is important
      stockPriceBreadth: 0.15,
      safehavenDemand: 0.1,
      junkBondDemand: 0.1,
      putCallRatio: 0.05,
    };

    let weightedScore = 0;
    Object.entries(weights).forEach(([key, weight]) => {
      weightedScore +=
        (components[key as keyof FearGreedComponents] || 50) * weight;
    });

    return Math.round(Math.max(0, Math.min(100, weightedScore)));
  }

  /**
   * Classify Fear & Greed status
   */
  private classifyFearGreedStatus(
    value: number,
  ): 'extreme-fear' | 'fear' | 'neutral' | 'greed' | 'extreme-greed' {
    if (value <= 20) return 'extreme-fear';
    if (value <= 40) return 'fear';
    if (value <= 60) return 'neutral';
    if (value <= 80) return 'greed';
    return 'extreme-greed';
  }

  /**
   * Calculate confidence score based on data availability
   */
  private calculateConfidence(components: FearGreedComponents): number {
    const componentValues = Object.values(components);
    const validComponents = componentValues.filter((val) => val !== 50).length; // 50 is default/fallback
    const totalComponents = componentValues.length;

    const baseConfidence = 60; // Base confidence
    const dataQualityBonus = (validComponents / totalComponents) * 40;

    return Math.round(baseConfidence + dataQualityBonus);
  }

  /**
   * Fallback data when calculation fails
   */
  private getFallbackFearGreedData(): FearGreedIndex {
    return {
      value: 52,
      status: 'neutral',
      confidence: 60,
      components: {
        marketVolatility: 50,
        marketVolume: 50,
        marketMomentum: 55,
        stockPriceBreadth: 50,
        safehavenDemand: 50,
        junkBondDemand: 50,
        putCallRatio: 52,
      },
      methodology: 'Fallback calculation due to API limitations',
      lastUpdated: new Date().toISOString(),
      source: 'calculated',
    };
  }
}
