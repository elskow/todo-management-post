import { Injectable } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';
import { SchedulerRegistry } from '@nestjs/schedule';

@Injectable()
export class CronHealthIndicator {
  constructor(
    private schedulerRegistry: SchedulerRegistry,
    private health: HealthIndicatorService,
  ) {}

  async isHealthy(key: string) {
    const indicator = this.health.check(key);

    try {
      const jobs = this.schedulerRegistry.getCronJobs();
      const activeJobs = Array.from(jobs.entries())
        .filter(([_, job]) => job.running)
        .map(([name]) => name);

      return indicator.up({
        activeJobs,
        jobCount: activeJobs.length,
      });
    } catch (error) {
      return indicator.down({
        message: error.message,
      });
    }
  }
}
