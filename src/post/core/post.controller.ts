import {
  Controller,
  Get,
  Post as HttpPost,
  Put,
  Delete,
  Param,
  Body,
  Headers,
  HttpStatus,
  HttpCode,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PostsService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { QueryPostsDto } from './dto/query-posts.dto';
import { PostResponseDto } from './dto/post-response.dto';
import { PostVersion } from './post-version.entity';
import { PaginatedResponseDto } from '@app/common/pagination.dto';
import { Post } from './post.entity';

@ApiTags('posts')
@ApiBearerAuth()
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @HttpPost()
  @ApiOperation({ summary: 'Create a new post' })
  @ApiResponse({ status: HttpStatus.CREATED, type: PostResponseDto })
  create(@Body() createPostDto: CreatePostDto): Promise<PostResponseDto> {
    return this.postsService.create(createPostDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all posts with filters and pagination' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Posts retrieved successfully',
    type: PaginatedResponseDto<PostResponseDto>,
  })
  async findAll(
    @Query() query: QueryPostsDto,
  ): Promise<PaginatedResponseDto<PostResponseDto>> {
    const posts = await this.postsService.findAll(query);
    return {
      data: posts.data.map((post) => this.mapToResponseDto(post)),
      meta: posts.meta,
    };
  }

  private mapToResponseDto(post: Post): PostResponseDto {
    return {
      id: post.id,
      title: post.title,
      content: post.content,
      brand: post.brand,
      platform: post.platform,
      dueDate: post.dueDate,
      payment: post.payment,
      status: post.status,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a post by ID' })
  @ApiResponse({ status: HttpStatus.OK, type: PostResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Post not found' })
  findOne(@Param('id') id: string): Promise<PostResponseDto> {
    return this.postsService.findOne(id);
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'Get version history of a post' })
  @ApiResponse({ status: HttpStatus.OK, type: [PostVersion] })
  getVersionHistory(@Param('id') id: string): Promise<PostVersion[]> {
    return this.postsService.getVersionHistory(id);
  }

  @Put(':id/revert/:versionId')
  @ApiOperation({ summary: 'Revert post to a specific version' })
  @ApiResponse({ status: HttpStatus.OK, type: PostResponseDto })
  revertToVersion(
    @Param('id') id: string,
    @Param('versionId') versionId: string,
  ): Promise<PostResponseDto> {
    return this.postsService.revertToVersion(id, versionId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a post' })
  @ApiResponse({ status: HttpStatus.OK, type: PostResponseDto })
  update(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
    @Headers('X-Change-Reason') changeReason?: string,
    @Headers('X-Changed-By') changedBy?: string,
  ): Promise<PostResponseDto> {
    return this.postsService.update(id, updatePostDto, changeReason, changedBy);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a post' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Post not found' })
  remove(@Param('id') id: string): Promise<void> {
    return this.postsService.remove(id);
  }
}
