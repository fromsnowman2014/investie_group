'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

interface FinancialExpandableSectionProps {
  children: React.ReactNode;
  title?: string;
  dataType: 'price' | 'analysis' | 'news' | 'profile' | 'general';
  priority: 'critical' | 'important' | 'supplementary';
  initialHeight?: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  metrics?: {
    confidence?: number;
    lastUpdated?: Date;
    source?: string;
  };
  expandBehavior?: 'click' | 'hover' | 'auto-on-data-change';
  className?: string;
}

const defaultInitialHeight = {
  mobile: 200,
  tablet: 280,
  desktop: 350
};

export default function FinancialExpandableSection({
  children,
  title,
  dataType,
  priority,
  initialHeight = defaultInitialHeight,
  metrics,
  expandBehavior = 'click',
  className = ''
}: FinancialExpandableSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [contentHeight, setContentHeight] = useState<number | null>(null);
  const [shouldShowButton, setShouldShowButton] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const getCurrentInitialHeight = useCallback(() => {
    if (typeof window === 'undefined') return initialHeight.desktop;
    
    const width = window.innerWidth;
    if (width <= 767) return initialHeight.mobile;
    if (width <= 1023) return initialHeight.tablet;
    return initialHeight.desktop;
  }, [initialHeight]);

  // Calculate if content exceeds initial height
  useEffect(() => {
    if (contentRef.current) {
      const fullHeight = contentRef.current.scrollHeight;
      setContentHeight(fullHeight);
      
      // Check if content exceeds current breakpoint's initial height
      const currentInitialHeight = getCurrentInitialHeight();
      setShouldShowButton(fullHeight > currentInitialHeight);
    }
  }, [children, initialHeight, getCurrentInitialHeight]);

  const getPriorityClasses = () => {
    switch (priority) {
      case 'critical':
        return 'expandable-critical-priority border-l-4 border-blue-600 bg-blue-50/30';
      case 'important':
        return 'expandable-important-priority border-l-3 border-amber-500 bg-amber-50/20';
      case 'supplementary':
        return 'expandable-supplementary-priority border-l-2 border-gray-400 bg-gray-50/10';
      default:
        return '';
    }
  };

  const getDataTypeIcon = () => {
    switch (dataType) {
      case 'price': return '💰';
      case 'analysis': return '🤖';
      case 'news': return '📰';
      case 'profile': return '🏢';
      default: return '📊';
    }
  };

  const getConfidenceColor = () => {
    if (!metrics?.confidence) return '';
    if (metrics.confidence >= 0.8) return 'text-green-600';
    if (metrics.confidence >= 0.6) return 'text-amber-600';
    return 'text-gray-500';
  };

  const formatLastUpdated = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const handleToggle = () => {
    if (expandBehavior === 'click') {
      setIsExpanded(!isExpanded);
    }
  };

  const handleMouseEnter = () => {
    if (expandBehavior === 'hover') {
      setIsExpanded(true);
    }
  };

  const handleMouseLeave = () => {
    if (expandBehavior === 'hover') {
      setIsExpanded(false);
    }
  };

  const currentInitialHeight = getCurrentInitialHeight();

  return (
    <div 
      className={`financial-expandable-section ${getPriorityClasses()} ${className} rounded-lg overflow-hidden transition-all duration-300 ease-in-out`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Header with metadata */}
      {(title || metrics) && (
        <div className="expandable-header bg-gray-50 px-3 py-2 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {title && (
              <div className="flex items-center gap-2">
                <span className="text-sm">{getDataTypeIcon()}</span>
                <h4 className="financial-title text-sm font-medium text-gray-900 m-0">
                  {title}
                </h4>
              </div>
            )}
            
            {metrics && (
              <div className="flex items-center gap-3 text-xs text-gray-500">
                {metrics.confidence && (
                  <span className={`font-medium ${getConfidenceColor()}`}>
                    {Math.round(metrics.confidence * 100)}%
                  </span>
                )}
                {metrics.lastUpdated && (
                  <span className="metadata-text">
                    {formatLastUpdated(metrics.lastUpdated)}
                  </span>
                )}
                {metrics.source && (
                  <span className="metadata-text truncate max-w-20">
                    {metrics.source}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content Area */}
      <div 
        className="expandable-content relative overflow-hidden transition-all duration-300 ease-in-out"
        style={{ 
          maxHeight: isExpanded ? `${contentHeight}px` : `${currentInitialHeight}px`
        }}
      >
        <div ref={contentRef} className="p-3">
          {children}
        </div>
        
        {/* Fade gradient when collapsed */}
        {!isExpanded && shouldShowButton && (
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
        )}
      </div>

      {/* Expand/Collapse Button */}
      {shouldShowButton && (
        <div className="expandable-footer border-t border-gray-100 bg-white">
          <button
            onClick={handleToggle}
            className="w-full px-3 py-2 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <span>
              {isExpanded ? 'Show Less' : 'Show More'}
            </span>
            <svg
              className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}