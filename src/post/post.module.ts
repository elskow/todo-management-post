import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './core/post.entity';
import { PostVersion } from './core/post-version.entity';
import { PostCoreModule } from './core/post.module';
import { PostAnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, PostVersion]),
    PostCoreModule,
    PostAnalyticsModule,
  ],
})
export class PostModule {}
