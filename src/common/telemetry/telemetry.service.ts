import { Injectable } from '@nestjs/common';
import {
  trace,
  Tracer,
  SpanKind,
  Span,
  Context,
  SpanStatusCode,
} from '@opentelemetry/api';
import { TraceContextManager } from './trace-context.manager';

@Injectable()
export class TelemetryService {
  private readonly tracer: Tracer;

  constructor(private readonly contextManager: TraceContextManager) {
    this.tracer = trace.getTracer('todo-post-service');
  }

  getActiveSpan(): Span | undefined {
    return this.contextManager.getActiveSpan();
  }

  startSpan(
    name: string,
    options: {
      kind?: SpanKind;
      attributes?: Record<string, any>;
      context?: Context;
    },
  ) {
    const context = options.context || this.contextManager.getActiveContext();
    return this.tracer.startSpan(
      name,
      {
        kind: options.kind || SpanKind.INTERNAL,
        attributes: options.attributes,
      },
      context,
    );
  }

  async withActiveSpan<T>(
    name: string,
    options: {
      kind?: SpanKind;
      attributes?: Record<string, any>;
    },
    fn: (span: Span) => Promise<T>,
  ): Promise<T> {
    const span = this.startSpan(name, options);

    return this.contextManager.withContext(
      trace.setSpan(this.contextManager.getActiveContext(), span),
      async () => {
        try {
          const result = await fn(span);
          span.setStatus({ code: SpanStatusCode.OK });
          return result;
        } catch (error) {
          this.setSpanError(span, error);
          throw error;
        } finally {
          span.end();
        }
      },
    );
  }

  addSpanAttributes(span: Span, attributes: Record<string, any>) {
    Object.entries(attributes).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        span.setAttribute(key, value);
      }
    });
  }

  setSpanError(span: Span, error: Error) {
    span.recordException(error);
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error.message,
    });
  }
}
