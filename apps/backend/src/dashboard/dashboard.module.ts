import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { NewsModule } from '../news/news.module';
import { StocksModule } from '../stocks/stocks.module';
import { MarketModule } from '../market/market.module';

@Module({
  imports: [NewsModule, StocksModule, MarketModule],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
