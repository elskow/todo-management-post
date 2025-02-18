import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class AnalyticsQueueService {
  constructor(@InjectQueue('analytics') private analyticsQueue: Queue) {}

  @Cron(CronExpression.EVERY_HOUR)
  async scheduleAnalyticsUpdate() {
    await this.analyticsQueue.add(
      'updateAnalytics',
      {},
      {
        removeOnComplete: true,
      },
    );
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async scheduleDailyTrendsUpdate() {
    await this.analyticsQueue.add(
      'updateTrends',
      {},
      {
        removeOnComplete: true,
      },
    );
  }

  @Cron(CronExpression.EVERY_HOUR)
  async schedulePlatformPerformanceUpdate() {
    await this.analyticsQueue.add(
      'updatePlatformPerformance',
      {},
      {
        removeOnComplete: true,
      },
    );
  }
}
