import { Injectable } from '@nestjs/common';
import { getTelemetryService } from '../telemetry/telemetry.instance';
import * as winston from 'winston';

export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'verbose';

@Injectable()
export class LoggingService {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      defaultMeta: {
        service: 'todo-post-service',
        environment: process.env.NODE_ENV || 'development',
      },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
          ),
        }),
      ],
    });
  }

  log(level: LogLevel, message: string, context?: any) {
    const telemetryService = getTelemetryService();
    const span = telemetryService.getActiveSpan();
    const traceId = span?.spanContext().traceId;
    const spanId = span?.spanContext().spanId;

    const logData = {
      message,
      level,
      context,
      traceId,
      spanId,
      timestamp: new Date().toISOString(),
    };

    this.logger.log(level, message, { ...logData, ...context });
  }

  error(message: string, error?: Error, context?: any) {
    this.log('error', message, {
      ...context,
      error: {
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
      },
    });
  }

  warn(message: string, context?: any) {
    this.log('warn', message, context);
  }

  info(message: string, context?: any) {
    this.log('info', message, context);
  }

  debug(message: string, context?: any) {
    this.log('debug', message, context);
  }

  verbose(message: string, context?: any) {
    this.log('verbose', message, context);
  }
}
