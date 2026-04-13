import { DomainValidationError } from '../../shared/errors/domain-validation.error.js';
import type {
  IntegrationConfigDetails,
  IntegrationConfigRepository,
} from '../ports/integration-config-repository.port.js';

export interface GetIntegrationConfigByIdInput {
  companyId: string;
  integrationConfigId: string;
}

export class GetIntegrationConfigByIdUseCase {
  constructor(private readonly integrationConfigRepository: IntegrationConfigRepository) {}

  async execute(input: GetIntegrationConfigByIdInput): Promise<IntegrationConfigDetails | null> {
    if (!input.companyId?.trim()) {
      throw new DomainValidationError('companyId is required.');
    }

    if (!input.integrationConfigId?.trim()) {
      throw new DomainValidationError('id is required.');
    }

    const numericId = this.parseIntegrationConfigId(input.integrationConfigId.trim());
    return this.integrationConfigRepository.getById(input.companyId.trim(), numericId);
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
