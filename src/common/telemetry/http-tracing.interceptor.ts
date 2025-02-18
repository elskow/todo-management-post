import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { trace, SpanKind, SpanStatusCode } from '@opentelemetry/api';
import { TelemetryService } from './telemetry.service';

@Injectable()
export class HttpTracingInterceptor implements NestInterceptor {
  constructor(private readonly telemetryService: TelemetryService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, path, params, query, body, headers } = req;

    return new Observable((subscriber) => {
      this.telemetryService.withActiveSpan(
        `HTTP ${method} ${path}`,
        {
          kind: SpanKind.SERVER,
          attributes: {
            'http.method': method,
            'http.route': path,
            'http.params': JSON.stringify(params),
            'http.query': JSON.stringify(query),
            'http.body': body ? JSON.stringify(body) : undefined,
            'http.user_agent': headers['user-agent'],
          },
        },
        async (span) => {
          try {
            next.handle().subscribe({
              next: (value) => {
                const response = context.switchToHttp().getResponse();
                this.telemetryService.addSpanAttributes(span, {
                  'http.status_code': response.statusCode,
                });
                subscriber.next(value);
              },
              error: (error) => {
                this.telemetryService.setSpanError(span, error);
                subscriber.error(error);
              },
              complete: () => subscriber.complete(),
            });
          } catch (error) {
            this.telemetryService.setSpanError(span, error);
            throw error;
          }
        },
      );
    });
  }
}
