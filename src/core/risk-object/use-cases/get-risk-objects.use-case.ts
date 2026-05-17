import { ORPHAN_REFERENCE_LABELS } from '../../shared/constants/orphan-reference-labels.js';
import { DomainValidationError } from '../../shared/errors/domain-validation.error.js';
import type {
  RiskObjectListItem,
  RiskObjectRepository,
} from '../ports/risk-object-repository.port.js';

export interface GetRiskObjectsInput {
  companyId: string;
  page: number;
  pageSize: number;
  /** Case-insensitive substring match on risk object name (optional). */
  name?: string;
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

    const nameFilter = input.name?.trim() ? input.name.trim() : undefined;
    const page = await this.riskObjectRepository.getListPage(
      input.companyId.trim(),
      input.page,
      input.pageSize,
      nameFilter,
    );
    return {
      hasMore: page.hasMore,
      items: page.items.map((item) => ({
        ...item,
        name: item.name?.trim() || ORPHAN_REFERENCE_LABELS.parentNotFound,
        code: item.code?.trim() || ORPHAN_REFERENCE_LABELS.placeholderCode,
        departmentId: item.departmentId?.trim() || ORPHAN_REFERENCE_LABELS.notSet,
      })),
    };
  }
}
