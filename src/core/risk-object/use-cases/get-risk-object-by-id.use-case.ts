import { DomainValidationError } from '../../shared/errors/domain-validation.error.js';
import type {
  RiskObjectDetails,
  RiskObjectRepository,
} from '../ports/risk-object-repository.port.js';

export interface GetRiskObjectByIdInput {
  companyId: string;
  id: string;
}

export class GetRiskObjectByIdUseCase {
  constructor(private readonly riskObjectRepository: RiskObjectRepository) {}

  async execute(input: GetRiskObjectByIdInput): Promise<RiskObjectDetails | null> {
    if (!input.companyId?.trim()) {
      throw new DomainValidationError('companyId is required.');
    }

    if (!input.id?.trim()) {
      throw new DomainValidationError('id is required.');
    }

    return this.riskObjectRepository.getById(input.companyId.trim(), input.id.trim());
  }
}
