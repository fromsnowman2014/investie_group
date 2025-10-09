/**
 * Widget Header Component
 * Displays widget title with drag handle and control buttons
 */

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
          aria-label={widget.isLocked ? 'Unlock widget position' : 'Lock widget position'}
        >
          {widget.isLocked ? '🔒' : '🔓'}
        </button>
        <button
          className="widget-control-btn remove-btn"
          onClick={() => onRemove(widget.id)}
          title="Remove widget"
          aria-label="Remove widget from dashboard"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
