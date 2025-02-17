import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere } from 'typeorm';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { QueryPostsDto } from './dto/query-posts.dto';
import { Post } from './post.entity';
import { PaginatedPostsResponseDto } from './dto/paginated-response.dto';

@Injectable()
export class PostsService {
    constructor(
        @InjectRepository(Post)
        private postRepository: Repository<Post>,
    ) { }

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

    async update(id: string, updatePostDto: UpdatePostDto): Promise<Post> {
        const post = await this.findOne(id);
        Object.assign(post, updatePostDto);
        return await this.postRepository.save(post);
    }

    async remove(id: string): Promise<void> {
        const result = await this.postRepository.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`Post with ID ${id} not found`);
        }
    }
}
