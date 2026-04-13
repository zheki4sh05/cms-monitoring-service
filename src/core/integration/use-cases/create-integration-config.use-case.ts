import { DomainValidationError } from '../../shared/errors/domain-validation.error.js';
import type { IntegrationKind } from '../domain/integration-config.js';
import type { IntegrationConfigRepository } from '../ports/integration-config-repository.port.js';

export interface CreateIntegrationConfigInput {
  companyId: string;
  authorName: string;
  name: string;
  integrationKind: string;
  endpointUrl: string;
  riskObjectModelId: string;
  mappingRules: unknown;
}

export interface CreateIntegrationConfigOutput {
  id: number;
  savedAt: Date;
}

export class CreateIntegrationConfigUseCase {
  constructor(private readonly integrationConfigRepository: IntegrationConfigRepository) {}

  async execute(input: CreateIntegrationConfigInput): Promise<CreateIntegrationConfigOutput> {
    if (!input.companyId?.trim()) {
      throw new DomainValidationError('companyId is required.');
    }

    if (!input.name?.trim()) {
      throw new DomainValidationError('name is required.');
    }

    if (!input.authorName?.trim()) {
      throw new DomainValidationError('authorName is required.');
    }

    if (!input.endpointUrl?.trim()) {
      throw new DomainValidationError('endpointUrl is required.');
    }

    if (!input.riskObjectModelId?.trim()) {
      throw new DomainValidationError('riskObjectModelId is required.');
    }

    if (!Array.isArray(input.mappingRules)) {
      throw new DomainValidationError('mapping_rules must be an array.');
    }

    const integrationKind = this.parseIntegrationKind(input.integrationKind);
    const now = new Date();

    const id = await this.integrationConfigRepository.save({
      companyId: input.companyId.trim(),
      name: input.name.trim(),
      integrationKind,
      endpointUrl: input.endpointUrl.trim(),
      riskObjectId: input.riskObjectModelId.trim(),
      mappingRules: input.mappingRules,
      active: true,
      authorName: input.authorName.trim(),
      createdAt: now,
      updatedAt: now,
    });

    return {
      id,
      savedAt: now,
    };
  }

  private parseIntegrationKind(value: string): IntegrationKind {
    const normalized = value?.trim().toUpperCase();
    if (normalized === 'PUSH' || normalized === 'PULL' || normalized === 'BROKER') {
      return normalized;
    }

    throw new DomainValidationError('integrationKind must be one of: PUSH, PULL, BROKER.');
  }
}
