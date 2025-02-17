import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere } from 'typeorm';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { QueryPostsDto } from './dto/query-posts.dto';
import { Post } from './post.entity';
import { PostVersion } from './post-version.entity';
import { PaginatedResponseDto, SortOrder } from '@app/common/pagination.dto';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    @InjectRepository(PostVersion)
    private postVersionRepository: Repository<PostVersion>,
  ) {}

  async create(createPostDto: CreatePostDto): Promise<Post> {
    const post = this.postRepository.create(createPostDto);
    return await this.postRepository.save(post);
  }

  async findAll(query: QueryPostsDto): Promise<PaginatedResponseDto<Post>> {
    const {
      limit = 10,
      cursor,
      sortBy = 'createdAt',
      order = SortOrder.DESC,
      brand,
      platform,
      status,
      dueDateFrom,
      dueDateTo,
    } = query;

    const queryBuilder = this.postRepository.createQueryBuilder('post');

    if (brand) {
      queryBuilder.andWhere('post.brand = :brand', { brand });
    }
    if (platform) {
      queryBuilder.andWhere('post.platform = :platform', { platform });
    }
    if (status) {
      queryBuilder.andWhere('post.status = :status', { status });
    }
    if (dueDateFrom || dueDateTo) {
      queryBuilder.andWhere('post.dueDate BETWEEN :from AND :to', {
        from: dueDateFrom ? new Date(dueDateFrom) : new Date(0),
        to: dueDateTo ? new Date(dueDateTo) : new Date('2099-12-31'),
      });
    }

    if (cursor) {
      const decodedCursor = Buffer.from(cursor, 'base64').toString('ascii');
      const [cursorValue, cursorId] = decodedCursor.split('_');

      if (order === SortOrder.DESC) {
        queryBuilder.andWhere(
          `(post.${sortBy} < :cursorValue) OR (post.${sortBy} = :cursorValue AND post.id < :cursorId)`,
          { cursorValue, cursorId },
        );
      } else {
        queryBuilder.andWhere(
          `(post.${sortBy} > :cursorValue) OR (post.${sortBy} = :cursorValue AND post.id > :cursorId)`,
          { cursorValue, cursorId },
        );
      }
    }

    queryBuilder
      .orderBy(`post.${sortBy}`, order)
      .addOrderBy('post.id', order) // Secondary sort by ID for stability
      .take(limit + 1); // Take one extra to determine if there are more results

    const posts = await queryBuilder.getMany();

    const hasMore = posts.length > limit;
    const items = hasMore ? posts.slice(0, -1) : posts;

    let nextCursor: string | undefined;
    if (hasMore && items.length > 0) {
      const lastItem = items[items.length - 1];
      const cursorValue = lastItem[sortBy];
      nextCursor = Buffer.from(`${cursorValue}_${lastItem.id}`).toString(
        'base64',
      );
    }

    const total = await queryBuilder.getCount();

    return {
      data: items,
      meta: {
        hasMore,
        nextCursor,
        total,
      },
    };
  }

  async findOne(id: string): Promise<Post> {
    const post = await this.postRepository.findOne({ where: { id } });
    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }
    return post;
  }

  private async createVersion(
    post: Post,
    changeReason?: string,
    changedBy?: string,
  ): Promise<PostVersion> {
    try {
      const version = this.postVersionRepository.create({
        postId: post.id,
        title: post.title,
        content: post.content,
        brand: post.brand,
        platform: post.platform,
        dueDate: post.dueDate,
        payment: post.payment,
        status: post.status,
        changeReason,
        changedBy,
      });

      return await this.postVersionRepository.save(version);
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to create version history',
        error.message,
      );
    }
  }

  async update(
    id: string,
    updatePostDto: UpdatePostDto,
    changeReason?: string,
    changedBy?: string,
  ): Promise<Post> {
    const post = await this.findOne(id);

    // Create a version before updating
    await this.createVersion(post, changeReason, changedBy);

    // Update the post
    Object.assign(post, updatePostDto);
    return await this.postRepository.save(post);
  }

  async getVersionHistory(postId: string): Promise<PostVersion[]> {
    await this.findOne(postId);

    return await this.postVersionRepository.find({
      where: { postId },
      order: { createdAt: 'DESC' },
    });
  }

  private isCurrentState(post: Post, version: PostVersion): boolean {
    return (
      post.title === version.title &&
      post.content === version.content &&
      post.brand === version.brand &&
      post.platform === version.platform &&
      post.dueDate.getTime() === version.dueDate.getTime() &&
      post.payment === version.payment &&
      post.status === version.status
    );
  }

  async revertToVersion(postId: string, versionId: string): Promise<Post> {
    const post = await this.findOne(postId);

    const version = await this.postVersionRepository.findOne({
      where: { id: versionId, postId },
    });

    if (!version) {
      throw new NotFoundException('Version not found');
    }

    if (this.isCurrentState(post, version)) {
      throw new BadRequestException(
        'Cannot revert to version as it matches current state',
      );
    }

    try {
      // Create a version of the current state before reverting
      await this.createVersion(post, `Reverted to version ${versionId}`);

      // Revert to the selected version
      const revertData = {
        title: version.title,
        content: version.content,
        brand: version.brand,
        platform: version.platform,
        dueDate: version.dueDate,
        payment: version.payment,
        status: version.status,
      };

      Object.assign(post, revertData);
      return await this.postRepository.save(post);
    } catch (error) {
      // Handle potential database errors
      throw new InternalServerErrorException(
        'Failed to revert to previous version',
      );
    }
  }

  async remove(id: string): Promise<void> {
    const result = await this.postRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }
  }
}
