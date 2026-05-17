import { ORPHAN_REFERENCE_LABELS } from '../../shared/constants/orphan-reference-labels.js';
import { DomainValidationError } from '../../shared/errors/domain-validation.error.js';
import type {
  RiskObjectChangeHistoryDetails,
  RiskObjectRepository,
} from '../ports/risk-object-repository.port.js';

export interface GetRiskObjectChangeHistoryByIdInput {
  companyId: string;
  historyId: string;
}

export type GetRiskObjectChangeHistoryByIdResult = RiskObjectChangeHistoryDetails;

export class GetRiskObjectChangeHistoryByIdUseCase {
  constructor(private readonly riskObjectRepository: RiskObjectRepository) {}

  async execute(input: GetRiskObjectChangeHistoryByIdInput): Promise<GetRiskObjectChangeHistoryByIdResult | null> {
    if (!input.companyId?.trim()) {
      throw new DomainValidationError('companyId is required.');
    }

    if (!input.historyId?.trim()) {
      throw new DomainValidationError('historyId is required.');
    }

    const parsedHistoryId = this.parseHistoryId(input.historyId.trim());
    const companyId = input.companyId.trim();
    const details = await this.riskObjectRepository.getChangeHistoryById(companyId, parsedHistoryId);
    if (!details) {
      return null;
    }

    const liveIds = await this.riskObjectRepository.findLiveRiskObjectIds(companyId, [details.riskObjectId]);
    const isDeleted = !liveIds.has(details.riskObjectId);
    return {
      ...details,
      riskObjectName: details.riskObjectName?.trim() || ORPHAN_REFERENCE_LABELS.parentNotFound,
      departmentId: details.departmentId?.trim() || ORPHAN_REFERENCE_LABELS.notSet,
      description: details.description?.trim() || ORPHAN_REFERENCE_LABELS.notSet,
      authorName: details.authorName?.trim() || ORPHAN_REFERENCE_LABELS.notSet,
      isDeleted,
    };
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
