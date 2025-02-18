import { Injectable } from '@nestjs/common';
import { Counter, Histogram, Gauge } from 'prom-client';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import {
  MetricLabels,
  DatabaseMetricLabels,
  CacheMetricLabels,
  QueueMetricLabels,
} from './metrics.types';

@Injectable()
export class MetricsService {
  constructor(
    @InjectMetric('http_request_total')
    private readonly requestCounter: Counter<string>,
    @InjectMetric('http_request_duration_seconds')
    private readonly requestDuration: Histogram<string>,
    @InjectMetric('active_connections')
    private readonly activeConnections: Gauge<string>,
    @InjectMetric('database_operation_total')
    private readonly databaseOperations: Counter<string>,
    @InjectMetric('database_operation_duration_seconds')
    private readonly databaseDuration: Histogram<string>,
    @InjectMetric('cache_operation_total')
    private readonly cacheOperations: Counter<string>,
    @InjectMetric('queue_job_total')
    private readonly queueJobs: Counter<string>,
    @InjectMetric('queue_job_duration_seconds')
    private readonly queueDuration: Histogram<string>,
    @InjectMetric('memory_usage_bytes')
    private readonly memoryUsage: Gauge<string>,
  ) {}

  static readonly metrics = {
    requestCounter: {
      name: 'http_request_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'path', 'status'],
    },
    requestDuration: {
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'path', 'status'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
    },
    activeConnections: {
      name: 'active_connections',
      help: 'Number of active connections',
    },
    databaseOperations: {
      name: 'database_operation_total',
      help: 'Total number of database operations',
      labelNames: ['operation', 'entity', 'status'],
    },
    databaseDuration: {
      name: 'database_operation_duration_seconds',
      help: 'Duration of database operations in seconds',
      labelNames: ['operation', 'entity', 'status'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2],
    },
    cacheOperations: {
      name: 'cache_operation_total',
      help: 'Total number of cache operations',
      labelNames: ['operation', 'status'],
    },
    queueJobs: {
      name: 'queue_job_total',
      help: 'Total number of queue jobs',
      labelNames: ['queue', 'status'],
    },
    queueDuration: {
      name: 'queue_job_duration_seconds',
      help: 'Duration of queue jobs in seconds',
      labelNames: ['queue', 'status'],
      buckets: [0.1, 0.5, 1, 5, 10, 30],
    },
    memoryUsage: {
      name: 'memory_usage_bytes',
      help: 'Memory usage in bytes',
      labelNames: ['type'],
    },
  };

  // HTTP metrics
  incrementRequestCount(labels: MetricLabels): void {
    this.requestCounter.labels(labels.method, labels.path, labels.status).inc();
  }

  observeRequestDuration(labels: MetricLabels, duration: number): void {
    this.requestDuration
      .labels(labels.method, labels.path, labels.status)
      .observe(duration);
  }

  // Database metrics
  incrementDatabaseOperation(labels: DatabaseMetricLabels): void {
    this.databaseOperations
      .labels(labels.operation, labels.entity, labels.status)
      .inc();
  }

  observeDatabaseDuration(
    labels: DatabaseMetricLabels,
    duration: number,
  ): void {
    this.databaseDuration
      .labels(labels.operation, labels.entity, labels.status)
      .observe(duration);
  }

  // Cache metrics
  incrementCacheOperation(labels: CacheMetricLabels): void {
    this.cacheOperations.labels(labels.operation, labels.status).inc();
  }

  // Queue metrics
  incrementQueueJob(labels: QueueMetricLabels): void {
    this.queueJobs.labels(labels.queue, labels.status).inc();
  }

  observeQueueDuration(labels: QueueMetricLabels, duration: number): void {
    this.queueDuration.labels(labels.queue, labels.status).observe(duration);
  }

  // System metrics
  updateMemoryMetrics(): void {
    const used = process.memoryUsage();
    this.memoryUsage.labels('heapUsed').set(used.heapUsed);
    this.memoryUsage.labels('heapTotal').set(used.heapTotal);
    this.memoryUsage.labels('rss').set(used.rss);
  }

  setActiveConnections(count: number): void {
    this.activeConnections.set(count);
  }
}
