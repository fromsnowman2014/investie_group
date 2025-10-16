/**
 * Sortable Widget Card Component
 * Individual card wrapper with drag-and-drop support
 */

'use client';

import React, { Suspense } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { WidgetConfig } from '@/lib/widgets/types';
import { getWidgetMetadata } from '@/lib/widgets/registry';
import WidgetPlaceholder from './WidgetPlaceholder';

interface SortableWidgetCardProps {
  widget: WidgetConfig;
  symbol: string;
  onRemove: (widgetId: string) => void;
  onToggleLock: (widgetId: string) => void;
}

export default function SortableWidgetCard({
  widget,
  symbol,
  onRemove,
  onToggleLock,
}: SortableWidgetCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: widget.id,
    disabled: widget.isLocked,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const metadata = getWidgetMetadata(widget.type);

  if (!metadata) {
    return (
      <div ref={setNodeRef} style={style} className="widget-card">
        <div className="card-header">
          <div className="card-title-section">
            <span className="widget-icon">⚠️</span>
            <h3 className="card-title">Unknown Widget</h3>
          </div>
        </div>
        <div className="card-content">
          <p>Widget type &quot;{widget.type}&quot; not found in registry.</p>
        </div>
      </div>
    );
  }

  const Component = metadata.component;
  const componentProps = widget.requiredSymbol ? { symbol } : {};

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`widget-card ${isDragging ? 'dragging' : ''} ${widget.isLocked ? 'locked' : ''}`}
      data-widget-id={widget.id}
    >
      <div className="card-header">
        <div
          className="card-title-section"
          {...attributes}
          {...listeners}
          style={{ cursor: widget.isLocked ? 'default' : 'grab' }}
        >
          {!widget.isLocked && (
            <span className="drag-icon" aria-label="Drag to reorder">
              ⋮⋮
            </span>
          )}
          <span className="widget-icon">{widget.icon}</span>
          <h3 className="card-title">{widget.title}</h3>
        </div>

        <div className="card-controls">
          <button
            className={`card-control-btn lock-btn ${widget.isLocked ? 'locked' : ''}`}
            onClick={() => onToggleLock(widget.id)}
            title={widget.isLocked ? 'Unlock widget' : 'Lock widget'}
          >
            {widget.isLocked ? '🔒' : '🔓'}
          </button>
          <button
            className="card-control-btn remove-btn"
            onClick={() => onRemove(widget.id)}
            title="Remove widget"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="card-content">
        <Suspense fallback={<WidgetPlaceholder widget={widget} />}>
          <Component {...componentProps} />
        </Suspense>
      </div>
    </div>
  );
}
