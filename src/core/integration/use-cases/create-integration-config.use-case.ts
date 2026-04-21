import { Logger } from '@nestjs/common';
import { DomainValidationError } from '../../shared/errors/domain-validation.error.js';
import type { IntegrationKind, PullConfig } from '../domain/integration-config.js';
import type { IntegrationConfigRepository } from '../ports/integration-config-repository.port.js';

export interface CreateIntegrationConfigInput {
  companyId: string;
  authorName: string;
  name: string;
  integrationKind: string;
  endpointUrl: string;
  riskObjectModelId: string;
  mappingRules: unknown;
  pullConfig?: PullConfig;
}

export interface CreateIntegrationConfigOutput {
  id: number;
  savedAt: Date;
}

export class CreateIntegrationConfigUseCase {
  private readonly logger = new Logger(CreateIntegrationConfigUseCase.name);

  constructor(private readonly integrationConfigRepository: IntegrationConfigRepository) {}

  async execute(input: CreateIntegrationConfigInput): Promise<CreateIntegrationConfigOutput> {
    this.logger.log(
      `Create integration config started (companyId=${input.companyId?.trim()}, integrationKind=${input.integrationKind}, hasPullConfig=${input.pullConfig !== undefined})`,
    );
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
    this.logger.log('Validation passed, saving integration config to repository');

    const id = await this.integrationConfigRepository.save({
      companyId: input.companyId.trim(),
      name: input.name.trim(),
      integrationKind,
      endpointUrl: input.endpointUrl.trim(),
      riskObjectId: input.riskObjectModelId.trim(),
      mappingRules: input.mappingRules,
      ...(input.pullConfig !== undefined ? { pullConfig: input.pullConfig } : {}),
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
