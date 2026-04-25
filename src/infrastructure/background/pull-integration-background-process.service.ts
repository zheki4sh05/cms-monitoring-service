import { Injectable, Logger, type OnModuleDestroy } from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { IntegrationConfigProcessManagerItem } from '../../core/integration/ports/integration-config-repository.port.js';
import { OutboxQueueService } from './outbox-queue.service.js';
import type { PullIntegrationInvocationEvent } from './pull-integration-invocation.event.js';
import { IntegrationInvocationEventBusService } from './integration-invocation-event-bus.service.js';

interface RunningPullWorker {
  timeoutRef: NodeJS.Timeout | null;
  intervalMs: number;
  stopped: boolean;
}

@Injectable()
export class PullIntegrationBackgroundProcessService implements OnModuleDestroy {
  private readonly logger = new Logger(PullIntegrationBackgroundProcessService.name);
  private readonly workers = new Map<string, RunningPullWorker>();

  constructor(
    private readonly outboxQueueService: OutboxQueueService,
    private readonly invocationEventBus: IntegrationInvocationEventBusService,
  ) {}

  async run(config: IntegrationConfigProcessManagerItem): Promise<void> {
    const workerKey = this.toWorkerKey(config.companyId, config.id);
    if (this.workers.has(workerKey)) {
      this.logger.log(
        `PULL_INTEGRATION_BACKGROUND_PROCESS already running (companyId=${config.companyId}, integrationId=${config.id})`,
      );
      return;
    }

    const intervalMs = this.resolvePollingIntervalMs(config);
    this.workers.set(workerKey, { timeoutRef: null, intervalMs, stopped: false });
    this.logger.log(
      `PULL_INTEGRATION_BACKGROUND_PROCESS worker started (companyId=${config.companyId}, integrationId=${config.id}, intervalMs=${intervalMs})`,
    );
    await this.runWorkerIteration(workerKey, config);
  }

  stop(companyId: string, integrationId: number): boolean {
    const workerKey = this.toWorkerKey(companyId, integrationId);
    const worker = this.workers.get(workerKey);
    if (!worker) {
      return false;
    }

    worker.stopped = true;
    if (worker.timeoutRef) {
      clearTimeout(worker.timeoutRef);
    }
    this.workers.delete(workerKey);
    this.logger.log(
      `PULL_INTEGRATION_BACKGROUND_PROCESS worker stopped (companyId=${companyId}, integrationId=${integrationId})`,
    );
    return true;
  }

  isRunning(companyId: string, integrationId: number): boolean {
    return this.workers.has(this.toWorkerKey(companyId, integrationId));
  }

  onModuleDestroy(): void {
    for (const [workerKey, worker] of this.workers) {
      worker.stopped = true;
      if (worker.timeoutRef) {
        clearTimeout(worker.timeoutRef);
      }
      this.logger.log(`PULL_INTEGRATION_BACKGROUND_PROCESS worker cleared on shutdown (worker=${workerKey})`);
    }
    this.workers.clear();
  }

  private async loadOrderExample(): Promise<unknown> {
    const filePath = join(process.cwd(), 'src', 'assets', 'order_example.json');
    const raw = await readFile(filePath, 'utf8');
    return JSON.parse(raw) as unknown;
  }

  private resolvePollingIntervalMs(config: IntegrationConfigProcessManagerItem): number {
    const preset = config.pullConfig?.pollingPreset;
    if (preset === 'hour') {
      this.logger.log(
        `PULL_INTEGRATION_BACKGROUND_PROCESS interval resolved by preset=hour (companyId=${config.companyId}, integrationId=${config.id}, intervalMs=${60 * 60 * 1000})`,
      );
      return 60 * 60 * 1000;
    }

    if (preset === 'day') {
      this.logger.log(
        `PULL_INTEGRATION_BACKGROUND_PROCESS interval resolved by preset=day (companyId=${config.companyId}, integrationId=${config.id}, intervalMs=${24 * 60 * 60 * 1000})`,
      );
      return 24 * 60 * 60 * 1000;
    }

    if (preset === 'month') {
      this.logger.log(
        `PULL_INTEGRATION_BACKGROUND_PROCESS interval resolved by preset=month (companyId=${config.companyId}, integrationId=${config.id}, intervalMs=${30 * 24 * 60 * 60 * 1000})`,
      );
      return 30 * 24 * 60 * 60 * 1000;
    }

    const rawMinutes = config.pullConfig?.pollingMinutes;
    const fallbackMinutes = 30;
    const normalizedMinutes =
      typeof rawMinutes === 'number' && Number.isFinite(rawMinutes) && rawMinutes > 0
        ? Math.floor(rawMinutes)
        : fallbackMinutes;
    const intervalMs = normalizedMinutes * 60 * 1000;
    this.logger.log(
      `PULL_INTEGRATION_BACKGROUND_PROCESS interval resolved by preset=minutes/default (companyId=${config.companyId}, integrationId=${config.id}, preset=${preset ?? 'undefined'}, pollingMinutes=${rawMinutes ?? 'undefined'}, fallbackMinutes=${fallbackMinutes}, intervalMs=${intervalMs})`,
    );
    return intervalMs;
  }

  private buildRequestConfig(config: IntegrationConfigProcessManagerItem, body: unknown) {
    const requestUri = config.pullConfig?.requestUri;
    const queryParams = config.pullConfig?.requestQueryParams ?? [];
    const requestUrl = requestUri ? this.joinUrl(config.endpointUrl, requestUri) : config.endpointUrl;
    const urlWithQuery = this.withQueryParams(requestUrl, queryParams);

    return {
      method: 'POST',
      url: urlWithQuery,
      headers: {
        'content-type': 'application/json',
        'x-integration-id': String(config.id),
      },
      body,
    };
  }

  private async executePollingIteration(config: IntegrationConfigProcessManagerItem): Promise<void> {
    const orderExample = await this.loadOrderExample();
    const requestConfig = this.buildRequestConfig(config, orderExample);
    const responsePayload = await this.executeMockHttpRequest(config, requestConfig);

    this.outboxQueueService.enqueue({
      companyId: config.companyId,
      integrationId: config.id,
      integrationName: config.name,
      pullConfig: config.pullConfig,
      requestConfig,
      createdAt: new Date(),
    });

    this.logger.log(
      `PULL_INTEGRATION_BACKGROUND_PROCESS queued mock response (companyId=${config.companyId}, integrationId=${config.id}, status=${responsePayload.status})`,
    );
  }

  private async runWorkerIteration(
    workerKey: string,
    config: IntegrationConfigProcessManagerItem,
  ): Promise<void> {
    const worker = this.workers.get(workerKey);
    if (!worker || worker.stopped) {
      return;
    }

    try {
      await this.executePollingIteration(config);
      this.emitInvocationEvent({
        companyId: config.companyId,
        integrationId: config.id,
        success: true,
        ...(config.lastStatusChangedByUserId ? { userId: config.lastStatusChangedByUserId } : {}),
      });
    } catch (error) {
      this.emitInvocationEvent({
        companyId: config.companyId,
        integrationId: config.id,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        ...(config.lastStatusChangedByUserId ? { userId: config.lastStatusChangedByUserId } : {}),
      });
      this.logger.error(
        `PULL_INTEGRATION_BACKGROUND_PROCESS iteration failed (companyId=${config.companyId}, integrationId=${config.id}): ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }

    const activeWorker = this.workers.get(workerKey);
    if (!activeWorker || activeWorker.stopped) {
      return;
    }

    activeWorker.timeoutRef = setTimeout(() => {
      void this.runWorkerIteration(workerKey, config);
    }, activeWorker.intervalMs);
  }

  private async executeMockHttpRequest(
    config: IntegrationConfigProcessManagerItem,
    requestConfig: { method: string; url: string; headers: Record<string, string>; body: unknown },
  ): Promise<{ status: number; body: unknown }> {
    this.logger.log(
      `PULL_INTEGRATION_BACKGROUND_PROCESS executing mock request (companyId=${config.companyId}, integrationId=${config.id}, method=${requestConfig.method}, url=${requestConfig.url}, pullConfig=${JSON.stringify(
        config.pullConfig,
      )})`,
    );
    return { status: 200, body: requestConfig.body };
  }

  private withQueryParams(url: string, params: Array<{ key: string; value: string }>): string {
    if (params.length === 0) {
      return url;
    }

    const searchParams = new URLSearchParams();
    for (const param of params) {
      searchParams.append(param.key, param.value);
    }

    return `${url}${url.includes('?') ? '&' : '?'}${searchParams.toString()}`;
  }

  private joinUrl(base: string, path: string): string {
    if (!path) {
      return base;
    }

    if (base.endsWith('/') && path.startsWith('/')) {
      return `${base.slice(0, -1)}${path}`;
    }

    if (!base.endsWith('/') && !path.startsWith('/')) {
      return `${base}/${path}`;
    }

    return `${base}${path}`;
  }

  private toWorkerKey(companyId: string, integrationId: number): string {
    return `${companyId}:${integrationId}`;
  }

  private emitInvocationEvent(event: PullIntegrationInvocationEvent): void {
    this.invocationEventBus.emitPullInvocation(event);
  }
}
