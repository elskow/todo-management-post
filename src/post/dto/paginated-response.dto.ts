import { ApiProperty } from '@nestjs/swagger';
import { PostResponseDto } from './post-response.dto';

export class PaginationMeta {
    @ApiProperty()
    total: number;

    @ApiProperty()
    page: number;

    @ApiProperty()
    lastPage: number;

    @ApiProperty()
    limit: number;

    @ApiProperty()
    hasPreviousPage: boolean;

    @ApiProperty()
    hasNextPage: boolean;
}

export class PaginatedPostsResponseDto {
    @ApiProperty({ type: [PostResponseDto] })
    data: PostResponseDto[];

    @ApiProperty()
    meta: PaginationMeta;
}