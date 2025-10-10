/**
 * Widget Registry
 * Central registry of all available dashboard widgets with metadata
 */

import { WidgetMetadata, WidgetType, WidgetCategory } from './types';
import { lazy } from 'react';

// Lazy load widgets for better performance
// AIOpinionCard uses named export, others use default export
const AIOpinionCard = lazy(() => import('@/app/components/AIOpinion/AIOpinionCard').then(m => ({ default: m.AIOpinionCard })));
const StockProfile = lazy(() => import('@/app/components/AIAnalysis/StockProfile'));
const MacroIndicatorsDashboard = lazy(() => import('@/app/components/MarketIntelligence/MacroIndicatorsDashboard'));
const AINewsAnalysisReport = lazy(() => import('@/app/components/MarketIntelligence/AINewsAnalysisReport'));
const AdvancedChart = lazy(() => import('@/app/components/TradingView/AdvancedChart'));
const TechnicalAnalysis = lazy(() => import('@/app/components/TradingView/TechnicalAnalysis'));
const CompanyProfile = lazy(() => import('@/app/components/TradingView/CompanyProfile'));
const FundamentalData = lazy(() => import('@/app/components/TradingView/FundamentalData'));
const TopStories = lazy(() => import('@/app/components/TradingView/TopStories'));
const BubbleDetector = lazy(() => import('@/app/components/RiskIndicators/BubbleDetector'));

export const WIDGET_REGISTRY: Record<WidgetType, WidgetMetadata> = {
  'ai-opinion': {
    id: 'ai-opinion',
    type: 'ai-opinion',
    title: 'AI Investment Opinion',
    description: 'AI-powered investment recommendations and analysis',
    icon: '🤖',
    category: 'AI Analysis',
    defaultSize: 'xlarge',
    minDimensions: { width: 6, height: 1 },
    maxDimensions: { width: 12, height: 3 },
    requiredSymbol: true,
    component: AIOpinionCard
  },
  'stock-profile': {
    id: 'stock-profile',
    type: 'stock-profile',
    title: 'Stock Profile',
    description: 'Company overview and key metrics',
    icon: '📊',
    category: 'Market Data',
    defaultSize: 'tall',
    minDimensions: { width: 4, height: 1 },
    requiredSymbol: true,
    component: StockProfile
  },
  'macro-indicators': {
    id: 'macro-indicators',
    type: 'macro-indicators',
    title: 'Macro Indicators',
    description: 'Economic indicators and market overview',
    icon: '📈',
    category: 'Market Data',
    defaultSize: 'tall',
    minDimensions: { width: 6, height: 1 },
    requiredSymbol: false,
    component: MacroIndicatorsDashboard
  },
  'news-analysis': {
    id: 'news-analysis',
    type: 'news-analysis',
    title: 'AI News Analysis',
    description: 'AI-analyzed news and sentiment',
    icon: '📰',
    category: 'News',
    defaultSize: 'xlarge',
    minDimensions: { width: 6, height: 1 },
    requiredSymbol: true,
    component: AINewsAnalysisReport
  },
  'advanced-chart': {
    id: 'advanced-chart',
    type: 'advanced-chart',
    title: 'Advanced Chart',
    description: 'TradingView advanced charting',
    icon: '📉',
    category: 'Charts',
    defaultSize: 'tall',
    minDimensions: { width: 6, height: 2 },
    maxDimensions: { width: 12, height: 4 },
    requiredSymbol: true,
    component: AdvancedChart
  },
  'technical-analysis': {
    id: 'technical-analysis',
    type: 'technical-analysis',
    title: 'Technical Analysis',
    description: 'Technical indicators and analysis',
    icon: '🔧',
    category: 'Charts',
    defaultSize: 'tall',
    minDimensions: { width: 4, height: 2 },
    maxDimensions: { width: 12, height: 4 },
    requiredSymbol: true,
    component: TechnicalAnalysis
  },
  'company-profile': {
    id: 'company-profile',
    type: 'company-profile',
    title: 'Company',
    description: 'Company profile widget',
    icon: '🏢',
    category: 'Fundamentals',
    defaultSize: 'square',
    minDimensions: { width: 4, height: 1 },
    requiredSymbol: true,
    component: CompanyProfile
  },
  'fundamental-data': {
    id: 'fundamental-data',
    type: 'fundamental-data',
    title: 'Fundamentals',
    description: 'Fundamental data and metrics',
    icon: '💰',
    category: 'Fundamentals',
    defaultSize: 'square',
    minDimensions: { width: 4, height: 1 },
    requiredSymbol: true,
    component: FundamentalData
  },
  'top-stories': {
    id: 'top-stories',
    type: 'top-stories',
    title: 'Stories',
    description: 'Top news stories',
    icon: '📃',
    category: 'News',
    defaultSize: 'square',
    minDimensions: { width: 4, height: 1 },
    requiredSymbol: true,
    component: TopStories
  },
  'bubble-detector': {
    id: 'bubble-detector',
    type: 'bubble-detector',
    title: 'Market Bubble Detector',
    description: 'AI-powered market bubble risk assessment',
    icon: '🫧',
    category: 'Risk Indicators',
    defaultSize: 'xlarge',
    minDimensions: { width: 6, height: 1 },
    maxDimensions: { width: 12, height: 3 },
    requiredSymbol: false,
    component: BubbleDetector
  }
};

/**
 * Get widget metadata by type
 */
export function getWidgetMetadata(type: WidgetType): WidgetMetadata | undefined {
  return WIDGET_REGISTRY[type];
}

/**
 * Get all available widgets
 */
export function getAllWidgets(): WidgetMetadata[] {
  return Object.values(WIDGET_REGISTRY);
}

/**
 * Get widgets filtered by category
 */
export function getWidgetsByCategory(category: WidgetCategory): WidgetMetadata[] {
  return getAllWidgets().filter(w => w.category === category);
}

/**
 * Get all unique categories
 */
export function getAllCategories(): WidgetCategory[] {
  const categories = new Set<WidgetCategory>();
  getAllWidgets().forEach(widget => categories.add(widget.category));
  return Array.from(categories);
}
