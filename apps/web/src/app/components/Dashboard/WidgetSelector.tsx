/**
 * Widget Selector Component
 * Modal interface for adding widgets to the dashboard
 */

'use client';

import React, { useState } from 'react';
import { WidgetType, WidgetCategory } from '@/lib/widgets/types';
import { getAllWidgets, getWidgetsByCategory, getAllCategories } from '@/lib/widgets/registry';

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

  const categories: (WidgetCategory | 'all')[] = ['all', ...getAllCategories()];

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
          <button
            className="close-btn"
            onClick={onClose}
            aria-label="Close widget selector"
          >
            ✕
          </button>
        </div>

        <div className="category-tabs">
          {categories.map(category => (
            <button
              key={category}
              className={`category-tab ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
              aria-pressed={selectedCategory === category}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="widget-gallery">
          {widgetsToShow.length === 0 ? (
            <div className="empty-state">
              <p>✅ All widgets in this category are already added</p>
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
                    aria-label={`Add ${widget.title} widget`}
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
