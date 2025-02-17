import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
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
        throw new Error("Method not implemented.");
    }

    async findOne(id: string): Promise<Post> {
        throw new Error("Method not implemented.");
    }

    async update(id: string, updatePostDto: UpdatePostDto): Promise<Post> {
        throw new Error("Method not implemented.");
    }

    async remove(id: string): Promise<void> {
        throw new Error("Method not implemented.");
    }
}