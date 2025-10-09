# Investie - Customizable Widget Layout System Implementation Plan

## 📋 Executive Summary

현재 Investie 애플리케이션은 고정된 grid 레이아웃을 사용하고 있습니다. 이 문서는 사용자가 drag & drop으로 위젯의 위치와 크기를 자유롭게 조정하고, 위젯을 추가/제거할 수 있는 완전히 커스터마이징 가능한 대시보드 시스템으로 전환하는 구현 계획을 제시합니다.

**주요 목표:**
- ✅ Drag & Drop 가능한 위젯 시스템
- ✅ Cookie/LocalStorage를 통한 레이아웃 영구 저장
- ✅ 가변 크기 위젯 지원 (1x1, 2x1, 1x2, 2x2 등)
- ✅ 위젯 추가/제거 UI
- ✅ 버블 판단 (Bubble Detector) 신규 위젯 추가
- ✅ 기존 컴포넌트의 완벽한 마이그레이션
- ✅ 전문적인 금융 대시보드 UI/UX

---

## 🎯 Current State Analysis

### 1. 현재 Frontend 구조

#### 1.1 페이지 구조 (`apps/web/src/app/page.tsx`)
```typescript
export default function Home() {
  const { currentSymbol } = useStock();
  
  return (
    <>
      <TickerTape />
      <MainLayout
        header={<Header />}
        aiInvestmentOpinion={<AIOpinionCard symbol={currentSymbol} />}
        stockProfile={<StockProfile symbol={currentSymbol} />}
        macroIndicatorsDashboard={<MacroIndicatorsDashboard />}
        aiNewsAnalysisReport={<AINewsAnalysisReport symbol={currentSymbol} />}
        advancedChart={<AdvancedChart />}
        technicalAnalysis={<TechnicalAnalysis />}
        companyProfile={<CompanyProfile />}
        fundamentalData={<FundamentalData />}
        topStories={<TopStories />}
      />
      <Footer />
    </>
  );
}
```

#### 1.2 현재 레이아웃 시스템 (`MainLayout.tsx`)
- **문제점**: 고정된 CSS Grid 사용
- **제약사항**: 
  - Grid template areas로 위치 고정
  - 순서 변경 불가능
  - 크기 조정 불가능
  - 위젯 추가/제거 불가능

```css
/* globals.css - 현재 레이아웃 */
.optimized-content-grid {
  grid-template-columns: 1fr 1fr;
  grid-template-areas:
    "ai-opinion ai-opinion"
    "stock-profile macro-indicators"
    "news-analysis news-analysis"
    "advanced-chart tech-analysis"
    "company-widget fundamental-widget"
    "stories-widget stories-widget";
}
```

#### 1.3 기존 컴포넌트 목록 (9개)

| ID | 컴포넌트 이름 | 현재 크기 | 설명 |
|----|-------------|---------|------|
| 1 | AI Investment Opinion | 2x1 (Full Width) | AI 기반 투자 의견 |
| 2 | Stock Profile | 1x1 (Half Width) | 주식 프로필 정보 |
| 3 | Macro Indicators | 1x1 (Half Width) | 거시경제 지표 |
| 4 | AI News Analysis | 2x1 (Full Width) | AI 뉴스 분석 |
| 5 | Advanced Chart | 1x2 (Half Width, Tall) | TradingView 차트 |
| 6 | Technical Analysis | 1x2 (Half Width, Tall) | 기술적 분석 |
| 7 | Company Profile | 1x1 (Third Width) | 회사 프로필 |
| 8 | Fundamental Data | 1x1 (Third Width) | 펀더멘털 데이터 |
| 9 | Top Stories | 2x1 (Full Width) | 주요 뉴스 |

---

## 🚀 New System Architecture

### 2. Widget System Design

#### 2.1 Widget 크기 시스템

**Grid-based Layout System:**
- 12-column grid system (flexible & responsive)
- Row height: 200px (minimum)
- Gap: 24px

**Widget Size Classes:**
```typescript
type WidgetSize = 
  | 'small'      // 4 columns x 1 row (1/3 width)
  | 'medium'     // 6 columns x 1 row (1/2 width)
  | 'large'      // 12 columns x 1 row (full width)
  | 'tall'       // 6 columns x 2 rows
  | 'square'     // 6 columns x 1.5 rows
  | 'xlarge'     // 12 columns x 2 rows
  | 'custom';    // User-defined
```

#### 2.2 Widget Configuration Schema

```typescript
interface WidgetConfig {
  id: string;                    // 고유 ID (e.g., 'ai-opinion')
  type: WidgetType;              // 위젯 타입
  title: string;                 // 표시 제목
  icon: string;                  // 아이콘 (emoji)
  size: WidgetSize;              // 크기
  position: {                    // 그리드 위치
    x: number;                   // Column start (0-11)
    y: number;                   // Row start (0-∞)
  };
  dimensions: {                  // 실제 크기
    width: number;               // Columns (1-12)
    height: number;              // Rows (1-∞)
  };
  isVisible: boolean;            // 표시 여부
  isLocked: boolean;             // 위치 고정 여부
  requiredSymbol: boolean;       // Symbol 필요 여부
  category: WidgetCategory;      // 카테고리
  order: number;                 // 정렬 순서
}

type WidgetType = 
  | 'ai-opinion'
  | 'stock-profile'
  | 'macro-indicators'
  | 'news-analysis'
  | 'advanced-chart'
  | 'technical-analysis'
  | 'company-profile'
  | 'fundamental-data'
  | 'top-stories'
  | 'bubble-detector';  // 🆕 신규 위젯

type WidgetCategory = 
  | 'AI Analysis'
  | 'Market Data'
  | 'Charts'
  | 'News'
  | 'Fundamentals'
  | 'Risk Indicators';  // 🆕 버블 디텍터용

interface DashboardLayout {
  version: string;               // 레이아웃 버전
  widgets: WidgetConfig[];       // 위젯 설정 배열
  lastModified: string;          // 마지막 수정 시간
  gridConfig: {                  // 그리드 설정
    columns: number;             // 12 (고정)
    gap: number;                 // 24px
    rowHeight: number;           // 200px
  };
}
```

#### 2.3 Default Layout Configuration

```typescript
const DEFAULT_LAYOUT: DashboardLayout = {
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
      isVisible: true,
      isLocked: false,
      requiredSymbol: false,
      category: 'Market Data',
      order: 3
    },
    {
      id: 'bubble-detector',  // 🆕 새로운 위젯
      type: 'bubble-detector',
      title: 'Market Bubble Detector',
      icon: '🫧',
      size: 'large',
      position: { x: 0, y: 2 },
      dimensions: { width: 12, height: 1 },
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
      isVisible: true,
      isLocked: false,
      requiredSymbol: true,
      category: 'News',
      order: 10
    }
  ]
};
```

---

## 🏗️ Implementation Plan

### Phase 1: Foundation & Infrastructure (Week 1)

#### 1.1 Create Widget System Types & Utilities

**Files to Create:**
```
apps/web/src/lib/
├── widgets/
│   ├── types.ts              # Widget types & interfaces
│   ├── registry.ts           # Widget registry & metadata
│   ├── defaultLayout.ts      # Default layout configuration
│   └── layoutStorage.ts      # LocalStorage/Cookie management
```

**Key Implementations:**

**`types.ts`** - Core type definitions
```typescript
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
  component: React.ComponentType<any>;
}
```

**`layoutStorage.ts`** - Persistence layer
```typescript
const LAYOUT_STORAGE_KEY = 'investie_dashboard_layout';
const LAYOUT_COOKIE_NAME = 'investie_layout';
const LAYOUT_VERSION = '1.0.0';

export class LayoutStorage {
  // Save to both localStorage and cookie for redundancy
  static saveLayout(layout: DashboardLayout): void {
    try {
      const serialized = JSON.stringify(layout);
      
      // LocalStorage (primary)
      localStorage.setItem(LAYOUT_STORAGE_KEY, serialized);
      
      // Cookie (backup, expires in 1 year)
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      document.cookie = `${LAYOUT_COOKIE_NAME}=${encodeURIComponent(serialized)}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Strict`;
      
      console.log('✅ Layout saved successfully');
    } catch (error) {
      console.error('❌ Failed to save layout:', error);
    }
  }
  
  static loadLayout(): DashboardLayout | null {
    try {
      // Try localStorage first
      const stored = localStorage.getItem(LAYOUT_STORAGE_KEY);
      if (stored) {
        const layout = JSON.parse(stored);
        if (this.validateLayout(layout)) {
          return layout;
        }
      }
      
      // Fallback to cookie
      const cookieValue = this.getCookie(LAYOUT_COOKIE_NAME);
      if (cookieValue) {
        const layout = JSON.parse(decodeURIComponent(cookieValue));
        if (this.validateLayout(layout)) {
          return layout;
        }
      }
      
      return null;
    } catch (error) {
      console.error('❌ Failed to load layout:', error);
      return null;
    }
  }
  
  static resetToDefault(): DashboardLayout {
    const defaultLayout = DEFAULT_LAYOUT;
    this.saveLayout(defaultLayout);
    return defaultLayout;
  }
  
  private static validateLayout(layout: any): boolean {
    return (
      layout &&
      layout.version &&
      Array.isArray(layout.widgets) &&
      layout.gridConfig
    );
  }
  
  private static getCookie(name: string): string | null {
    const matches = document.cookie.match(
      new RegExp(`(?:^|; )${name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1')}=([^;]*)`)
    );
    return matches ? matches[1] : null;
  }
}
```

#### 1.2 Create Widget Registry

**`registry.ts`** - Widget metadata registry
```typescript
import { WidgetMetadata, WidgetType } from './types';
import { lazy } from 'react';

// Lazy load widgets for better performance
const AIOpinionCard = lazy(() => import('@/app/components/AIOpinion/AIOpinionCard'));
const StockProfile = lazy(() => import('@/app/components/AIAnalysis/StockProfile'));
const MacroIndicatorsDashboard = lazy(() => import('@/app/components/MarketIntelligence/MacroIndicatorsDashboard'));
const AINewsAnalysisReport = lazy(() => import('@/app/components/MarketIntelligence/AINewsAnalysisReport'));
const AdvancedChart = lazy(() => import('@/app/components/TradingView/AdvancedChart'));
const TechnicalAnalysis = lazy(() => import('@/app/components/TradingView/TechnicalAnalysis'));
const CompanyProfile = lazy(() => import('@/app/components/TradingView/CompanyProfile'));
const FundamentalData = lazy(() => import('@/app/components/TradingView/FundamentalData'));
const TopStories = lazy(() => import('@/app/components/TradingView/TopStories'));
const BubbleDetector = lazy(() => import('@/app/components/RiskIndicators/BubbleDetector')); // 🆕

export const WIDGET_REGISTRY: Record<WidgetType, WidgetMetadata> = {
  'ai-opinion': {
    id: 'ai-opinion',
    type: 'ai-opinion',
    title: 'AI Investment Opinion',
    description: 'AI-powered investment recommendations and analysis',
    icon: '🤖',
    category: 'AI Analysis',
    defaultSize: 'large',
    minDimensions: { width: 6, height: 1 },
    maxDimensions: { width: 12, height: 2 },
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
    defaultSize: 'medium',
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
    defaultSize: 'medium',
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
    defaultSize: 'large',
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
    minDimensions: { width: 4, height: 1 },
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
    defaultSize: 'small',
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
    defaultSize: 'small',
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
    defaultSize: 'small',
    minDimensions: { width: 4, height: 1 },
    requiredSymbol: true,
    component: TopStories
  },
  'bubble-detector': {  // 🆕 New Widget
    id: 'bubble-detector',
    type: 'bubble-detector',
    title: 'Market Bubble Detector',
    description: 'AI-powered market bubble risk assessment',
    icon: '🫧',
    category: 'Risk Indicators',
    defaultSize: 'large',
    minDimensions: { width: 6, height: 1 },
    maxDimensions: { width: 12, height: 2 },
    requiredSymbol: false,
    component: BubbleDetector
  }
};

export function getWidgetMetadata(type: WidgetType): WidgetMetadata | undefined {
  return WIDGET_REGISTRY[type];
}

export function getAllWidgets(): WidgetMetadata[] {
  return Object.values(WIDGET_REGISTRY);
}

export function getWidgetsByCategory(category: WidgetCategory): WidgetMetadata[] {
  return getAllWidgets().filter(w => w.category === category);
}
```

---

### Phase 2: Drag & Drop System (Week 2)

#### 2.1 Choose & Integrate Drag & Drop Library

**Recommended Library: `react-grid-layout`**

**Why `react-grid-layout`?**
- ✅ Mature & battle-tested (15k+ stars)
- ✅ Built specifically for dashboard layouts
- ✅ Responsive grid system
- ✅ Auto-rearrangement on collision
- ✅ Resize handles built-in
- ✅ TypeScript support
- ✅ SSR compatible (Next.js)

**Installation:**
```bash
cd apps/web
npm install react-grid-layout
npm install --save-dev @types/react-grid-layout
```

**Alternative Consideration: `dnd-kit`**
- More modern, better accessibility
- More control but requires more custom code
- Decision: Start with `react-grid-layout` for faster MVP, can migrate later if needed

#### 2.2 Create Draggable Widget Container

**Files to Create:**
```
apps/web/src/app/components/Dashboard/
├── DashboardGrid.tsx          # Main grid container
├── WidgetContainer.tsx        # Individual widget wrapper
├── WidgetHeader.tsx           # Widget header with drag handle
└── WidgetPlaceholder.tsx      # Empty state placeholder
```

**`DashboardGrid.tsx`** - Main Implementation
```typescript
'use client';

import React, { useState, useCallback, Suspense } from 'react';
import GridLayout, { Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import { WidgetConfig, DashboardLayout } from '@/lib/widgets/types';
import { LayoutStorage } from '@/lib/widgets/layoutStorage';
import { DEFAULT_LAYOUT } from '@/lib/widgets/defaultLayout';
import WidgetContainer from './WidgetContainer';
import { useStock } from '../StockProvider';

export default function DashboardGrid() {
  const { currentSymbol } = useStock();
  const [layout, setLayout] = useState<DashboardLayout>(() => {
    return LayoutStorage.loadLayout() || DEFAULT_LAYOUT;
  });

  // Convert WidgetConfig to react-grid-layout format
  const gridLayout: Layout[] = layout.widgets
    .filter(w => w.isVisible)
    .map(widget => ({
      i: widget.id,
      x: widget.position.x,
      y: widget.position.y,
      w: widget.dimensions.width,
      h: widget.dimensions.height,
      minW: widget.minDimensions?.width || 2,
      minH: widget.minDimensions?.height || 1,
      maxW: widget.maxDimensions?.width,
      maxH: widget.maxDimensions?.height,
      static: widget.isLocked
    }));

  const handleLayoutChange = useCallback((newGridLayout: Layout[]) => {
    // Update widget positions
    const updatedWidgets = layout.widgets.map(widget => {
      const gridItem = newGridLayout.find(item => item.i === widget.id);
      if (gridItem) {
        return {
          ...widget,
          position: { x: gridItem.x, y: gridItem.y },
          dimensions: { width: gridItem.w, height: gridItem.h }
        };
      }
      return widget;
    });

    const updatedLayout: DashboardLayout = {
      ...layout,
      widgets: updatedWidgets,
      lastModified: new Date().toISOString()
    };

    setLayout(updatedLayout);
    LayoutStorage.saveLayout(updatedLayout);
  }, [layout]);

  const handleRemoveWidget = useCallback((widgetId: string) => {
    const updatedWidgets = layout.widgets.map(w =>
      w.id === widgetId ? { ...w, isVisible: false } : w
    );
    
    const updatedLayout = {
      ...layout,
      widgets: updatedWidgets,
      lastModified: new Date().toISOString()
    };
    
    setLayout(updatedLayout);
    LayoutStorage.saveLayout(updatedLayout);
  }, [layout]);

  const handleToggleLock = useCallback((widgetId: string) => {
    const updatedWidgets = layout.widgets.map(w =>
      w.id === widgetId ? { ...w, isLocked: !w.isLocked } : w
    );
    
    const updatedLayout = {
      ...layout,
      widgets: updatedWidgets,
      lastModified: new Date().toISOString()
    };
    
    setLayout(updatedLayout);
    LayoutStorage.saveLayout(updatedLayout);
  }, [layout]);

  return (
    <div className="dashboard-grid-container">
      <GridLayout
        className="dashboard-grid"
        layout={gridLayout}
        cols={12}
        rowHeight={200}
        width={1400}
        margin={[24, 24]}
        containerPadding={[16, 16]}
        isDraggable={true}
        isResizable={true}
        compactType="vertical"
        preventCollision={false}
        onLayoutChange={handleLayoutChange}
        draggableHandle=".widget-drag-handle"
      >
        {layout.widgets
          .filter(w => w.isVisible)
          .map(widget => (
            <div key={widget.id}>
              <Suspense fallback={<WidgetPlaceholder widget={widget} />}>
                <WidgetContainer
                  widget={widget}
                  symbol={currentSymbol}
                  onRemove={handleRemoveWidget}
                  onToggleLock={handleToggleLock}
                />
              </Suspense>
            </div>
          ))}
      </GridLayout>
    </div>
  );
}
```

**`WidgetContainer.tsx`** - Widget Wrapper
```typescript
'use client';

import React from 'react';
import { WidgetConfig } from '@/lib/widgets/types';
import { getWidgetMetadata } from '@/lib/widgets/registry';
import WidgetHeader from './WidgetHeader';

interface WidgetContainerProps {
  widget: WidgetConfig;
  symbol: string;
  onRemove: (widgetId: string) => void;
  onToggleLock: (widgetId: string) => void;
}

export default function WidgetContainer({
  widget,
  symbol,
  onRemove,
  onToggleLock
}: WidgetContainerProps) {
  const metadata = getWidgetMetadata(widget.type);
  
  if (!metadata) {
    return <div>Widget not found: {widget.type}</div>;
  }

  const Component = metadata.component;
  const componentProps = widget.requiredSymbol ? { symbol } : {};

  return (
    <div className="widget-container">
      <WidgetHeader
        widget={widget}
        metadata={metadata}
        onRemove={onRemove}
        onToggleLock={onToggleLock}
      />
      <div className="widget-content">
        <Component {...componentProps} />
      </div>
    </div>
  );
}
```

**`WidgetHeader.tsx`** - Drag Handle & Controls
```typescript
'use client';

import React from 'react';
import { WidgetConfig, WidgetMetadata } from '@/lib/widgets/types';

interface WidgetHeaderProps {
  widget: WidgetConfig;
  metadata: WidgetMetadata;
  onRemove: (widgetId: string) => void;
  onToggleLock: (widgetId: string) => void;
}

export default function WidgetHeader({
  widget,
  metadata,
  onRemove,
  onToggleLock
}: WidgetHeaderProps) {
  return (
    <div className="widget-header">
      <div className="widget-drag-handle" title="Drag to move">
        <span className="drag-icon">⋮⋮</span>
        <span className="widget-icon">{metadata.icon}</span>
        <h3 className="widget-title">{widget.title}</h3>
      </div>
      
      <div className="widget-controls">
        <button
          className={`widget-control-btn lock-btn ${widget.isLocked ? 'locked' : ''}`}
          onClick={() => onToggleLock(widget.id)}
          title={widget.isLocked ? 'Unlock position' : 'Lock position'}
        >
          {widget.isLocked ? '🔒' : '🔓'}
        </button>
        <button
          className="widget-control-btn remove-btn"
          onClick={() => onRemove(widget.id)}
          title="Remove widget"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
```

---

### Phase 3: Widget Management UI (Week 2-3)

#### 3.1 Widget Selector Modal

**Files to Create:**
```
apps/web/src/app/components/Dashboard/
├── WidgetSelector.tsx         # Widget selection modal
├── WidgetGallery.tsx          # Widget gallery view
└── LayoutControls.tsx         # Layout reset/export controls
```

**`WidgetSelector.tsx`** - Add Widget Modal
```typescript
'use client';

import React, { useState } from 'react';
import { WidgetType, WidgetCategory } from '@/lib/widgets/types';
import { getAllWidgets, getWidgetsByCategory } from '@/lib/widgets/registry';

interface WidgetSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onAddWidget: (widgetType: WidgetType) => void;
  hiddenWidgets: WidgetType[];
}

export default function WidgetSelector({
  isOpen,
  onClose,
  onAddWidget,
  hiddenWidgets
}: WidgetSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<WidgetCategory | 'all'>('all');
  
  if (!isOpen) return null;

  const categories: (WidgetCategory | 'all')[] = [
    'all',
    'AI Analysis',
    'Market Data',
    'Charts',
    'News',
    'Fundamentals',
    'Risk Indicators'
  ];

  const availableWidgets = selectedCategory === 'all'
    ? getAllWidgets()
    : getWidgetsByCategory(selectedCategory);

  const widgetsToShow = availableWidgets.filter(w =>
    hiddenWidgets.includes(w.type)
  );

  return (
    <div className="widget-selector-overlay" onClick={onClose}>
      <div className="widget-selector-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🎨 Add Widgets</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="category-tabs">
          {categories.map(category => (
            <button
              key={category}
              className={`category-tab ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="widget-gallery">
          {widgetsToShow.length === 0 ? (
            <div className="empty-state">
              <p>✅ All widgets are already added</p>
            </div>
          ) : (
            widgetsToShow.map(widget => (
              <div key={widget.id} className="widget-card">
                <div className="widget-card-header">
                  <span className="widget-card-icon">{widget.icon}</span>
                  <h3>{widget.title}</h3>
                </div>
                <p className="widget-card-description">{widget.description}</p>
                <div className="widget-card-footer">
                  <span className="widget-category-badge">{widget.category}</span>
                  <button
                    className="add-widget-btn"
                    onClick={() => {
                      onAddWidget(widget.type);
                      onClose();
                    }}
                  >
                    + Add
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
```

#### 3.2 Layout Control Panel

**`LayoutControls.tsx`** - Dashboard Controls
```typescript
'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/lib/widgets/types';
import { LayoutStorage } from '@/lib/widgets/layoutStorage';
import WidgetSelector from './WidgetSelector';

interface LayoutControlsProps {
  layout: DashboardLayout;
  onLayoutChange: (layout: DashboardLayout) => void;
}

export default function LayoutControls({
  layout,
  onLayoutChange
}: LayoutControlsProps) {
  const [isWidgetSelectorOpen, setIsWidgetSelectorOpen] = useState(false);

  const handleResetLayout = () => {
    if (confirm('Are you sure you want to reset to default layout?')) {
      const defaultLayout = LayoutStorage.resetToDefault();
      onLayoutChange(defaultLayout);
      window.location.reload(); // Force refresh
    }
  };

  const handleExportLayout = () => {
    const dataStr = JSON.stringify(layout, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `investie-layout-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleAddWidget = (widgetType: WidgetType) => {
    const updatedWidgets = layout.widgets.map(w =>
      w.type === widgetType ? { ...w, isVisible: true } : w
    );
    
    const updatedLayout = {
      ...layout,
      widgets: updatedWidgets,
      lastModified: new Date().toISOString()
    };
    
    onLayoutChange(updatedLayout);
  };

  const hiddenWidgets = layout.widgets
    .filter(w => !w.isVisible)
    .map(w => w.type);

  return (
    <div className="layout-controls">
      <button
        className="control-btn add-widget-btn"
        onClick={() => setIsWidgetSelectorOpen(true)}
        disabled={hiddenWidgets.length === 0}
      >
        ➕ Add Widget {hiddenWidgets.length > 0 && `(${hiddenWidgets.length})`}
      </button>

      <button
        className="control-btn reset-btn"
        onClick={handleResetLayout}
      >
        🔄 Reset Layout
      </button>

      <button
        className="control-btn export-btn"
        onClick={handleExportLayout}
      >
        💾 Export
      </button>

      <WidgetSelector
        isOpen={isWidgetSelectorOpen}
        onClose={() => setIsWidgetSelectorOpen(false)}
        onAddWidget={handleAddWidget}
        hiddenWidgets={hiddenWidgets}
      />
    </div>
  );
}
```

---

### Phase 4: Bubble Detector Widget (Week 3)

#### 4.1 Bubble Detector Component

**Files to Create:**
```
apps/web/src/app/components/RiskIndicators/
├── BubbleDetector.tsx         # Main component
├── BubbleGauge.tsx           # Visualization gauge
└── BubbleMetrics.tsx         # Detailed metrics
```

**Bubble Detection Logic:**
```typescript
interface BubbleIndicators {
  shillerPE: {
    value: number;
    percentile: number;
    signal: 'low' | 'medium' | 'high' | 'extreme';
  };
  marketCapToGDP: {
    value: number;
    percentile: number;
    signal: 'low' | 'medium' | 'high' | 'extreme';
  };
  volatilityIndex: {
    value: number;
    signal: 'low' | 'medium' | 'high';
  };
  sentimentIndex: {
    value: number; // -100 to +100
    signal: 'fear' | 'neutral' | 'greed' | 'extreme-greed';
  };
  overallRisk: {
    score: number; // 0-100
    level: 'low' | 'moderate' | 'elevated' | 'high' | 'extreme';
    recommendation: string;
  };
}
```

**`BubbleDetector.tsx`** - Main Implementation
```typescript
'use client';

import React from 'react';
import useSWR from 'swr';
import BubbleGauge from './BubbleGauge';
import BubbleMetrics from './BubbleMetrics';

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch bubble data');
  return response.json();
};

export default function BubbleDetector() {
  const { data, error, isLoading } = useSWR<BubbleIndicators>(
    '/api/v1/market/bubble-indicators',
    fetcher,
    { refreshInterval: 300000 } // 5 minutes
  );

  if (isLoading) {
    return <div className="bubble-detector-loading">Loading bubble analysis...</div>;
  }

  if (error || !data) {
    return <div className="bubble-detector-error">Unable to load bubble data</div>;
  }

  return (
    <div className="bubble-detector">
      <div className="bubble-summary">
        <BubbleGauge risk={data.overallRisk} />
        <div className="risk-recommendation">
          <h4>💡 Recommendation</h4>
          <p>{data.overallRisk.recommendation}</p>
        </div>
      </div>
      
      <BubbleMetrics indicators={data} />
    </div>
  );
}
```

#### 4.2 Backend API Implementation

**Files to Create/Modify:**
```
apps/backend/src/market/
├── bubble-indicators.service.ts
└── bubble-indicators.controller.ts
```

**API Endpoint:** `GET /api/v1/market/bubble-indicators`

**Data Sources:**
- Shiller P/E: FRED API (CAPE ratio)
- Market Cap to GDP: World Bank / FRED
- VIX: Yahoo Finance
- Sentiment: Fear & Greed Index API
- Historical percentiles: Internal calculation

---

### Phase 5: Migration & Styling (Week 4)

#### 5.1 Update Main Page

**`apps/web/src/app/page.tsx`** - New Structure
```typescript
'use client';

import React from 'react';
import TickerTape from './components/TradingView/TickerTape';
import Header from './components/Header';
import DashboardGrid from './components/Dashboard/DashboardGrid';
import Footer from './components/Footer';

export default function Home() {
  return (
    <div className="app-container">
      <TickerTape />
      <div className="main-layout">
        <header className="layout-header">
          <Header />
        </header>
        <main className="dashboard-main">
          <DashboardGrid />
        </main>
      </div>
      <Footer />
    </div>
  );
}
```

#### 5.2 Create Dashboard Styles

**Files to Create:**
```
apps/web/src/app/components/Dashboard/
└── dashboard.css
```

**`dashboard.css`** - Complete Styling
```css
/* Dashboard Grid Container */
.dashboard-grid-container {
  max-width: var(--content-max-width);
  margin: 0 auto;
  padding: var(--spacing-md);
  background: #f8fafc;
}

.dashboard-grid {
  position: relative;
}

/* Widget Container */
.widget-container {
  background: #ffffff;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
  transition: all 0.3s ease;
}

.widget-container:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--color-primary);
}

/* Widget Header */
.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-md);
  background: linear-gradient(to bottom, #ffffff, #f8fafc);
  border-bottom: 1px solid var(--color-border-light);
  flex-shrink: 0;
}

.widget-drag-handle {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: move;
  user-select: none;
  flex: 1;
}

.widget-drag-handle:active {
  cursor: grabbing;
}

.drag-icon {
  color: var(--color-text-tertiary);
  font-size: 14px;
  line-height: 1;
}

.widget-icon {
  font-size: 18px;
}

.widget-title {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text-primary);
}

/* Widget Controls */
.widget-controls {
  display: flex;
  gap: var(--spacing-xs);
  align-items: center;
}

.widget-control-btn {
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  padding: 4px 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.widget-control-btn:hover {
  background: var(--color-border-light);
  border-color: var(--color-border);
}

.lock-btn.locked {
  background: #fef3c7;
  border-color: #fbbf24;
}

.remove-btn:hover {
  background: #fee2e2;
  border-color: #ef4444;
  color: #dc2626;
}

/* Widget Content */
.widget-content {
  flex: 1;
  overflow: auto;
  padding: var(--spacing-md);
  background: #ffffff;
}

/* Layout Controls */
.layout-controls {
  position: fixed;
  bottom: var(--spacing-xl);
  right: var(--spacing-xl);
  display: flex;
  gap: var(--spacing-sm);
  z-index: 1000;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: var(--spacing-sm);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--color-border);
}

.control-btn {
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.control-btn:hover:not(:disabled) {
  background: var(--color-primary-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.reset-btn {
  background: var(--color-warning);
}

.export-btn {
  background: var(--color-success);
}

/* Widget Selector Modal */
.widget-selector-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
}

.widget-selector-modal {
  background: white;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  max-width: 900px;
  width: 100%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg) var(--spacing-xl);
  border-bottom: 1px solid var(--color-border);
}

.modal-header h2 {
  margin: 0;
  font-size: var(--font-size-2xl);
  font-weight: 700;
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--color-text-secondary);
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: var(--color-border-light);
  color: var(--color-text-primary);
}

/* Category Tabs */
.category-tabs {
  display: flex;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-xl);
  border-bottom: 1px solid var(--color-border);
  overflow-x: auto;
}

.category-tab {
  padding: var(--spacing-sm) var(--spacing-md);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.category-tab:hover {
  background: var(--color-border-light);
}

.category-tab.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

/* Widget Gallery */
.widget-gallery {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-xl);
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--spacing-lg);
}

.widget-card {
  background: white;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.widget-card:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.widget-card-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.widget-card-icon {
  font-size: 24px;
}

.widget-card-header h3 {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: 600;
}

.widget-card-description {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-relaxed);
  flex: 1;
}

.widget-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: var(--spacing-sm);
}

.widget-category-badge {
  background: var(--color-border-light);
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--color-text-secondary);
}

.add-widget-btn {
  padding: 6px 16px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.add-widget-btn:hover {
  background: var(--color-primary-dark);
  transform: scale(1.05);
}

/* Empty State */
.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: var(--spacing-3xl);
  color: var(--color-text-secondary);
}

/* React Grid Layout Overrides */
.react-grid-item {
  transition: all 200ms ease;
  transition-property: left, top, width, height;
}

.react-grid-item.cssTransforms {
  transition-property: transform, width, height;
}

.react-grid-item.resizing {
  transition: none;
  z-index: 100;
  will-change: width, height;
}

.react-grid-item.react-draggable-dragging {
  transition: none;
  z-index: 100;
  will-change: transform;
  cursor: grabbing !important;
}

.react-grid-item.dropping {
  visibility: hidden;
}

.react-grid-item.react-grid-placeholder {
  background: var(--color-primary);
  opacity: 0.2;
  transition-duration: 100ms;
  z-index: 2;
  border-radius: var(--radius-lg);
}

.react-resizable-handle {
  position: absolute;
  width: 20px;
  height: 20px;
}

.react-resizable-handle-se {
  bottom: 0;
  right: 0;
  cursor: se-resize;
}

.react-resizable-handle-se::after {
  content: '';
  position: absolute;
  right: 3px;
  bottom: 3px;
  width: 8px;
  height: 8px;
  border-right: 2px solid var(--color-border);
  border-bottom: 2px solid var(--color-border);
}

/* Responsive */
@media (max-width: 1024px) {
  .layout-controls {
    bottom: var(--spacing-md);
    right: var(--spacing-md);
    flex-direction: column;
  }
  
  .widget-gallery {
    grid-template-columns: 1fr;
  }
}
```

---

## 🎨 Professional UI/UX Enhancements

### Visual Design Improvements

#### 1. **Drag & Drop Visual Feedback**
- Smooth animations during drag
- Semi-transparent placeholder
- Magnetic grid snapping
- Visual collision detection

#### 2. **Widget States**
- **Normal**: Subtle border, light shadow
- **Hover**: Elevated shadow, primary color border
- **Dragging**: Increased opacity, larger shadow
- **Locked**: Yellow tint, lock icon visible
- **Loading**: Skeleton placeholder with pulse animation

#### 3. **Micro-interactions**
- Smooth transitions (200ms ease)
- Scale effects on button hover
- Haptic feedback (visual bounce)
- Toast notifications for actions

#### 4. **Color Coding by Category**
```typescript
const CATEGORY_COLORS = {
  'AI Analysis': '#3b82f6',      // Blue
  'Market Data': '#10b981',      // Green
  'Charts': '#8b5cf6',           // Purple
  'News': '#f59e0b',             // Amber
  'Fundamentals': '#06b6d4',     // Cyan
  'Risk Indicators': '#ef4444'   // Red
};
```

#### 5. **Accessibility**
- ARIA labels for all interactive elements
- Keyboard navigation support
- Focus indicators
- Screen reader announcements
- High contrast mode support

---

## 📊 Data Flow & State Management

### State Architecture

```typescript
// Global Layout State (Context)
interface DashboardContext {
  layout: DashboardLayout;
  setLayout: (layout: DashboardLayout) => void;
  addWidget: (widgetType: WidgetType) => void;
  removeWidget: (widgetId: string) => void;
  toggleLock: (widgetId: string) => void;
  resetLayout: () => void;
  exportLayout: () => void;
  importLayout: (layout: DashboardLayout) => void;
}

// Create Context
const DashboardContext = createContext<DashboardContext | null>(null);

// Provider Component
export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [layout, setLayout] = useState<DashboardLayout>(() => {
    return LayoutStorage.loadLayout() || DEFAULT_LAYOUT;
  });
  
  // ... methods implementation
  
  return (
    <DashboardContext.Provider value={contextValue}>
      {children}
    </DashboardContext.Provider>
  );
}

// Custom Hook
export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) throw new Error('useDashboard must be used within DashboardProvider');
  return context;
}
```

---

## 🧪 Testing Strategy

### Unit Tests
```typescript
// layoutStorage.test.ts
describe('LayoutStorage', () => {
  it('should save layout to localStorage', () => { ... });
  it('should load layout from localStorage', () => { ... });
  it('should fallback to cookie if localStorage fails', () => { ... });
  it('should validate layout schema', () => { ... });
  it('should reset to default layout', () => { ... });
});

// widgetRegistry.test.ts
describe('WidgetRegistry', () => {
  it('should return all widgets', () => { ... });
  it('should filter by category', () => { ... });
  it('should return widget metadata', () => { ... });
});
```

### Integration Tests
```typescript
// DashboardGrid.test.tsx
describe('DashboardGrid', () => {
  it('should render all visible widgets', () => { ... });
  it('should handle drag and drop', () => { ... });
  it('should save layout on change', () => { ... });
  it('should remove widget', () => { ... });
  it('should lock/unlock widget', () => { ... });
});
```

### E2E Tests (Playwright)
```typescript
test('user can customize dashboard', async ({ page }) => {
  await page.goto('/');
  
  // Drag widget
  await page.dragAndDrop('[data-widget="ai-opinion"]', '[data-grid-x="6"][data-grid-y="0"]');
  
  // Verify new position saved
  await page.reload();
  const widget = await page.locator('[data-widget="ai-opinion"]');
  await expect(widget).toHaveAttribute('data-grid-x', '6');
  
  // Remove widget
  await page.click('[data-widget="ai-opinion"] .remove-btn');
  await expect(widget).not.toBeVisible();
  
  // Add widget back
  await page.click('.add-widget-btn');
  await page.click('[data-widget-type="ai-opinion"] .add-widget-btn');
  await expect(widget).toBeVisible();
  
  // Reset layout
  await page.click('.reset-btn');
  await page.click('text=OK');
  // Verify default layout restored
});
```

---

## 🚀 Deployment & Migration Plan

### Phase 1: Soft Launch (Week 5)
1. Deploy to staging environment
2. Internal testing with team
3. Gather feedback
4. Fix critical bugs

### Phase 2: Beta Release (Week 6)
1. Feature flag: `ENABLE_CUSTOM_LAYOUT`
2. A/B testing: 20% users get new layout
3. Monitor performance metrics
4. Collect user feedback

### Phase 3: Full Rollout (Week 7)
1. Increase to 50% users
2. Monitor error rates
3. Optimize performance
4. Increase to 100%

### Migration Strategy

#### Option A: Automatic Migration (Recommended)
```typescript
function migrateOldLayout(): DashboardLayout {
  // Detect if user has old layout (no customization)
  const hasCustomization = LayoutStorage.loadLayout();
  
  if (!hasCustomization) {
    // First-time users get default layout
    return DEFAULT_LAYOUT;
  }
  
  // Existing users keep their layout
  return hasCustomization;
}
```

#### Option B: Opt-in with Preview
```typescript
// Show banner: "Try our new customizable dashboard!"
// Button: "Preview New Layout"
// Users can switch back and forth
```

---

## 📈 Performance Optimization

### 1. Code Splitting
```typescript
// Lazy load widgets
const BubbleDetector = lazy(() => import('@/components/RiskIndicators/BubbleDetector'));

// Lazy load react-grid-layout
const GridLayout = lazy(() => import('react-grid-layout'));
```

### 2. Virtualization
- For dashboards with many widgets (>20)
- Use `react-window` for off-screen widgets
- Render only visible widgets

### 3. Memoization
```typescript
const MemoizedWidgetContainer = React.memo(WidgetContainer, (prev, next) => {
  return (
    prev.widget.id === next.widget.id &&
    prev.symbol === next.symbol &&
    prev.widget.isLocked === next.widget.isLocked
  );
});
```

### 4. Debounced Save
```typescript
const debouncedSave = useMemo(
  () => debounce((layout: DashboardLayout) => {
    LayoutStorage.saveLayout(layout);
  }, 500),
  []
);
```

---

## 🔒 Security Considerations

### 1. XSS Prevention
- Sanitize all user inputs
- Validate layout JSON schema
- Prevent code injection in widget configs

### 2. Cookie Security
```typescript
document.cookie = `layout=${data}; Secure; SameSite=Strict; Path=/`;
```

### 3. Storage Limits
- LocalStorage: 5MB limit
- Validate layout size before saving
- Compress layout JSON if needed

---

## 📝 Console Log Optimization Plan

### Logs to Remove (Based on console.log analysis)

#### 1. **Debug Logs** (제거)
```typescript
// ❌ Remove these
console.log('🔍 Enhanced Macro Indicators Debug');
console.log('Environment Variables:', {...});
console.log('SWR State:', {...});
console.log('🤖 AI Opinion: Fetching analysis for...');
console.log('🌐 Direct API: Fetching market overview data...');
console.log('📈 Direct API: Fetching ^GSPC data...');
console.log('🔗 [1/5] Trying proxy...');
console.log('🔗 Full URL:', ...);
console.log('⏱️ Request took 221ms');
console.log('📊 Response status:', ...);
console.log('📊 Response headers:', ...);
```

#### 2. **Verbose API Logs** (Production에서만 제거, Development는 유지)
```typescript
// ✅ Use conditional logging
if (process.env.NODE_ENV === 'development') {
  console.log('🔍 Fetching data from:', url);
}
```

#### 3. **Error Logs** (유지하되 개선)
```typescript
// ✅ Keep but improve
console.error('❌ FRED API: Failed to fetch UNRATE:', error);

// ✅ Better: Use error tracking service
import * as Sentry from '@sentry/nextjs';
Sentry.captureException(error);
```

#### 4. **Third-party Logs** (필터링)
```typescript
// TradingView widget logs - cannot control directly
// Solution: Add these to global error handler

// Suppress known warnings
const originalWarn = console.warn;
console.warn = function filterWarnings(...args) {
  const msg = args[0];
  if (typeof msg === 'string' && msg.includes('Invalid environment undefined')) {
    return; // Suppress TradingView warnings
  }
  originalWarn.apply(console, args);
};
```

### Create Centralized Logger

**`apps/web/src/lib/logger.ts`**
```typescript
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private enabledLevels: Set<LogLevel>;
  
  constructor() {
    this.enabledLevels = new Set(['error', 'warn']);
    if (this.isDevelopment) {
      this.enabledLevels.add('info');
      this.enabledLevels.add('debug');
    }
  }
  
  debug(message: string, ...args: any[]) {
    if (this.enabledLevels.has('debug')) {
      console.log(`🔍 ${message}`, ...args);
    }
  }
  
  info(message: string, ...args: any[]) {
    if (this.enabledLevels.has('info')) {
      console.log(`ℹ️ ${message}`, ...args);
    }
  }
  
  warn(message: string, ...args: any[]) {
    if (this.enabledLevels.has('warn')) {
      console.warn(`⚠️ ${message}`, ...args);
    }
  }
  
  error(message: string, error?: Error, ...args: any[]) {
    console.error(`❌ ${message}`, error, ...args);
    // Send to error tracking service
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.captureException(error || new Error(message));
    }
  }
}

export const logger = new Logger();
```

**Usage:**
```typescript
// Before
console.log('🔍 Fetching data...');

// After
import { logger } from '@/lib/logger';
logger.debug('Fetching data...');
```

---

## 📋 Implementation Checklist

### Week 1: Foundation
- [ ] Create widget types & interfaces
- [ ] Implement widget registry
- [ ] Create layout storage system
- [ ] Define default layout configuration
- [ ] Set up testing infrastructure

### Week 2: Drag & Drop
- [ ] Install react-grid-layout
- [ ] Create DashboardGrid component
- [ ] Create WidgetContainer component
- [ ] Create WidgetHeader with drag handle
- [ ] Implement layout persistence
- [ ] Add lock/unlock functionality

### Week 3: Widget Management
- [ ] Create WidgetSelector modal
- [ ] Implement add/remove widgets
- [ ] Create LayoutControls panel
- [ ] Add export/import functionality
- [ ] Implement Bubble Detector widget
- [ ] Create Bubble Detector API endpoint

### Week 4: Polish & Testing
- [ ] Apply professional styling
- [ ] Add animations & transitions
- [ ] Optimize console logging
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Performance optimization
- [ ] Accessibility audit

### Week 5: Launch
- [ ] Deploy to staging
- [ ] Internal QA testing
- [ ] Fix critical bugs
- [ ] Performance monitoring setup
- [ ] Documentation

---

## 🎯 Success Metrics

### User Engagement
- **Widget customization rate**: % of users who modify layout
- **Widgets per dashboard**: Average number of active widgets
- **Layout save frequency**: How often users adjust layout

### Performance
- **Load time**: Time to interactive (target: <2s)
- **Drag performance**: FPS during drag operations (target: 60fps)
- **Memory usage**: Heap size (target: <100MB)

### User Satisfaction
- **NPS Score**: Net Promoter Score
- **Feature usage**: % using customization features
- **Error rate**: JavaScript errors per session

---

## 🔮 Future Enhancements (Phase 2)

### 1. **Layout Templates**
- Pre-designed layouts (Trader, Analyst, Beginner)
- Community-shared layouts
- Layout marketplace

### 2. **Advanced Customization**
- Custom widget themes
- Widget-specific settings
- Dark mode per widget

### 3. **Collaboration Features**
- Share layouts with team
- Real-time collaborative editing
- Layout versioning

### 4. **Mobile Responsive**
- Touch-optimized drag & drop
- Mobile-specific layouts
- Gesture controls

### 5. **AI-Powered Layouts**
- Auto-arrange based on usage
- Personalized recommendations
- Adaptive layouts based on market conditions

---

## 📚 References & Resources

### Libraries
- [react-grid-layout](https://github.com/react-grid-layout/react-grid-layout)
- [dnd-kit](https://dndkit.com/) (alternative)
- [react-window](https://react-window.vercel.app/) (virtualization)

### Design Inspiration
- [Bloomberg Terminal](https://www.bloomberg.com/professional/solution/bloomberg-terminal/)
- [TradingView](https://www.tradingview.com/)
- [Notion](https://www.notion.so/) (layout flexibility)
- [Grafana](https://grafana.com/) (dashboard UX)

### Best Practices
- [Web.dev - Performance](https://web.dev/performance/)
- [React Performance](https://react.dev/learn/render-and-commit)
- [WAI-ARIA Practices](https://www.w3.org/WAI/ARIA/apg/)

---

## ✅ Conclusion

This comprehensive plan provides a roadmap to transform Investie's static dashboard into a fully customizable, drag-and-drop widget system with:

1. ✅ **10 widgets** (9 existing + 1 new Bubble Detector)
2. ✅ **Flexible grid layout** with drag & drop
3. ✅ **Persistent layouts** via cookies & localStorage
4. ✅ **Professional UI/UX** with smooth animations
5. ✅ **Widget management** (add/remove/lock)
6. ✅ **Optimized performance** with code splitting & memoization
7. ✅ **Clean console logs** with centralized logging
8. ✅ **Comprehensive testing** strategy
9. ✅ **Scalable architecture** for future enhancements

**Estimated Timeline**: 5-7 weeks for full implementation
**Estimated Effort**: 1 senior developer (full-time)

Ready for implementation approval! 🚀

