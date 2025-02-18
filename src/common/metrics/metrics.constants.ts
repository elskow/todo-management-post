export const METRIC_PREFIX = 'app_';

export const HISTOGRAM_BUCKETS = {
  HTTP: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  DATABASE: [0.01, 0.05, 0.1, 0.5, 1, 2],
  QUEUE: [0.1, 0.5, 1, 5, 10, 30],
};

export const METRICS_PATH = '/metrics';
