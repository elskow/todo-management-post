import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { AnalyticsService } from './analytics.service';
import { Post } from '@app/post/core/post.entity';
import { Platform, PostStatus } from '@app/post/core/dto/create-post.dto';

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
    andWhere: jest.fn().mockReturnThis(),
    cache: jest.fn().mockReturnThis(),
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

      mockQueryBuilder.getRawOne.mockResolvedValueOnce({
        totalPosts: '10',
        totalPayments: '1000',
        averagePayment: '100',
        postsLastWeek: '3',
        postsLastMonth: '5',
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

      expect(mockQueryBuilder.cache).toHaveBeenCalledWith(true);

      expect(mockQueryBuilder.setParameter).toHaveBeenCalledWith(
        'lastWeek',
        expect.any(Date),
      );
      expect(mockQueryBuilder.setParameter).toHaveBeenCalledWith(
        'lastMonth',
        expect.any(Date),
      );

      expect(result).toEqual({
        totalPosts: 10,
        totalPayments: 1000,
        averagePayment: 100,
        platformStats: [
          {
            platform: Platform.INSTAGRAM,
            count: 10,
            totalPayment: 500,
          },
        ],
        statusStats: [
          {
            status: PostStatus.PUBLISHED,
            count: 5,
          },
        ],
        postsLastWeek: 3,
        postsLastMonth: 5,
      });

      expect(mockQueryBuilder.select).toHaveBeenCalledWith(
        expect.arrayContaining([
          'COUNT(DISTINCT post.id) as totalPosts',
          'SUM(post.payment) as totalPayments',
          'AVG(post.payment) as averagePayment',
          'COUNT(CASE WHEN post.createdAt >= :lastWeek THEN 1 END) as postsLastWeek',
          'COUNT(CASE WHEN post.createdAt >= :lastMonth THEN 1 END) as postsLastMonth',
        ]),
      );
    });

    it('should handle errors gracefully', async () => {
      const mockQueryBuilder = createMockQueryBuilder();
      (repository.createQueryBuilder as jest.Mock).mockReturnValue(
        mockQueryBuilder,
      );

      mockQueryBuilder.getRawOne.mockRejectedValueOnce(
        new Error('Database error'),
      );

      await expect(service.getStatistics()).rejects.toThrow('Database error');
    });

    it('should return cached data when available', async () => {
      const cachedData = {
        totalPosts: 5,
        totalPayments: 500,
        averagePayment: 100,
        platformStats: [],
        statusStats: [],
        postsLastWeek: 2,
        postsLastMonth: 3,
      };

      const mockQueryBuilder = createMockQueryBuilder();
      const mockRepository = {
        createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      };

      const mockCacheManager = {
        get: jest.fn().mockResolvedValue(cachedData),
        set: jest.fn().mockResolvedValue(undefined),
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

      const service = module.get<AnalyticsService>(AnalyticsService);

      mockQueryBuilder.getRawOne.mockResolvedValue({
        totalPosts: '5',
        totalPayments: '500',
        averagePayment: '100',
        postsLastWeek: '2',
        postsLastMonth: '3',
      });

      mockQueryBuilder.getRawMany
        .mockResolvedValueOnce([]) // platformStats
        .mockResolvedValueOnce([]); // statusStats

      const result = await service.getStatistics();

      expect(result).toEqual(cachedData);
      expect(mockCacheManager.get).toHaveBeenCalledWith('post-statistics');
      expect(mockRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('should fetch and cache data when cache misses', async () => {
      const expectedData = {
        totalPosts: 10,
        totalPayments: 1000,
        averagePayment: 100,
        platformStats: [
          {
            platform: Platform.INSTAGRAM,
            count: 10,
            totalPayment: 500,
          },
        ],
        statusStats: [
          {
            status: PostStatus.PUBLISHED,
            count: 5,
          },
        ],
        postsLastWeek: 3,
        postsLastMonth: 5,
      };

      const mockQueryBuilder = createMockQueryBuilder();
      const mockRepository = {
        createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      };

      const mockCacheManager = {
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue(undefined),
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

      const service = module.get<AnalyticsService>(AnalyticsService);

      mockQueryBuilder.getRawOne.mockResolvedValue({
        totalPosts: '10',
        totalPayments: '1000',
        averagePayment: '100',
        postsLastWeek: '3',
        postsLastMonth: '5',
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

      expect(result).toEqual(expectedData);
      expect(mockCacheManager.get).toHaveBeenCalledWith('post-statistics');
      expect(mockRepository.createQueryBuilder).toHaveBeenCalledTimes(3); // One for each query
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'post-statistics',
        expectedData,
        300,
      );
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

      expect(mockQueryBuilder.cache).toHaveBeenCalledWith(true);
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

      expect(mockQueryBuilder.cache).toHaveBeenCalledWith(true);
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

      expect(mockQueryBuilder.cache).toHaveBeenCalledWith(true);
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(0);
    });
  });
});
