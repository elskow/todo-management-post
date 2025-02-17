import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    HttpStatus,
    HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PostsService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { QueryPostsDto } from './dto/query-posts.dto';
import { PostResponseDto } from './dto/post-response.dto';
import { PaginatedPostsResponseDto } from './dto/paginated-response.dto';

@ApiTags('posts')
@ApiBearerAuth()
@Controller('posts')
export class PostsController {
    constructor(private readonly postsService: PostsService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new post' })
    @ApiResponse({ status: HttpStatus.CREATED, type: PostResponseDto })
    create(@Body() createPostDto: CreatePostDto): Promise<PostResponseDto> {
        return this.postsService.create(createPostDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all posts with filters and pagination' })
    @ApiResponse({ status: HttpStatus.OK, type: PaginatedPostsResponseDto })
    findAll(@Query() query: QueryPostsDto): Promise<PaginatedPostsResponseDto> {
        return this.postsService.findAll(query);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a post by ID' })
    @ApiResponse({ status: HttpStatus.OK, type: PostResponseDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Post not found' })
    findOne(@Param('id') id: string): Promise<PostResponseDto> {
        return this.postsService.findOne(id);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update a post' })
    @ApiResponse({ status: HttpStatus.OK, type: PostResponseDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Post not found' })
    update(
        @Param('id') id: string,
        @Body() updatePostDto: UpdatePostDto,
    ): Promise<PostResponseDto> {
        return this.postsService.update(id, updatePostDto);
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