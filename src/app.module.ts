import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { PostModule } from './post/post.module';
import { MetricsModule } from './common/metrics/metrics.module';
import { HealthModule } from './health/health.module';
import { ShutdownService } from './common/shutdown.service';
import databaseConfig from './config/db.config';
import { Post } from './post/core/post.entity';
import { PostVersion } from './post/core/post-version.entity';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [databaseConfig],
      isGlobal: true,
    }),
    CacheModule.register({
      isGlobal: true,
      ttl: 60,
    }),
    ScheduleModule.forRoot(),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'analytics',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule, HealthModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.database'),
        entities: [Post, PostVersion],
        migrations: [join(__dirname, 'migrations', '*.js')],
        migrationsTableName: 'migrations_typeorm',
        migrationsRun: true,
      }),
      inject: [ConfigService],
    }),
    PostModule,
    HealthModule,
    MetricsModule,
  ],
  providers: [
    ShutdownService,
    {
      provide: 'SHUTDOWN_TIMEOUT',
      useValue: 30000,
    },
  ],
})
export class AppModule {}
