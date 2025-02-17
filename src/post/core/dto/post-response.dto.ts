import { ApiProperty } from '@nestjs/swagger';
import { Platform, PostStatus } from './create-post.dto';

export class PostResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  brand: string;

  @ApiProperty({ enum: Platform })
  platform: Platform;

  @ApiProperty()
  dueDate: Date;

  @ApiProperty()
  payment: number;

  @ApiProperty({ enum: PostStatus })
  status: PostStatus;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
