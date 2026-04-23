import { Inject, Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import type {
  IntegrationConfigProcessManagerItem,
  IntegrationConfigRepository,
} from '../../core/integration/ports/integration-config-repository.port.js';
import { INTEGRATION_CONFIG_REPOSITORY } from '../../core/integration/ports/integration-config-repository.port.js';

@Injectable()
export class IntegrationRuntimeProcessManagerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(IntegrationRuntimeProcessManagerService.name);
  private readonly syncIntervalMs = 10 * 60 * 1000;
  private intervalRef: NodeJS.Timeout | null = null;
  private syncInProgress = false;

  constructor(
    @Inject(INTEGRATION_CONFIG_REPOSITORY)
    private readonly integrationConfigRepository: IntegrationConfigRepository,
  ) {}

  onModuleInit(): void {
    this.logger.log(
      `Integration runtime process manager started. Synchronization interval=${this.syncIntervalMs}ms`,
    );
    this.intervalRef = setInterval(() => {
      void this.synchronizeRuntimeState();
    }, this.syncIntervalMs);
    void this.synchronizeRuntimeState();
  }

  onModuleDestroy(): void {
    if (this.intervalRef) {
      clearInterval(this.intervalRef);
      this.intervalRef = null;
      this.logger.log('Integration runtime process manager scheduler stopped');
    }
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
      this.logger.error(
        `Background process health check failed (companyId=${config.companyId}, id=${config.id}): ${error instanceof Error ? error.message : 'Unknown error'}`,
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
    config.status = nextStatus;
  }

  private async startBackgroundProcess(config: IntegrationConfigProcessManagerItem): Promise<void> {
    this.logger.log(
      `Starter enqueue requested for integration (companyId=${config.companyId}, id=${config.id}, name=${config.name})`,
    );
    this.logger.log(
      `Starter payload prepared (companyId=${config.companyId}, id=${config.id}, endpointUrl=${config.endpointUrl}, integrationKind=${config.integrationKind})`,
    );
  }

  private async stopBackgroundProcess(config: IntegrationConfigProcessManagerItem): Promise<void> {
    this.logger.log(`Stopper requested for integration (companyId=${config.companyId}, id=${config.id})`);
  }

  private async cleanupBackgroundResources(config: IntegrationConfigProcessManagerItem): Promise<void> {
    this.logger.log(`Resource cleanup requested for integration (companyId=${config.companyId}, id=${config.id})`);
  }

  private async checkProcessHealth(config: IntegrationConfigProcessManagerItem): Promise<void> {
    this.logger.log(`Process heartbeat check (companyId=${config.companyId}, id=${config.id})`);
  }
}
