import {
  SEMATTRS_CODE_FILEPATH,
  SEMATTRS_CODE_FUNCTION,
  SEMATTRS_CODE_NAMESPACE,
} from '@opentelemetry/semantic-conventions';
import { SpanKind } from '@opentelemetry/api';
import { getTelemetryService } from './telemetry.instance';

export interface TraceOptions {
  name?: string;
  kind?: SpanKind;
  attributes?: Record<string, any>;
}

export function Trace(options: TraceOptions = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const telemetryService = getTelemetryService();
      const spanName =
        options.name || `${target.constructor.name}.${propertyKey}`;

      return await telemetryService.withActiveSpan(
        spanName,
        {
          kind: options.kind || SpanKind.INTERNAL,
          attributes: {
            [SEMATTRS_CODE_FUNCTION]: propertyKey,
            [SEMATTRS_CODE_NAMESPACE]: target.constructor.name,
            [SEMATTRS_CODE_FILEPATH]: __filename,
            ...options.attributes,
          },
        },
        async (span) => {
          try {
            const sanitizedArgs = sanitizeArgs(args);
            telemetryService.addSpanAttributes(span, {
              'function.arguments': JSON.stringify(sanitizedArgs),
            });

            const result = await originalMethod.apply(this, args);

            if (shouldAddResult(result)) {
              telemetryService.addSpanAttributes(span, {
                'function.result': JSON.stringify(result),
              });
            }

            return result;
          } catch (error) {
            telemetryService.setSpanError(span, error);
            throw error;
          }
        },
      );
    };

    return descriptor;
  };
}

function sanitizeArgs(args: any[]): any[] {
  return args.map((arg) => {
    if (arg === null || arg === undefined) return arg;
    if (typeof arg === 'object') {
      // Remove sensitive data
      const cleaned = { ...arg };
      delete cleaned.password;
      delete cleaned.token;
      return cleaned;
    }
    return arg;
  });
}

function shouldAddResult(result: any): boolean {
  // Add logic to determine if result should be added to span
  // Avoid adding sensitive or too large data
  return (
    result &&
    typeof result === 'object' &&
    !result.password &&
    !result.token &&
    JSON.stringify(result).length < 1000
  );
}
