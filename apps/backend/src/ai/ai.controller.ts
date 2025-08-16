import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { ClaudeService } from './claude.service';
import { AIEvaluationService } from './ai-evaluation.service';

@Controller('api/v1/ai')
export class AIController {
  constructor(
    private readonly claudeService: ClaudeService,
    private readonly aiEvaluationService: AIEvaluationService
  ) {}

  @Get('health')
  async getAIHealth() {
    try {
      const claudeHealth = await this.claudeService.healthCheck();
      
      return {
        success: true,
        data: {
          claude: {
            status: claudeHealth.hasApiKey ? 'configured' : 'not_configured',
            model: claudeHealth.model,
            hasApiKey: claudeHealth.hasApiKey
          },
          evaluationService: {
            status: 'operational',
            cacheEnabled: true
          }
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: 'AI health check failed',
          message: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('models')
  async getAvailableModels() {
    try {
      return {
        success: true,
        data: {
          claude: {
            model: 'claude-3-haiku-20240307',
            provider: 'anthropic',
            status: 'available'
          },
          fallback: {
            model: 'mock_responses',
            provider: 'internal',
            status: 'always_available'
          }
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: 'Failed to fetch AI models',
          message: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('stats')
  async getAIStats() {
    try {
      // Mock AI usage statistics
      const stats = {
        totalEvaluations: Math.floor(Math.random() * 10000),
        successRate: 94.5,
        averageResponseTime: 1.2,
        cacheHitRate: 68.3,
        modelUsage: {
          claude: 85.2,
          fallback: 14.8
        },
        evaluationBreakdown: {
          buy: 23,
          hold: 52,
          sell: 25
        }
      };

      return {
        success: true,
        data: stats,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: 'Failed to fetch AI statistics',
          message: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}