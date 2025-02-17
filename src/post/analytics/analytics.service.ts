import {
  Injectable,
  UseInterceptors,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { CacheKey, CacheTTL, CacheInterceptor } from '@nestjs/cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { Post } from '@app/post/core/post.entity';
import { PostStatus } from '@app/post/core/dto/create-post.dto';
import { PaginationDto } from '@common/pagination.dto';
import { PostAnalyticsDto, PostStatisticsDto } from './analytics.dto';

@Injectable()
@UseInterceptors(CacheInterceptor)
export class AnalyticsService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {}

  async onApplicationBootstrap() {
    await Promise.all([this.getStatistics(), this.getPlatformPerformance()]);
  }

  @CacheKey('post-statistics')
  @CacheTTL(300) // 5 minutes cache
  async getStatistics(): Promise<PostStatisticsDto> {
    const queryBuilder = this.postRepository
      .createQueryBuilder('post')
      .cache(true)
      .select([
        'COUNT(DISTINCT post.id) as totalPosts',
        'SUM(post.payment) as totalPayments',
        'AVG(post.payment) as averagePayment',
        'COUNT(CASE WHEN post.createdAt >= :lastWeek THEN 1 END) as postsLastWeek',
        'COUNT(CASE WHEN post.createdAt >= :lastMonth THEN 1 END) as postsLastMonth',
      ])
      .setParameter('lastWeek', this.getDateBefore(7))
      .setParameter('lastMonth', this.getDateBefore(30));

    const [basicStats, platformStats, statusStats] = await Promise.all([
      queryBuilder.getRawOne(),
      this.getPlatformStats(),
      this.getStatusStats(),
    ]);

    return {
      totalPosts: Number(basicStats.totalPosts) || 0,
      totalPayments: Number(basicStats.totalPayments) || 0,
      averagePayment: Number(basicStats.averagePayment) || 0,
      platformStats,
      statusStats,
      postsLastWeek: Number(basicStats.postsLastWeek) || 0,
      postsLastMonth: Number(basicStats.postsLastMonth) || 0,
    };
  }

  @CacheKey('platform-performance')
  @CacheTTL(300)
  async getPlatformPerformance() {
    return this.postRepository
      .createQueryBuilder('post')
      .cache(true)
      .select([
        'post.platform as platform',
        'COUNT(DISTINCT post.id) as totalPosts',
        'AVG(post.payment) as averagePayment',
        'COUNT(CASE WHEN post.status = :published THEN 1 END) as publishedPosts',
      ])
      .setParameter('published', PostStatus.PUBLISHED)
      .groupBy('post.platform')
      .getRawMany()
      .then((results) =>
        results.map((p) => ({
          platform: p.platform,
          totalPosts: Number(p.totalPosts) || 0,
          averagePayment: Number(p.averagePayment) || 0,
          publishedPosts: Number(p.publishedPosts) || 0,
          publishRate: this.calculatePublishRate(
            p.publishedPosts,
            p.totalPosts,
          ),
        })),
      );
  }

  @CacheKey('post-trends')
  @CacheTTL(300)
  async getTrends(query: PaginationDto): Promise<PostAnalyticsDto> {
    const { page = 1, limit = 10 } = query;

    const trends = await this.postRepository
      .createQueryBuilder('post')
      .cache(true)
      .select([
        'DATE(post.createdAt) as date',
        'COUNT(DISTINCT post.id) as count',
        'COALESCE(SUM(post.payment), 0) as totalPayment',
      ])
      .groupBy('DATE(post.createdAt)')
      .orderBy('date', 'DESC')
      .limit(limit)
      .offset((page - 1) * limit)
      .getRawMany();

    return {
      trends: trends.map((trend) => ({
        date: new Date(trend.date),
        count: Number(trend.count) || 0,
        totalPayment: Number(trend.totalPayment) || 0,
      })),
    };
  }

  private getDateBefore(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
  }

  private calculatePublishRate(
    publishedPosts: string | number,
    totalPosts: string | number,
  ): number {
    const published = Number(publishedPosts);
    const total = Number(totalPosts);
    return total > 0 ? (published / total) * 100 : 0;
  }

  private async getPlatformStats() {
    return this.postRepository
      .createQueryBuilder('post')
      .cache(true)
      .select([
        'post.platform as platform',
        'COUNT(DISTINCT post.id) as count',
        'COALESCE(SUM(post.payment), 0) as totalPayment',
      ])
      .groupBy('post.platform')
      .getRawMany()
      .then((stats) =>
        stats.map((stat) => ({
          platform: stat.platform,
          count: Number(stat.count) || 0,
          totalPayment: Number(stat.totalPayment) || 0,
        })),
      );
  }

  private async getStatusStats() {
    return this.postRepository
      .createQueryBuilder('post')
      .cache(true)
      .select(['post.status as status', 'COUNT(DISTINCT post.id) as count'])
      .groupBy('post.status')
      .getRawMany()
      .then((stats) =>
        stats.map((stat) => ({
          status: stat.status,
          count: Number(stat.count) || 0,
        })),
      );
  }
}
