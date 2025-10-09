/**
 * Layout Controls Component
 * Floating control panel for dashboard management
 */

'use client';

import React, { useState } from 'react';
import { DashboardLayout, WidgetType } from '@/lib/widgets/types';
import { LayoutStorage } from '@/lib/widgets/layoutStorage';
import WidgetSelector from './WidgetSelector';

interface LayoutControlsProps {
  layout: DashboardLayout;
  onLayoutChange: (layout: DashboardLayout) => void;
  onAddWidget: (widgetId: string) => void;
  onResetLayout: () => void;
}

export default function LayoutControls({
  layout,
  onLayoutChange,
  onAddWidget,
  onResetLayout
}: LayoutControlsProps) {
  const [isWidgetSelectorOpen, setIsWidgetSelectorOpen] = useState(false);

  const handleResetLayout = () => {
    if (confirm('Are you sure you want to reset to default layout? This cannot be undone.')) {
      onResetLayout();
      if (typeof window !== 'undefined') {
        window.location.reload(); // Force refresh to ensure clean state
      }
    }
  };

  const handleExportLayout = () => {
    LayoutStorage.exportLayout(layout);
  };

  const handleImportLayout = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          const importedLayout = LayoutStorage.importLayout(content);
          if (importedLayout) {
            onLayoutChange(importedLayout);
            alert('Layout imported successfully!');
            if (typeof window !== 'undefined') {
              window.location.reload();
            }
          } else {
            alert('Failed to import layout. Please check the file format.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const hiddenWidgets = layout.widgets
    .filter(w => !w.isVisible)
    .map(w => w.type);

  return (
    <>
      <div className="layout-controls">
        <button
          className="control-btn add-widget-btn"
          onClick={() => setIsWidgetSelectorOpen(true)}
          disabled={hiddenWidgets.length === 0}
          title={hiddenWidgets.length === 0 ? 'All widgets are visible' : 'Add hidden widgets'}
          aria-label="Add widget to dashboard"
        >
          ➕ Add Widget {hiddenWidgets.length > 0 && `(${hiddenWidgets.length})`}
        </button>

        <button
          className="control-btn import-btn"
          onClick={handleImportLayout}
          title="Import layout from file"
          aria-label="Import layout"
        >
          📥 Import
        </button>

        <button
          className="control-btn export-btn"
          onClick={handleExportLayout}
          title="Export current layout to file"
          aria-label="Export layout"
        >
          💾 Export
        </button>

        <button
          className="control-btn reset-btn"
          onClick={handleResetLayout}
          title="Reset to default layout"
          aria-label="Reset layout to default"
        >
          🔄 Reset
        </button>
      </div>

      <WidgetSelector
        isOpen={isWidgetSelectorOpen}
        onClose={() => setIsWidgetSelectorOpen(false)}
        onAddWidget={(widgetType: WidgetType) => onAddWidget(widgetType)}
        hiddenWidgets={hiddenWidgets}
      />
    </>
  );
}
