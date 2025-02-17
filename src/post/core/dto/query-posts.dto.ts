import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { Platform, PostStatus } from './create-post.dto';
import { TransformDate } from '@common/date.transformer';
import { CursorPaginationDto } from '@common/pagination.dto';

export class QueryPostsDto extends CursorPaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ enum: Platform })
  @IsOptional()
  @IsEnum(Platform)
  platform?: Platform;

  @ApiPropertyOptional({ enum: PostStatus })
  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;

  @ApiPropertyOptional({
    description: 'Filter posts from this date',
    example: '2025-02-17',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  @TransformDate()
  dueDateFrom?: Date;

  @ApiPropertyOptional({
    description: 'Filter posts until this date',
    example: '2025-02-17',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  @TransformDate()
  dueDateTo?: Date;
}
