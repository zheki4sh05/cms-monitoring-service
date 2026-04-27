import { Inject, Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  IntegrationInvocationStats,
  IntegrationConfigProcessManagerItem,
  IntegrationConfigRepository,
} from '../../core/integration/ports/integration-config-repository.port.js';
import { INTEGRATION_CONFIG_REPOSITORY } from '../../core/integration/ports/integration-config-repository.port.js';
import { IntegrationStatusEventsPublisher } from '../messaging/integration-status-events.publisher.js';
import { PullIntegrationBackgroundProcessService } from './pull-integration-background-process.service.js';
import type { PullIntegrationInvocationEvent } from './pull-integration-invocation.event.js';
import { IntegrationInvocationEventBusService } from './integration-invocation-event-bus.service.js';

@Injectable()
export class IntegrationRuntimeProcessManagerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(IntegrationRuntimeProcessManagerService.name);
  private readonly syncIntervalMs = 1 * 60 * 1000;
  private readonly systemUserId = 'integration-manager';
  private readonly failedInvocationsStopThreshold: number;
  private intervalRef: NodeJS.Timeout | null = null;
  private syncInProgress = false;

  constructor(
    @Inject(INTEGRATION_CONFIG_REPOSITORY)
    private readonly integrationConfigRepository: IntegrationConfigRepository,
    private readonly integrationStatusEventsPublisher: IntegrationStatusEventsPublisher,
    private readonly pullIntegrationBackgroundProcessService: PullIntegrationBackgroundProcessService,
    private readonly invocationEventBus: IntegrationInvocationEventBusService,
    private readonly configService: ConfigService,
  ) {
    const thresholdRaw = this.configService.get<string>('INTEGRATION_INVOCATIONS_FAILED_STOP_THRESHOLD', '10');
    const thresholdValue = Number.parseInt(thresholdRaw, 10);
    this.failedInvocationsStopThreshold = Number.isInteger(thresholdValue) && thresholdValue > 0 ? thresholdValue : 10;
  }

  private readonly pullInvocationListener = (event: PullIntegrationInvocationEvent) => {
    void this.handlePullInvocationEvent(event);
  };

  onModuleInit(): void {
    this.logger.log(
      `Integration runtime process manager started. Synchronization interval=${this.syncIntervalMs}ms`,
    );
    this.intervalRef = setInterval(() => {
      void this.synchronizeRuntimeState();
    }, this.syncIntervalMs);
    this.invocationEventBus.onPullInvocation(this.pullInvocationListener);
    void this.synchronizeRuntimeState();
  }

  onModuleDestroy(): void {
    if (this.intervalRef) {
      clearInterval(this.intervalRef);
      this.intervalRef = null;
      this.logger.log('Integration runtime process manager scheduler stopped');
    }
    this.invocationEventBus.offPullInvocation(this.pullInvocationListener);
  }

  private async synchronizeRuntimeState(): Promise<void> {
    if (this.syncInProgress) {
      this.logger.warn('Skipping runtime synchronization because previous run is still in progress');
      return;
    }

    this.syncInProgress = true;
    this.logger.log('Runtime synchronization started');
    try {
      const configs = await this.integrationConfigRepository.listForProcessManager();
      this.logger.log(`Runtime synchronization fetched ${configs.length} integration configs`);

      for (const config of configs) {
        await this.synchronizeConfig(config);
      }

      this.logger.log('Runtime synchronization finished successfully');
    } catch (error) {
      this.logger.error(
        `Runtime synchronization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    } finally {
      this.syncInProgress = false;
    }
  }

  private async synchronizeConfig(config: IntegrationConfigProcessManagerItem): Promise<void> {
    this.logger.log(
      `Processing integration runtime state (companyId=${config.companyId}, id=${config.id}, active=${config.active}, status=${config.status}, kind=${config.integrationKind})`,
    );

    if (config.active) {
      await this.handleActiveIntegration(config);
      return;
    }

    await this.handleInactiveIntegration(config);
  }

  private async handleActiveIntegration(config: IntegrationConfigProcessManagerItem): Promise<void> {
    if (config.status === 'work') {
      await this.monitorWorkingProcess(config);
      return;
    }

    try {
      if (config.status !== 'loading') {
        await this.updateRuntimeStatus(config, 'loading');
      }

      await this.integrationConfigRepository.resetInvocationStatsById(config.companyId, config.id);
      this.logger.log(
        `Invocation stats reset before process start (companyId=${config.companyId}, id=${config.id})`,
      );

      await this.startBackgroundProcess(config);
      await this.updateRuntimeStatus(config, 'work');
      this.logger.log(
        `Integration process transitioned to work (companyId=${config.companyId}, id=${config.id})`,
      );
    } catch (error) {
      this.logger.error(
        `Integration process start failed (companyId=${config.companyId}, id=${config.id}): ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      await this.updateRuntimeStatus(config, 'failed');
    }
  }

  private async handleInactiveIntegration(config: IntegrationConfigProcessManagerItem): Promise<void> {
    if (config.status === 'idle' || config.status === 'stop') {
      this.logger.log(
        `Inactive integration is already in terminal state (companyId=${config.companyId}, id=${config.id}, status=${config.status})`,
      );
      return;
    }

    try {
      await this.stopBackgroundProcess(config);
      await this.cleanupBackgroundResources(config);
      await this.updateRuntimeStatus(config, 'stop');
      this.logger.log(`Integration process stopped (companyId=${config.companyId}, id=${config.id})`);
    } catch (error) {
      this.logger.error(
        `Integration process stop failed (companyId=${config.companyId}, id=${config.id}): ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      await this.updateRuntimeStatus(config, 'failed');
    }
  }

  private async monitorWorkingProcess(config: IntegrationConfigProcessManagerItem): Promise<void> {
    try {
      this.logger.log(
        `Monitoring running background process (companyId=${config.companyId}, id=${config.id})`,
      );
      await this.checkProcessHealth(config);
      this.logger.log(
        `Background process health check passed (companyId=${config.companyId}, id=${config.id})`,
      );
    } catch (error) {
      if (this.isPullWorkerMissingError(error)) {
        await this.recoverMissingWorkingProcess(config);
        return;
      }
      this.logger.error(
        `Background process health check failed (companyId=${config.companyId}, id=${config.id}): ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      await this.updateRuntimeStatus(config, 'failed');
    }
  }

  private isPullWorkerMissingError(error: unknown): boolean {
    return error instanceof Error && error.message === 'PULL_INTEGRATION_BACKGROUND_PROCESS is not running';
  }

  private async recoverMissingWorkingProcess(config: IntegrationConfigProcessManagerItem): Promise<void> {
    this.logger.warn(
      `Background process is missing for work status, attempting recovery (companyId=${config.companyId}, id=${config.id}, kind=${config.integrationKind})`,
    );
    try {
      await this.startBackgroundProcess(config);
      this.logger.log(
        `Background process recovered for work status (companyId=${config.companyId}, id=${config.id})`,
      );
    } catch (startError) {
      this.logger.error(
        `Background process recovery failed (companyId=${config.companyId}, id=${config.id}): ${startError instanceof Error ? startError.message : 'Unknown error'}`,
      );
      await this.updateRuntimeStatus(config, 'failed');
    }
  }

  private async updateRuntimeStatus(
    config: IntegrationConfigProcessManagerItem,
    nextStatus: 'idle' | 'loading' | 'work' | 'failed' | 'stop',
  ): Promise<void> {
    this.logger.log(
      `Updating runtime status (companyId=${config.companyId}, id=${config.id}, from=${config.status}, to=${nextStatus})`,
    );
    await this.integrationConfigRepository.updateRuntimeStatusById(config.companyId, config.id, nextStatus);
    await this.integrationStatusEventsPublisher.publishStatusChanged(
      config.companyId,
      String(config.id),
      nextStatus,
      config.lastStatusChangedByUserId ?? undefined,
    );
    this.logger.log(
      `Kafka ws event sent for integration status change (companyId=${config.companyId}, id=${config.id}, status=${nextStatus}, userId=${config.lastStatusChangedByUserId ?? 'fallback'})`,
    );
    config.status = nextStatus;
  }

  private async startBackgroundProcess(config: IntegrationConfigProcessManagerItem): Promise<void> {
    this.logger.log(
      `Starter enqueue requested for integration (companyId=${config.companyId}, id=${config.id}, name=${config.name})`,
    );

    if (config.integrationKind === 'PULL') {
      this.logger.log(
        `Starting PULL_INTEGRATION_BACKGROUND_PROCESS (companyId=${config.companyId}, id=${config.id}, endpointUrl=${config.endpointUrl})`,
      );
      await this.pullIntegrationBackgroundProcessService.run(config);
      return;
    }

    this.logger.warn(
      `Background process is not configured for integration kind=${config.integrationKind} (companyId=${config.companyId}, id=${config.id})`,
    );
  }

  private async stopBackgroundProcess(config: IntegrationConfigProcessManagerItem): Promise<void> {
    if (config.integrationKind === 'PULL') {
      const stopped = this.pullIntegrationBackgroundProcessService.stop(config.companyId, config.id);
      if (stopped) {
        this.logger.log(
          `Stopped PULL_INTEGRATION_BACKGROUND_PROCESS (companyId=${config.companyId}, id=${config.id})`,
        );
      } else {
        this.logger.log(
          `PULL_INTEGRATION_BACKGROUND_PROCESS is not running (companyId=${config.companyId}, id=${config.id})`,
        );
      }
      return;
    }

    this.logger.log(`Stopper requested for integration (companyId=${config.companyId}, id=${config.id})`);
  }

  private async cleanupBackgroundResources(config: IntegrationConfigProcessManagerItem): Promise<void> {
    this.logger.log(`Resource cleanup requested for integration (companyId=${config.companyId}, id=${config.id})`);
  }

  private async checkProcessHealth(config: IntegrationConfigProcessManagerItem): Promise<void> {
    if (config.integrationKind === 'PULL') {
      const running = this.pullIntegrationBackgroundProcessService.isRunning(config.companyId, config.id);
      if (!running) {
        throw new Error('PULL_INTEGRATION_BACKGROUND_PROCESS is not running');
      }
      this.logger.log(
        `PULL_INTEGRATION_BACKGROUND_PROCESS heartbeat is healthy (companyId=${config.companyId}, id=${config.id})`,
      );
      return;
    }

    this.logger.log(`Process heartbeat check (companyId=${config.companyId}, id=${config.id})`);
  }

  async handlePullInvocationEvent(event: PullIntegrationInvocationEvent): Promise<void> {
    const stats = await this.integrationConfigRepository.registerInvocationResult(
      event.companyId,
      event.integrationId,
      event.success,
      event.errorMessage,
    );
    if (!stats) {
      this.logger.warn(
        `Received invocation event for missing integration (companyId=${event.companyId}, integrationId=${event.integrationId})`,
      );
      return;
    }

    this.logger.log(
      `Invocation stats updated (companyId=${stats.companyId}, integrationId=${stats.integrationId}, success=${stats.invocationsSuccess}, failed=${stats.invocationsFailed})`,
    );

    await this.maybePublishInvocationStats(stats, event.userId);

    if (stats.invocationsFailed > this.failedInvocationsStopThreshold) {
      await this.stopIntegrationAfterTooManyFailures(stats, event.userId);
    }
  }

  private async maybePublishInvocationStats(stats: IntegrationInvocationStats, userId?: string): Promise<void> {
    const totalInvocations = stats.invocationsSuccess + stats.invocationsFailed;
    if (totalInvocations % 5 !== 0) {
      return;
    }

    await this.integrationStatusEventsPublisher.publishInvocationsChanged(
      stats.companyId,
      String(stats.integrationId),
      stats.invocationsSuccess,
      stats.invocationsFailed,
      userId ?? this.systemUserId,
    );
  }

  private async stopIntegrationAfterTooManyFailures(
    stats: IntegrationInvocationStats,
    userId?: string,
  ): Promise<void> {
    const stopped = this.pullIntegrationBackgroundProcessService.stop(stats.companyId, stats.integrationId);
    if (!stopped) {
      this.logger.warn(
        `Failed invocations threshold reached but worker is already stopped (companyId=${stats.companyId}, integrationId=${stats.integrationId})`,
      );
    }

    await this.integrationConfigRepository.updateActiveById(
      stats.companyId,
      stats.integrationId,
      false,
      userId ?? this.systemUserId,
    );
    await this.integrationConfigRepository.updateRuntimeStatusById(stats.companyId, stats.integrationId, 'stop');
    await this.integrationStatusEventsPublisher.publishStatusChanged(
      stats.companyId,
      String(stats.integrationId),
      'stop',
      userId ?? this.systemUserId,
    );
    this.logger.error(
      `Integration stopped due to failed invocations threshold (companyId=${stats.companyId}, integrationId=${stats.integrationId}, failed=${stats.invocationsFailed}, threshold=${this.failedInvocationsStopThreshold})`,
    );
  }
}
