/**
 * Dashboard Grid Component
 * Main grid container for draggable and resizable widgets
 */

'use client';

import React, { useState, useCallback, Suspense, useEffect } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import './dashboard.css';
import { WidgetConfig, DashboardLayout } from '@/lib/widgets/types';
import { LayoutStorage } from '@/lib/widgets/layoutStorage';
import { DEFAULT_LAYOUT } from '@/lib/widgets/defaultLayout';
import WidgetContainer from './WidgetContainer';
import WidgetPlaceholder from './WidgetPlaceholder';
import LayoutControls from './LayoutControls';
import { useStock } from '../StockProvider';

const ResponsiveGridLayout = WidthProvider(Responsive);

export default function DashboardGrid() {
  const { currentSymbol } = useStock();
  const [layout, setLayout] = useState<DashboardLayout>(() => {
    // Load from storage on client side only
    if (typeof window !== 'undefined') {
      return LayoutStorage.loadLayout() || DEFAULT_LAYOUT;
    }
    return DEFAULT_LAYOUT;
  });

  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted before rendering grid
  useEffect(() => {
    setMounted(true);
  }, []);

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
    // Update widget positions based on new layout
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

    const updatedLayout: DashboardLayout = {
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

    const updatedLayout: DashboardLayout = {
      ...layout,
      widgets: updatedWidgets,
      lastModified: new Date().toISOString()
    };

    setLayout(updatedLayout);
    LayoutStorage.saveLayout(updatedLayout);
  }, [layout]);

  const handleAddWidget = useCallback((widgetId: string) => {
    const updatedWidgets = layout.widgets.map(w =>
      w.id === widgetId ? { ...w, isVisible: true } : w
    );

    const updatedLayout: DashboardLayout = {
      ...layout,
      widgets: updatedWidgets,
      lastModified: new Date().toISOString()
    };

    setLayout(updatedLayout);
    LayoutStorage.saveLayout(updatedLayout);
  }, [layout]);

  const handleResetLayout = useCallback(() => {
    const defaultLayout = LayoutStorage.resetToDefault();
    setLayout(defaultLayout);
  }, []);

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="dashboard-grid-container">
        <div className="dashboard-loading">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-grid-container">
      <ResponsiveGridLayout
        className="dashboard-grid"
        layouts={{ lg: gridLayout }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={layout.gridConfig.rowHeight}
        margin={[layout.gridConfig.gap, layout.gridConfig.gap]}
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
            <div key={widget.id} data-grid={gridLayout.find(g => g.i === widget.id)}>
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
      </ResponsiveGridLayout>

      <LayoutControls
        layout={layout}
        onLayoutChange={setLayout}
        onAddWidget={handleAddWidget}
        onResetLayout={handleResetLayout}
      />
    </div>
  );
}
