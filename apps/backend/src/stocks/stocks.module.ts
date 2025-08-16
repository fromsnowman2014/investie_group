import { Module } from '@nestjs/common';
import { StocksController } from './stocks.controller';
import { StocksService } from './stocks.service';
import { AIModule } from '../ai/ai.module';
import { NewsModule } from '../news/news.module';

@Module({
  imports: [AIModule, NewsModule],
  controllers: [StocksController],
  providers: [StocksService],
  exports: [StocksService],
})
export class StocksModule {}