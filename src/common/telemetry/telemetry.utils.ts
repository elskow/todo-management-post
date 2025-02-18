import { TELEMETRY_CONSTANTS } from './telemetry.constants';

export class TelemetryUtils {
  static sanitizeObject(obj: any): any {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    const cleaned = Array.isArray(obj) ? [...obj] : { ...obj };

    for (const key in cleaned) {
      if (TELEMETRY_CONSTANTS.SENSITIVE_FIELDS.includes(key.toLowerCase())) {
        cleaned[key] = '[REDACTED]';
      } else if (typeof cleaned[key] === 'object') {
        cleaned[key] = TelemetryUtils.sanitizeObject(cleaned[key]);
      }
    }

    return cleaned;
  }

  static truncateString(str: string, maxLength: number = 1000): string {
    if (str.length <= maxLength) return str;
    return `${str.substring(0, maxLength)}...`;
  }

  static isValidResult(result: any): boolean {
    if (!result || typeof result !== 'object') return false;

    // Check if result contains sensitive data
    const stringified = JSON.stringify(result);
    if (stringified.length > TELEMETRY_CONSTANTS.MAX_RESULT_SIZE) return false;

    // Check if result contains any sensitive fields
    return !TELEMETRY_CONSTANTS.SENSITIVE_FIELDS.some((field) =>
      stringified.toLowerCase().includes(field.toLowerCase()),
    );
  }

  static formatError(error: Error): Record<string, string> {
    return {
      [TELEMETRY_CONSTANTS.SPAN_ATTRIBUTES.ERROR.TYPE]: error.name,
      [TELEMETRY_CONSTANTS.SPAN_ATTRIBUTES.ERROR.MESSAGE]: error.message,
      [TELEMETRY_CONSTANTS.SPAN_ATTRIBUTES.ERROR.STACK]: error.stack || '',
    };
  }
}
