/**
 * Environment Configuration for Direct API Approach
 * Simplified configuration since we no longer use Supabase or external services
 */

interface EnvironmentConfig {
  debugMode: boolean;
  nodeEnv: string;
  source: 'environment' | 'default';
  timestamp: string;
}

/**
 * Get environment configuration for direct API approach
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  const processAvailable = typeof process !== 'undefined';

  const config: EnvironmentConfig = {
    debugMode: processAvailable ? process.env.NEXT_PUBLIC_DEBUG_MODE === 'true' : false,
    nodeEnv: processAvailable ? process.env.NODE_ENV || 'development' : 'development',
    source: processAvailable ? 'environment' : 'default',
    timestamp: new Date().toISOString()
  };

  // Light debugging for development
  if (config.debugMode) {
    console.log('🔧 Environment Config:', {
      nodeEnv: config.nodeEnv,
      debugMode: config.debugMode,
      source: config.source
    });
  }

  return config;
}

/**
 * Check if we're in development mode
 */
export function isDevelopment(): boolean {
  const config = getEnvironmentConfig();
  return config.nodeEnv === 'development';
}

/**
 * Check if debug mode is enabled
 */
export function isDebugMode(): boolean {
  const config = getEnvironmentConfig();
  return config.debugMode;
}

/**
 * Get debug information for troubleshooting
 */
export function getEnvironmentDebugInfo() {
  const config = getEnvironmentConfig();
  return {
    nodeEnv: config.nodeEnv,
    debugMode: config.debugMode,
    source: config.source,
    timestamp: config.timestamp,
    usingDirectAPI: true
  };
}