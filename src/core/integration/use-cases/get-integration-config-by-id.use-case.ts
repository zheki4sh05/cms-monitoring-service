import { Logger } from '@nestjs/common';
import { DomainValidationError } from '../../shared/errors/domain-validation.error.js';
import type {
  IntegrationConfigDetails,
  IntegrationConfigRepository,
} from '../ports/integration-config-repository.port.js';
import type { RiskObjectRepository } from '../../risk-object/ports/risk-object-repository.port.js';
import {
  type ResolvedRiskObjectModelForIntegration,
  resolveRiskObjectModelForIntegration,
} from './resolve-risk-object-model-for-integration.js';

export interface GetIntegrationConfigByIdInput {
  companyId: string;
  integrationConfigId: string;
}

export type GetIntegrationConfigByIdResult = IntegrationConfigDetails & {
  isDeleted: boolean;
  riskObjectModel: ResolvedRiskObjectModelForIntegration;
};

export class GetIntegrationConfigByIdUseCase {
  private readonly logger = new Logger(GetIntegrationConfigByIdUseCase.name);

  constructor(
    private readonly integrationConfigRepository: IntegrationConfigRepository,
    private readonly riskObjectRepository: RiskObjectRepository,
  ) {}

  async execute(input: GetIntegrationConfigByIdInput): Promise<GetIntegrationConfigByIdResult | null> {
    this.logger.log(
      `Get integration config started (companyId=${input.companyId?.trim()}, id=${input.integrationConfigId?.trim()})`,
    );
    if (!input.companyId?.trim()) {
      throw new DomainValidationError('companyId is required.');
    }

    if (!input.integrationConfigId?.trim()) {
      throw new DomainValidationError('id is required.');
    }

    const numericId = this.parseIntegrationConfigId(input.integrationConfigId.trim());
    const companyId = input.companyId.trim();
    this.logger.log(`Validation passed, loading integration config id=${numericId}`);

    const live = await this.integrationConfigRepository.getById(companyId, numericId);
    if (live) {
      const riskObjectModel = await resolveRiskObjectModelForIntegration(
        this.riskObjectRepository,
        companyId,
        live.riskObjectModelId,
      );
      return { ...live, isDeleted: false, riskObjectModel };
    }

    const fromHistory = await this.integrationConfigRepository.getLatestSnapshotFromHistory(
      companyId,
      numericId,
    );
    if (fromHistory) {
      const riskObjectModel = await resolveRiskObjectModelForIntegration(
        this.riskObjectRepository,
        companyId,
        fromHistory.riskObjectModelId,
      );
      return { ...fromHistory, isDeleted: true, riskObjectModel };
    }

    return null;
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
