import { DomainValidationError } from '../../shared/errors/domain-validation.error.js';
import type {
  IntegrationConfigListItem,
  IntegrationConfigRepository,
} from '../ports/integration-config-repository.port.js';

export interface GetIntegrationConfigsInput {
  companyId: string;
  page: number;
  pageSize: number;
}

export interface GetIntegrationConfigsOutput {
  items: IntegrationConfigListItem[];
  hasMore: boolean;
}

export class GetIntegrationConfigsUseCase {
  constructor(private readonly integrationConfigRepository: IntegrationConfigRepository) {}

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

    return this.integrationConfigRepository.getListPage(input.companyId.trim(), input.page, input.pageSize);
  }
}
