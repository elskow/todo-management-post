import {
  Injectable,
  UseInterceptors,
  OnApplicationBootstrap,
  Inject,
} from '@nestjs/common';
import {
  CacheKey,
  CacheTTL,
  CacheInterceptor,
  CACHE_MANAGER,
} from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PaginationDto } from '@common/pagination.dto';
import {
  PlatformPerformanceDto,
  PostAnalyticsDto,
  PostStatisticsDto,
  PostTrendDto,
} from './analytics.dto';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class AnalyticsService {
  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    @InjectQueue('analytics') private analyticsQueue: Queue,
  ) {}

  async getStatistics(): Promise<PostStatisticsDto> {
    const cached =
      await this.cacheManager.get<PostStatisticsDto>('post-statistics');
    if (cached) {
      return cached;
    }

    // If no cached data, trigger an immediate update and wait for it
    const job = await this.analyticsQueue.add(
      'updateAnalytics',
      {},
      {
        removeOnComplete: true,
      },
    );
    return await job.finished();
  }

  async getTrends(query: PaginationDto): Promise<PostAnalyticsDto> {
    const cached = await this.cacheManager.get<PostTrendDto[]>('post-trends');
    if (cached) {
      const { page = 1, limit = 10 } = query;
      const start = (page - 1) * limit;
      const end = start + limit;

      return {
        trends: cached.slice(start, end),
      };
    }

    const job = await this.analyticsQueue.add(
      'updateTrends',
      {},
      {
        removeOnComplete: true,
      },
    );
    const result = await job.finished();

    const trends = Array.isArray(result) ? result : result.trends || [];

    return {
      trends: trends.slice(0, query.limit),
    };
  }

  async getPlatformPerformance(): Promise<PlatformPerformanceDto[]> {
    const cached = await this.cacheManager.get<PlatformPerformanceDto[]>(
      'platform-performance',
    );
    if (cached) {
      return cached;
    }

    // If no cached data, trigger an immediate update and wait for it
    const job = await this.analyticsQueue.add(
      'updatePlatformPerformance',
      {},
      {
        removeOnComplete: true,
      },
    );
    return await job.finished();
  }
}
