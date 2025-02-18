import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggingService } from './logging.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly loggingService: LoggingService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, path, ip } = req;
    const userAgent = req.get('user-agent') || '';
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: (data) => {
          const response = context.switchToHttp().getResponse();
          const duration = Date.now() - start;
          this.loggingService.info(`${method} ${path}`, {
            duration,
            statusCode: response.statusCode,
            ip,
            userAgent,
          });
        },
        error: (error) => {
          const duration = Date.now() - start;
          this.loggingService.error(`${method} ${path}`, error, {
            duration,
            ip,
            userAgent,
          });
        },
      }),
    );
  }
}
