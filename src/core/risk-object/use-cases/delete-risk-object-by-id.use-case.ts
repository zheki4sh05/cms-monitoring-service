import { DomainValidationError } from '../../shared/errors/domain-validation.error.js';
import type { RiskObjectRepository } from '../ports/risk-object-repository.port.js';

export interface DeleteRiskObjectByIdInput {
  companyId: string;
  id: string;
  authorName: string;
}

export class DeleteRiskObjectByIdUseCase {
  constructor(private readonly riskObjectRepository: RiskObjectRepository) {}

  async execute(input: DeleteRiskObjectByIdInput): Promise<Date | null> {
    if (!input.companyId?.trim()) {
      throw new DomainValidationError('companyId is required.');
    }

    if (!input.id?.trim()) {
      throw new DomainValidationError('id is required.');
    }

    const authorName = input.authorName?.trim() || 'Unknown';

    return this.riskObjectRepository.deleteById(input.companyId.trim(), input.id.trim(), authorName);
  }
}
