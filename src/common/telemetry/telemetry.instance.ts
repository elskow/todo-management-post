import { TelemetryService } from './telemetry.service';
import { TraceContextManager } from './trace-context.manager';

let telemetryServiceInstance: TelemetryService | null = null;

export function setTelemetryServiceInstance(instance: TelemetryService) {
  telemetryServiceInstance = instance;
}

export function getTelemetryService(): TelemetryService {
  if (!telemetryServiceInstance) {
    const contextManager = new TraceContextManager();
    telemetryServiceInstance = new TelemetryService(contextManager);
  }
  return telemetryServiceInstance;
}
