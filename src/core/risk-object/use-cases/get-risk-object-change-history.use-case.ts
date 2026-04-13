import { DomainValidationError } from '../../shared/errors/domain-validation.error.js';
import type {
  RiskObjectChangeHistoryItem,
  RiskObjectRepository,
} from '../ports/risk-object-repository.port.js';

export interface GetRiskObjectChangeHistoryInput {
  companyId: string;
  page: number;
  pageSize: number;
  q?: string;
}

export interface GetRiskObjectChangeHistoryOutput {
  items: RiskObjectChangeHistoryItem[];
  hasMore: boolean;
}

export class GetRiskObjectChangeHistoryUseCase {
  constructor(private readonly riskObjectRepository: RiskObjectRepository) {}

  async execute(input: GetRiskObjectChangeHistoryInput): Promise<GetRiskObjectChangeHistoryOutput> {
    if (!input.companyId?.trim()) {
      throw new DomainValidationError('companyId is required.');
    }

    if (input.page < 1) {
      throw new DomainValidationError('page must be greater than or equal to 1.');
    }

    if (input.pageSize < 1) {
      throw new DomainValidationError('pageSize must be greater than or equal to 1.');
    }

    const q = input.q?.trim();

    return this.riskObjectRepository.getChangeHistoryPage(
      input.companyId.trim(),
      input.page,
      input.pageSize,
      q ? q : undefined,
    );
  }
}
