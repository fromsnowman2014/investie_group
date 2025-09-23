import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { MarketController } from './market.controller';
import { MarketService } from './market.service';
import { DatabaseModule } from '../database/database.module';
import { FredApiService } from './services/fred-api.service';
import { FearGreedIndexService } from './services/fear-greed-index.service';
import { AlphaVantageService } from './services/alpha-vantage.service';
import { MarketCacheService } from './services/market-cache.service';
import { ScheduledMarketUpdatesService } from './services/scheduled-market-updates.service';
import { YahooFinanceService } from './services/yahoo-finance.service';

@Module({
  imports: [
    DatabaseModule,
    ScheduleModule.forRoot(), // Enable scheduled tasks
  ],
  controllers: [MarketController],
  providers: [
    MarketService,
    FredApiService,
    FearGreedIndexService,
    AlphaVantageService,
    MarketCacheService,
    ScheduledMarketUpdatesService,
    YahooFinanceService,
  ],
  exports: [
    MarketService,
    FredApiService,
    FearGreedIndexService,
    AlphaVantageService,
    MarketCacheService,
    ScheduledMarketUpdatesService,
    YahooFinanceService,
  ],
})
export class MarketModule {}
