import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { NewsController } from './news.controller';
import { NewsService } from './news.service';
import { StockValidatorHelper } from './stock-validator.helper';
import { AIModule } from '../ai/ai.module';

@Module({
  imports: [
    CacheModule.register({
      ttl: 21600, // 6 hours for news content
      max: 500,   // Maximum number of items in cache
    }),
    AIModule,
  ],
  controllers: [NewsController],
  providers: [NewsService, StockValidatorHelper],
  exports: [NewsService, StockValidatorHelper],
})
export class NewsModule {}