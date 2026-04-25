import { Injectable, Logger } from '@nestjs/common';
import { IntegrationStatusEventsPublisher } from '../messaging/integration-status-events.publisher.js';
import { PostgresIntegrationConfigRepository } from '../persistence/postgres-integration-config.repository.js';
import { PostgresMonitoringResultRepository } from '../persistence/postgres-monitoring-result.repository.js';
import { PostgresMonitoringRetryRepository } from '../persistence/postgres-monitoring-retry.repository.js';
import { PostgresRiskObjectRepository } from '../persistence/postgres-risk-object.repository.js';

@Injectable()
export class OutboxProcessingService {
  private readonly logger = new Logger(OutboxProcessingService.name);

  constructor(
    private readonly integrationConfigRepository: PostgresIntegrationConfigRepository,
    private readonly riskObjectRepository: PostgresRiskObjectRepository,
    private readonly monitoringResultRepository: PostgresMonitoringResultRepository,
    private readonly monitoringRetryRepository: PostgresMonitoringRetryRepository,
    private readonly eventsPublisher: IntegrationStatusEventsPublisher,
  ) {}

  async processFreshItem(integrationId: number, data: unknown, processDate: Date): Promise<void> {
    const integration = await this.integrationConfigRepository.getByIdForOutboxProcessing(integrationId);
    if (!integration) {
      this.logger.warn(`OUTBOX_QUEUE integration not found (integrationId=${integrationId})`);
      return;
    }

    const riskObject = await this.riskObjectRepository.getByIdForOutboxProcessing(
      integration.companyId,
      integration.riskObjectId,
    );
    if (!riskObject) {
      this.logger.warn(
        `OUTBOX_QUEUE risk object not found (integrationId=${integrationId}, companyId=${integration.companyId}, riskObjectId=${integration.riskObjectId})`,
      );
      return;
    }

    if (!riskObject.active) {
      await this.monitoringRetryRepository.save({
        data,
        riskObjectId: integration.riskObjectId,
        integrationId: integration.id,
        processDate,
      });

      const recipients = new Set<string>();
      if (riskObject.authorId?.trim()) {
        recipients.add(riskObject.authorId.trim());
      }
      if (riskObject.lastModifiedBy?.trim()) {
        recipients.add(riskObject.lastModifiedBy.trim());
      }

      for (const userId of recipients) {
        await this.eventsPublisher.publishDisabledRiskObjectEvent(userId, integration.companyId, integration.riskObjectId);
      }

      this.logger.warn(
        `OUTBOX_QUEUE moved to retry because risk object disabled (integrationId=${integrationId}, companyId=${integration.companyId}, riskObjectId=${integration.riskObjectId})`,
      );
      return;
    }

    await this.persistSuccess(integration.id, integration.companyId, integration.riskObjectId, data, processDate);
  }

  async processRetryItem(retryItemId: string, integrationId: number, data: unknown, processDate: Date): Promise<void> {
    const integration = await this.integrationConfigRepository.getByIdForOutboxProcessing(integrationId);
    if (!integration || !integration.active) {
      return;
    }

    const riskObject = await this.riskObjectRepository.getByIdForOutboxProcessing(
      integration.companyId,
      integration.riskObjectId,
    );
    if (!riskObject || !riskObject.active) {
      return;
    }

    await this.persistSuccess(integration.id, integration.companyId, integration.riskObjectId, data, processDate);
    await this.monitoringRetryRepository.deleteById(retryItemId);
  }

  private async persistSuccess(
    integrationId: number,
    companyId: string,
    riskObjectId: string,
    data: unknown,
    processDate: Date,
  ): Promise<void> {
    const monitoringEntityId = await this.monitoringResultRepository.save({
      data,
      riskObjectId,
      integrationId,
      processDate,
    });

    await this.eventsPublisher.publishRiskMonitoringEvent({
      integrationId: String(integrationId),
      companyId,
      monitoring_entity: monitoringEntityId,
      start_process: processDate.toISOString(),
    });

    this.logger.log(
      `OUTBOX item processed successfully (integrationId=${integrationId}, companyId=${companyId}, riskObjectId=${riskObjectId}, monitoringEntityId=${monitoringEntityId})`,
    );
  }
}
