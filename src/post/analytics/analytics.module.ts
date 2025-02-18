import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { CacheModule } from '@nestjs/cache-manager';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AnalyticsQueueService } from './analytics-queue.service';
import { AnalyticsProcessor } from './analytics.processor';
import { Post } from '@app/post/core/post.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post]),
    CacheModule.register({
      ttl: 86400,
    }),
    BullModule.registerQueue({
      name: 'analytics',
    }),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, AnalyticsQueueService, AnalyticsProcessor],
})
export class PostAnalyticsModule {}
