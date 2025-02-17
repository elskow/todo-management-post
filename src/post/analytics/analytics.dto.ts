import { ApiProperty } from '@nestjs/swagger';
import { Platform, PostStatus } from '../core/dto/create-post.dto';

export class PlatformStats {
  @ApiProperty({ enum: Platform })
  platform: Platform;

  @ApiProperty()
  count: number;

  @ApiProperty()
  totalPayment: number;
}

export class PlatformPerformanceDto {
  @ApiProperty({ enum: Platform })
  platform: Platform;

  @ApiProperty()
  totalPosts: number;

  @ApiProperty()
  averagePayment: number;

  @ApiProperty()
  publishedPosts: number;

  @ApiProperty()
  publishRate: number;
}

export class StatusStats {
  @ApiProperty({ enum: PostStatus })
  status: PostStatus;

  @ApiProperty()
  count: number;
}

export class PostStatisticsDto {
  @ApiProperty()
  totalPosts: number;

  @ApiProperty()
  totalPayments: number;

  @ApiProperty()
  averagePayment: number;

  @ApiProperty({ type: [PlatformStats] })
  platformStats: PlatformStats[];

  @ApiProperty({ type: [StatusStats] })
  statusStats: StatusStats[];

  @ApiProperty()
  postsLastWeek: number;

  @ApiProperty()
  postsLastMonth: number;
}

export class PostTrendDto {
  @ApiProperty()
  date: Date;

  @ApiProperty()
  count: number;

  @ApiProperty()
  totalPayment: number;
}

export class PostAnalyticsDto {
  @ApiProperty({ type: [PostTrendDto] })
  trends: PostTrendDto[];
}
