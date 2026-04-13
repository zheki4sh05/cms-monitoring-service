import { DomainValidationError } from '../../shared/errors/domain-validation.error.js';
import type {
  RiskObjectRepository,
  RiskObjectStatus,
} from '../ports/risk-object-repository.port.js';

export interface UpdateRiskObjectStatusInput {
  companyId: string;
  id: string;
  status: RiskObjectStatus;
}

export class UpdateRiskObjectStatusUseCase {
  constructor(private readonly riskObjectRepository: RiskObjectRepository) {}

  async execute(input: UpdateRiskObjectStatusInput): Promise<Date | null> {
    if (!input.companyId?.trim()) {
      throw new DomainValidationError('companyId is required.');
    }

    if (!input.id?.trim()) {
      throw new DomainValidationError('id is required.');
    }

    if (input.status !== 'active' && input.status !== 'archived') {
      throw new DomainValidationError('status must be active or archived.');
    }

    return this.riskObjectRepository.updateStatusById(
      input.companyId.trim(),
      input.id.trim(),
      input.status,
    );
  }
}
