import { Module } from '@nestjs/common';
import { PostCoreModule } from './core/post.module';
import { PostAnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [PostCoreModule, PostAnalyticsModule],
})
export class PostModule {}
