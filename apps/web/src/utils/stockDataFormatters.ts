// Enhanced formatting utilities for stock market data
import { StockMarketData, FormattedMarketData, PriceChangeInfo } from '@/types/enhancedStockProfile';

/**
 * Format a price change value with proper sign and styling info
 */
export function formatPriceChange(value: number): PriceChangeInfo {
  const isPositive = value > 0;
  const isNegative = value < 0;
  const isNeutral = value === 0;

  return {
    value,
    formatted: isPositive ? `+${value.toFixed(2)}` : value.toFixed(2),
    isPositive,
    isNegative,
    isNeutral
  };
}

/**
 * Format a percentage change with proper sign and styling info
 */
export function formatPercentChange(value: number): PriceChangeInfo {
  const isPositive = value > 0;
  const isNegative = value < 0;
  const isNeutral = value === 0;

  return {
    value,
    formatted: `${isPositive ? '+' : ''}${value.toFixed(2)}%`,
    isPositive,
    isNegative,
    isNeutral
  };
}

/**
 * Format market cap (extends existing function)
 */
export function formatMarketCap(value: number | undefined): string {
  if (!value || value <= 0) return 'N/A';

  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  return `$${value.toLocaleString()}`;
}

/**
 * Format volume numbers
 */
export function formatVolume(value: number | undefined): string {
  if (!value || value <= 0) return 'N/A';

  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return value.toLocaleString();
}

/**
 * Format P/E ratio
 */
export function formatPE(value: number | undefined): string {
  if (!value || value <= 0) return 'N/A';
  return value.toFixed(2);
}

/**
 * Format 52-week range
 */
export function format52WeekRange(low: number | undefined, high: number | undefined): string {
  if (!low || !high || low <= 0 || high <= 0) return 'N/A';
  return `$${low.toFixed(2)} - $${high.toFixed(2)}`;
}

/**
 * Format price with proper currency symbol
 */
export function formatPrice(value: number | undefined): string {
  if (!value || value <= 0) return '$0.00';
  return `$${value.toFixed(2)}`;
}

/**
 * Complete formatter for market data
 */
export function formatMarketData(marketData: StockMarketData): FormattedMarketData {
  return {
    price: formatPrice(marketData.price),
    change: formatPriceChange(marketData.change),
    changePercent: formatPercentChange(marketData.changePercent),
    volume: marketData.volume ? formatVolume(marketData.volume) : undefined,
    marketCap: marketData.marketCap ? formatMarketCap(marketData.marketCap) : undefined,
    pe: marketData.pe ? formatPE(marketData.pe) : undefined,
    fiftyTwoWeekRange: format52WeekRange(marketData.fiftyTwoWeekLow, marketData.fiftyTwoWeekHigh)
  };
}

/**
 * Get CSS classes for price change styling
 */
export function getPriceChangeClasses(changeInfo: PriceChangeInfo): string {
  if (changeInfo.isPositive) return 'price-change positive';
  if (changeInfo.isNegative) return 'price-change negative';
  return 'price-change neutral';
}

/**
 * Get CSS color variable for price change
 */
export function getPriceChangeColor(changeInfo: PriceChangeInfo): string {
  if (changeInfo.isPositive) return 'var(--color-positive)';
  if (changeInfo.isNegative) return 'var(--color-negative)';
  return 'var(--color-neutral)';
}