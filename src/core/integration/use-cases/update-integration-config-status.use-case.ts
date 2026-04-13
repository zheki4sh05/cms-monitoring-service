import { DomainValidationError } from '../../shared/errors/domain-validation.error.js';
import type {
  IntegrationConfigRepository,
  IntegrationConfigStatus,
} from '../ports/integration-config-repository.port.js';

export interface UpdateIntegrationConfigStatusInput {
  companyId: string;
  integrationConfigId: string;
  status: IntegrationConfigStatus;
}

export class UpdateIntegrationConfigStatusUseCase {
  constructor(private readonly integrationConfigRepository: IntegrationConfigRepository) {}

  async execute(input: UpdateIntegrationConfigStatusInput): Promise<Date | null> {
    if (!input.companyId?.trim()) {
      throw new DomainValidationError('companyId is required.');
    }

    if (!input.integrationConfigId?.trim()) {
      throw new DomainValidationError('id is required.');
    }

    if (input.status !== 'active' && input.status !== 'inactive') {
      throw new DomainValidationError('status must be active or inactive.');
    }

    const numericId = this.parseIntegrationConfigId(input.integrationConfigId.trim());
    return this.integrationConfigRepository.updateStatusById(
      input.companyId.trim(),
      numericId,
      input.status,
    );
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
