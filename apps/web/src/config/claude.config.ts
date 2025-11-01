/**
 * Centralized Claude API Configuration
 *
 * This file manages all Claude model versions used across the application.
 * Update model versions here to maintain consistency across all API routes.
 *
 * Official Documentation: https://docs.claude.com/en/docs/about-claude/models
 * Last Updated: 2025-11-01
 */

/**
 * Claude Model Versions (Current as of November 2025)
 *
 * Latest Models (Recommended):
 * - claude-sonnet-4-5-20250929: Latest Sonnet 4.5 (best balance of intelligence, speed, cost)
 * - claude-haiku-4-5-20251001: Latest Haiku 4.5 (fastest, most cost-effective)
 * - claude-opus-4-1-20250805: Latest Opus 4.1 (most capable)
 *
 * Legacy Models (Still Available):
 * - claude-sonnet-4-20250514: Claude Sonnet 4
 * - claude-3-7-sonnet-20250219: Claude Sonnet 3.7
 * - claude-3-5-haiku-20241022: Claude Haiku 3.5
 * - claude-3-haiku-20240307: Claude Haiku 3
 *
 * Note: Claude 3.5 Sonnet has been superseded by Sonnet 4.x series
 */

export const CLAUDE_MODELS = {
  // Primary model for general analysis (Anthropic's recommended default)
  DEFAULT: 'claude-sonnet-4-5-20250929',

  // Advanced model for complex analysis (same as default - Sonnet 4.5 is the best)
  ADVANCED: 'claude-sonnet-4-5-20250929',

  // Fast model for simple tasks
  FAST: 'claude-haiku-4-5-20251001',

  // Most capable model for critical analysis
  PREMIUM: 'claude-opus-4-1-20250805',
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
    console.log(`🔧 [Claude Config] Using CLAUDE_MODEL from environment: ${envModel} (feature: ${feature})`);
    return envModel;
  }

  // Feature-specific model selection
  let selectedModel: string;
  switch (feature) {
    case 'bubble-detection':
      // Use advanced model for complex market analysis
      selectedModel = CLAUDE_MODELS.ADVANCED;
      break;

    case 'company-analysis':
    case 'investment-opinion':
    case 'default':
    default:
      // Use Sonnet 4.5 for most features (Anthropic's recommended default)
      selectedModel = CLAUDE_MODELS.DEFAULT;
      break;
  }

  console.log(`🤖 [Claude Config] Selected model for '${feature}': ${selectedModel}`);
  return selectedModel;
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