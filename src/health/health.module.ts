import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { HealthController } from './health.controller';
import { RedisHealthIndicator } from './redis.health';
import { CronHealthIndicator } from './cron.health';

@Module({
  imports: [
    TerminusModule,
    TypeOrmModule,
    BullModule.registerQueue({
      name: 'analytics',
    }),
  ],
  controllers: [HealthController],
  providers: [RedisHealthIndicator, CronHealthIndicator],
})
export class HealthModule {}
