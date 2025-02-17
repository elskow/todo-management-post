import { Injectable, UseInterceptors } from '@nestjs/common';
import { CacheKey, CacheTTL, CacheInterceptor } from '@nestjs/cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { Post } from '../core/post.entity';
import { PostStatus } from '../core/dto/create-post.dto';
import { PaginationDto } from '../../common/pagination.dto';
import { PostAnalyticsDto, PostStatisticsDto } from './analytics.dto';

@Injectable()
@UseInterceptors(CacheInterceptor)
export class AnalyticsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {}

  @CacheKey('post-statistics')
  @CacheTTL(60)
  async getStatistics(): Promise<PostStatisticsDto> {
    const totalPosts = (await this.postRepository.count()) || 0;

    const paymentStats = (await this.postRepository
      .createQueryBuilder('post')
      .select([
        'SUM(post.payment) as totalPayments',
        'AVG(post.payment) as averagePayment',
      ])
      .getRawOne()) || { totalPayments: 0, averagePayment: 0 };

    const platformStats =
      (await this.postRepository
        .createQueryBuilder('post')
        .select([
          'post.platform as platform',
          'COUNT(*) as count',
          'SUM(post.payment) as totalPayment',
        ])
        .groupBy('post.platform')
        .getRawMany()) || [];

    const statusStats =
      (await this.postRepository
        .createQueryBuilder('post')
        .select(['post.status as status', 'COUNT(*) as count'])
        .groupBy('post.status')
        .getRawMany()) || [];

    const lastWeekDate = new Date();
    lastWeekDate.setDate(lastWeekDate.getDate() - 7);

    const lastMonthDate = new Date();
    lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);

    const postsLastWeek =
      (await this.postRepository.count({
        where: {
          createdAt: MoreThanOrEqual(lastWeekDate),
        },
      })) || 0;

    const postsLastMonth =
      (await this.postRepository.count({
        where: {
          createdAt: MoreThanOrEqual(lastMonthDate),
        },
      })) || 0;

    return {
      totalPosts,
      totalPayments: Number(paymentStats.totalPayments) || 0,
      averagePayment: Number(paymentStats.averagePayment) || 0,
      platformStats: platformStats.map((stat) => ({
        platform: stat.platform,
        count: Number(stat.count) || 0,
        totalPayment: Number(stat.totalPayment) || 0,
      })),
      statusStats: statusStats.map((stat) => ({
        status: stat.status,
        count: Number(stat.count) || 0,
      })),
      postsLastWeek,
      postsLastMonth,
    };
  }

  async getTrends(query: PaginationDto): Promise<PostAnalyticsDto> {
    const { page = 1, limit = 10 } = query;

    const trends =
      (await this.postRepository
        .createQueryBuilder('post')
        .select([
          'DATE(post.createdAt) as date',
          'COUNT(*) as count',
          'SUM(post.payment) as totalPayment',
        ])
        .groupBy('DATE(post.createdAt)')
        .orderBy('date', 'DESC')
        .limit(limit)
        .offset((page - 1) * limit)
        .getRawMany()) || [];

    return {
      trends: trends.map((trend) => ({
        date: new Date(trend.date),
        count: Number(trend.count) || 0,
        totalPayment: Number(trend.totalPayment) || 0,
      })),
    };
  }

  async getPlatformPerformance() {
    const performance =
      (await this.postRepository
        .createQueryBuilder('post')
        .select([
          'post.platform as platform',
          'COUNT(*) as totalPosts',
          'AVG(post.payment) as averagePayment',
          'COUNT(CASE WHEN post.status = :published THEN 1 END) as publishedPosts',
        ])
        .setParameter('published', PostStatus.PUBLISHED)
        .groupBy('post.platform')
        .getRawMany()) || [];

    return performance.map((p) => ({
      platform: p.platform,
      totalPosts: Number(p.totalPosts) || 0,
      averagePayment: Number(p.averagePayment) || 0,
      publishedPosts: Number(p.publishedPosts) || 0,
      publishRate:
        Number(p.publishedPosts) > 0
          ? (Number(p.publishedPosts) / Number(p.totalPosts)) * 100
          : 0,
    }));
  }
}
