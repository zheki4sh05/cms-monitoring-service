import { Injectable, Logger } from '@nestjs/common';
import {
  PostgresMonitoringResultRepository,
  type MonitoringResultForProcessing,
} from '../../../infrastructure/persistence/postgres-monitoring-result.repository.js';
import { DomainValidationError } from '../../shared/errors/domain-validation.error.js';

export interface TakeMonitoringResultByIdInput {
  monitoringResultId: string;
}

@Injectable()
export class TakeMonitoringResultByIdUseCase {
  private readonly logger = new Logger(TakeMonitoringResultByIdUseCase.name);

  constructor(private readonly monitoringResultRepository: PostgresMonitoringResultRepository) {}

  async execute(input: TakeMonitoringResultByIdInput): Promise<MonitoringResultForProcessing | null> {
    this.logger.log(`Start take monitoring result (rawId=${input.monitoringResultId})`);
    const monitoringResultId = this.parseId(input.monitoringResultId);
    this.logger.log(`Parsed monitoring result id (id=${monitoringResultId})`);
    const result = await this.monitoringResultRepository.takeForProcessingById(monitoringResultId);

    if (!result) {
      this.logger.warn(`Monitoring result not found in repository (id=${monitoringResultId})`);
      return null;
    }

    this.logger.log(
      `Monitoring result taken successfully (id=${monitoringResultId}, integrationId=${result.integrationId}, riskObjectId=${result.riskObjectId})`,
    );
    return result;
  }

  private parseId(rawId: string): string {
    const id = rawId.trim().toLowerCase();
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
    if (!uuidPattern.test(id)) {
      this.logger.warn(`Invalid monitoring result id format (rawId=${rawId})`);
      throw new DomainValidationError('monitoringResultId must be a valid UUID.');
    }

    return id;
  }
}
