import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MetricsService } from './metrics.service';

@Injectable()
export class MetricsScheduler {
  constructor(private metricsService: MetricsService) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  updateSystemMetrics() {
    this.metricsService.updateMemoryMetrics();
  }
}
