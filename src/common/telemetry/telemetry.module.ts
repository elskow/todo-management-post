import { Module, Global, OnModuleInit } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { HttpTracingInterceptor } from './http-tracing.interceptor';
import { TelemetryService } from './telemetry.service';
import { TraceContextManager } from './trace-context.manager';
import { setTelemetryServiceInstance } from './telemetry.instance';

@Global()
@Module({
  providers: [
    TelemetryService,
    TraceContextManager,
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpTracingInterceptor,
    },
  ],
  exports: [TelemetryService, TraceContextManager],
})
export class TelemetryModule implements OnModuleInit {
  constructor(private readonly telemetryService: TelemetryService) {}

  onModuleInit() {
    setTelemetryServiceInstance(this.telemetryService);
  }
}
