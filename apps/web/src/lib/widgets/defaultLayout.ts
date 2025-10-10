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
    rowHeight: 280  // Increased from 200px to accommodate content
  },
  widgets: [
    {
      id: 'ai-opinion',
      type: 'ai-opinion',
      title: 'AI Investment Opinion',
      icon: '🤖',
      size: 'xlarge',
      position: { x: 0, y: 0 },
      dimensions: { width: 12, height: 4 },
      minDimensions: { width: 6, height: 1 },
      maxDimensions: { width: 12, height: 6 },
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
      size: 'tall',
      position: { x: 0, y: 2 },
      dimensions: { width: 6, height: 3 },
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
      size: 'tall',
      position: { x: 6, y: 2 },
      dimensions: { width: 6, height: 3 },
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
      size: 'xlarge',
      position: { x: 0, y: 4 },
      dimensions: { width: 12, height: 4 },
      minDimensions: { width: 6, height: 1 },
      maxDimensions: { width: 12, height: 3 },
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
      size: 'xlarge',
      position: { x: 0, y: 6 },
      dimensions: { width: 12, height: 3 },
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
      position: { x: 0, y: 8 },
      dimensions: { width: 6, height: 3 },
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
      position: { x: 6, y: 8 },
      dimensions: { width: 6, height: 3 },
      minDimensions: { width: 4, height: 2 },
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
      size: 'square',
      position: { x: 0, y: 11 },
      dimensions: { width: 4, height:  },
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
      size: 'square',
      position: { x: 4, y: 11 },
      dimensions: { width: 4, height: 3 },
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
      size: 'square',
      position: { x: 8, y: 11 },
      dimensions: { width: 4, height: 3 },
      minDimensions: { width: 4, height: 1 },
      isVisible: true,
      isLocked: false,
      requiredSymbol: true,
      category: 'News',
      order: 10
    }
  ]
};
