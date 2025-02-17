import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostsService } from './post.service';
import { Post } from './post.entity';
import { CreatePostDto, Platform, PostStatus } from './dto/create-post.dto';
import { NotFoundException } from '@nestjs/common';
import { SortOrder } from '../common/pagination.dto';

describe('PostsService', () => {
    let service: PostsService;
    let repository: Repository<Post>;

    const mockPost: Post = {
        id: '1',
        title: 'Test Post',
        content: 'Test Content',
        brand: 'Test Brand',
        platform: Platform.INSTAGRAM,
        dueDate: new Date('2025-02-17'),
        payment: 100,
        status: PostStatus.DRAFT,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const mockCreatePostDto: CreatePostDto = {
        title: 'Test Post',
        content: 'Test Content',
        brand: 'Test Brand',
        platform: Platform.INSTAGRAM,
        dueDate: new Date('2025-02-17'),
        payment: 100,
        status: PostStatus.DRAFT,
    };

    const mockRepository = {
        create: jest.fn(),
        save: jest.fn(),
        findAndCount: jest.fn(),
        findOne: jest.fn(),
        delete: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PostsService,
                {
                    provide: getRepositoryToken(Post),
                    useValue: mockRepository,
                },
            ],
        }).compile();

        service = module.get<PostsService>(PostsService);
        repository = module.get<Repository<Post>>(getRepositoryToken(Post));
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should create a new post', async () => {
            mockRepository.create.mockReturnValue(mockPost);
            mockRepository.save.mockResolvedValue(mockPost);

            const result = await service.create(mockCreatePostDto);

            expect(result).toEqual(mockPost);
            expect(mockRepository.create).toHaveBeenCalledWith(mockCreatePostDto);
            expect(mockRepository.save).toHaveBeenCalledWith(mockPost);
        });
    });

    describe('findAll', () => {
        it('should return paginated posts with default pagination', async () => {
            const mockPosts = [mockPost];
            const totalPosts = 1;
            mockRepository.findAndCount.mockResolvedValue([mockPosts, totalPosts]);

            const result = await service.findAll({});

            expect(result).toEqual({
                data: mockPosts,
                meta: {
                    total: totalPosts,
                    page: 1,
                    lastPage: 1,
                    limit: 10,
                    hasPreviousPage: false,
                    hasNextPage: false,
                },
            });

            expect(mockRepository.findAndCount).toHaveBeenCalledWith({
                where: {},
                order: { createdAt: SortOrder.DESC },
                skip: 0,
                take: 10,
            });
        });

        it('should return paginated posts with custom pagination and filters', async () => {
            const mockPosts = [mockPost];
            const totalPosts = 1;
            const query = {
                page: 2,
                limit: 5,
                sortBy: 'title',
                order: SortOrder.ASC,
                brand: 'Test Brand',
                platform: Platform.INSTAGRAM,
                status: PostStatus.DRAFT,
            };

            mockRepository.findAndCount.mockResolvedValue([mockPosts, totalPosts]);

            const result = await service.findAll(query);

            expect(result).toEqual({
                data: mockPosts,
                meta: {
                    total: totalPosts,
                    page: 2,
                    lastPage: 1,
                    limit: 5,
                    hasPreviousPage: true,
                    hasNextPage: false,
                },
            });

            expect(mockRepository.findAndCount).toHaveBeenCalledWith({
                where: {
                    brand: query.brand,
                    platform: query.platform,
                    status: query.status,
                },
                order: { [query.sortBy]: query.order },
                skip: 5,
                take: 5,
            });
        });

        it('should handle date range filters', async () => {
            const mockPosts = [mockPost];
            const totalPosts = 1;
            const dueDateFrom = new Date('2025-01-01');
            const dueDateTo = new Date('2025-12-31');

            mockRepository.findAndCount.mockResolvedValue([mockPosts, totalPosts]);

            const result = await service.findAll({
                dueDateFrom,
                dueDateTo,
            });

            expect(result.data).toEqual(mockPosts);
            expect(mockRepository.findAndCount).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        dueDate: expect.any(Object),
                    },
                }),
            );
        });
    });

    describe('findOne', () => {
        it('should return a single post', async () => {
            mockRepository.findOne.mockResolvedValue(mockPost);

            const result = await service.findOne('1');

            expect(result).toEqual(mockPost);
            expect(mockRepository.findOne).toHaveBeenCalledWith({
                where: { id: '1' },
            });
        });

        it('should throw NotFoundException when post is not found', async () => {
            mockRepository.findOne.mockResolvedValue(null);

            await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
        });
    });

    describe('update', () => {
        it('should update a post', async () => {
            const updateDto = { title: 'Updated Title' };
            const updatedPost = { ...mockPost, ...updateDto };

            mockRepository.findOne.mockResolvedValue(mockPost);
            mockRepository.save.mockResolvedValue(updatedPost);

            const result = await service.update('1', updateDto);

            expect(result).toEqual(updatedPost);
            expect(mockRepository.save).toHaveBeenCalledWith({
                ...mockPost,
                ...updateDto,
            });
        });

        it('should throw NotFoundException when updating non-existent post', async () => {
            mockRepository.findOne.mockResolvedValue(null);

            await expect(service.update('1', {})).rejects.toThrow(NotFoundException);
        });
    });

    describe('remove', () => {
        it('should delete a post', async () => {
            mockRepository.delete.mockResolvedValue({ affected: 1 });

            await service.remove('1');

            expect(mockRepository.delete).toHaveBeenCalledWith('1');
        });

        it('should throw NotFoundException when deleting non-existent post', async () => {
            mockRepository.delete.mockResolvedValue({ affected: 0 });

            await expect(service.remove('1')).rejects.toThrow(NotFoundException);
        });
    });
});