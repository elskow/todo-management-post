import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PaginationDto } from '../../common/pagination.dto';
import { AnalyticsService } from './analytics.service';
import {
  PostAnalyticsDto,
  PostStatisticsDto,
  PlatformPerformanceDto,
} from './analytics.dto';

@ApiTags('posts-analytics')
@Controller('posts/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get posts statistics summary' })
  @ApiResponse({ status: 200, type: PostStatisticsDto })
  getStatistics(): Promise<PostStatisticsDto> {
    return this.analyticsService.getStatistics();
  }

  @Get('trends')
  @ApiOperation({ summary: 'Get posts trends over time' })
  @ApiResponse({ status: 200, type: PostAnalyticsDto })
  getTrends(@Query() query: PaginationDto): Promise<PostAnalyticsDto> {
    return this.analyticsService.getTrends(query);
  }

  @Get('platform-performance')
  @ApiOperation({ summary: 'Get performance metrics by platform' })
  @ApiResponse({
    status: 200,
    description: 'Platform performance metrics',
    type: [PlatformPerformanceDto],
  })
  getPlatformPerformance(): Promise<PlatformPerformanceDto[]> {
    return this.analyticsService.getPlatformPerformance();
  }
}
