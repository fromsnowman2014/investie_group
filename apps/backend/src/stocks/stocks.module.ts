import { Module } from '@nestjs/common';
import { StocksController } from './stocks.controller';
import { StocksService } from './stocks.service';
import { AIModule } from '../ai/ai.module';
import { NewsModule } from '../news/news.module';
import { DatabaseModule } from '../database/database.module';
import {
  StockDataService,
  StockCacheService,
  StockTransformService,
  StockValidationService,
} from './services';

@Module({
  imports: [AIModule, NewsModule, DatabaseModule],
  controllers: [StocksController],
  providers: [
    StocksService,
    StockDataService,
    StockCacheService,
    StockTransformService,
    StockValidationService,
  ],
  exports: [
    StocksService,
    StockDataService,
    StockCacheService,
    StockTransformService,
    StockValidationService,
  ],
})
export class StocksModule {}
