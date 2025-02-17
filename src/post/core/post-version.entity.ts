import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Post } from './post.entity';
import { Platform, PostStatus } from './dto/create-post.dto';

@Entity('post_versions')
@Index(['postId', 'createdAt'])
export class PostVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  postId: string;

  @ManyToOne(() => Post, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post: Post;

  @Column()
  title: string;

  @Column('text')
  content: string;

  @Column()
  brand: string;

  @Column({
    type: 'enum',
    enum: Platform,
  })
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
  })
  status: PostStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  changeReason: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  changedBy: string;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  @Index()
  createdAt: Date;
}
