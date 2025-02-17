import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { AnalyticsService } from './analytics.service';
import { Post } from '../core/post.entity';
import { Platform, PostStatus } from '../core/dto/create-post.dto';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let repository: Repository<Post>;

  const createMockQueryBuilder = () => ({
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    setParameter: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getRawOne: jest.fn(),
    getRawMany: jest.fn(),
    execute: jest.fn(),
  });

  beforeEach(async () => {
    const mockQueryBuilder = createMockQueryBuilder();

    const mockRepository = {
      count: jest.fn().mockImplementation(() => Promise.resolve(0)),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    const mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      reset: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: getRepositoryToken(Post),
          useValue: mockRepository,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    repository = module.get<Repository<Post>>(getRepositoryToken(Post));

    jest.clearAllMocks();
  });

  describe('getStatistics', () => {
    it('should return post statistics', async () => {
      const mockQueryBuilder = createMockQueryBuilder();
      (repository.createQueryBuilder as jest.Mock).mockReturnValue(
        mockQueryBuilder,
      );

      (repository.count as jest.Mock)
        .mockResolvedValueOnce(10) // totalPosts
        .mockResolvedValueOnce(3) // postsLastWeek
        .mockResolvedValueOnce(5); // postsLastMonth

      mockQueryBuilder.getRawOne.mockResolvedValueOnce({
        totalPayments: '1000',
        averagePayment: '100',
      });

      mockQueryBuilder.getRawMany
        .mockResolvedValueOnce([
          {
            platform: Platform.INSTAGRAM,
            count: '10',
            totalPayment: '500',
          },
        ])
        .mockResolvedValueOnce([
          {
            status: PostStatus.PUBLISHED,
            count: '5',
          },
        ]);

      const result = await service.getStatistics();

      expect(result.totalPosts).toBe(10);
      expect(result.totalPayments).toBe(1000);
      expect(result.averagePayment).toBe(100);
      expect(result.platformStats).toHaveLength(1);
      expect(result.platformStats[0].platform).toBe(Platform.INSTAGRAM);
      expect(result.statusStats).toHaveLength(1);
      expect(result.statusStats[0].status).toBe(PostStatus.PUBLISHED);
    });
  });

  describe('getTrends', () => {
    it('should return post trends', async () => {
      const mockQueryBuilder = createMockQueryBuilder();
      (repository.createQueryBuilder as jest.Mock).mockReturnValue(
        mockQueryBuilder,
      );

      mockQueryBuilder.getRawMany.mockResolvedValueOnce([
        {
          date: '2023-01-01',
          count: '5',
          totalPayment: '500',
        },
      ]);

      const result = await service.getTrends({ page: 1, limit: 10 });

      expect(result.trends).toHaveLength(1);
      expect(result.trends[0].count).toBe(5);
      expect(result.trends[0].totalPayment).toBe(500);
      expect(result.trends[0].date).toBeInstanceOf(Date);
    });
  });

  describe('getPlatformPerformance', () => {
    it('should return platform performance metrics', async () => {
      const mockQueryBuilder = createMockQueryBuilder();
      (repository.createQueryBuilder as jest.Mock).mockReturnValue(
        mockQueryBuilder,
      );

      mockQueryBuilder.getRawMany.mockResolvedValueOnce([
        {
          platform: Platform.INSTAGRAM,
          totalPosts: '10',
          averagePayment: '100',
          publishedPosts: '5',
        },
      ]);

      const result = await service.getPlatformPerformance();

      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        platform: Platform.INSTAGRAM,
        totalPosts: 10,
        averagePayment: 100,
        publishedPosts: 5,
        publishRate: 50,
      });
    });

    it('should handle empty result', async () => {
      const mockQueryBuilder = createMockQueryBuilder();
      (repository.createQueryBuilder as jest.Mock).mockReturnValue(
        mockQueryBuilder,
      );
      mockQueryBuilder.getRawMany.mockResolvedValueOnce([]);

      const result = await service.getPlatformPerformance();

      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(0);
    });
  });
});
