import { DomainValidationError } from '../../shared/errors/domain-validation.error.js';
import type {
  RiskObjectListItem,
  RiskObjectRepository,
} from '../ports/risk-object-repository.port.js';

export interface GetRiskObjectsInput {
  companyId: string;
  page: number;
  pageSize: number;
}

export interface GetRiskObjectsOutput {
  items: RiskObjectListItem[];
  hasMore: boolean;
}

export class GetRiskObjectsUseCase {
  constructor(private readonly riskObjectRepository: RiskObjectRepository) {}

  async execute(input: GetRiskObjectsInput): Promise<GetRiskObjectsOutput> {
    if (!input.companyId?.trim()) {
      throw new DomainValidationError('companyId is required.');
    }

    if (input.page < 1) {
      throw new DomainValidationError('page must be greater than or equal to 1.');
    }

    if (input.pageSize < 1) {
      throw new DomainValidationError('pageSize must be greater than or equal to 1.');
    }

    return this.riskObjectRepository.getListPage(input.companyId.trim(), input.page, input.pageSize);
  }
}
