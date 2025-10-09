/**
 * Default Dashboard Layout Configuration
 * Defines the initial widget arrangement for new users
 */

import { DashboardLayout } from './types';

export const DEFAULT_LAYOUT: DashboardLayout = {
  version: '1.0.0',
  lastModified: new Date().toISOString(),
  gridConfig: {
    columns: 12,
    gap: 24,
    rowHeight: 200
  },
  widgets: [
    {
      id: 'ai-opinion',
      type: 'ai-opinion',
      title: 'AI Investment Opinion',
      icon: '🤖',
      size: 'large',
      position: { x: 0, y: 0 },
      dimensions: { width: 12, height: 1 },
      minDimensions: { width: 6, height: 1 },
      maxDimensions: { width: 12, height: 2 },
      isVisible: true,
      isLocked: false,
      requiredSymbol: true,
      category: 'AI Analysis',
      order: 1
    },
    {
      id: 'stock-profile',
      type: 'stock-profile',
      title: 'Stock Profile',
      icon: '📊',
      size: 'medium',
      position: { x: 0, y: 1 },
      dimensions: { width: 6, height: 1 },
      minDimensions: { width: 4, height: 1 },
      isVisible: true,
      isLocked: false,
      requiredSymbol: true,
      category: 'Market Data',
      order: 2
    },
    {
      id: 'macro-indicators',
      type: 'macro-indicators',
      title: 'Macro Indicators',
      icon: '📈',
      size: 'medium',
      position: { x: 6, y: 1 },
      dimensions: { width: 6, height: 1 },
      minDimensions: { width: 6, height: 1 },
      isVisible: true,
      isLocked: false,
      requiredSymbol: false,
      category: 'Market Data',
      order: 3
    },
    {
      id: 'bubble-detector',
      type: 'bubble-detector',
      title: 'Market Bubble Detector',
      icon: '🫧',
      size: 'large',
      position: { x: 0, y: 2 },
      dimensions: { width: 12, height: 1 },
      minDimensions: { width: 6, height: 1 },
      maxDimensions: { width: 12, height: 2 },
      isVisible: true,
      isLocked: false,
      requiredSymbol: false,
      category: 'Risk Indicators',
      order: 4
    },
    {
      id: 'news-analysis',
      type: 'news-analysis',
      title: 'AI News Analysis',
      icon: '📰',
      size: 'large',
      position: { x: 0, y: 3 },
      dimensions: { width: 12, height: 1 },
      minDimensions: { width: 6, height: 1 },
      isVisible: true,
      isLocked: false,
      requiredSymbol: true,
      category: 'News',
      order: 5
    },
    {
      id: 'advanced-chart',
      type: 'advanced-chart',
      title: 'Advanced Chart',
      icon: '📉',
      size: 'tall',
      position: { x: 0, y: 4 },
      dimensions: { width: 6, height: 2 },
      minDimensions: { width: 6, height: 2 },
      isVisible: true,
      isLocked: false,
      requiredSymbol: true,
      category: 'Charts',
      order: 6
    },
    {
      id: 'technical-analysis',
      type: 'technical-analysis',
      title: 'Technical Analysis',
      icon: '🔧',
      size: 'tall',
      position: { x: 6, y: 4 },
      dimensions: { width: 6, height: 2 },
      minDimensions: { width: 4, height: 1 },
      isVisible: true,
      isLocked: false,
      requiredSymbol: true,
      category: 'Charts',
      order: 7
    },
    {
      id: 'company-profile',
      type: 'company-profile',
      title: 'Company',
      icon: '🏢',
      size: 'small',
      position: { x: 0, y: 6 },
      dimensions: { width: 4, height: 1 },
      minDimensions: { width: 4, height: 1 },
      isVisible: true,
      isLocked: false,
      requiredSymbol: true,
      category: 'Fundamentals',
      order: 8
    },
    {
      id: 'fundamental-data',
      type: 'fundamental-data',
      title: 'Fundamentals',
      icon: '💰',
      size: 'small',
      position: { x: 4, y: 6 },
      dimensions: { width: 4, height: 1 },
      minDimensions: { width: 4, height: 1 },
      isVisible: true,
      isLocked: false,
      requiredSymbol: true,
      category: 'Fundamentals',
      order: 9
    },
    {
      id: 'top-stories',
      type: 'top-stories',
      title: 'Stories',
      icon: '📃',
      size: 'small',
      position: { x: 8, y: 6 },
      dimensions: { width: 4, height: 1 },
      minDimensions: { width: 4, height: 1 },
      isVisible: true,
      isLocked: false,
      requiredSymbol: true,
      category: 'News',
      order: 10
    }
  ]
};
