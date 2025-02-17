import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere } from 'typeorm';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { QueryPostsDto } from './dto/query-posts.dto';
import { Post } from './post.entity';
import { PaginatedPostsResponseDto } from './dto/paginated-response.dto';
import { PostVersion } from './post-version.entity';

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

  async findAll(query: QueryPostsDto): Promise<PaginatedPostsResponseDto> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      order = 'DESC',
      brand,
      platform,
      status,
      dueDateFrom,
      dueDateTo,
    } = query;

    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (brand) {
      whereClause.brand = brand;
    }
    if (platform) {
      whereClause.platform = platform;
    }
    if (status) {
      whereClause.status = status;
    }
    if (dueDateFrom || dueDateTo) {
      whereClause.dueDate = Between(
        dueDateFrom ? new Date(dueDateFrom) : new Date(0),
        dueDateTo ? new Date(dueDateTo) : new Date('2099-12-31'),
      );
    }

    const [posts, total] = await this.postRepository.findAndCount({
      where: whereClause,
      order: { [sortBy]: order },
      skip,
      take: limit,
    });

    const lastPage = Math.ceil(total / limit);

    return {
      data: posts,
      meta: {
        total,
        page,
        lastPage,
        limit,
        hasPreviousPage: page > 1,
        hasNextPage: page < lastPage,
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
    return await this.postVersionRepository.find({
      where: { postId },
      order: { createdAt: 'DESC' },
    });
  }

  async revertToVersion(postId: string, versionId: string): Promise<Post> {
    const version = await this.postVersionRepository.findOne({
      where: { id: versionId, postId },
    });

    if (!version) {
      throw new NotFoundException('Version not found');
    }

    const post = await this.findOne(postId);

    // Create a version of the current state before reverting
    await this.createVersion(post, 'Reverted to previous version');

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
  }

  async remove(id: string): Promise<void> {
    const result = await this.postRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }
  }
}
