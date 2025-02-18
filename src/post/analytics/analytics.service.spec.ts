import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { getQueueToken } from '@nestjs/bull';
import { AnalyticsService } from './analytics.service';
import { Platform, PostStatus } from '@app/post/core/dto/create-post.dto';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let mockCacheManager: any;
  let mockQueue: any;

  beforeEach(async () => {
    mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
    };

    mockQueue = {
      add: jest.fn().mockImplementation((jobName) => ({
        finished: () => {
          switch (jobName) {
            case 'updateAnalytics':
              return Promise.resolve({
                totalPosts: 10,
                totalPayments: 1000,
                averagePayment: 100,
                platformStats: [],
                statusStats: [],
                postsLastWeek: 3,
                postsLastMonth: 5,
              });
            case 'updateTrends':
              return Promise.resolve([
                {
                  date: new Date(),
                  count: 5,
                  totalPayment: 500,
                },
              ]);
            case 'updatePlatformPerformance':
              return Promise.resolve([
                {
                  platform: Platform.INSTAGRAM,
                  totalPosts: 10,
                  averagePayment: 100,
                  publishedPosts: 5,
                  publishRate: 50,
                },
              ]);
            default:
              return Promise.resolve([]);
          }
        },
      })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
        {
          provide: getQueueToken('analytics'),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
  });

  describe('getStatistics', () => {
    it('should return cached statistics when available', async () => {
      const cachedData = {
        totalPosts: 5,
        totalPayments: 500,
        averagePayment: 100,
        platformStats: [],
        statusStats: [],
        postsLastWeek: 2,
        postsLastMonth: 3,
      };

      mockCacheManager.get.mockResolvedValue(cachedData);

      const result = await service.getStatistics();

      expect(result).toEqual(cachedData);
      expect(mockCacheManager.get).toHaveBeenCalledWith('post-statistics');
      expect(mockQueue.add).not.toHaveBeenCalled();
    });

    it('should create job and return results when cache misses', async () => {
      mockCacheManager.get.mockResolvedValue(null);

      const result = await service.getStatistics();

      expect(mockQueue.add).toHaveBeenCalledWith(
        'updateAnalytics',
        {},
        { removeOnComplete: true },
      );
      expect(result).toBeDefined();
    });
  });

  describe('getTrends', () => {
    it('should return cached trends when available', async () => {
      const cachedTrends = [{ date: new Date(), count: 5, totalPayment: 500 }];

      mockCacheManager.get.mockResolvedValue(cachedTrends);

      const result = await service.getTrends({ page: 1, limit: 10 });

      expect(result.trends).toEqual(cachedTrends);
      expect(mockCacheManager.get).toHaveBeenCalledWith('post-trends');
      expect(mockQueue.add).not.toHaveBeenCalled();
    });

    it('should create job and return results when cache misses', async () => {
      mockCacheManager.get.mockResolvedValue(null);

      const result = await service.getTrends({ page: 1, limit: 10 });

      expect(mockQueue.add).toHaveBeenCalledWith(
        'updateTrends',
        {},
        { removeOnComplete: true },
      );
      expect(result).toEqual({
        trends: [
          {
            date: expect.any(Date),
            count: 5,
            totalPayment: 500,
          },
        ],
      });
    });

    it('should properly paginate cached results', async () => {
      const cachedTrends = Array(20)
        .fill(null)
        .map((_, index) => ({
          date: new Date(),
          count: index + 1,
          totalPayment: (index + 1) * 100,
        }));

      mockCacheManager.get.mockResolvedValue(cachedTrends);

      const result = await service.getTrends({ page: 2, limit: 5 });

      expect(result.trends).toHaveLength(5);
      expect(result.trends[0].count).toBe(6); // Second page, first item
    });
  });

  describe('getPlatformPerformance', () => {
    it('should return cached platform performance when available', async () => {
      const cachedPerformance = [
        {
          platform: Platform.INSTAGRAM,
          totalPosts: 10,
          averagePayment: 100,
          publishedPosts: 5,
          publishRate: 50,
        },
      ];

      mockCacheManager.get.mockResolvedValue(cachedPerformance);

      const result = await service.getPlatformPerformance();

      expect(result).toEqual(cachedPerformance);
      expect(mockCacheManager.get).toHaveBeenCalledWith('platform-performance');
      expect(mockQueue.add).not.toHaveBeenCalled();
    });

    it('should create job and return results when cache misses', async () => {
      mockCacheManager.get.mockResolvedValue(null);

      const result = await service.getPlatformPerformance();

      expect(mockQueue.add).toHaveBeenCalledWith(
        'updatePlatformPerformance',
        {},
        { removeOnComplete: true },
      );
      expect(result).toBeDefined();
    });
  });
});
