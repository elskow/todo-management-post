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
  private server?: any;

  constructor(
    private moduleRef: ModuleRef,
    @InjectDataSource() private dataSource: DataSource,
    @Optional()
    @InjectQueue('analytics')
    private analyticsQueue: Queue | undefined,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  setServer(server: any) {
    this.server = server;
  }

  async onApplicationShutdown(signal?: string): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }
    this.isShuttingDown = true;

    this.logger.log(`Starting cleanup with signal: ${signal}`);

    try {
      if (this.server) {
        await new Promise<void>((resolve) => {
          this.server.close(() => {
            this.logger.log('HTTP server closed');
            resolve();
          });
        });
      }

      await Promise.race([
        this.performCleanup(),
        this.timeoutPromise(this.SHUTDOWN_TIMEOUT),
      ]);

      this.logger.log('Application closed successfully');

      await new Promise((resolve) => setTimeout(resolve, 100));
      process.exit(0);
    } catch (error) {
      if (error.message === 'SHUTDOWN_TIMEOUT') {
        this.logger.error('Shutdown timeout reached, forcing exit');
      } else {
        this.logger.error(`Error during cleanup: ${error}`);
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
      process.exit(1);
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
