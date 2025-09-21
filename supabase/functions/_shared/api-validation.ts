// API Response Validation and Error Handling Utilities
// Professional-grade validation for market data APIs

export interface ApiValidationResult {
  isValid: boolean;
  isFresh: boolean;
  hasRateLimit: boolean;
  errorType?: 'rate_limit' | 'stale_data' | 'invalid_format' | 'api_error';
  errorMessage?: string;
  warningMessage?: string;
  dataAge?: number; // hours
  fallbackRecommended: boolean;
}

export interface DataFreshnessConfig {
  maxAgeHours: number;
  warnAfterHours: number;
  source: string;
}

/**
 * Validates Alpha Vantage API response for rate limits and data quality
 */
export function validateAlphaVantageResponse(
  data: any,
  config: DataFreshnessConfig
): ApiValidationResult {
  // Check for rate limit messages
  if (data['Note'] && data['Note'].includes('API call frequency')) {
    return {
      isValid: false,
      isFresh: false,
      hasRateLimit: true,
      errorType: 'rate_limit',
      errorMessage: 'Alpha Vantage API rate limit exceeded (25 calls/day)',
      fallbackRecommended: true
    };
  }

  // Check for demo key message
  if (data['Information'] && data['Information'].includes('demo')) {
    return {
      isValid: false,
      isFresh: false,
      hasRateLimit: false,
      errorType: 'api_error',
      errorMessage: 'Using demo API key - limited functionality',
      fallbackRecommended: true
    };
  }

  // Check for invalid response format
  const quote = data['Global Quote'];
  if (!quote) {
    return {
      isValid: false,
      isFresh: false,
      hasRateLimit: false,
      errorType: 'invalid_format',
      errorMessage: 'Invalid Alpha Vantage response format',
      fallbackRecommended: true
    };
  }

  // Validate data freshness
  const latestTradingDay = quote['07. latest trading day'];
  if (!latestTradingDay) {
    return {
      isValid: false,
      isFresh: false,
      hasRateLimit: false,
      errorType: 'invalid_format',
      errorMessage: 'Missing trading day timestamp',
      fallbackRecommended: true
    };
  }

  const freshnessResult = validateDataFreshness(latestTradingDay, config);

  return {
    isValid: true,
    isFresh: freshnessResult.isFresh,
    hasRateLimit: false,
    dataAge: freshnessResult.dataAge,
    warningMessage: freshnessResult.warningMessage,
    fallbackRecommended: !freshnessResult.isFresh && freshnessResult.dataAge > config.maxAgeHours
  };
}

/**
 * Validates data freshness based on timestamp
 */
export function validateDataFreshness(
  timestamp: string,
  config: DataFreshnessConfig
): {
  isFresh: boolean;
  dataAge: number;
  warningMessage?: string;
} {
  const dataDate = new Date(timestamp);
  const now = new Date();
  const ageInHours = (now.getTime() - dataDate.getTime()) / (1000 * 60 * 60);

  // Account for weekends and market hours
  const isWeekend = now.getDay() === 0 || now.getDay() === 6;
  const isFriday = now.getDay() === 5;
  const isAfterMarketHours = now.getHours() >= 16; // After 4 PM EST

  let effectiveMaxAge = config.maxAgeHours;

  // Extend acceptable age during weekends
  if (isWeekend) {
    effectiveMaxAge = 72; // 3 days for weekend
  } else if (isFriday && isAfterMarketHours) {
    effectiveMaxAge = 24; // 1 day for Friday after hours
  }

  const isFresh = ageInHours <= effectiveMaxAge;

  let warningMessage: string | undefined;
  if (ageInHours > config.warnAfterHours) {
    if (isWeekend) {
      warningMessage = `Market data is from last trading day (${Math.round(ageInHours)}h ago) - markets closed for weekend`;
    } else {
      warningMessage = `Market data is ${Math.round(ageInHours)} hours old - potentially stale`;
    }
  }

  return {
    isFresh,
    dataAge: ageInHours,
    warningMessage
  };
}

/**
 * Generate user-friendly error messages for UI display
 */
export function generateUserFriendlyMessage(result: ApiValidationResult): {
  status: 'success' | 'warning' | 'error';
  title: string;
  message: string;
  action?: string;
} {
  if (result.hasRateLimit) {
    return {
      status: 'error',
      title: 'API Rate Limit Exceeded',
      message: 'Alpha Vantage API daily limit reached (25 calls). Using backup data source.',
      action: 'Upgrade to Premium API key for unlimited access'
    };
  }

  if (result.errorType === 'api_error') {
    return {
      status: 'warning',
      title: 'API Key Issue',
      message: 'Using demo API key with limited functionality. Real-time data may be unavailable.',
      action: 'Configure valid Alpha Vantage API key'
    };
  }

  if (!result.isFresh && result.dataAge) {
    if (result.dataAge > 72) {
      return {
        status: 'error',
        title: 'Stale Market Data',
        message: `Market data is ${Math.round(result.dataAge)} hours old. Data may be significantly outdated.`,
        action: 'Check API connectivity and configuration'
      };
    } else {
      return {
        status: 'warning',
        title: 'Market Data Notice',
        message: result.warningMessage || 'Using last available trading day data',
        action: 'Data will refresh when markets reopen'
      };
    }
  }

  return {
    status: 'success',
    title: 'Market Data Current',
    message: 'Real-time market data successfully retrieved'
  };
}

/**
 * Enhanced API call wrapper with comprehensive validation
 */
export async function validateAndProcessApiResponse<T>(
  apiCall: () => Promise<any>,
  validator: (data: any, config: DataFreshnessConfig) => ApiValidationResult,
  config: DataFreshnessConfig,
  fallbackFunction?: () => Promise<T | null>
): Promise<{
  data: T | null;
  validation: ApiValidationResult;
  userMessage: ReturnType<typeof generateUserFriendlyMessage>;
}> {
  try {
    const rawData = await apiCall();
    const validation = validator(rawData, config);
    const userMessage = generateUserFriendlyMessage(validation);

    // Log validation results
    if (validation.hasRateLimit) {
      console.warn(`🚫 Rate Limit: ${validation.errorMessage}`);
    } else if (validation.warningMessage) {
      console.warn(`⚠️ Data Warning: ${validation.warningMessage}`);
    } else if (validation.isValid && validation.isFresh) {
      console.log(`✅ Data Valid: Fresh data from ${config.source}`);
    }

    // Use fallback if recommended and available
    if (validation.fallbackRecommended && fallbackFunction) {
      console.log(`🔄 Using fallback data source due to: ${validation.errorMessage || validation.warningMessage}`);
      const fallbackData = await fallbackFunction();
      return {
        data: fallbackData,
        validation: {
          ...validation,
          warningMessage: `${validation.errorMessage || validation.warningMessage} - Using backup data source`
        },
        userMessage: {
          ...userMessage,
          message: `${userMessage.message} Using backup data source.`
        }
      };
    }

    return {
      data: validation.isValid ? rawData : null,
      validation,
      userMessage
    };

  } catch (error) {
    const errorValidation: ApiValidationResult = {
      isValid: false,
      isFresh: false,
      hasRateLimit: false,
      errorType: 'api_error',
      errorMessage: `API call failed: ${error.message}`,
      fallbackRecommended: true
    };

    // Try fallback if available
    if (fallbackFunction) {
      console.warn(`⚠️ API Error: ${error.message}, trying fallback`);
      const fallbackData = await fallbackFunction();
      return {
        data: fallbackData,
        validation: errorValidation,
        userMessage: {
          status: 'warning',
          title: 'API Service Issue',
          message: `Primary API unavailable: ${error.message}. Using backup data source.`,
          action: 'Check API service status'
        }
      };
    }

    return {
      data: null,
      validation: errorValidation,
      userMessage: {
        status: 'error',
        title: 'Data Unavailable',
        message: `Unable to fetch market data: ${error.message}`,
        action: 'Please try again later'
      }
    };
  }
}