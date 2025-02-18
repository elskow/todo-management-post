import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '../core/post.entity';
import { PostStatus } from '../core/dto/create-post.dto';
import { Inject } from '@nestjs/common';

@Processor('analytics')
export class AnalyticsProcessor {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  @Process('updateAnalytics')
  async handleAnalyticsUpdate(job: Job) {
    try {
      // Get basic statistics
      const basicStats = await this.postRepository
        .createQueryBuilder('post')
        .select([
          'COUNT(DISTINCT post.id) as totalPosts',
          'SUM(post.payment) as totalPayments',
          'AVG(post.payment) as averagePayment',
          'COUNT(CASE WHEN post.createdAt >= :lastWeek THEN 1 END) as postsLastWeek',
          'COUNT(CASE WHEN post.createdAt >= :lastMonth THEN 1 END) as postsLastMonth',
        ])
        .setParameter('lastWeek', this.getDateBefore(7))
        .setParameter('lastMonth', this.getDateBefore(30))
        .getRawOne();

      // Get platform stats
      const platformStats = await this.getPlatformStats();
      const statusStats = await this.getStatusStats();

      const analytics = {
        totalPosts: Number(basicStats.totalPosts) || 0,
        totalPayments: Number(basicStats.totalPayments) || 0,
        averagePayment: Number(basicStats.averagePayment) || 0,
        platformStats,
        statusStats,
        postsLastWeek: Number(basicStats.postsLastWeek) || 0,
        postsLastMonth: Number(basicStats.postsLastMonth) || 0,
        lastUpdated: new Date(),
      };

      // Cache the results
      await this.cacheManager.set('post-statistics', analytics, 86400); // 24 hours
      return analytics;
    } catch (error) {
      console.error('Failed to update analytics:', error);
      throw error;
    }
  }

  @Process('updateTrends')
  async handleTrendsUpdate(job: Job) {
    try {
      const trends = await this.postRepository
        .createQueryBuilder('post')
        .select([
          'DATE(post.createdAt) as date',
          'COUNT(DISTINCT post.id) as count',
          'COALESCE(SUM(post.payment), 0) as totalPayment',
        ])
        .groupBy('DATE(post.createdAt)')
        .orderBy('date', 'DESC')
        .limit(30) // Last 30 days
        .getRawMany();

      const formattedTrends = trends.map((trend) => ({
        date: new Date(trend.date),
        count: Number(trend.count) || 0,
        totalPayment: Number(trend.totalPayment) || 0,
      }));

      await this.cacheManager.set('post-trends', formattedTrends, 86400);
      return formattedTrends;
    } catch (error) {
      console.error('Failed to update trends:', error);
      throw error;
    }
  }

  private getDateBefore(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
  }
  private async getPlatformStats() {
    return this.postRepository
      .createQueryBuilder('post')
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

  @Process('updatePlatformPerformance')
  async handlePlatformPerformanceUpdate(job: Job) {
    try {
      const results = await this.postRepository
        .createQueryBuilder('post')
        .select([
          'post.platform as platform',
          'COUNT(DISTINCT post.id) as totalPosts',
          'AVG(post.payment) as averagePayment',
          'COUNT(CASE WHEN post.status = :published THEN 1 END) as publishedPosts',
        ])
        .setParameter('published', PostStatus.PUBLISHED)
        .groupBy('post.platform')
        .getRawMany();

      const performanceMetrics = results.map((p) => ({
        platform: p.platform,
        totalPosts: Number(p.totalPosts) || 0,
        averagePayment: Number(p.averagePayment) || 0,
        publishedPosts: Number(p.publishedPosts) || 0,
        publishRate: this.calculatePublishRate(p.publishedPosts, p.totalPosts),
      }));

      await this.cacheManager.set(
        'platform-performance',
        performanceMetrics,
        86400,
      );
      return performanceMetrics;
    } catch (error) {
      console.error('Failed to update platform performance:', error);
      throw error;
    }
  }

  private calculatePublishRate(
    publishedPosts: string | number,
    totalPosts: string | number,
  ): number {
    const published = Number(publishedPosts);
    const total = Number(totalPosts);
    return total > 0 ? (published / total) * 100 : 0;
  }
}
