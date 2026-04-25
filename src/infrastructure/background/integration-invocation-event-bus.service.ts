import { Injectable } from '@nestjs/common';
import { EventEmitter } from 'node:events';
import {
  PULL_INTEGRATION_INVOCATION_EVENT,
  type PullIntegrationInvocationEvent,
} from './pull-integration-invocation.event.js';

@Injectable()
export class IntegrationInvocationEventBusService {
  private readonly emitter = new EventEmitter();

  emitPullInvocation(event: PullIntegrationInvocationEvent): void {
    this.emitter.emit(PULL_INTEGRATION_INVOCATION_EVENT, event);
  }

  onPullInvocation(listener: (event: PullIntegrationInvocationEvent) => void): void {
    this.emitter.on(PULL_INTEGRATION_INVOCATION_EVENT, listener);
  }

  offPullInvocation(listener: (event: PullIntegrationInvocationEvent) => void): void {
    this.emitter.off(PULL_INTEGRATION_INVOCATION_EVENT, listener);
  }
}
