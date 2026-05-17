import { ORPHAN_REFERENCE_LABELS } from '../../shared/constants/orphan-reference-labels.js';
import { DomainValidationError } from '../../shared/errors/domain-validation.error.js';
import type {
  IntegrationConfigHistoryItem,
  IntegrationConfigRepository,
} from '../ports/integration-config-repository.port.js';

export interface GetIntegrationConfigChangeHistoryInput {
  companyId: string;
  page: number;
  pageSize: number;
  q?: string;
}

export interface GetIntegrationConfigChangeHistoryOutput {
  items: IntegrationConfigHistoryItem[];
  hasMore: boolean;
}

export class GetIntegrationConfigChangeHistoryUseCase {
  constructor(private readonly integrationConfigRepository: IntegrationConfigRepository) {}

  async execute(
    input: GetIntegrationConfigChangeHistoryInput,
  ): Promise<GetIntegrationConfigChangeHistoryOutput> {
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

    const page = await this.integrationConfigRepository.getChangeHistoryPage(
      companyId,
      input.page,
      input.pageSize,
      q ? q : undefined,
    );

    const integrationIds = [...new Set(page.items.map((i) => i.integrationId))];
    const liveIds = await this.integrationConfigRepository.findLiveIntegrationConfigIds(
      companyId,
      integrationIds,
    );

    const items: IntegrationConfigHistoryItem[] = page.items.map((item) => {
      const isDeleted = !liveIds.has(item.integrationId);
      return {
        ...item,
        isDeleted,
        configName: item.configName?.trim() || (isDeleted ? ORPHAN_REFERENCE_LABELS.deleted : ORPHAN_REFERENCE_LABELS.parentNotFound),
        description: item.description?.trim() || ORPHAN_REFERENCE_LABELS.notSet,
        authorName: item.authorName?.trim() || ORPHAN_REFERENCE_LABELS.notSet,
      };
    });

    return {
      items,
      hasMore: page.hasMore,
    };
  }
}
