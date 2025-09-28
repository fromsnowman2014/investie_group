'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Error caught by ErrorBoundary${this.props.componentName ? ` in ${this.props.componentName}` : ''}:`, error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      // You can integrate with error reporting services like Sentry here
      console.error('Production error:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        componentName: this.props.componentName
      });
    }
  }

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="error-boundary">
          <div className="error-content">
            <div className="error-icon">⚠️</div>
            <h3>Something went wrong</h3>
            <p>
              {this.props.componentName 
                ? `There was an error loading the ${this.props.componentName} component.`
                : 'There was an unexpected error.'
              }
            </p>
            <button 
              className="retry-button"
              onClick={() => this.setState({ hasError: false, error: undefined, errorInfo: undefined })}
            >
              Try Again
            </button>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="error-details">
                <summary>Error Details (Development Only)</summary>
                <pre className="error-stack">
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.error.stack}
                  {this.state.errorInfo?.componentStack && (
                    <>
                      {'\n\nComponent Stack:'}
                      {this.state.errorInfo.componentStack}
                    </>
                  )}
                </pre>
              </details>
            )}
          </div>

          <style jsx>{`
            .error-boundary {
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 200px;
              padding: 20px;
              background: #fef2f2;
              border: 1px solid #fecaca;
              border-radius: 12px;
              margin: 16px 0;
            }

            .error-content {
              text-align: center;
              max-width: 500px;
            }

            .error-icon {
              font-size: 48px;
              margin-bottom: 16px;
            }

            .error-content h3 {
              font-size: 18px;
              font-weight: 600;
              color: #991b1b;
              margin-bottom: 12px;
            }

            .error-content p {
              font-size: 14px;
              color: #7f1d1d;
              margin-bottom: 20px;
              line-height: 1.5;
            }

            .retry-button {
              background: #dc2626;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 8px;
              font-size: 14px;
              font-weight: 500;
              cursor: pointer;
              transition: background-color 0.2s;
            }

            .retry-button:hover {
              background: #b91c1c;
            }

            .error-details {
              margin-top: 20px;
              text-align: left;
              background: #f9fafb;
              border: 1px solid #e5e7eb;
              border-radius: 6px;
              padding: 12px;
            }

            .error-details summary {
              font-size: 12px;
              font-weight: 600;
              color: #374151;
              cursor: pointer;
              margin-bottom: 8px;
            }

            .error-stack {
              font-size: 11px;
              color: #6b7280;
              white-space: pre-wrap;
              word-break: break-word;
              max-height: 200px;
              overflow-y: auto;
              background: white;
              padding: 8px;
              border-radius: 4px;
              border: 1px solid #e5e7eb;
            }

            @media (max-width: 768px) {
              .error-boundary {
                min-height: 150px;
                padding: 16px;
                margin: 12px 0;
              }

              .error-icon {
                font-size: 36px;
                margin-bottom: 12px;
              }

              .error-content h3 {
                font-size: 16px;
              }

              .error-content p {
                font-size: 13px;
              }

              .retry-button {
                padding: 8px 16px;
                font-size: 13px;
              }
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}

// Specialized Error Boundary for TradingView widgets
export function TradingViewErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      componentName="TradingView Widget"
      fallback={
        <div className="tradingview-error-fallback">
          <div className="error-icon">📊</div>
          <h4>Chart Temporarily Unavailable</h4>
          <p>The TradingView chart widget encountered an issue. Please refresh the page to try again.</p>
          <small>This is usually caused by network connectivity or TradingView service issues.</small>
          <style jsx>{`
            .tradingview-error-fallback {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 400px;
              padding: 20px;
              background: #f8f9fa;
              border: 1px solid #e9ecef;
              border-radius: 8px;
              text-align: center;
            }
            .error-icon {
              font-size: 48px;
              margin-bottom: 16px;
              opacity: 0.6;
            }
            .tradingview-error-fallback h4 {
              color: #495057;
              margin-bottom: 8px;
              font-size: 18px;
              font-weight: 600;
            }
            .tradingview-error-fallback p {
              color: #6c757d;
              max-width: 300px;
              margin-bottom: 8px;
              line-height: 1.5;
            }
            .tradingview-error-fallback small {
              color: #adb5bd;
              font-size: 12px;
            }
          `}</style>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

export default ErrorBoundary;