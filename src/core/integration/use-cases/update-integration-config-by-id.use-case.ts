import { Logger } from '@nestjs/common';
import { DomainValidationError } from '../../shared/errors/domain-validation.error.js';
import type { IntegrationKind, PullConfig } from '../domain/integration-config.js';
import type { IntegrationConfigRepository } from '../ports/integration-config-repository.port.js';

export interface UpdateIntegrationConfigByIdInput {
  companyId: string;
  integrationConfigId: string;
  name: string;
  integrationKind: string;
  endpointUrl: string;
  riskObjectModelId: string;
  mappingRules: unknown;
  pullConfig?: PullConfig;
  authorName: string;
}

export class UpdateIntegrationConfigByIdUseCase {
  private readonly logger = new Logger(UpdateIntegrationConfigByIdUseCase.name);

  constructor(private readonly integrationConfigRepository: IntegrationConfigRepository) {}

  async execute(input: UpdateIntegrationConfigByIdInput): Promise<Date | null> {
    this.logger.log(
      `Update integration config started (companyId=${input.companyId?.trim()}, id=${input.integrationConfigId?.trim()}, hasPullConfig=${input.pullConfig !== undefined})`,
    );
    if (!input.companyId?.trim()) {
      throw new DomainValidationError('companyId is required.');
    }

    if (!input.integrationConfigId?.trim()) {
      throw new DomainValidationError('id is required.');
    }

    if (!input.name?.trim()) {
      throw new DomainValidationError('name is required.');
    }

    if (!input.endpointUrl?.trim()) {
      throw new DomainValidationError('endpointUrl is required.');
    }

    if (!input.riskObjectModelId?.trim()) {
      throw new DomainValidationError('riskObjectModelId is required.');
    }

    if (!input.authorName?.trim()) {
      throw new DomainValidationError('authorName is required.');
    }

    if (!Array.isArray(input.mappingRules)) {
      throw new DomainValidationError('mapping_rules must be an array.');
    }

    const id = this.parseIntegrationConfigId(input.integrationConfigId.trim());
    const integrationKind = this.parseIntegrationKind(input.integrationKind);
    this.logger.log(`Validation passed, updating integration config id=${id} in repository`);

    return this.integrationConfigRepository.updateById({
      companyId: input.companyId.trim(),
      id,
      name: input.name.trim(),
      integrationKind,
      endpointUrl: input.endpointUrl.trim(),
      riskObjectModelId: input.riskObjectModelId.trim(),
      mappingRules: input.mappingRules,
      ...(input.pullConfig !== undefined ? { pullConfig: input.pullConfig } : {}),
      authorName: input.authorName.trim(),
      changeComment: `Обновлены параметры подключения (#${id})`,
    });
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

  private parseIntegrationKind(value: string): IntegrationKind {
    const normalized = value?.trim().toUpperCase();
    if (normalized === 'PUSH' || normalized === 'PULL' || normalized === 'BROKER') {
      return normalized;
    }

    throw new DomainValidationError('integrationKind must be one of: PUSH, PULL, BROKER.');
  }
}
