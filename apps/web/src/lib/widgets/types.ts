/**
 * Widget System Types
 * Defines core types for the customizable dashboard widget system
 */

export type WidgetSize =
  | 'small'      // 4 columns x 1 row (1/3 width, 280px)
  | 'medium'     // 6 columns x 1 row (1/2 width, 280px)
  | 'large'      // 12 columns x 1 row (full width, 280px)
  | 'tall'       // 6 columns x 2-3 rows (1/2 width, 560-840px for charts)
  | 'square'     // 4 columns x 2 rows (1/3 width, 560px)
  | 'xlarge'     // 12 columns x 2 rows (full width, 560px)
  | 'custom';    // User-defined

export type WidgetType =
  | 'ai-opinion'
  | 'stock-profile'
  | 'macro-indicators'
  | 'news-analysis'
  | 'advanced-chart'
  | 'technical-analysis'
  | 'company-profile'
  | 'fundamental-data'
  | 'top-stories'
  | 'bubble-detector';  // New widget

export type WidgetCategory =
  | 'AI Analysis'
  | 'Market Data'
  | 'Charts'
  | 'News'
  | 'Fundamentals'
  | 'Risk Indicators';  // For bubble detector

export interface WidgetConfig {
  id: string;                    // Unique ID (e.g., 'ai-opinion')
  type: WidgetType;              // Widget type
  title: string;                 // Display title
  icon: string;                  // Icon (emoji)
  size: WidgetSize;              // Size class
  position: {                    // Grid position
    x: number;                   // Column start (0-11)
    y: number;                   // Row start (0-∞)
  };
  dimensions: {                  // Actual size
    width: number;               // Columns (1-12)
    height: number;              // Rows (1-∞)
  };
  minDimensions?: {              // Minimum size constraints
    width: number;
    height: number;
  };
  maxDimensions?: {              // Maximum size constraints
    width: number;
    height: number;
  };
  isVisible: boolean;            // Display visibility
  isLocked: boolean;             // Position lock
  requiredSymbol: boolean;       // Requires stock symbol
  category: WidgetCategory;      // Widget category
  order: number;                 // Display order
}

export interface DashboardLayout {
  version: string;               // Layout version
  widgets: WidgetConfig[];       // Widget configurations
  lastModified: string;          // Last modification timestamp
  gridConfig: {                  // Grid settings
    columns: number;             // 12 (fixed)
    gap: number;                 // 24px
    rowHeight: number;           // 200px
  };
}

export interface WidgetMetadata {
  id: string;
  type: WidgetType;
  title: string;
  description: string;
  icon: string;
  category: WidgetCategory;
  defaultSize: WidgetSize;
  minDimensions: { width: number; height: number };
  maxDimensions?: { width: number; height: number };
  requiredSymbol: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: React.ComponentType<any>;
}
