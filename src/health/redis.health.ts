import { Injectable } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class RedisHealthIndicator {
  constructor(
    @InjectQueue('analytics') private analyticsQueue: Queue,
    private health: HealthIndicatorService,
  ) {}

  async isHealthy(key: string) {
    const indicator = this.health.check(key);

    try {
      const client = this.analyticsQueue.client;
      await client.ping();
      return indicator.up();
    } catch (error) {
      return indicator.down({
        message: error.message,
      });
    }
  }
}
