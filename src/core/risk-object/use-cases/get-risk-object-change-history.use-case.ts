import { ORPHAN_REFERENCE_LABELS } from '../../shared/constants/orphan-reference-labels.js';
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
    const companyId = input.companyId.trim();

    const page = await this.riskObjectRepository.getChangeHistoryPage(
      companyId,
      input.page,
      input.pageSize,
      q ? q : undefined,
    );

    const riskIds = [...new Set(page.items.map((i) => i.riskObjectId))];
    const liveIds = await this.riskObjectRepository.findLiveRiskObjectIds(companyId, riskIds);

    const items: RiskObjectChangeHistoryItem[] = page.items.map((item) => {
      const isDeleted = !liveIds.has(item.riskObjectId);
      return {
        ...item,
        isDeleted,
        name: item.name?.trim() || ORPHAN_REFERENCE_LABELS.parentNotFound,
        departmentId: item.departmentId?.trim() || ORPHAN_REFERENCE_LABELS.notSet,
        changeComment: item.changeComment?.trim() || ORPHAN_REFERENCE_LABELS.notSet,
      };
    });

    return {
      items,
      hasMore: page.hasMore,
    };
  }
}
