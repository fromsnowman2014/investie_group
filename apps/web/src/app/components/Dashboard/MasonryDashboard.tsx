/**
 * Masonry Dashboard Component
 * Card-based layout with automatic height adjustment and drag-to-reorder
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { DashboardLayout } from '@/lib/widgets/types';
import { LayoutStorage } from '@/lib/widgets/layoutStorage';
import { DEFAULT_LAYOUT } from '@/lib/widgets/defaultLayout';
import SortableWidgetCard from './SortableWidgetCard';
import LayoutControls from './LayoutControls';
import { useStock } from '../StockProvider';
import './masonry-dashboard.css';

export default function MasonryDashboard() {
  const { currentSymbol } = useStock();
  const [layout, setLayout] = useState<DashboardLayout>(() => {
    if (typeof window !== 'undefined') {
      return LayoutStorage.loadLayout() || DEFAULT_LAYOUT;
    }
    return DEFAULT_LAYOUT;
  });

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Setup drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required to activate drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Get visible widgets sorted by order
  const visibleWidgets = layout.widgets
    .filter(w => w.isVisible)
    .sort((a, b) => a.order - b.order);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = visibleWidgets.findIndex(w => w.id === active.id);
      const newIndex = visibleWidgets.findIndex(w => w.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedVisible = arrayMove(visibleWidgets, oldIndex, newIndex);

        // Update order property for all visible widgets
        const updatedWidgets = layout.widgets.map(widget => {
          if (!widget.isVisible) return widget;

          const newOrder = reorderedVisible.findIndex(w => w.id === widget.id);
          return { ...widget, order: newOrder + 1 };
        });

        const updatedLayout: DashboardLayout = {
          ...layout,
          widgets: updatedWidgets,
          lastModified: new Date().toISOString(),
        };

        setLayout(updatedLayout);
        LayoutStorage.saveLayout(updatedLayout);
      }
    }
  }, [layout, visibleWidgets]);

  const handleRemoveWidget = useCallback((widgetId: string) => {
    const updatedWidgets = layout.widgets.map(w =>
      w.id === widgetId ? { ...w, isVisible: false } : w
    );

    const updatedLayout: DashboardLayout = {
      ...layout,
      widgets: updatedWidgets,
      lastModified: new Date().toISOString(),
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
      lastModified: new Date().toISOString(),
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
      lastModified: new Date().toISOString(),
    };

    setLayout(updatedLayout);
    LayoutStorage.saveLayout(updatedLayout);
  }, [layout]);

  const handleResetLayout = useCallback(() => {
    const defaultLayout = LayoutStorage.resetToDefault();
    setLayout(defaultLayout);
  }, []);

  if (!mounted) {
    return (
      <div className="masonry-dashboard-container">
        <div className="dashboard-loading">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="masonry-dashboard-container">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={visibleWidgets.map(w => w.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="masonry-grid">
            {visibleWidgets.map(widget => (
              <SortableWidgetCard
                key={widget.id}
                widget={widget}
                symbol={currentSymbol}
                onRemove={handleRemoveWidget}
                onToggleLock={handleToggleLock}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <LayoutControls
        layout={layout}
        onLayoutChange={setLayout}
        onAddWidget={handleAddWidget}
        onResetLayout={handleResetLayout}
      />
    </div>
  );
}
