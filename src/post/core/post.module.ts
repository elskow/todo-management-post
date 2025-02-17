import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsController } from './post.controller';
import { PostsService } from './post.service';
import { Post } from './post.entity';
import { PostVersion } from './post-version.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Post, PostVersion])],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostCoreModule {}
