import { Logger } from '@nestjs/common';
import { DomainValidationError } from '../../shared/errors/domain-validation.error.js';
import type { IntegrationConfigRepository } from '../ports/integration-config-repository.port.js';

export interface DeleteIntegrationConfigByIdInput {
  companyId: string;
  integrationConfigId: string;
}

export class DeleteIntegrationConfigByIdUseCase {
  private readonly logger = new Logger(DeleteIntegrationConfigByIdUseCase.name);

  constructor(private readonly integrationConfigRepository: IntegrationConfigRepository) {}

  async execute(input: DeleteIntegrationConfigByIdInput): Promise<Date | null> {
    this.logger.log(
      `Delete integration config started (companyId=${input.companyId?.trim()}, id=${input.integrationConfigId?.trim()})`,
    );
    if (!input.companyId?.trim()) {
      throw new DomainValidationError('companyId is required.');
    }

    if (!input.integrationConfigId?.trim()) {
      throw new DomainValidationError('id is required.');
    }

    const id = this.parseIntegrationConfigId(input.integrationConfigId.trim());
    this.logger.log(`Validation passed, deleting integration config id=${id}`);
    return this.integrationConfigRepository.deleteById(input.companyId.trim(), id);
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
