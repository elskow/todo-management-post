import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { Post } from '@app/post/core/post.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Post]), CacheModule.register()],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class PostAnalyticsModule {}
