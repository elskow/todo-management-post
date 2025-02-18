import { Injectable, Scope } from '@nestjs/common';
import { Context, trace, ROOT_CONTEXT } from '@opentelemetry/api';
import { AsyncLocalStorage } from 'async_hooks';

@Injectable({ scope: Scope.DEFAULT })
export class TraceContextManager {
  private readonly storage = new AsyncLocalStorage<Context>();

  getActiveContext(): Context {
    const storedContext = this.storage.getStore();
    if (storedContext) return storedContext;

    const activeSpan = trace.getActiveSpan();
    if (activeSpan) {
      return trace.setSpanContext(ROOT_CONTEXT, activeSpan.spanContext());
    }

    return ROOT_CONTEXT;
  }

  withContext<T>(context: Context, fn: () => Promise<T>): Promise<T> {
    return this.storage.run(context, fn);
  }

  async executeInContext<T>(fn: () => Promise<T>): Promise<T> {
    const activeSpan = trace.getActiveSpan();
    const context = activeSpan
      ? trace.setSpanContext(ROOT_CONTEXT, activeSpan.spanContext())
      : ROOT_CONTEXT;

    return this.withContext(context, fn);
  }

  getActiveSpan() {
    return trace.getActiveSpan();
  }

  setActiveContext(context: Context) {
    const currentStore = this.storage.getStore();
    if (!currentStore) {
      this.storage.enterWith(context);
    }
  }
}
