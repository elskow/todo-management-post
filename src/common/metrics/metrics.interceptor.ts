import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MetricsService } from './metrics.service';
import { MetricLabels } from './metrics.types';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, path } = req;
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const status = context.switchToHttp().getResponse().statusCode;
          const duration = (Date.now() - start) / 1000;
          const labels: MetricLabels = {
            method,
            path,
            status: status.toString(),
          };

          this.metricsService.incrementRequestCount(labels);
          this.metricsService.observeRequestDuration(labels, duration);
          this.metricsService.updateMemoryMetrics();
        },
        error: (error) => {
          const status = error.status || 500;
          const duration = (Date.now() - start) / 1000;
          const labels: MetricLabels = {
            method,
            path,
            status: status.toString(),
          };

          this.metricsService.incrementRequestCount(labels);
          this.metricsService.observeRequestDuration(labels, duration);
          this.metricsService.updateMemoryMetrics();
        },
      }),
    );
  }
}
