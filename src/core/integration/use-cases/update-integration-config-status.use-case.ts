import { Logger } from '@nestjs/common';
import { DomainValidationError } from '../../shared/errors/domain-validation.error.js';
import type { IntegrationConfigRepository } from '../ports/integration-config-repository.port.js';

export interface UpdateIntegrationConfigStatusInput {
  companyId: string;
  integrationConfigId: string;
  active: boolean;
}

export class UpdateIntegrationConfigStatusUseCase {
  private readonly logger = new Logger(UpdateIntegrationConfigStatusUseCase.name);

  constructor(private readonly integrationConfigRepository: IntegrationConfigRepository) {}

  async execute(input: UpdateIntegrationConfigStatusInput): Promise<Date | null> {
    this.logger.log(
      `Update integration activation requested (companyId=${input.companyId?.trim()}, id=${input.integrationConfigId?.trim()}, active=${input.active})`,
    );
    if (!input.companyId?.trim()) {
      throw new DomainValidationError('companyId is required.');
    }

    if (!input.integrationConfigId?.trim()) {
      throw new DomainValidationError('id is required.');
    }

    if (typeof input.active !== 'boolean') {
      throw new DomainValidationError('active must be boolean.');
    }

    const numericId = this.parseIntegrationConfigId(input.integrationConfigId.trim());
    this.logger.log(`Validation passed, updating active flag for integration id=${numericId}`);
    return this.integrationConfigRepository.updateActiveById(input.companyId.trim(), numericId, input.active);
  }

  private parseIntegrationConfigId(value: string): number {
    const matched = /^ic-(\d+)$/.exec(value) ?? /^(\d+)$/.exec(value);
    if (!matched || !matched[1]) {
      throw new DomainValidationError('id must match format ic-<number>.');
    }

    const numericId = Number.parseInt(matched[1], 10);
    if (!Number.isInteger(numericId) || numericId < 1) {
      throw new DomainValidationError('id must match format ic-<number>.');
    }

    return numericId;
  }
}
