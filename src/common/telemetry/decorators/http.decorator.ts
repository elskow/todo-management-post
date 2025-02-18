import {
  Get as NestGet,
  Post as NestPost,
  Put as NestPut,
  Delete as NestDelete,
  Patch as NestPatch,
} from '@nestjs/common';
import { SpanKind } from '@opentelemetry/api';
import { Trace } from './trace.decorator';

export function Get(path?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    NestGet(path)(target, propertyKey, descriptor);
    return Trace({
      kind: SpanKind.SERVER,
      attributes: {
        'http.method': 'GET',
        'http.route': path || '/',
      },
    })(target, propertyKey, descriptor);
  };
}

export function Post(path?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    NestPost(path)(target, propertyKey, descriptor);
    return Trace({
      kind: SpanKind.SERVER,
      attributes: {
        'http.method': 'POST',
        'http.route': path || '/',
      },
    })(target, propertyKey, descriptor);
  };
}

export function Put(path?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    NestPut(path)(target, propertyKey, descriptor);
    return Trace({
      kind: SpanKind.SERVER,
      attributes: {
        'http.method': 'PUT',
        'http.route': path || '/',
      },
    })(target, propertyKey, descriptor);
  };
}

export function Delete(path?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    NestDelete(path)(target, propertyKey, descriptor);
    return Trace({
      kind: SpanKind.SERVER,
      attributes: {
        'http.method': 'DELETE',
        'http.route': path || '/',
      },
    })(target, propertyKey, descriptor);
  };
}

export function Patch(path?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    NestPatch(path)(target, propertyKey, descriptor);
    return Trace({
      kind: SpanKind.SERVER,
      attributes: {
        'http.method': 'PATCH',
        'http.route': path || '/',
      },
    })(target, propertyKey, descriptor);
  };
}
