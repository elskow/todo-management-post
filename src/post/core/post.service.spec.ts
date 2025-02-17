import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostsService } from './post.service';
import { Post } from './post.entity';
import { PostVersion } from './post-version.entity';
import { CreatePostDto, Platform, PostStatus } from './dto/create-post.dto';
import { NotFoundException } from '@nestjs/common';
import { SortOrder } from '@common/pagination.dto';

describe('PostsService', () => {
  let service: PostsService;
  let postRepository: Repository<Post>;
  let versionRepository: Repository<PostVersion>;

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

  const mockVersion: PostVersion = {
    id: 'version-1',
    postId: '1',
    post: mockPost,
    title: 'Test Post',
    content: 'Test Content',
    brand: 'Test Brand',
    platform: Platform.INSTAGRAM,
    dueDate: new Date('2025-02-17'),
    payment: 100,
    status: PostStatus.DRAFT,
    changeReason: 'Initial version',
    changedBy: 'test-user',
    createdAt: new Date(),
  };

  const mockPostRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
  };

  const mockVersionRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        {
          provide: getRepositoryToken(Post),
          useValue: mockPostRepository,
        },
        {
          provide: getRepositoryToken(PostVersion),
          useValue: mockVersionRepository,
        },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
    postRepository = module.get<Repository<Post>>(getRepositoryToken(Post));
    versionRepository = module.get<Repository<PostVersion>>(
      getRepositoryToken(PostVersion),
    );

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new post', async () => {
      mockPostRepository.create.mockReturnValue(mockPost);
      mockPostRepository.save.mockResolvedValue(mockPost);

      const result = await service.create(mockCreatePostDto);

      expect(result).toEqual(mockPost);
      expect(mockPostRepository.create).toHaveBeenCalledWith(mockCreatePostDto);
      expect(mockPostRepository.save).toHaveBeenCalledWith(mockPost);
    });
  });

  describe('findAll', () => {
    it('should return paginated posts with default pagination', async () => {
      const mockPosts = [mockPost];
      const totalPosts = 1;
      mockPostRepository.findAndCount.mockResolvedValue([
        mockPosts,
        totalPosts,
      ]);

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

      expect(mockPostRepository.findAndCount).toHaveBeenCalledWith({
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

      mockPostRepository.findAndCount.mockResolvedValue([
        mockPosts,
        totalPosts,
      ]);

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

      expect(mockPostRepository.findAndCount).toHaveBeenCalledWith({
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

      mockPostRepository.findAndCount.mockResolvedValue([
        mockPosts,
        totalPosts,
      ]);

      const result = await service.findAll({
        dueDateFrom,
        dueDateTo,
      });

      expect(result.data).toEqual(mockPosts);
      expect(mockPostRepository.findAndCount).toHaveBeenCalledWith(
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
      mockPostRepository.findOne.mockResolvedValue(mockPost);

      const result = await service.findOne('1');

      expect(result).toEqual(mockPost);
      expect(mockPostRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should throw NotFoundException when post is not found', async () => {
      mockPostRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a post', async () => {
      const updateDto = { title: 'Updated Title' };
      const updatedPost = { ...mockPost, ...updateDto };

      mockPostRepository.findOne.mockResolvedValue(mockPost);
      mockPostRepository.save.mockResolvedValue(updatedPost);

      const result = await service.update('1', updateDto);

      expect(result).toEqual(updatedPost);
      expect(mockPostRepository.save).toHaveBeenCalledWith({
        ...mockPost,
        ...updateDto,
      });
    });

    it('should throw NotFoundException when updating non-existent post', async () => {
      mockPostRepository.findOne.mockResolvedValue(null);

      await expect(service.update('1', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a post', async () => {
      mockPostRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove('1');

      expect(mockPostRepository.delete).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException when deleting non-existent post', async () => {
      mockPostRepository.delete.mockResolvedValue({ affected: 0 });

      await expect(service.remove('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('versioning', () => {
    describe('update with versioning', () => {
      it('should create a version before updating the post', async () => {
        const updateDto = { title: 'Updated Title' };
        const updatedPost = { ...mockPost, ...updateDto };
        const changeReason = 'Update title';
        const changedBy = 'test-user';

        mockPostRepository.findOne.mockResolvedValue(mockPost);
        mockVersionRepository.create.mockReturnValue(mockVersion);
        mockVersionRepository.save.mockResolvedValue(mockVersion);
        mockPostRepository.save.mockResolvedValue(updatedPost);

        const result = await service.update(
          '1',
          updateDto,
          changeReason,
          changedBy,
        );

        expect(mockVersionRepository.create).toHaveBeenCalledWith({
          postId: mockPost.id,
          title: mockPost.title,
          content: mockPost.content,
          brand: mockPost.brand,
          platform: mockPost.platform,
          dueDate: mockPost.dueDate,
          payment: mockPost.payment,
          status: mockPost.status,
          changeReason,
          changedBy,
        });
        expect(mockVersionRepository.save).toHaveBeenCalled();
        expect(result).toEqual(updatedPost);
      });
    });

    describe('getVersionHistory', () => {
      it('should return version history for a post', async () => {
        const versions = [mockVersion];
        mockVersionRepository.find.mockResolvedValue(versions);

        const result = await service.getVersionHistory('1');

        expect(result).toEqual(versions);
        expect(mockVersionRepository.find).toHaveBeenCalledWith({
          where: { postId: '1' },
          order: { createdAt: 'DESC' },
        });
      });

      it('should return empty array when no versions exist', async () => {
        mockVersionRepository.find.mockResolvedValue([]);

        const result = await service.getVersionHistory('1');

        expect(result).toEqual([]);
      });
    });

    describe('revertToVersion', () => {
      it('should revert post to a specific version', async () => {
        const currentPost = { ...mockPost, title: 'Updated Title' };
        const revertedPost = { ...mockPost };

        mockVersionRepository.findOne.mockResolvedValue(mockVersion);
        mockPostRepository.findOne.mockResolvedValue(currentPost);
        mockVersionRepository.create.mockReturnValue({
          ...mockVersion,
          changeReason: 'Reverted to previous version',
        });
        mockVersionRepository.save.mockResolvedValue(mockVersion);
        mockPostRepository.save.mockResolvedValue(revertedPost);

        const result = await service.revertToVersion('1', 'version-1');

        expect(mockVersionRepository.findOne).toHaveBeenCalledWith({
          where: { id: 'version-1', postId: '1' },
        });
        expect(mockVersionRepository.create).toHaveBeenCalled();
        expect(mockVersionRepository.save).toHaveBeenCalled();
        expect(result).toEqual(revertedPost);
      });

      it('should throw NotFoundException when version not found', async () => {
        mockVersionRepository.findOne.mockResolvedValue(null);

        await expect(
          service.revertToVersion('1', 'non-existent-version'),
        ).rejects.toThrow(NotFoundException);
      });

      it('should throw NotFoundException when post not found', async () => {
        mockVersionRepository.findOne.mockResolvedValue(mockVersion);
        mockPostRepository.findOne.mockResolvedValue(null);

        await expect(service.revertToVersion('1', 'version-1')).rejects.toThrow(
          NotFoundException,
        );
      });
    });

    describe('remove with versioning', () => {
      it('should delete post and its versions (cascade)', async () => {
        mockPostRepository.delete.mockResolvedValue({ affected: 1 });

        await service.remove('1');

        expect(mockPostRepository.delete).toHaveBeenCalledWith('1');
      });
    });
  });
});
