import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsEnum,
  IsNumber,
  IsNotEmpty,
  Min,
  IsDate,
} from 'class-validator';
import { TransformDate } from '../../../common/date.transformer';

export enum Platform {
  INSTAGRAM = 'INSTAGRAM',
  FACEBOOK = 'FACEBOOK',
  TWITTER = 'TWITTER',
  LINKEDIN = 'LINKEDIN',
  TIKTOK = 'TIKTOK',
}

export enum PostStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  PUBLISHED = 'PUBLISHED',
  CANCELLED = 'CANCELLED',
}

export class CreatePostDto {
  @ApiProperty({ description: 'Title of the social media post' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Content of the post' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ description: 'Brand associated with the post' })
  @IsString()
  @IsNotEmpty()
  brand: string;

  @ApiProperty({ enum: Platform, description: 'Social media platform' })
  @IsEnum(Platform)
  platform: Platform;

  @ApiProperty({
    description: 'Due date for post publication',
    example: '2025-02-17',
    type: Date,
  })
  @IsDate()
  @Type(() => Date)
  @TransformDate()
  dueDate: Date;

  @ApiProperty({ description: 'Payment amount for the post', minimum: 0 })
  @IsNumber()
  @Min(0)
  payment: number;

  @ApiProperty({ enum: PostStatus, default: PostStatus.DRAFT })
  @IsEnum(PostStatus)
  status: PostStatus;
}
