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
    return this.integrationConfigRepository.getChangeHistoryPage(
      input.companyId.trim(),
      input.page,
      input.pageSize,
      q ? q : undefined,
    );
  }
}
