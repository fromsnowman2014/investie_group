/**
 * Widget Placeholder Component
 * Loading placeholder for lazy-loaded widgets
 */

'use client';

import React from 'react';
import { WidgetConfig } from '@/lib/widgets/types';

interface WidgetPlaceholderProps {
  widget: WidgetConfig;
}

export default function WidgetPlaceholder({ widget }: WidgetPlaceholderProps) {
  return (
    <div className="widget-placeholder">
      <div className="placeholder-header">
        <span className="placeholder-icon">{widget.icon}</span>
        <div className="placeholder-title">{widget.title}</div>
      </div>
      <div className="placeholder-content">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading widget...</p>
      </div>
    </div>
  );
}
