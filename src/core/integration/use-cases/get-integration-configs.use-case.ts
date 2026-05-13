import { DomainValidationError } from '../../shared/errors/domain-validation.error.js';
import { ORPHAN_REFERENCE_LABELS } from '../../shared/constants/orphan-reference-labels.js';
import type {
  IntegrationConfigListItem,
  IntegrationConfigRepository,
} from '../ports/integration-config-repository.port.js';
import type { RiskObjectRepository } from '../../risk-object/ports/risk-object-repository.port.js';

export interface GetIntegrationConfigsInput {
  companyId: string;
  page: number;
  pageSize: number;
  name?: string;
}

export interface IntegrationConfigListItemForClient extends IntegrationConfigListItem {
  riskObjectModelIsDeleted: boolean;
  riskObjectModelName: string;
}

export interface GetIntegrationConfigsOutput {
  items: IntegrationConfigListItemForClient[];
  hasMore: boolean;
}

export class GetIntegrationConfigsUseCase {
  constructor(
    private readonly integrationConfigRepository: IntegrationConfigRepository,
    private readonly riskObjectRepository: RiskObjectRepository,
  ) {}

  async execute(input: GetIntegrationConfigsInput): Promise<GetIntegrationConfigsOutput> {
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
    const companyId = input.companyId.trim();
    const page = await this.integrationConfigRepository.getListPage(
      companyId,
      input.page,
      input.pageSize,
      nameFilter,
    );

    const riskIds = [...new Set(page.items.map((i) => i.riskObjectModelId).filter((id) => id?.trim()))];
    const liveIds = await this.riskObjectRepository.findLiveRiskObjectIds(companyId, riskIds);
    const liveNames = await this.riskObjectRepository.findRiskObjectNamesByIds(companyId, riskIds);
    const missingIds = riskIds.filter((id) => !liveIds.has(id));
    const historyNames =
      missingIds.length > 0
        ? await this.riskObjectRepository.findLatestRiskObjectNamesFromHistory(companyId, missingIds)
        : new Map<string, string>();

    const items: IntegrationConfigListItemForClient[] = page.items.map((item) => {
      const modelId = (item.riskObjectModelId ?? '').trim();
      if (!modelId) {
        return {
          ...item,
          riskObjectModelIsDeleted: false,
          riskObjectModelName: ORPHAN_REFERENCE_LABELS.notSet,
        };
      }

      const isDeleted = !liveIds.has(modelId);
      const nameFromLive = liveNames.get(modelId)?.trim();
      const nameFromHistory = historyNames.get(modelId)?.trim();
      const resolved = nameFromLive ?? nameFromHistory ?? '';
      const riskObjectModelName = resolved || ORPHAN_REFERENCE_LABELS.parentNotFound;

      return {
        ...item,
        riskObjectModelIsDeleted: isDeleted,
        riskObjectModelName,
      };
    });

    return {
      items,
      hasMore: page.hasMore,
    };
  }
}
