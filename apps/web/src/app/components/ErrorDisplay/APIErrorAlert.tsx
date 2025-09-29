'use client';

import React from 'react';

interface APIError {
  error: string;
  message: string;
  details?: string;
  errorType: string;
  symbol?: string;
}

interface APIErrorAlertProps {
  error: APIError;
  title?: string;
  className?: string;
}

export default function APIErrorAlert({ error, title, className = '' }: APIErrorAlertProps) {
  const getErrorIcon = () => {
    switch (error.errorType) {
      case 'CONFIGURATION_ERROR':
        return '🔑';
      case 'RATE_LIMIT_ERROR':
        return '⏱️';
      default:
        return '⚠️';
    }
  };

  const getErrorTitle = () => {
    if (title) return title;
    
    switch (error.errorType) {
      case 'CONFIGURATION_ERROR':
        return 'API Configuration Required';
      case 'RATE_LIMIT_ERROR':
        return 'API Rate Limit Reached';
      default:
        return 'Service Unavailable';
    }
  };

  const getErrorDescription = () => {
    switch (error.errorType) {
      case 'CONFIGURATION_ERROR':
        return 'This feature requires API keys to be configured on the server.';
      case 'RATE_LIMIT_ERROR':
        return 'API rate limit has been exceeded. Please try again later.';
      default:
        return error.message || 'The service is temporarily unavailable.';
    }
  };

  return (
    <div className={`api-error-alert ${className}`}>
      <div className="error-content">
        <div className="error-header">
          <div className="error-icon">{getErrorIcon()}</div>
          <div className="error-info">
            <h3 className="error-title">{getErrorTitle()}</h3>
            <p className="error-description">{getErrorDescription()}</p>
          </div>
        </div>
        
        {error.details && (
          <div className="error-details">
            <details>
              <summary>Technical Details</summary>
              <p>{error.details}</p>
              {error.symbol && <p>Symbol: {error.symbol}</p>}
            </details>
          </div>
        )}
      </div>

      <style jsx>{`
        .api-error-alert {
          background: linear-gradient(135deg, #fff1f1 0%, #ffe6e6 100%);
          border: 1px solid #ffcccc;
          border-radius: 12px;
          padding: 20px;
          margin: 16px 0;
          box-shadow: 0 2px 8px rgba(220, 38, 38, 0.1);
        }

        .error-content {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .error-header {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .error-icon {
          font-size: 24px;
          margin-top: 2px;
        }

        .error-info {
          flex: 1;
        }

        .error-title {
          margin: 0 0 8px 0;
          font-size: 16px;
          font-weight: 600;
          color: #dc2626;
        }

        .error-description {
          margin: 0;
          font-size: 14px;
          color: #7f1d1d;
          line-height: 1.5;
        }

        .error-details {
          border-top: 1px solid #fecaca;
          padding-top: 12px;
        }

        .error-details details {
          cursor: pointer;
        }

        .error-details summary {
          font-weight: 500;
          color: #991b1b;
          font-size: 13px;
          margin-bottom: 8px;
        }

        .error-details p {
          margin: 4px 0;
          font-size: 12px;
          color: #7f1d1d;
          font-family: monospace;
          background: rgba(0, 0, 0, 0.05);
          padding: 8px;
          border-radius: 4px;
        }

        @media (max-width: 768px) {
          .api-error-alert {
            margin: 12px 0;
            padding: 16px;
          }

          .error-title {
            font-size: 15px;
          }

          .error-description {
            font-size: 13px;
          }
        }
      `}</style>
    </div>
  );
}

// Utility function to check if error is an API error
export function isAPIError(error: unknown): error is APIError {
  return !!(error && 
         typeof error === 'object' && 
         'error' in error && 
         'errorType' in error &&
         'message' in error);
}
