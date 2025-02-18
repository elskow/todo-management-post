import {
  trace,
  SpanKind,
  SpanStatusCode,
  Context,
  Span,
} from '@opentelemetry/api';

export interface TraceOptions {
  name?: string;
  kind?: SpanKind;
  attributes?: Record<string, any>;
}

export function Trace(options: TraceOptions = {}) {
  const tracer = trace.getTracer('todo-post-service');

  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const spanName =
        options.name || `${target.constructor.name}.${propertyKey}`;

      return await tracer.startActiveSpan(
        spanName,
        {
          kind: options.kind || SpanKind.INTERNAL,
          attributes: {
            ...options.attributes,
            'code.function': propertyKey,
            'code.namespace': target.constructor.name,
          },
        },
        async (span: Span) => {
          try {
            // Add method parameters as span attributes
            args.forEach((arg, index) => {
              if (
                ['string', 'number', 'boolean'].includes(typeof arg) ||
                arg === null
              ) {
                span.setAttribute(`argument.${index}`, String(arg));
              }
            });

            const result = await originalMethod.apply(this, args);
            span.setStatus({ code: SpanStatusCode.OK });
            return result;
          } catch (error) {
            span.recordException(error);
            span.setStatus({
              code: SpanStatusCode.ERROR,
              message: error.message,
            });
            throw error;
          } finally {
            span.end();
          }
        },
      );
    };

    return descriptor;
  };
}
