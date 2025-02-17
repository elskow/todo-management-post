import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsModule } from './post/post.module';
import databaseConfig from './config/db.config';
import { Post } from './post/post.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [databaseConfig],
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.database'),
        entities: [Post],
        migrations: ['dist/migrations/*.js'],
        migrationsTableName: 'migrations_typeorm',
        migrationsRun: true,
      }),
      inject: [ConfigService],
    }),
    PostsModule,
  ],
})
export class AppModule { }