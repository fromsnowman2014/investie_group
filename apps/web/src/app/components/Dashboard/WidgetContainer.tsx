/**
 * Widget Container Component
 * Wrapper for individual dashboard widgets with header and content
 */

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
    return (
      <div className="widget-container widget-error">
        <div className="widget-header">
          <div className="widget-drag-handle">
            <span className="widget-icon">⚠️</span>
            <h3 className="widget-title">Unknown Widget</h3>
          </div>
        </div>
        <div className="widget-content">
          <p>Widget type &quot;{widget.type}&quot; not found in registry.</p>
        </div>
      </div>
    );
  }

  const Component = metadata.component;
  const componentProps = widget.requiredSymbol ? { symbol } : {};

  return (
    <div className="widget-container" data-widget-id={widget.id}>
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
