import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere } from 'typeorm';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { QueryPostsDto } from './dto/query-posts.dto';
import { Post } from './post.entity';

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

    async findAll(query: QueryPostsDto): Promise<Post[]> {
        const whereClause: FindOptionsWhere<Post> = {};

        if (query.brand) {
            whereClause.brand = query.brand;
        }
        if (query.platform) {
            whereClause.platform = query.platform;
        }
        if (query.status) {
            whereClause.status = query.status;
        }
        if (query.dueDateFrom || query.dueDateTo) {
            whereClause.dueDate = Between(
                query.dueDateFrom ? new Date(query.dueDateFrom) : new Date(0),
                query.dueDateTo ? new Date(query.dueDateTo) : new Date('2099-12-31'),
            );
        }

        return await this.postRepository.find({
            where: whereClause,
            order: {
                createdAt: 'DESC',
            },
        });
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
