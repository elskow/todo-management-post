import { Module } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import {
  makeCounterProvider,
  makeHistogramProvider,
  makeGaugeProvider,
} from '@willsoto/nestjs-prometheus';
import { MetricsService } from './metrics.service';
import { MetricsController } from './metrics.controller';
import { MetricsScheduler } from './metrics.scheduler';
import { METRIC_PREFIX, METRICS_PATH } from './metrics.constants';

@Module({
  imports: [
    PrometheusModule.register({
      defaultMetrics: {
        enabled: true,
        config: {
          prefix: METRIC_PREFIX,
          gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
        },
      },
    }),
  ],
  providers: [
    MetricsService,
    MetricsScheduler,
    makeCounterProvider(MetricsService.metrics.requestCounter),
    makeHistogramProvider(MetricsService.metrics.requestDuration),
    makeGaugeProvider(MetricsService.metrics.activeConnections),
    makeCounterProvider(MetricsService.metrics.databaseOperations),
    makeHistogramProvider(MetricsService.metrics.databaseDuration),
    makeCounterProvider(MetricsService.metrics.cacheOperations),
    makeCounterProvider(MetricsService.metrics.queueJobs),
    makeHistogramProvider(MetricsService.metrics.queueDuration),
    makeGaugeProvider(MetricsService.metrics.memoryUsage),
  ],
  controllers: [MetricsController],
  exports: [MetricsService],
})
export class MetricsModule {}
