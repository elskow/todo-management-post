import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Platform, PostStatus } from './dto/create-post.dto';

@Entity('posts')
@Index(['brand', 'platform', 'status'])
@Index(['createdAt'])
@Index(['dueDate'])
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  title: string;

  @Column('text')
  content: string;

  @Column()
  @Index()
  brand: string;

  @Column({
    type: 'enum',
    enum: Platform,
  })
  @Index()
  platform: Platform;

  @Column({
    type: 'datetime',
  })
  dueDate: Date;

  @Column('decimal', { precision: 10, scale: 2 })
  payment: number;

  @Column({
    type: 'enum',
    enum: PostStatus,
    default: PostStatus.DRAFT,
  })
  @Index()
  status: PostStatus;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    name: 'createdAt',
  })
  createdAt: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
    name: 'updatedAt',
  })
  updatedAt: Date;
}
