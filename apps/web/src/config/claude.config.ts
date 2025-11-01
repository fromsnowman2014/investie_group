/**
 * Centralized Claude API Configuration
 *
 * This file manages all Claude model versions used across the application.
 * Update model versions here to maintain consistency across all API routes.
 */

/**
 * Claude Model Versions
 *
 * Available models as of 2024:
 * - claude-3-5-sonnet-20240620: Latest stable Claude 3.5 Sonnet (recommended)
 * - claude-3-opus-20240229: Most capable Claude 3 model
 * - claude-3-sonnet-20240229: Balanced performance/cost
 * - claude-3-haiku-20240307: Fastest, most cost-effective
 *
 * Sonnet 4.5 models (if available):
 * - claude-sonnet-4-5-20250929: Latest Sonnet 4.5
 */

export const CLAUDE_MODELS = {
  // Primary model for general analysis (stable, recommended)
  DEFAULT: 'claude-3-5-sonnet-20240620',

  // Advanced model for complex analysis (if Sonnet 4.5 is available)
  ADVANCED: 'claude-sonnet-4-5-20250929',

  // Fast model for simple tasks
  FAST: 'claude-3-haiku-20240307',

  // Most capable model for critical analysis
  PREMIUM: 'claude-3-opus-20240229',
} as const;

/**
 * Get the Claude model to use for a specific feature
 *
 * Features:
 * - 'company-analysis': AI company business analysis
 * - 'investment-opinion': AI investment recommendations
 * - 'bubble-detection': Market bubble detection
 * - 'default': General purpose analysis
 */
export function getClaudeModel(feature: 'company-analysis' | 'investment-opinion' | 'bubble-detection' | 'default' = 'default'): string {
  // Allow environment variable override
  const envModel = process.env.CLAUDE_MODEL;
  if (envModel) {
    console.log(`🔧 Using CLAUDE_MODEL from environment: ${envModel}`);
    return envModel;
  }

  // Feature-specific model selection
  switch (feature) {
    case 'bubble-detection':
      // Use advanced model for complex market analysis (if available)
      // Fall back to default if Sonnet 4.5 is not available
      return CLAUDE_MODELS.ADVANCED;

    case 'company-analysis':
    case 'investment-opinion':
    case 'default':
    default:
      // Use stable Sonnet 3.5 for most features
      return CLAUDE_MODELS.DEFAULT;
  }
}

/**
 * Get the Claude API key from environment variables
 */
export function getClaudeApiKey(): string | undefined {
  return process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
}

/**
 * Claude API configuration
 */
export const CLAUDE_API_CONFIG = {
  baseUrl: 'https://api.anthropic.com/v1/messages',
  version: '2023-06-01',
  defaultMaxTokens: 1024,
  defaultTemperature: 0.3,
} as const;