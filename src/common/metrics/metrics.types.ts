export interface MetricLabels {
  method: string;
  path: string;
  status: string;
}

export interface DatabaseMetricLabels {
  operation: string;
  entity: string;
  status: string;
}

export interface CacheMetricLabels {
  operation: string;
  status: string;
}

export interface QueueMetricLabels {
  queue: string;
  status: string;
}
