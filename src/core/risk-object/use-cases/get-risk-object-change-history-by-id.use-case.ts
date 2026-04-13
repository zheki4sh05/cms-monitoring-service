import { DomainValidationError } from '../../shared/errors/domain-validation.error.js';
import type {
  RiskObjectChangeHistoryDetails,
  RiskObjectRepository,
} from '../ports/risk-object-repository.port.js';

export interface GetRiskObjectChangeHistoryByIdInput {
  companyId: string;
  historyId: string;
}

export class GetRiskObjectChangeHistoryByIdUseCase {
  constructor(private readonly riskObjectRepository: RiskObjectRepository) {}

  async execute(input: GetRiskObjectChangeHistoryByIdInput): Promise<RiskObjectChangeHistoryDetails | null> {
    if (!input.companyId?.trim()) {
      throw new DomainValidationError('companyId is required.');
    }

    if (!input.historyId?.trim()) {
      throw new DomainValidationError('historyId is required.');
    }

    const parsedHistoryId = this.parseHistoryId(input.historyId.trim());
    return this.riskObjectRepository.getChangeHistoryById(input.companyId.trim(), parsedHistoryId);
  }

  private parseHistoryId(value: string): number {
    const matched = /^roh-(\d+)$/.exec(value);
    if (!matched) {
      throw new DomainValidationError('historyId must match format roh-<number>.');
    }

    const numericPart = matched[1];
    if (!numericPart) {
      throw new DomainValidationError('historyId must match format roh-<number>.');
    }

    const numericId = Number.parseInt(numericPart, 10);
    if (!Number.isInteger(numericId) || numericId < 1) {
      throw new DomainValidationError('historyId must match format roh-<number>.');
    }

    return numericId;
  }
}
