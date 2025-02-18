import { Injectable, OnApplicationShutdown, Optional } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { Queue } from 'bull';
import { InjectDataSource } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bull';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Inject } from '@nestjs/common';

@Injectable()
export class ShutdownService implements OnApplicationShutdown {
  private readonly logger = new Logger(ShutdownService.name);
  private readonly SHUTDOWN_TIMEOUT = 30000; // 30 seconds
  private isShuttingDown = false;

  constructor(
    private moduleRef: ModuleRef,
    @InjectDataSource() private dataSource: DataSource,
    @Optional()
    @InjectQueue('analytics')
    private analyticsQueue: Queue | undefined,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async onApplicationShutdown(signal?: string) {
    if (this.isShuttingDown) {
      return;
    }
    this.isShuttingDown = true;

    this.logger.log(`Starting cleanup with signal: ${signal}`);

    try {
      await Promise.race([
        this.performCleanup(),
        this.timeoutPromise(this.SHUTDOWN_TIMEOUT),
      ]);
    } catch (error) {
      if (error.message === 'SHUTDOWN_TIMEOUT') {
        this.logger.error('Shutdown timeout reached, forcing exit');
      } else {
        this.logger.error(`Error during cleanup: ${error}`);
      }
    } finally {
      this.isShuttingDown = false;
    }
  }

  private async performCleanup(): Promise<void> {
    this.logger.log('Starting cleanup tasks...');

    try {
      if (this.analyticsQueue) {
        this.logger.log('Closing Bull queues...');
        await this.analyticsQueue.close();
        this.logger.log('Bull queues closed');
      }

      this.logger.log('Clearing cache...');
      await this.cacheManager.clear();
      this.logger.log('Cache cleared');

      if (this.dataSource?.isInitialized) {
        this.logger.log('Closing database connections...');
        try {
          await this.dataSource.destroy();
          this.logger.log('Database connections closed');
        } catch (dbError) {
          this.logger.warn(`Database cleanup warning: ${dbError.message}`);
        }
      }

      this.logger.log('All cleanup tasks completed successfully');
    } catch (error) {
      this.logger.error('Error during cleanup tasks', error);
      throw error;
    }
  }

  private timeoutPromise(timeout: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('SHUTDOWN_TIMEOUT'));
      }, timeout);
    });
  }
}
