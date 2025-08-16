import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { AIController } from './ai.controller';
import { AIEvaluationService } from './ai-evaluation.service';
import { ClaudeService } from './claude.service';
import { TechnicalAnalysisService } from './technical-analysis.service';

@Module({
  imports: [
    CacheModule.register({
      ttl: 43200, // 12 hours for AI content
      max: 1000, // Maximum number of items in cache
    }),
  ],
  controllers: [AIController],
  providers: [
    AIEvaluationService,
    ClaudeService,
    TechnicalAnalysisService,
  ],
  exports: [
    AIEvaluationService,
    ClaudeService,
    TechnicalAnalysisService,
  ],
})
export class AIModule {}